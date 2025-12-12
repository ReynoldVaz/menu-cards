/**
 * Twilio WhatsApp Message Sending API
 * Sends WhatsApp messages using restaurant's Twilio subaccount credentials
 * 
 * SECURITY: Expects encrypted authToken from client
 * Decrypts token before using with Twilio API
 */

import { decryptToken, safeDecrypt } from '../../src/utils/encryption.ts';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      restaurantCode, 
      subaccountSid, 
      authToken, 
      whatsappNumber, 
      recipients, 
      message 
    } = req.body;

    // Validate required fields
    if (!restaurantCode || !subaccountSid || !authToken || !whatsappNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: restaurantCode, subaccountSid, authToken, whatsappNumber' 
      });
    }

    // SECURITY FIX: Decrypt auth token before using
    let decryptedAuthToken;
    try {
      decryptedAuthToken = safeDecrypt(authToken);
    } catch (error) {
      console.error('[Twilio] Failed to decrypt auth token:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt authentication token'
      });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipients array is required and must not be empty' 
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message content is required' 
      });
    }

    console.log('[Twilio] Sending messages for restaurant:', restaurantCode);
    console.log('[Twilio] Using subaccount:', subaccountSid);
    console.log('[Twilio] From number:', whatsappNumber);
    console.log('[Twilio] Recipients:', recipients.length);

    // TODO: Use real Twilio SDK in production
    // IMPORTANT: Use decryptedAuthToken instead of authToken
    // const client = require('twilio')(subaccountSid, decryptedAuthToken);
    // const results = await Promise.all(
    //   recipients.map(async (phone) => {
    //     try {
    //       const msg = await client.messages.create({
    //         from: whatsappNumber,
    //         to: phone,
    //         body: message,
    //       });
    //       return { phone, status: 'sent', sid: msg.sid };
    //     } catch (err) {
    //       return { phone, status: 'failed', error: err.message };
    //     }
    //   })
    // );

    // Simulate sending messages
    const simulatedResults = recipients.map((phone) => ({
      phone,
      status: 'queued',
      sid: `SM${Math.random().toString(36).substring(2, 15)}`,
      timestamp: new Date().toISOString(),
    }));

    console.log('[Twilio] Messages queued (SIMULATED):', simulatedResults.length);

    return res.status(200).json({
      success: true,
      message: `Broadcast sent to ${recipients.length} recipients (SIMULATED)`,
      data: {
        totalRecipients: recipients.length,
        results: simulatedResults,
        isSimulated: true,
      },
    });

  } catch (error) {
    console.error('[Twilio] Error sending messages:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send messages',
    });
  }
}
