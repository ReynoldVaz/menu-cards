/**
 * Twilio Subaccount Creation API
 * Creates a new Twilio subaccount for a restaurant and registers WhatsApp sender
 * 
 * Supports two setup types:
 * 1. new_number: Provisions a new WhatsApp number from Twilio
 * 2. existing_number: Ports existing business number (BYON)
 * 
 * PLACEHOLDERS:
 * - TWILIO_ACCOUNT_SID: Master Twilio account SID
 * - TWILIO_AUTH_TOKEN: Master Twilio auth token
 * - TWILIO_WHATSAPP_NUMBER: WhatsApp-enabled number to assign
 */

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      restaurantCode, 
      restaurantName, 
      ownerEmail, 
      ownerPhone,
      setupType = 'new_number',
      existingPhone = null
    } = req.body;

    if (!restaurantCode || !restaurantName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: restaurantCode, restaurantName' 
      });
    }

    // TODO: Replace with actual Twilio master credentials from environment variables
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_MASTER_ACCOUNT_SID || 'PLACEHOLDER_MASTER_SID';
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_MASTER_AUTH_TOKEN || 'PLACEHOLDER_MASTER_TOKEN';

    // Placeholder: Simulated Twilio API call
    // In production, use Twilio SDK:
    // const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    // const subaccount = await client.api.accounts.create({
    //   friendlyName: `Restaurant: ${restaurantName} (${restaurantCode})`
    // });

    console.log('[Twilio] Creating subaccount for:', restaurantName);
    console.log('[Twilio] Master SID:', TWILIO_ACCOUNT_SID);
    console.log('[Twilio] Setup type:', setupType);
    
    if (setupType === 'existing_number') {
      console.log('[Twilio] BYON - Porting existing number:', existingPhone);
      if (!existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'existingPhone is required for BYON setup'
        });
      }
    }

    // Simulate subaccount creation
    const simulatedSubaccount = {
      sid: `AC${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      authToken: `AUTH_TOKEN_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
      friendlyName: `Restaurant: ${restaurantName} (${restaurantCode})`,
      status: 'active',
      dateCreated: new Date().toISOString(),
    };

    // Determine WhatsApp number based on setup type
    let simulatedWhatsAppNumber;
    if (setupType === 'existing_number' && existingPhone) {
      // BYON: Use the verified existing number
      simulatedWhatsAppNumber = existingPhone.startsWith('whatsapp:') 
        ? existingPhone 
        : `whatsapp:${existingPhone}`;
      console.log('[Twilio] BYON - Using verified number:', simulatedWhatsAppNumber);
    } else {
      // New number: Provision from Twilio pool
      simulatedWhatsAppNumber = `whatsapp:+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
      console.log('[Twilio] New number provisioned:', simulatedWhatsAppNumber);
    }

    // TODO: In production, register WhatsApp sender with Twilio
    // const messagingService = await client.messaging.services.create({
    //   friendlyName: `${restaurantName} WhatsApp`,
    // });
    // await client.messaging.services(messagingService.sid)
    //   .phoneNumbers.create({ phoneNumberSid: 'YOUR_WHATSAPP_NUMBER_SID' });

    console.log('[Twilio] Subaccount created:', simulatedSubaccount.sid);
    console.log('[Twilio] WhatsApp number assigned:', simulatedWhatsAppNumber);

    // Return credentials to be stored in Firestore by frontend
    return res.status(200).json({
      success: true,
      message: setupType === 'existing_number' 
        ? 'Subaccount created with BYON successfully (SIMULATED)'
        : 'Subaccount created successfully (SIMULATED)',
      data: {
        subaccountSid: simulatedSubaccount.sid,
        authToken: simulatedSubaccount.authToken,
        whatsappNumber: simulatedWhatsAppNumber,
        setupType,
        status: 'pending', // Change to 'active' after real Twilio approval
        createdAt: simulatedSubaccount.dateCreated,
        isSimulated: true, // Flag to indicate this is placeholder data
      },
    });

  } catch (error) {
    console.error('[Twilio] Error creating subaccount:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subaccount',
    });
  }
}
