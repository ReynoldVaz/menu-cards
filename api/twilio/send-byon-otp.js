/**
 * Send BYON OTP API
 * Sends a 6-digit verification code to the business phone number
 * This is triggered when a restaurant owner requests BYON setup
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phone, restaurantName, restaurantCode } = req.body;

    // Validate required fields
    if (!phone || !restaurantName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phone, restaurantName',
      });
    }

    console.log('[BYON OTP] Sending verification code to:', phone);

    // TODO: Implement real Twilio Verify API
    // const twilio = require('twilio');
    // const client = twilio(
    //   process.env.TWILIO_MASTER_ACCOUNT_SID,
    //   process.env.TWILIO_MASTER_AUTH_TOKEN
    // );
    //
    // try {
    //   const verification = await client.verify.v2
    //     .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    //     .verifications.create({
    //       to: phone,
    //       channel: 'sms',
    //       customFriendlyName: `Menu Cards - ${restaurantName}`,
    //     });
    //
    //   console.log('[BYON OTP] Verification sent:', verification.status);
    //
    //   return res.status(200).json({
    //     success: true,
    //     message: 'Verification code sent',
    //     data: {
    //       phone,
    //       status: verification.status,
    //       validUntil: verification.validUntil,
    //     },
    //   });
    // } catch (twilioError) {
    //   console.error('[BYON OTP] Twilio error:', twilioError);
    //   return res.status(400).json({
    //     success: false,
    //     message: twilioError.message || 'Failed to send verification code',
    //   });
    // }

    // PLACEHOLDER: Log the OTP send attempt
    console.log('[BYON OTP] SMS simulated for:', {
      phone,
      restaurantName,
      restaurantCode,
      message: 'Your Menu Cards verification code: 123456 (SIMULATED)',
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent (SIMULATED)',
      data: {
        phone,
        status: 'pending',
        validUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        isSimulated: true,
        simulatedCode: '123456', // Only for testing, remove in production
      },
    });

  } catch (error) {
    console.error('[BYON OTP] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code',
    });
  }
}
