import { GoogleGenerativeAI } from "@google/generative-ai";

// Response cache for common questions (5 minutes TTL)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

console.log(`[Chat API] ✓ Module loaded successfully - ${new Date().toISOString()}`);
console.log(`[Chat API] Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`[Chat API] Gemini API Key configured: ${!!process.env.VITE_GEMINI_API_KEY}`);

// Currency formatting function - ALWAYS returns INR symbol
function formatPrice(price, currency = 'INR') {
  // Extract just the numeric value - remove EVERYTHING except digits and decimal
  let numPrice = 0;
  
  if (price !== null && price !== undefined && price !== '') {
    const priceStr = String(price).trim();
    console.log('[formatPrice] Input:', priceStr, 'Type:', typeof price);
    
    // Match only numbers and decimal points
    const matches = priceStr.match(/[\d.]+/);
    if (matches && matches.length > 0) {
      numPrice = parseFloat(matches[0]);
      console.log('[formatPrice] Extracted number:', numPrice);
    }
  }
  
  // Validate the number
  if (isNaN(numPrice) || numPrice < 0) {
    numPrice = 0;
  }
  
  // ALWAYS use INR (₹) - ignore currency parameter
  const symbol = '₹';
  
  // Format the number
  const formattedNumber = numPrice.toFixed(2).replace(/\.00$/, '');
  const result = `${symbol}${formattedNumber}`;
  console.log('[formatPrice] Output:', result);
  return result;
}

function getCacheKey(message, menuHash) {
  return `${message.toLowerCase().trim()}_${menuHash}`;
}

function getMenuHash(menuData) {
  // Simple hash of menu data to detect changes
  return JSON.stringify(menuData).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0).toString(36);
}

function normalizeMenuData(sections) {
  // Normalize menu sections to ensure currency is properly set
  if (!Array.isArray(sections)) return sections;
  
  return sections.map(section => ({
    ...section,
    items: Array.isArray(section.items) 
      ? section.items.map(item => {
          // Explicitly set currency to INR, only override if item has a valid currency
          let currency = 'INR'; // DEFAULT
          if (item.currency && typeof item.currency === 'string') {
            const trimmedCurrency = item.currency.trim().toUpperCase();
            if (['INR', 'USD', 'EUR', 'GBP'].includes(trimmedCurrency)) {
              currency = trimmedCurrency;
            }
          }
          return {
            ...item,
            currency: currency
          };
        })
      : section.items
  }));
}

function normalizeTodaysSpecial(special) {
  // Normalize today's special to ensure currency is properly set
  if (!special) return special;
  
  if (Array.isArray(special)) {
    return special.map(item => {
      let currency = 'INR'; // DEFAULT
      if (item.currency && typeof item.currency === 'string') {
        const trimmedCurrency = item.currency.trim().toUpperCase();
        if (['INR', 'USD', 'EUR', 'GBP'].includes(trimmedCurrency)) {
          currency = trimmedCurrency;
        }
      }
      return {
        ...item,
        currency: currency
      };
    });
  }
  
  let currency = 'INR'; // DEFAULT
  if (special.currency && typeof special.currency === 'string') {
    const trimmedCurrency = special.currency.trim().toUpperCase();
    if (['INR', 'USD', 'EUR', 'GBP'].includes(trimmedCurrency)) {
      currency = trimmedCurrency;
    }
  }
  return {
    ...special,
    currency: currency
  };
}

function formatMenuForPrompt(menuSections, todaysSpecial, events) {
  // Format menu data for the AI to understand context better
  // Send prices WITHOUT currency symbols - the system prompt will tell AI which currency to use
  let formatted = "";
  let currencyUsed = 'INR'; // Default

  if (todaysSpecial) {
    formatted += "📌 TODAY'S SPECIAL:\n";
    if (Array.isArray(todaysSpecial)) {
      todaysSpecial.forEach(s => {
        // Detect currency from item or use default
        const itemCurrency = (s.currency || 'INR').toUpperCase();
        if (!itemCurrency.includes(currencyUsed) && currencyUsed === 'INR') {
          currencyUsed = itemCurrency; // Use first non-default currency found
        }
        console.log(`[Menu] Today's Special: ${s.name} - Price: ${s.price}, Currency: ${itemCurrency}`);
        formatted += `• ${s.name} - ${s.price}${s.description ? ` (${s.description})` : ""}\n`;
      });
    } else {
      const itemCurrency = (todaysSpecial.currency || 'INR').toUpperCase();
      currencyUsed = itemCurrency;
      console.log(`[Menu] Today's Special: ${todaysSpecial.name} - Price: ${todaysSpecial.price}, Currency: ${itemCurrency}`);
      formatted += `• ${todaysSpecial.name} - ${todaysSpecial.price}${todaysSpecial.description ? ` (${todaysSpecial.description})` : ""}\n`;
    }
    formatted += "\n";
  }

  if (Array.isArray(menuSections) && menuSections.length > 0) {
    formatted += "MENU BY SECTION:\n";
    menuSections.forEach(section => {
      formatted += `\n${section.title || section.name}:\n`;
      if (Array.isArray(section.items)) {
        section.items.forEach(item => {
          // Detect currency from item or use default
          const itemCurrency = (item.currency || 'INR').toUpperCase();
          if (!itemCurrency.includes(currencyUsed) && currencyUsed === 'INR') {
            currencyUsed = itemCurrency; // Use first non-default currency found
          }
          console.log(`[Menu] Item: ${item.name} - Price: ${item.price}, Currency: ${itemCurrency}`);
          formatted += `  • ${item.name} - ${item.price}${item.description ? ` (${item.description})` : ""}\n`;
        });
      }
    });
    formatted += "\n";
  }

  if (Array.isArray(events) && events.length > 0) {
    formatted += "UPCOMING EVENTS:\n";
    events.forEach(event => {
      formatted += `• ${event.title} - ${event.date}${event.time ? ` at ${event.time}` : ""}\n`;
    });
  }

  return formatted;
}

