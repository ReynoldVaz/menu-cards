// Vercel Serverless Function: WhatsApp Broadcast Placeholder
// Path: /api/broadcast-whatsapp.js

export default async function handler(req, res) {
  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Handle preflight request
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract message and phone numbers from request body
  const { message, phones } = req.body;

  // WhatsApp Cloud API credentials (real)
  const WHATSAPP_TOKEN ='EAAL6ZCvhcZAPgBQLYf5TJeoXHH2XkZBTAz1ImoeCiYOVZAWnhGadlBeZCqdEnESKBxHJYhJ2ImCRhCqV2ZAGVgHNc8s4V9Ed3FG7fXAiJA2WVgl9ZC6La04n76TZBspyZCw7IIDisW3cs5yze03Lvbbj4rHVhpVSGKwuNh0TqjPvOSmI4fhJAf7FOZB43WGFD3uPe4GeTYxKr5rKr8B3oYflcsVa1zXIfCqFHZAXtDHvHJdEf7ja66J4d54DN2O5rX389HtbadUnrhWOlOLS8i94FaYW7PC';
  const PHONE_NUMBER_ID = '913104901889900';
  const API_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  // Validate input
  if (!message || !phones || !Array.isArray(phones) || phones.length === 0) {
    return res.status(400).json({ error: 'Missing message or phone numbers.' });
  }

  // Send message to each phone (real API call)
  const results = [];
  for (const phone of phones) {
    try {
      const apiRes = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      });
      const apiData = await apiRes.json();
      results.push({ phone, status: apiRes.status, response: apiData });
    } catch (err) {
      results.push({ phone, status: 500, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return res.status(200).json({
    status: 'sent',
    message: `Broadcast attempted to ${phones.length} numbers (real API).`,
    results,
  });
}
