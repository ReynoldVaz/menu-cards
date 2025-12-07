
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log(`[Email API] ✓ Module loaded - ${new Date().toISOString()}`);
console.log(`[Email API] Email service type: Resend`);
console.log(`[Email API] Email service configured: ${!!resend}`);

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
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    return;
  }

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@menucards.app',
      to,
      subject,
      html,
      reply_to: 'support@menucards.app',
    });
    res.status(200).json({ success: true, result });
    return;
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    return;
  }
}


