/**
 * BYON (Bring Your Own Number) Verification API
 * Verifies the 6-digit OTP for existing number porting
 * 
 * Flow:
 * 1. Owner submits existing number in WhatsApp request
 * 2. Twilio sends SMS with 6-digit code to that number
 * 3. Owner provides code to Master Admin
 * 4. Admin submits code via this endpoint
 * 5. Twilio validates and completes number porting
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      phone,
      verificationCode,
      restaurantCode,
    } = req.body;

    // Validate required fields
    if (!phone || !verificationCode || !restaurantCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: phone, verificationCode, restaurantCode',
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(verificationCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Must be 6 digits.',
      });
    }

    console.log('[BYON Verification] Validating code for:', phone);

    // TODO: Implement real Twilio verification
    // const twilio = require('twilio');
    // const client = twilio(
    //   process.env.TWILIO_MASTER_ACCOUNT_SID,
    //   process.env.TWILIO_MASTER_AUTH_TOKEN
    // );
    //
    // try {
    //   const verificationCheck = await client.verify.v2
    //     .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    //     .verificationChecks.create({
    //       to: phone,
    //       code: verificationCode,
    //     });
    //
    //   if (verificationCheck.status !== 'approved') {
    //     return res.status(400).json({
    //       success: false,
    //       message: 'Invalid verification code',
    //     });
    //   }
    // } catch (twilioError) {
    //   console.error('[BYON Verification] Twilio error:', twilioError);
    //   return res.status(400).json({
    //     success: false,
    //     message: twilioError.message || 'Verification failed',
    //   });
    // }

    // PLACEHOLDER: Accept any 6-digit code for now
    console.log('[BYON Verification] Code accepted (SIMULATED):', verificationCode);

    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      data: {
        phone,
        verified: true,
        verifiedAt: new Date().toISOString(),
        isSimulated: true, // Remove in production
      },
    });

  } catch (error) {
    console.error('[BYON Verification] Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Verification failed',
    });
  }
}
