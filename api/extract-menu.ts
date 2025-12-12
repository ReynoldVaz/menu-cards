import { ImageAnnotatorClient } from '@google-cloud/vision';
import type { IncomingMessage, ServerResponse } from 'http';

// Interface for extracted menu item
interface ExtractedMenuItem {
  name: string;
  price: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  section: string;
  description: string;
  ingredients: string;
  is_todays_special: boolean;
  is_unavailable: boolean;
  dietType?: 'veg' | 'non-veg' | 'vegan';
  confidence?: 'high' | 'medium' | 'low';
}

interface VercelRequest extends IncomingMessage {
  query: { [key: string]: string | string[] };
  cookies: { [key: string]: string };
  body: any;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (body: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, restaurantId, fileType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Initialize Google Cloud Vision client
    // Credentials should be set via GOOGLE_APPLICATION_CREDENTIALS env var
    // Or pass credentials directly from environment variables
    const visionClient = new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    // Perform text detection
    const [result] = await visionClient.textDetection({
      image: {
        content: image,
      },
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      return res.status(200).json({ items: [], message: 'No text detected in image' });
    }

    // Full text is in the first annotation
    const fullText = detections[0]?.description || '';

    // Parse the text to extract menu items
    const items = parseMenuText(fullText);

    return res.status(200).json({
      items,
      rawText: fullText,
      totalDetected: items.length,
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Parse extracted text into structured menu items
 * This is a smart parser that handles various menu formats
 */
function parseMenuText(text: string): ExtractedMenuItem[] {
  const items: ExtractedMenuItem[] = [];
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  let currentSection = 'Main Course';
  let i = 0;

  // Common section keywords
  const sectionKeywords = [
    'appetizer', 'starter', 'soup', 'salad', 'main course', 'entree',
    'curry', 'biryani', 'rice', 'bread', 'naan', 'roti', 'dessert',
    'sweet', 'beverage', 'drink', 'juice', 'shake', 'special',
  ];

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check if line is a section header
    const lowerLine = line.toLowerCase();
    const isSection = sectionKeywords.some((keyword) => lowerLine.includes(keyword) && !hasPricePattern(line));

    if (isSection && !hasPricePattern(line)) {
      currentSection = capitalizeWords(line);
      i++;
      continue;
    }

    // Try to extract item (name + price)
    const priceMatch = line.match(/(?:₹|Rs\.?|INR|USD|\$|EUR|€|GBP|£)\s*(\d+(?:\.\d{1,2})?)/i);
    
    if (priceMatch) {
      // Extract price and currency
      const priceValue = parseFloat(priceMatch[1]);
      const currency = detectCurrency(line);

      // Item name is everything before the price
      let itemName = line.substring(0, priceMatch.index).trim();
      
      // Clean up item name
      itemName = itemName.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim();

      if (itemName.length > 2 && priceValue > 0) {
        // Look ahead for description (next line without price)
        let description = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (!hasPricePattern(nextLine) && nextLine.length > 10 && nextLine.length < 200) {
            description = nextLine;
            i++; // Skip description line
          }
        }

        // Detect diet type from keywords
        const dietType = detectDietType(itemName + ' ' + description);

        // Determine confidence based on data quality
        let confidence: 'high' | 'medium' | 'low' = 'medium';
        if (itemName.length > 3 && priceValue > 0 && description.length > 10) {
          confidence = 'high';
        } else if (itemName.length < 3 || priceValue === 0) {
          confidence = 'low';
        }

        items.push({
          name: itemName,
          price: priceValue,
          currency,
          section: currentSection,
          description,
          ingredients: '',
          is_todays_special: false,
          is_unavailable: false,
          dietType,
          confidence,
        });
      }
    }

    i++;
  }

  return items;
}

/**
 * Check if line contains a price pattern
 */
function hasPricePattern(text: string): boolean {
  return /(?:₹|Rs\.?|INR|USD|\$|EUR|€|GBP|£)\s*\d+(?:\.\d{1,2})?/i.test(text);
}

/**
 * Detect currency from text
 */
function detectCurrency(text: string): 'INR' | 'USD' | 'EUR' | 'GBP' {
  if (/₹|Rs\.?|INR/i.test(text)) return 'INR';
  if (/\$|USD/i.test(text)) return 'USD';
  if (/€|EUR/i.test(text)) return 'EUR';
  if (/£|GBP/i.test(text)) return 'GBP';
  return 'INR'; // Default
}

/**
 * Detect diet type from text
 */
function detectDietType(text: string): 'veg' | 'non-veg' | 'vegan' | undefined {
  const lower = text.toLowerCase();
  
  // Vegan indicators
  if (lower.includes('vegan') || lower.includes('plant-based')) {
    return 'vegan';
  }
  
  // Non-veg indicators
  const nonVegKeywords = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'prawn', 'egg', 'meat'];
  if (nonVegKeywords.some((keyword) => lower.includes(keyword))) {
    return 'non-veg';
  }
  
  // Veg indicators
  const vegKeywords = ['paneer', 'vegetarian', 'veg', 'tofu', 'mushroom', 'vegetable'];
  if (vegKeywords.some((keyword) => lower.includes(keyword))) {
    return 'veg';
  }
  
  return undefined;
}

/**
 * Capitalize each word in a string
 */
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
