import nodemailer from 'nodemailer';

// Determine which email service to use
const USE_SENDGRID = !!process.env.SENDGRID_API_KEY;
const USE_GMAIL = !!process.env.EMAIL_USER && !!process.env.EMAIL_PASSWORD;

let transporter = null;

if (USE_SENDGRID) {
  console.log(`[Email API] Using SendGrid for email delivery`);
  // Use SendGrid via Nodemailer SMTP relay
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
} else if (USE_GMAIL) {
  console.log(`[Email API] Using Gmail SMTP for email delivery`);
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
} else {
  console.warn(`[Email API] ⚠️ No email service configured!`);
  console.warn(`[Email API] Set either SENDGRID_API_KEY or (EMAIL_USER + EMAIL_PASSWORD)`);
}

console.log(`[Email API] ✓ Module loaded - ${new Date().toISOString()}`);
console.log(`[Email API] Email service type: ${USE_SENDGRID ? 'SendGrid' : USE_GMAIL ? 'Gmail' : 'NONE'}`);
console.log(`[Email API] Email service configured: ${!!transporter}`);

// Email template generator
function getEmailTemplate(type, data) {
  const baseStyles = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #f9fafb;
  `;

  const headerStyles = `
    background: linear-gradient(135deg, #EA580C 0%, #FB923C 100%);
    color: white;
    padding: 40px 20px;
    text-align: center;
  `;

  const contentStyles = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    margin: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;

  const buttonStyles = `
    background-color: #EA580C;
    color: white;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    display: inline-block;
    margin: 20px 0;
  `;

  const footerStyles = `
    background-color: #f3f4f6;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
    border-top: 1px solid #e5e7eb;
  `;

  if (type === 'approval') {
    return {
      html: `
        <div style="${baseStyles}">
          <div style="${headerStyles}">
            <h1 style="margin: 0; font-size: 28px;">✓ Registration Approved</h1>
          </div>
          
          <div style="${contentStyles}">
            <p>Hi ${data.restaurantName},</p>
            
            <p>Great news! Your restaurant registration has been <strong>approved</strong> by our team.</p>
            
            <p>Your restaurant is now live on our platform. You can start managing your menu items and restaurant information.</p>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #EA580C; margin: 20px 0; border-radius: 4px;">
              <strong>Restaurant Code:</strong> ${data.restaurantCode}
            </div>
            
            <p>
              <a href="${process.env.APP_URL || 'https://menu-cards.vercel.app'}/login" style="${buttonStyles}">
                Go to Dashboard
              </a>
            </p>
            
            <p>If you have any questions, please feel free to contact our support team.</p>
            
            <p>Welcome aboard!</p>
            <p><strong>Menu Cards Team</strong></p>
          </div>
          
          <div style="${footerStyles}">
            <p>This is an automated email. Please do not reply directly to this email.</p>
            <p>&copy; 2024 Menu Cards. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
Registration Approved

Hi ${data.restaurantName},

Great news! Your restaurant registration has been approved by our team.

Your restaurant is now live on our platform. You can start managing your menu items and restaurant information.

Restaurant Code: ${data.restaurantCode}

Visit your dashboard at: ${process.env.APP_URL || 'https://menu-cards.vercel.app'}/login

If you have any questions, please feel free to contact our support team.

Welcome aboard!

Menu Cards Team
      `,
    };
  }

  if (type === 'rejection') {
    return {
      html: `
        <div style="${baseStyles}">
          <div style="${headerStyles}">
            <h1 style="margin: 0; font-size: 28px;">Registration Status Update</h1>
          </div>
          
          <div style="${contentStyles}">
            <p>Hi ${data.restaurantName},</p>
            
            <p>Thank you for your interest in joining our platform.</p>
            
            <p>Unfortunately, your registration request has been <strong>declined</strong> at this time.</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
              <strong>Reason:</strong> ${data.rejectionReason}
            </div>
            
            <p>If you believe this decision was made in error or would like more information, please reach out to our support team.</p>
            
            <p>We appreciate your interest and hope you'll consider applying again in the future.</p>
            
            <p><strong>Menu Cards Team</strong></p>
          </div>
          
          <div style="${footerStyles}">
            <p>This is an automated email. Please do not reply directly to this email.</p>
            <p>&copy; 2024 Menu Cards. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
Registration Status Update

Hi ${data.restaurantName},

Thank you for your interest in joining our platform.

Unfortunately, your registration request has been declined at this time.

Reason: ${data.rejectionReason}

If you believe this decision was made in error or would like more information, please reach out to our support team.

We appreciate your interest and hope you'll consider applying again in the future.

Menu Cards Team
      `,
    };
  }

  return { html: '', text: '' };
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check for dummy email patterns
function isDummyEmail(email) {
  const dummyPatterns = [
    /^test@/i,
    /^demo@/i,
    /^dummy@/i,
    /^fake@/i,
    /^temp@/i,
    /example\.com$/i,
    /test\.com$/i,
    /localhost/i,
  ];
  return dummyPatterns.some(pattern => pattern.test(email));
}

// Main email handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { type, to, restaurantName, restaurantCode, rejectionReason } = req.body;

    console.log(`[Email] === RECEIVED REQUEST ===`);
    console.log(`[Email] Type:`, type);
    console.log(`[Email] To:`, to);
    console.log(`[Email] Restaurant:`, restaurantName);
    console.log(`[Email] Configured EMAIL_USER:`, process.env.EMAIL_USER);
    console.log(`[Email] Configured EMAIL_PASSWORD:`, process.env.EMAIL_PASSWORD ? '✓ SET' : '✗ NOT SET');
    console.log(`[Email] Sending ${type} email to:`, to);

    // Validate required fields
    if (!type || !to || !restaurantName) {
      console.warn('[Email] Missing required fields:', { type, to, restaurantName });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, to, restaurantName',
      });
    }

    // Validate email format
    if (!isValidEmail(to)) {
      console.warn('[Email] Invalid email format:', to);
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format',
      });
    }

    // Check for dummy email patterns
    if (isDummyEmail(to)) {
      console.warn('[Email] Rejected dummy email pattern:', to);
      return res.status(400).json({
        success: false,
        message: 'Invalid email address (dummy/test email)',
      });
    }

    // Get email template
    const template = getEmailTemplate(type, {
      restaurantName,
      restaurantCode,
      rejectionReason: rejectionReason || 'Your application does not meet our current requirements.',
    });

    if (!template.html) {
      console.warn('[Email] Unknown email type:', type);
      return res.status(400).json({
        success: false,
        message: 'Unknown email type',
      });
    }

    // Send email
    const mailOptions = {
      from: USE_SENDGRID 
        ? (process.env.SENDGRID_FROM_EMAIL || 'noreply@menucards.app')
        : (process.env.EMAIL_USER || 'noreply@menucards.app'),
      to: to,
      subject: type === 'approval' 
        ? `Welcome to Menu Cards - ${restaurantName}!` 
        : `Update on Your Menu Cards Registration`,
      html: template.html,
      text: template.text,
      replyTo: 'support@menucards.app',
    };

    console.log('[Email] Sending with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      service: USE_SENDGRID ? 'SendGrid' : 'Gmail',
    });

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email] ✓ ${type} email sent successfully:`, info.messageId);

    return res.status(200).json({
      success: true,
      message: `${type} email sent successfully`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error('[Email] ✗ CRITICAL ERROR:');
    console.error('[Email] Error name:', error.name);
    console.error('[Email] Error message:', error.message);
    console.error('[Email] Error code:', error.code);
    console.error('[Email] Full error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send email: ' + (error.message || 'Unknown error'),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
