# Email Service Setup Guide

## Overview

The application now includes email functionality for sending registration approval/rejection/welcome emails to restaurant owners. The email system is configured to work with **SendGrid**, but can be adapted to other services (Mailgun, Firebase Functions, etc.).

## Current Implementation

- **Backend Handler**: `/api/send-email.js` - Handles email requests
- **Frontend Utility**: `src/utils/emailService.ts` - Makes API calls to send emails
- **Templates**: 3 HTML email templates (approval, rejection, welcome)
- **Status**: ✅ Backend endpoint created, frontend utility ready, awaiting SendGrid configuration

## Setup Instructions

### Option 1: SendGrid (Recommended)

SendGrid is free for up to 100 emails/day, perfect for development and small deployments.

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for a free account
   - Verify your email address

2. **Get API Key**
   - Login to SendGrid dashboard
   - Navigate to Settings → API Keys
   - Click "Create API Key"
   - Give it a name like "Menu Cards - Development"
   - Select "Full Access" or customize permissions:
     - `mail.send` - Required
     - `api_keys.read` - Optional
   - Copy the API key (keep it secret!)

3. **Configure Environment Variables**
   
   **For Development** (add to `.env` or `.env.local`):
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@menucards.com
   APP_URL=http://localhost:5173
   ```

   **For Production** (Vercel):
   - Go to your Vercel project settings
   - Click "Environment Variables"
   - Add the following variables:
     - `SENDGRID_API_KEY` = Your SendGrid API key
     - `SENDGRID_FROM_EMAIL` = noreply@menucards.com (or your domain)
     - `APP_URL` = https://menu-cards.vercel.app

4. **Verify Sender Email** (Important!)
   - SendGrid requires verifying the "From" email address
   - In SendGrid dashboard: Settings → Sender Authentication
   - For development: Add your personal email
   - For production: Add your business domain or use SendGrid's verification

5. **Test Email Sending**
   ```bash
   # Start dev server
   npm run dev:api
   
   # In another terminal, test with curl:
   curl -X POST http://localhost:3001/api/send-email \
     -H "Content-Type: application/json" \
     -d '{
       "to": "your-email@example.com",
       "subject": "Test Email",
       "template": "welcome",
       "data": { "restaurantName": "Test Restaurant" }
     }'
   ```

### Option 2: Mailgun

If you prefer Mailgun:

1. **Create Account**
   - Go to https://mailgun.com
   - Sign up and add your domain

2. **Install Package**
   ```bash
   npm install mailgun.js form-data
   ```

3. **Update `/api/send-email.js`**
   - Uncomment the `sendEmailViaMailgun` function at the bottom
   - Replace the `sendEmailViaSendGrid` call with `sendEmailViaMailgun`

4. **Add Environment Variables**
   ```
   MAILGUN_API_KEY=your_api_key
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAILGUN_FROM_EMAIL=noreply@yourdomain.com
   ```

### Option 3: Firebase Cloud Functions

If you want to use Firebase instead:

1. **Install Firebase Functions**
   ```bash
   npm install firebase-functions firebase-admin
   ```

2. **Create `functions/send-email.js`**
   - Reference the email templates from `/api/send-email.js`
   - Use Firebase Admin SDK to send emails

3. **Deploy**
   ```bash
   firebase deploy --only functions
   ```

## Email Templates

Three templates are available:

### 1. Approval Template
```typescript
{
  "to": "owner@example.com",
  "subject": "Registration Approved!",
  "template": "approval",
  "data": {
    "restaurantName": "The Olive Garden",
    "restaurantCode": "REST-123456"
  }
}
```

### 2. Rejection Template
```typescript
{
  "to": "owner@example.com",
  "subject": "Registration Status Update",
  "template": "rejection",
  "data": {
    "restaurantName": "The Olive Garden",
    "rejectionReason": "Missing required business license documentation"
  }
}
```

### 3. Welcome Template
```typescript
{
  "to": "owner@example.com",
  "subject": "Welcome to Menu Cards!",
  "template": "welcome",
  "data": {
    "restaurantName": "The Olive Garden"
  }
}
```

## Integration with MasterAdminDashboard

Once emails are working, update the approval/rejection handlers in `MasterAdminDashboard.tsx`:

```typescript
// In approval handler:
import { sendApprovalEmail } from '@/utils/emailService';

const handleApprove = async (requestId: string, restaurantCode: string) => {
  // Update Firebase...
  
  // Send approval email
  const result = await sendApprovalEmail(
    ownerEmail,
    restaurantName,
    restaurantCode
  );
  
  if (result.success) {
    toast.success('Restaurant approved and email sent!');
  }
};

// Similar pattern for rejection
const handleReject = async (requestId: string, rejectionReason: string) => {
  // Update Firebase...
  
  const result = await sendRejectionEmail(
    ownerEmail,
    restaurantName,
    rejectionReason
  );
  
  if (result.success) {
    toast.success('Restaurant rejected and email sent!');
  }
};
```

## Testing Checklist

- [ ] SendGrid account created and API key obtained
- [ ] Environment variables configured locally
- [ ] Test email sent successfully via dev server
- [ ] Email contains correct template and data
- [ ] Email formatting looks good in email client
- [ ] Production environment variables set in Vercel
- [ ] Test approval email from MasterAdminDashboard
- [ ] Test rejection email with custom reason
- [ ] Test welcome email on new account creation

## Troubleshooting

### "Email service not configured"
- Ensure `SENDGRID_API_KEY` is set in `.env` or Vercel
- Verify environment variable name is exactly `SENDGRID_API_KEY`

### "Failed to send email"
- Check SendGrid dashboard for any errors
- Verify sender email is authenticated in SendGrid
- Check recipient email is valid
- Review console logs in dev server or Vercel logs

### "Email appears to be sent but not received"
- Check spam/junk folder
- Verify email domain authentication (SPF/DKIM records)
- Check SendGrid Activity feed for bounce/suppression

### Dev server not showing email logs
- Ensure dev server is running with: `npm run dev:api`
- Check console for `[Email]` prefix logs
- Verify `/api/send-email` endpoint is mounted in `api-dev-server.js`

## Security Notes

- Never commit API keys to git
- Use environment variables for all secrets
- Keep `SENDGRID_API_KEY` private - it can send emails on your behalf
- In production, use Vercel's environment variables system
- Consider rate limiting email sending to prevent abuse

## Cost

- **SendGrid**: Free tier (100 emails/day) - perfect for development
- **Mailgun**: Free tier (5,000 emails/month) - good for small deployments
- **Firebase Cloud Functions**: Free tier included with Firebase

## Next Steps

1. Choose your email service (SendGrid recommended)
2. Set up account and get API key
3. Configure environment variables
4. Test email sending with the curl command above
5. Integrate into `MasterAdminDashboard.tsx` approval/rejection flows
6. Deploy to Vercel and configure production variables