function buildSystemPrompt(currency = 'INR') {
  // Build currency instruction based on the provided currency
  const currencySymbols = {
    'INR': { symbol: '₹', name: 'Indian Rupee' },
    'USD': { symbol: '$', name: 'US Dollar' },
    'EUR': { symbol: '€', name: 'Euro' },
    'GBP': { symbol: '£', name: 'British Pound' }
  };
  
  const selectedCurrency = currencySymbols[currency] || currencySymbols['INR'];
  const currencyRule = `IMPORTANT: When displaying prices, ALWAYS use the ${selectedCurrency.name} symbol (${selectedCurrency.symbol}) in format: ${selectedCurrency.symbol}NUMBER (e.g., ${selectedCurrency.symbol}67, ${selectedCurrency.symbol}50, ${selectedCurrency.symbol}90)`;
  
  console.log(`[SystemPrompt] Building prompt for currency: ${currency} (${selectedCurrency.symbol})`);
  
  return `You are a knowledgeable, friendly AI assistant for a restaurant. Your job is to help customers with menu recommendations, questions about dishes, pricing, events, and special offers.

RULES:
1. Always answer based ONLY on the restaurant data provided below
2. If you don't know something, say "I don't have that information - please contact the restaurant directly"
3. Keep responses concise but helpful (2-4 sentences max)
4. When listing dishes, use bullet points with dish name, price, and brief description
5. Be conversational and warm - the customer is a potential diner
6. If asked about allergies/dietary restrictions, recommend contacting the restaurant directly
7. Suggest items based on user preferences when possible
8. Highlight specials and upcoming events when relevant
9. ${currencyRule}`;
}

