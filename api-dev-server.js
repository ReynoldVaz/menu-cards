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
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';
import emailHandler from './api/send-email.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Chat API endpoint - use the handler from chat.js
app.post('/api/chat', chatHandler);

// Email API endpoint - use the handler from send-email.js
app.post('/api/send-email', emailHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Development API Server running on http://localhost:${PORT}`);
  console.log(`📡 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`📧 Email endpoint: POST http://localhost:${PORT}/api/send-email`);
  console.log(`💚 Health check: GET http://localhost:${PORT}/health\n`);
});
