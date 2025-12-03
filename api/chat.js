import { GoogleGenerativeAI } from "@google/generative-ai";

// Response cache for common questions (5 minutes TTL)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

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

function formatMenuForPrompt(menuSections, todaysSpecial, events) {
  // Format menu data for the AI to understand context better
  let formatted = "";

  if (todaysSpecial) {
    formatted += "📌 TODAY'S SPECIAL:\n";
    if (Array.isArray(todaysSpecial)) {
      todaysSpecial.forEach(s => {
        formatted += `• ${s.name} - ${s.price}${s.description ? ` (${s.description})` : ""}\n`;
      });
    } else {
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

function buildSystemPrompt() {
  return `You are a knowledgeable, friendly AI assistant for a restaurant. Your job is to help customers with menu recommendations, questions about dishes, pricing, events, and special offers.

RULES:
1. Always answer based ONLY on the restaurant data provided below
2. If you don't know something, say "I don't have that information - please contact the restaurant directly"
3. Keep responses concise but helpful (2-4 sentences max)
4. When listing dishes, use bullet points with dish name, price, and brief description
5. Be conversational and warm - the customer is a potential diner
6. If asked about allergies/dietary restrictions, recommend contacting the restaurant directly
7. Suggest items based on user preferences when possible
8. Highlight specials and upcoming events when relevant`;
}

function improveResponse(response, message) {
  // Post-process response to ensure quality
  response = response.trim();
  
  // Ensure response is not too long
  if (response.length > 1000) {
    response = response.substring(0, 1000) + "...";
  }

  // Fix common formatting issues
  response = response.replace(/\*\*/g, "**").replace(/\n\n\n+/g, "\n\n");

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
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Validate API key
    if (!process.env.VITE_GEMINI_API_KEY) {
      console.error("[Chat] Missing VITE_GEMINI_API_KEY");
      return res.status(500).json({ error: "API key not configured" });
    }

    const { message, menuSections, todaysSpecial, events } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    // Check cache first
    const menuHash = getMenuHash({ menuSections, todaysSpecial, events });
    const cacheKey = getCacheKey(message, menuHash);
    const cachedResponse = responseCache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
      console.log(`[Chat] Cache hit for: "${message.substring(0, 50)}..."`);
      return res.status(200).json({ 
        reply: cachedResponse.response,
        cached: true 
      });
    }

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
    const formattedMenu = formatMenuForPrompt(menuSections, todaysSpecial, events);
    const systemPrompt = buildSystemPrompt();

    const fullPrompt = `${systemPrompt}

RESTAURANT DATA:
${formattedMenu}

CUSTOMER MESSAGE: "${message}"

RESPONSE:`;

    // Retry logic with exponential backoff for reliability
    let reply = null;
    let lastError = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent(fullPrompt);
        reply = result.response.text();
        
        if (!reply) {
          throw new Error("Empty response from Gemini API");
        }

        // Improve response formatting
        reply = improveResponse(reply, message);

        // Cache successful response
        responseCache.set(cacheKey, {
          response: reply,
          timestamp: Date.now()
        });

        // Cleanup old cache entries
        if (responseCache.size > 100) {
          const firstKey = responseCache.keys().next().value;
          responseCache.delete(firstKey);
        }

        console.log(`[Chat] Success on attempt ${attempt + 1}: "${message.substring(0, 50)}..."`);
        break;

      } catch (err) {
        lastError = err;
        console.warn(`[Chat] Attempt ${attempt + 1} failed:`, err.message);

        if (attempt === 0) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!reply) {
      console.error("[Chat] All retry attempts failed:", lastError?.message);
      return res.status(500).json({ 
        error: "Failed to generate response. Please try again.",
        details: lastError?.message 
      });
    }

    return res.status(200).json({ 
      reply,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("[Chat API] Unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    
    return res.status(500).json({ 
      error: "Server error. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
