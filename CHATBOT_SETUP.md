# ChatBot Development Setup

The ChatBot feature requires a running API server to handle Gemini AI requests. Follow these steps to set it up:

## Option 1: Run Both Dev Server and API Together (Recommended)

```bash
npm run dev:full
```

This will start:
- **Vite Dev Server**: http://localhost:5173 (your app)
- **API Server**: http://localhost:3001 (chat API)

## Option 2: Run Separately (for debugging)

### Terminal 1 - Start Vite Dev Server
```bash
npm run dev
```

### Terminal 2 - Start API Server
```bash
npm run dev:api
```

## Prerequisites

Make sure your `.env` file has:
```
VITE_GEMINI_API_KEY=your-api-key-here
```

## How It Works

1. **Development Mode** (`npm run dev:full`):
   - The ChatBot component detects development mode and sends requests to `http://localhost:3001/api/chat`
   - The API server handles the request and communicates with Google's Gemini API
   - Response is sent back to the ChatBot

2. **Production Mode** (deployed to Vercel):
   - The ChatBot component detects production mode and sends requests to `/api/chat`
   - Vercel's serverless function handles the request (the API in `/api` folder)

## Testing the ChatBot

1. Open http://localhost:5173 in your browser
2. Click the chat button (bottom right)
3. Try one of the suggestion prompts or ask a question about the menu

## Troubleshooting

### "⚠️ Error: Failed to execute 'json' on 'Response'"
- Make sure the API server is running (`npm run dev:api`)
- Check that port 3001 is not in use

### "⚠️ Error: API key not configured"
- Verify `VITE_GEMINI_API_KEY` is set in `.env`
- Restart both dev servers after updating `.env`

### "⚠️ Error: Cannot GET /api/chat"
- The Vite dev server is receiving the request instead of the API server
- Make sure you're running `npm run dev:full` or both servers separately
