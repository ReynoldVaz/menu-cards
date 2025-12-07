// Utility to send email via backend API
export async function sendEmailClient({ to, subject, html }: { to: string; subject: string; html: string }) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ to, subject, html }),
  });
  return response.json();
}
