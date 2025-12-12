/**
 * Twilio WhatsApp Webhook Handler - PRODUCTION
 * Handles incoming WhatsApp messages for STOP/START commands
 * Automatically manages subscriber opt-outs/opt-ins
 * Deployed on Vercel serverless
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only once)
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf-8')
  );
  
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export const config = {
  api: {
    bodyParser: true, // Twilio sends form-encoded data
  },
};

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Content-Type', 'text/xml');
    return res.status(405).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }

  try {
    const { From, Body, To } = req.body;

    // Normalize phone number (remove whatsapp: prefix)
    const customerPhone = From?.replace('whatsapp:', '').trim();
    const restaurantWhatsAppNumber = To?.replace('whatsapp:', '').trim();

    if (!customerPhone || !restaurantWhatsAppNumber) {
      console.error('[Webhook] Missing phone numbers:', { From, To });
      res.setHeader('Content-Type', 'text/xml');
      return res.status(400).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    // Normalize message (case-insensitive, trim whitespace)
    const message = Body?.trim().toUpperCase();

    console.log('[Webhook] Received:', {
      from: customerPhone,
      to: restaurantWhatsAppNumber,
      message,
    });

    // Find restaurant by WhatsApp number
    const restaurantsRef = db.collection('restaurants');
    const restaurantQuery = await restaurantsRef
      .where('twilioConfig.whatsappNumber', '==', `whatsapp:${restaurantWhatsAppNumber}`)
      .limit(1)
      .get();

    if (restaurantQuery.empty) {
      console.error('[Webhook] Restaurant not found for:', restaurantWhatsAppNumber);
      res.setHeader('Content-Type', 'text/xml');
      return res.status(404).send(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Restaurant not found.</Message></Response>'
      );
    }

    const restaurantDoc = restaurantQuery.docs[0];
    const restaurantData = restaurantDoc.data();
    const restaurantId = restaurantData.id || restaurantDoc.id;
    const restaurantName = restaurantData.name || 'Restaurant';

    // Reference to subscribers collection
    const subscribersRef = db.collection(`restaurants/${restaurantId}/subscribers`);

    // Handle STOP command
    if (message === 'STOP' || message === 'UNSUBSCRIBE' || message === 'QUIT') {
      // Find subscriber by phone
      const subscriberQuery = await subscribersRef
        .where('phone', '==', customerPhone)
        .limit(1)
        .get();

      if (!subscriberQuery.empty) {
        // Delete subscriber
        await subscriberQuery.docs[0].ref.delete();
        console.log('[Webhook] Unsubscribed:', customerPhone, 'from', restaurantName);

        // Send confirmation
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>✓ You have been unsubscribed from ${restaurantName}. Reply START to re-subscribe.</Message></Response>`
        );
      } else {
        // Not subscribed
        console.log('[Webhook] Not subscribed:', customerPhone);
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You are not currently subscribed to ${restaurantName}.</Message></Response>`
        );
      }
    }

    // Handle START command
    if (message === 'START' || message === 'SUBSCRIBE' || message === 'YES') {
      // Check if already subscribed
      const subscriberQuery = await subscribersRef
        .where('phone', '==', customerPhone)
        .limit(1)
        .get();

      if (subscriberQuery.empty) {
        // Add new subscriber
        await subscribersRef.add({
          phone: customerPhone,
          originalInput: customerPhone,
          createdAt: new Date(),
          country: 'Unknown',
          source: 'whatsapp_webhook',
        });
        console.log('[Webhook] Subscribed:', customerPhone, 'to', restaurantName);

        // Send confirmation
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>✓ Welcome! You are now subscribed to ${restaurantName}'s WhatsApp updates. Reply STOP to unsubscribe.</Message></Response>`
        );
      } else {
        // Already subscribed
        console.log('[Webhook] Already subscribed:', customerPhone);
        res.setHeader('Content-Type', 'text/xml');
        return res.status(200).send(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You are already subscribed to ${restaurantName}. Reply STOP to unsubscribe.</Message></Response>`
        );
      }
    }

    // Unknown command - send help message
    console.log('[Webhook] Unknown command:', message);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Reply STOP to unsubscribe or START to subscribe to ${restaurantName}'s updates.</Message></Response>`
    );
  } catch (error) {
    console.error('[Webhook] Error:', error);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(500).send(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Service temporarily unavailable. Please try again later.</Message></Response>'
    );
  }
}
