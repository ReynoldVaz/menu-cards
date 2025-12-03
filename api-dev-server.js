#!/usr/bin/env node

/**
 * Local development API server for menu-cards
 * Runs on port 3001 to handle API requests during development
 * 
 * Usage: node api-dev-server.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatHandler from './api/chat.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Chat API endpoint - use the handler from chat.js
app.post('/api/chat', chatHandler);

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
