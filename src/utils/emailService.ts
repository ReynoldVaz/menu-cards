/**
 * Email Service Utility
 * Handles sending emails for registration approvals, rejections, etc.
 * 
 * Note: This requires a backend email service (e.g., SendGrid, Mailgun, Firebase Functions)
 * For now, this file provides the structure to integrate with any email service
 */

interface EmailPayload {
  to: string;
  subject: string;
  template: 'approval' | 'rejection' | 'welcome';
  data?: {
    restaurantName?: string;
    ownerName?: string;
    restaurantCode?: string;
    rejectionReason?: string;
  };
}

/**
 * Send approval email to restaurant owner
 */
export const sendApprovalEmail = async (
  ownerEmail: string,
  restaurantName: string,
  restaurantCode: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[sendApprovalEmail] Starting...');
    console.log('[sendApprovalEmail] Email:', ownerEmail);
    console.log('[sendApprovalEmail] Restaurant:', restaurantName);
    console.log('[sendApprovalEmail] Code:', restaurantCode);
    
    const payload = {
      type: 'approval',
      to: ownerEmail,
      restaurantName,
      restaurantCode,
    };

    console.log('[sendApprovalEmail] Payload:', payload);
    console.log('[sendApprovalEmail] Sending POST to /api/send-email...');

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[sendApprovalEmail] Response status:', response.status);
    console.log('[sendApprovalEmail] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendApprovalEmail] Error response:', errorText);
      throw new Error(`Email send failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[sendApprovalEmail] API Response:', result);
    console.log('✅ Approval email API call successful');
    return { success: true, message: 'Approval email sent successfully' };
  } catch (err) {
    console.error('❌ Failed to send approval email:', err);
    console.error('[sendApprovalEmail] Error details:', err instanceof Error ? err.message : String(err));
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to send email'
    };
  }
};

/**
 * Send rejection email to restaurant owner
 */
export const sendRejectionEmail = async (
  ownerEmail: string,
  restaurantName: string,
  rejectionReason: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('[sendRejectionEmail] Starting...');
    console.log('[sendRejectionEmail] Email:', ownerEmail);
    console.log('[sendRejectionEmail] Restaurant:', restaurantName);
    console.log('[sendRejectionEmail] Reason:', rejectionReason);
    
    const payload = {
      type: 'rejection',
      to: ownerEmail,
      restaurantName,
      rejectionReason,
    };

    console.log('[sendRejectionEmail] Payload:', payload);
    console.log('[sendRejectionEmail] Sending POST to /api/send-email...');

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[sendRejectionEmail] Response status:', response.status);
    console.log('[sendRejectionEmail] Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendRejectionEmail] Error response:', errorText);
      throw new Error(`Email send failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[sendRejectionEmail] API Response:', result);
    console.log('✅ Rejection email API call successful');
    return { success: true, message: 'Rejection email sent successfully' };
  } catch (err) {
    console.error('❌ Failed to send rejection email:', err);
    console.error('[sendRejectionEmail] Error details:', err instanceof Error ? err.message : String(err));
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to send email'
    };
  }
};

/**
 * Send welcome email to new restaurant owner
 */
export const sendWelcomeEmail = async (
  ownerEmail: string,
  restaurantName: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const payload: EmailPayload = {
      to: ownerEmail,
      subject: `Welcome to Menu Cards - ${restaurantName}`,
      template: 'welcome',
      data: {
        restaurantName,
      },
    };

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.statusText}`);
    }

    console.log('✅ Welcome email sent to:', ownerEmail);
    return { success: true, message: 'Welcome email sent successfully' };
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err);
    return { 
      success: false, 
      message: err instanceof Error ? err.message : 'Failed to send email'
    };
  }
};

/**
 * Email template generator (for future reference)
 * You can customize these templates in your backend email service
 */
export const getEmailTemplate = (template: string, data: any): string => {
  const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9fafb;
  `;

  switch (template) {
    case 'approval':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #22c55e;">🎉 Registration Approved!</h1>
          <p>Hello,</p>
          <p>Great news! Your restaurant <strong>${data.restaurantName}</strong> has been approved and is now live on Menu Cards.</p>
          <p><strong>Restaurant Code:</strong> ${data.restaurantCode}</p>
          <p>You can now:</p>
          <ul>
            <li>Upload your menu items</li>
            <li>Manage restaurant details</li>
            <li>View customer interactions</li>
            <li>Update your theme and branding</li>
          </ul>
          <p><a href="${window.location.origin}/admin/dashboard" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        </div>
      `;

    case 'rejection':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #ef4444;">Registration Status Update</h1>
          <p>Hello,</p>
          <p>Thank you for submitting your restaurant <strong>${data.restaurantName}</strong> for registration.</p>
          <p><strong>Reason:</strong> ${data.rejectionReason}</p>
          <p>Please review and resubmit your application. If you have questions, please contact our support team.</p>
        </div>
      `;

    case 'welcome':
      return `
        <div style="${baseStyles}">
          <h1 style="color: #f97316;">Welcome to Menu Cards!</h1>
          <p>Hello,</p>
          <p>Welcome <strong>${data.restaurantName}</strong>! Your account has been created successfully.</p>
          <p>Next steps:</p>
          <ol>
            <li>Complete your restaurant profile</li>
            <li>Upload your menu items</li>
            <li>Customize your theme</li>
            <li>Share your menu code with customers</li>
          </ol>
          <p>We're excited to have you on board!</p>
        </div>
      `;

    default:
      return '';
  }
};
