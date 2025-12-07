import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResendEmail(to: string, subject: string, html: string) {
  return await resend.emails.send({
    from: 'admin@yourdomain.com',
    to,
    subject,
    html,
  });
}