function improveResponse(response, message, currency = 'INR') {
  // Post-process response to ensure quality
  response = response.trim();
  console.log(`[improveResponse] Input response length: ${response.length} chars`);
  
  // Ensure response is not too long
  if (response.length > 1000) {
    console.log(`[improveResponse] Truncating response from ${response.length} to 1000 chars`);
    response = response.substring(0, 1000) + "...";
  }

  // Fix common formatting issues
  response = response.replace(/\*\*/g, "**").replace(/\n\n\n+/g, "\n\n");

  // Fix currency symbols - replace incorrect currency with the correct one
  const currencySymbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  const correctSymbol = currencySymbols[currency] || '₹';
  const responseBeforeFix = response;
  
  // Replace common incorrect currency patterns
  // First, remove all currency symbols from numbers
  response = response.replace(/[$€£₹]\s*(\d+(?:\.\d{1,2})?)/g, (match, price) => {
    // Replace with correct symbol and price
    return `${correctSymbol}${price}`;
  });
  
  if (responseBeforeFix !== response) {
    console.log(`[improveResponse] Currency symbols fixed`);
  }
  
  console.log(`[improveResponse] Final currency: ${currency} (${correctSymbol}), Output length: ${response.length} chars`);
  console.log(`[improveResponse] Sample: "${response.substring(0, 120)}..."`);

  return response;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    console.error(`[Chat] Invalid method: ${req.method}`);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log(`[Chat] ===== NEW REQUEST =====`);
    // Validate API key
    if (!process.env.VITE_GEMINI_API_KEY) {
      console.error("[Chat] Missing VITE_GEMINI_API_KEY");
      return res.status(500).json({ error: "API key not configured" });
    }

    const { message, menuSections, todaysSpecial, events, currency } = req.body;
    
    console.log(`[Chat] Request received - Message: "${message.substring(0, 50)}...", Currency from payload: ${currency || 'undefined'}`);

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    // Normalize menu data to ensure proper currency handling
    console.log(`[Chat] Normalizing menu data...`);
    const normalizedMenuSections = normalizeMenuData(menuSections);
    const normalizedTodaysSpecial = normalizeTodaysSpecial(todaysSpecial);
    console.log(`[Chat] Normalized ${normalizedMenuSections?.length || 0} menu sections`);
    
    // Debug: Log what we're working with
    if (normalizedMenuSections && normalizedMenuSections.length > 0 && normalizedMenuSections[0].items) {
      const firstItem = normalizedMenuSections[0].items[0];
      console.log(`[Chat] First item: name="${firstItem?.name}", price="${firstItem?.price}", currency="${firstItem?.currency}"`);
      console.log(`[Chat] Formatted price: ${formatPrice(firstItem?.price, firstItem?.currency || 'INR')}`);
    }

    // Check cache first
    const menuHash = getMenuHash({ normalizedMenuSections, normalizedTodaysSpecial, events });
    const cacheKey = getCacheKey(message, menuHash);
    const cachedResponse = responseCache.get(cacheKey);
    console.log(`[Chat] Cache key: ${cacheKey.substring(0, 50)}..., Cache size: ${responseCache.size}`);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      console.log(`[Chat] ✓ Cache HIT for: "${message.substring(0, 50)}..."`);
      console.log(`[Chat] Cached response preview: "${cachedResponse.response.substring(0, 80)}..."`);
      return res.status(200).json({ 
        reply: cachedResponse.response,
        cached: true 
      });
    }
    
    console.log(`[Chat] Cache MISS - will call Gemini API`);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        topP: 0.9,
        topK: 40
      }
    });

    // Format menu data for better AI understanding
    const formattedMenu = formatMenuForPrompt(normalizedMenuSections, normalizedTodaysSpecial, events);
    
    // Detect primary currency - prioritize payload currency, then detect from menu
    let primaryCurrency = currency || 'INR'; // Use currency from payload if provided
    
    // If currency from payload is not valid, detect from menu
    const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
    if (!validCurrencies.includes((primaryCurrency || '').toUpperCase())) {
      primaryCurrency = 'INR'; // Default to INR
      
      if (normalizedMenuSections && normalizedMenuSections.length > 0) {
        for (const section of normalizedMenuSections) {
          if (section.items && section.items.length > 0) {
            const itemCurrency = (section.items[0].currency || 'INR').toUpperCase();
            if (validCurrencies.includes(itemCurrency)) {
              primaryCurrency = itemCurrency;
              break;
            }
          }
        }
      }
    }
    
    console.log(`[Chat] Currency from payload: ${currency || 'not provided'}, Final currency: ${primaryCurrency}`);
    const systemPrompt = buildSystemPrompt(primaryCurrency);
    console.log(`[Chat] System prompt built for ${primaryCurrency}`);

    const fullPrompt = `${systemPrompt}

RESTAURANT DATA:
${formattedMenu}

CUSTOMER MESSAGE: "${message}"

RESPONSE:`;
    
    console.log(`[Chat] Full prompt length: ${fullPrompt.length} chars`);

    // Retry logic with exponential backoff for reliability
    let reply = null;
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Chat] Attempt ${attempt + 1}/2: Calling Gemini API...`);
        const startTime = Date.now();
        const result = await model.generateContent(fullPrompt);
        const duration = Date.now() - startTime;
        console.log(`[Chat] ✓ Gemini API responded in ${duration}ms`);
        
        reply = result.response.text();
        console.log(`[Chat] Raw response length: ${reply.length} chars, Preview: "${reply.substring(0, 80)}..."`);
        
        if (!reply) {
          throw new Error("Empty response from Gemini API");
        }

        // Improve response formatting and fix currency symbols
        console.log(`[Chat] Processing response with currency: ${primaryCurrency}...`);
        reply = improveResponse(reply, message, primaryCurrency);
        
        console.log(`[Chat] ✓ Final response length: ${reply.length} chars, Preview: "${reply.substring(0, 100)}..."`);
        console.log(`[Chat] Currency symbol used: ${primaryCurrency === 'INR' ? '₹' : primaryCurrency === 'USD' ? '$' : primaryCurrency === 'EUR' ? '€' : '£'}`);

        // Cache successful response
        responseCache.set(cacheKey, {
          response: reply,
          timestamp: Date.now()
        });
        console.log(`[Chat] Response cached, cache size now: ${responseCache.size}`);

        // Cleanup old cache entries
        if (responseCache.size > 100) {
          const firstKey = responseCache.keys().next().value;
          responseCache.delete(firstKey);
          console.log(`[Chat] Cleaned up oldest cache entry, new size: ${responseCache.size}`);
        }

        console.log(`[Chat] ✓ Success on attempt ${attempt + 1}: "${message.substring(0, 50)}..."`);
        break;

      } catch (err) {
        lastError = err;
        console.warn(`[Chat] ✗ Attempt ${attempt + 1} failed:`, err.message);

        if (attempt === 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!reply) {
      console.error("[Chat] ✗ All retry attempts failed:", lastError?.message);
      return res.status(500).json({ 
        error: "Failed to generate response. Please try again.",
        details: lastError?.message 
      });
    }

    console.log(`[Chat] ===== REQUEST COMPLETE (${new Date().toISOString()}) =====`);
    return res.status(200).json({ 
      reply,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[Chat API] ✗ Unexpected error:", err?.message || err);
    console.error("[Chat API] Full error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    return res.status(500).json({ 
      error: "Server error. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
