#!/usr/bin/env node

/**
 * Local development API server for menu-cards
 * Runs on port 3001 to handle API requests during development
 * 
 * Usage: node api-dev-server.js
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    // Validate API key
    if (!process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: "API key not configured. Set VITE_GEMINI_API_KEY in .env" });
    }

    const { message, menuSections, todaysSpecial, events } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Safely compress the menu, handling null/undefined values
    const compressedMenu = JSON.stringify({
      special: todaysSpecial ? {
        name: todaysSpecial.name,
        price: todaysSpecial.price,
        description: todaysSpecial.description
      } : null,
      sections: Array.isArray(menuSections) ? menuSections.map(s => ({
        name: s.title || s.name,
        items: Array.isArray(s.items) ? s.items.map(i => ({
          name: i.name,
          price: i.price,
          desc: i.description
        })) : []
      })) : [],
      events: Array.isArray(events) ? events.map(e => ({
        title: e.title,
        date: e.date,
        time: e.time
      })) : []
    }).slice(0, 15000); // limit prompt size

    const prompt = `You are a friendly AI restaurant assistant. Answer questions about the menu, dishes, prices, and events.
Be concise and helpful. Format responses nicely with bullet points when listing items.

User asked: "${message}"

Restaurant data:
${compressedMenu}`;

    // 2 retries for stability
    let reply = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        reply = result.response.text();
        break;
      } catch (err) {
        console.error(`[Chat] Attempt ${attempt + 1} failed:`, err.message);
        if (attempt === 1) throw err;
      }
    }

    return res.status(200).json({ reply: reply || "Sorry, I couldn't generate a response. Please try again." });

  } catch (err) {
    console.error("[Chat API] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: `Server error: ${errorMessage}` });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Development API Server running on http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`💚 Health check: GET http://localhost:${PORT}/health\n`);
});
