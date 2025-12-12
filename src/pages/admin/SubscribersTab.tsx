import { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import type { Restaurant } from '../../hooks/useFirebaseRestaurant';

// FEATURE FLAG: BYON (Bring Your Own Number)
// Set to true when ready to enable number porting feature
// Currently disabled pending proper Twilio porting integration
// const BYON_ENABLED = false;
const BYON_ENABLED = true;

interface SubscribersTabProps {
  restaurant: Restaurant;
  onUpdate: () => void;
}

interface WhatsAppRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  requestedAt: string;
}

interface TwilioConfig {
  subaccountSid?: string;
  authToken?: string;
  whatsappNumber?: string;
  status?: string;
  isSimulated?: boolean;
}

export function SubscribersTab({ restaurant }: SubscribersTabProps) {
  const [subscribers, setSubscribers] = useState<Array<{ id: string; phone: string; originalInput?: string; createdAt?: any }>>([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [whatsappRequest, setWhatsappRequest] = useState<WhatsAppRequest | null>(null);
  const [requestForm, setRequestForm] = useState({
    useExistingNumber: false,
    businessPhone: '',
    broadcastsPerWeek: 2,
    broadcastsPerMonth: 8,
    estimatedRecipientsPerBroadcast: 100,
    useCase: '',
    sampleMessage: '',
    agreedToTerms: false,
  });

  useEffect(() => {
    const ref = collection(db, `restaurants/${restaurant.id}/subscribers`);
    getDocs(ref).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSubscribers(list);
    }).catch((err) => {
      console.error('Failed to load subscribers:', err);
    });

    // Load Twilio config
    const restaurantRef = collection(db, 'restaurants');
    getDocs(restaurantRef).then((snap) => {
      const restaurantDoc = snap.docs.find(d => d.id === restaurant.restaurantCode);
      if (restaurantDoc && restaurantDoc.data().twilioConfig) {
        setTwilioConfig(restaurantDoc.data().twilioConfig as TwilioConfig);
      }
    }).catch((err) => {
      console.error('Failed to load Twilio config:', err);
    });

    // Load existing WhatsApp request
    loadWhatsAppRequest();
  }, [restaurant.id, restaurant.restaurantCode]);

  async function loadWhatsAppRequest() {
    try {
      const requestsRef = collection(db, 'whatsapp_requests');
      const q = query(requestsRef, where('restaurantId', '==', restaurant.id));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const requestDoc = snapshot.docs[0];
        setWhatsappRequest({
          id: requestDoc.id,
          status: requestDoc.data().status,
          rejectionReason: requestDoc.data().rejectionReason,
          requestedAt: requestDoc.data().requestedAt,
        });
      }
    } catch (err) {
      console.error('Failed to load WhatsApp request:', err);
    }
  }

  async function checkBroadcastLimits() {
    // Check if restaurant has approved broadcast limits
    const restaurantRef = collection(db, 'restaurants');
    const snap = await getDocs(restaurantRef);
    const restaurantDoc = snap.docs.find(d => d.id === restaurant.restaurantCode);
    
    if (!restaurantDoc) {
      return { allowed: false, message: 'Restaurant configuration not found.' };
    }

    const data = restaurantDoc.data();
    const broadcastLimits = data.twilioConfig?.broadcastLimits;

    if (!broadcastLimits) {
      return { allowed: false, message: 'Broadcast limits not configured. Please contact support.' };
    }

    // Get broadcast history for current week and month
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const historyRef = collection(db, `restaurants/${restaurant.id}/broadcast_history`);
    const snapshot = await getDocs(historyRef);
    
    const broadcasts = snapshot.docs.map(d => ({
      timestamp: d.data().timestamp?.toDate(),
      recipientCount: d.data().recipientCount || 0,
    }));

    // Count broadcasts this week and month
    const weekBroadcasts = broadcasts.filter(b => b.timestamp >= weekStart).length;
    const monthBroadcasts = broadcasts.filter(b => b.timestamp >= monthStart).length;

    // Check limits
    if (weekBroadcasts >= broadcastLimits.perWeek) {
      return { 
        allowed: false, 
        message: `⚠️ Weekly limit reached (${weekBroadcasts}/${broadcastLimits.perWeek}). Resets on ${new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.` 
      };
    }

    if (monthBroadcasts >= broadcastLimits.perMonth) {
      return { 
        allowed: false, 
        message: `⚠️ Monthly limit reached (${monthBroadcasts}/${broadcastLimits.perMonth}). Resets on ${new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString()}.` 
      };
    }

    return { 
      allowed: true, 
      message: `✓ Allowed (Week: ${weekBroadcasts}/${broadcastLimits.perWeek}, Month: ${monthBroadcasts}/${broadcastLimits.perMonth})` 
    };
  }

  function downloadCsv() {
    const rows = subscribers.map((s) => ({
      phone: s.phone,
      originalInput: s.originalInput || '',
      createdAt: s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : '',
    }));
    const header = ['phone','originalInput','createdAt'];
    const csv = [header.join(','), ...rows.map(r => `${r.phone},${r.originalInput},${r.createdAt}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurant.name.replace(/[^a-z0-9]+/gi,'-')}-subscribers.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }



  async function handleSubmitWhatsAppRequest() {
    if (!requestForm.agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    if (!requestForm.useCase.trim() || !requestForm.sampleMessage.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (requestForm.useExistingNumber && !requestForm.businessPhone.trim()) {
      alert('Please provide your existing phone number');
      return;
    }

    setSavingSettings(true);
    
    try {
      // Create WhatsApp request (NO OTP sent automatically - Admin will send on-demand)
      await addDoc(collection(db, 'whatsapp_requests'), {
        restaurantId: restaurant.id,
        restaurantCode: restaurant.restaurantCode,
        restaurantName: restaurant.name,
        ownerEmail: restaurant.email,
        setupType: requestForm.useExistingNumber ? 'existing_number' : 'new_number',
        businessPhone: requestForm.businessPhone || null,
        broadcastLimits: {
          perWeek: requestForm.broadcastsPerWeek,
          perMonth: requestForm.broadcastsPerMonth,
          estimatedRecipients: requestForm.estimatedRecipientsPerBroadcast,
        },
        useCase: requestForm.useCase,
        sampleMessage: requestForm.sampleMessage,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        otpSentAt: null, // OTP sent on-demand by Master Admin during approval
      });

      // Send email notification
      await notifyMasterAdminForWhatsAppSetup();

      // Reload request
      await loadWhatsAppRequest();
      
      setShowRequestForm(false);
      alert('✅ WhatsApp setup request submitted! You will be notified once approved.');
    } catch (err) {
      console.error('Failed to submit request:', err);
      alert('Failed to submit request');
    } finally {
      setSavingSettings(false);
    }
  }

  async function notifyMasterAdminForWhatsAppSetup() {
    try {
      // Send email notification to master admin
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: import.meta.env.VITE_MASTER_ADMIN_EMAIL || 'admin@menucards.com',
          subject: `WhatsApp Setup Request - ${restaurant.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #EA580C;">🔔 New WhatsApp Setup Request</h2>
              <p>A restaurant has submitted a WhatsApp marketing request:</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Restaurant Details</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Restaurant:</strong> ${restaurant.name}</li>
                  <li><strong>Code:</strong> ${restaurant.restaurantCode}</li>
                  <li><strong>Owner Email:</strong> ${restaurant.email}</li>
                  <li><strong>Business Phone:</strong> ${requestForm.businessPhone}</li>
                </ul>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Broadcasts per Week:</strong> ${requestForm.broadcastsPerWeek}</li>
                  <li><strong>Broadcasts per Month:</strong> ${requestForm.broadcastsPerMonth}</li>
                  <li><strong>Estimated Recipients:</strong> ${requestForm.estimatedRecipientsPerBroadcast} per broadcast</li>
                  <li><strong>Estimated Monthly Cost:</strong> $${(requestForm.broadcastsPerMonth * requestForm.estimatedRecipientsPerBroadcast * 0.005).toFixed(2)}</li>
                  <li style="margin-top: 10px;"><strong>Use Case:</strong> ${requestForm.useCase}</li>
                  <li style="margin-top: 10px;"><strong>Sample Message:</strong></li>
                  <li style="background: white; padding: 10px; border-radius: 4px; margin-top: 5px; font-style: italic;">
                    "${requestForm.sampleMessage}"
                  </li>
                </ul>
              </div>

              <p><strong>Action Required:</strong> Please review and approve/reject this request in the Master Admin Dashboard.</p>
              
              <a href="${window.location.origin}/master-admin" 
                 style="display: inline-block; background: #EA580C; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; margin: 20px 0;">
                Review Request in Dashboard
              </a>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Requested: ${new Date().toLocaleString()}
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send notification email');
      }
    } catch (err) {
      console.error('Error notifying master admin:', err);
      // Don't show error to user - it's background notification
    }
  }

  async function handleBroadcast() {
    if (!twilioConfig) {
      setBroadcastStatus('WhatsApp not configured. Please contact support.');
      return;
    }

    // Check broadcast limits before sending
    try {
      const limitsCheck = await checkBroadcastLimits();
      if (!limitsCheck.allowed) {
        setBroadcastStatus(limitsCheck.message);
        return;
      }
    } catch (err) {
      console.error('Failed to check limits:', err);
      setBroadcastStatus('Unable to verify broadcast limits. Please try again.');
      return;
    }

    setBroadcastLoading(true);
    setBroadcastStatus(null);
    try {
      const res = await fetch('/api/twilio/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantCode: restaurant.restaurantCode,
          subaccountSid: twilioConfig.subaccountSid,
          authToken: twilioConfig.authToken,
          whatsappNumber: twilioConfig.whatsappNumber,
          recipients: subscribers.map(s => s.phone),
          message: broadcastMsg,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setBroadcastStatus('Server error: ' + res.status + ' ' + res.statusText);
        return;
      }

      if (!res.ok) {
        setBroadcastStatus(data?.message || `Error: ${res.status} ${res.statusText}`);
      } else {
        // Log broadcast to history
        try {
          await addDoc(collection(db, `restaurants/${restaurant.id}/broadcast_history`), {
            timestamp: new Date(),
            recipientCount: subscribers.length,
            message: broadcastMsg.substring(0, 100), // Store first 100 chars
            sentBy: restaurant.email || 'unknown',
            status: 'success',
          });
        } catch (historyErr) {
          console.error('Failed to log broadcast history:', historyErr);
        }
        
        setBroadcastStatus(data?.message || 'Messages sent successfully!');
        setBroadcastMsg(''); // Clear message after successful send
        setTimeout(() => setShowBroadcast(false), 2000); // Auto-close after 2s
      }
    } catch (err) {
      setBroadcastStatus('Network error or server unavailable.');
    } finally {
      setBroadcastLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-6 space-y-6">
      {/* WhatsApp Marketing Setup */}
      <div className="bg-white rounded-xl shadow-md p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">WhatsApp Marketing</h3>
        
        {/* WhatsApp Status & Request */}
        <div className="p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">WhatsApp Broadcast & Phone Collection</h4>
              <p className="text-xs text-gray-500 mt-1">
                Send promotional messages via WhatsApp. Phone collection is automatically enabled when approved.
              </p>
            </div>
            {whatsappRequest && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                whatsappRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                whatsappRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {whatsappRequest.status === 'approved' ? '✓ Approved' :
                 whatsappRequest.status === 'rejected' ? '✗ Rejected' :
                 '⏳ Pending Review'}
              </span>
            )}
          </div>

          {!whatsappRequest && !twilioConfig && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="w-full px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg active:shadow-sm transition-all text-sm font-medium"
            >
              📲 Request WhatsApp Marketing Access
            </button>
          )}

          {whatsappRequest && whatsappRequest.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⏳ Your request is under review. You'll be notified once approved.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Requested: {new Date(whatsappRequest.requestedAt).toLocaleDateString()}
              </p>
            </div>
          )}

          {whatsappRequest && whatsappRequest.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium">✗ Request Rejected</p>
              {whatsappRequest.rejectionReason && (
                <p className="text-xs text-red-700 mt-2">
                  Reason: {whatsappRequest.rejectionReason}
                </p>
              )}
              <button
                onClick={() => setShowRequestForm(true)}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
              >
                Submit New Request
              </button>
            </div>
          )}

          {twilioConfig && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">✓ WhatsApp Marketing Active</p>
              <div className="text-xs text-green-700 mt-2 space-y-1">
                <p>📱 WhatsApp Number: {twilioConfig.whatsappNumber}</p>
                <p>✓ Phone collection enabled on menu</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subscribers List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Subscribers ({subscribers.length})</h2>
        {twilioConfig ? (
          <button
            className="px-4 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowBroadcast(true)}
            disabled={subscribers.length === 0}
          >
            📢 Broadcast
          </button>
        ) : whatsappRequest?.status === 'pending' ? (
          <div className="text-xs text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg">
            ⏳ WhatsApp setup pending approval
          </div>
        ) : (
          <div className="text-xs text-gray-500 bg-gray-200 px-3 py-2 rounded-lg">
            Request WhatsApp marketing in settings above
          </div>
        )}
      </div>
      {subscribers.length === 0 ? (
        <p className="text-gray-600">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">
          <table className="min-w-full text-sm bg-gradient-to-br from-white to-gray-50">
            <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Original Input</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Opt-in Date</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-gray-200">
                  <td className="px-4 py-3 font-mono">{s.phone}</td>
                  <td className="px-4 py-3">{s.originalInput || ''}</td>
                  <td className="px-4 py-3">{s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Broadcast WhatsApp Message</h3>
            
            {twilioConfig?.isSimulated && (
              <div className="mb-4 text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                ⚠️ Using simulated Twilio credentials for testing
              </div>
            )}

            {/* Message Templates */}
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">📝 Quick Templates:</p>
              <div className="space-y-1">
                <button
                  onClick={() => setBroadcastMsg(`🍽️ ${restaurant.name} - Today's Special!\n\n[Describe your special here]\nValid until [time]. Show this message at checkout.\n\nReply STOP to unsubscribe.`)}
                  className="w-full text-left text-xs text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                  disabled={broadcastLoading}
                >
                  ✨ Daily Special
                </button>
                <button
                  onClick={() => setBroadcastMsg(`🎉 Exclusive Offer at ${restaurant.name}!\n\n[Your discount/offer]\nValid: [dates]\n\nVisit us at [address]\nReply STOP to unsubscribe.`)}
                  className="w-full text-left text-xs text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                  disabled={broadcastLoading}
                >
                  🎁 Promotional Offer
                </button>
                <button
                  onClick={() => setBroadcastMsg(`📢 ${restaurant.name} Announcement\n\n[Your message here]\n\nThank you for being a valued customer!\nReply STOP to unsubscribe.`)}
                  className="w-full text-left text-xs text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                  disabled={broadcastLoading}
                >
                  📣 General Announcement
                </button>
              </div>
            </div>

            <textarea
              className="w-full rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              placeholder="Enter your message..."
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              disabled={broadcastLoading}
            />
            
            {/* Preview Section */}
            {broadcastMsg.trim() && (
              <div className="mb-3 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-800 mb-2">👁️ Message Preview:</p>
                <div className="bg-white rounded-lg p-3 mb-2 text-sm text-gray-700 whitespace-pre-wrap border border-green-200">
                  {broadcastMsg}
                </div>
                <div className="flex items-center justify-between text-xs text-green-700">
                  <span>📊 Characters: {broadcastMsg.length}</span>
                  <span>💬 {broadcastMsg.length > 160 ? '⚠️ Long message (may split)' : '✓ Single message'}</span>
                </div>
              </div>
            )}

            <div className="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-gray-700">📢 Recipients:</span>
                  <span className="ml-2 text-gray-600">{subscribers.length} subscribers</span>
                </div>
                {twilioConfig && (
                  <div className="text-xs text-gray-500">
                    From: {twilioConfig.whatsappNumber}
                  </div>
                )}
              </div>
              {subscribers.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  First 3: {subscribers.slice(0, 3).map(s => s.phone).join(', ')}
                  {subscribers.length > 3 && ` +${subscribers.length - 3} more`}
                </div>
              )}
            </div>
            {broadcastStatus && (
              <div className="mb-3 text-yellow-700 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl px-4 py-3 text-sm shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]">
                {broadcastStatus}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                className="px-5 py-2.5 bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all font-medium disabled:opacity-50"
                onClick={() => { setShowBroadcast(false); setBroadcastMsg(''); setBroadcastStatus(null); }}
                disabled={broadcastLoading}
              >Cancel</button>
              <button
                className="px-5 py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBroadcast}
                disabled={broadcastLoading || !broadcastMsg.trim()}
              >{broadcastLoading ? 'Sending...' : 'Send Broadcast'}</button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">📲 WhatsApp Marketing Request</h3>
            <p className="text-sm text-gray-600 mb-6">
              Fill in the details below to request WhatsApp marketing access. Our team will set up your WhatsApp Business account and notify you once approved.
            </p>

            {/* Important Disclaimer */}
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span className="text-lg">ℹ️</span> How WhatsApp Number Setup Works
              </h4>
              
              <div className="space-y-3 text-xs text-blue-800">
                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">🥇 Standard Setup (Recommended - Faster & Easier)</p>
                  <ul className="space-y-1 list-disc list-inside ml-2">
                    <li>We provide a <strong>new dedicated WhatsApp number</strong> via Twilio</li>
                    <li>Setup time: <strong>1-2 days</strong> (automated process)</li>
                    <li>Cost: <strong>~₹150/month number rental</strong> + message charges</li>
                    <li>You keep using your personal WhatsApp normally</li>
                    <li>Professional separate number for business broadcasts</li>
                  </ul>
                </div>

                <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">🥈 Use Your Existing Number (Complex - Manual Process)</p>
                  <ul className="space-y-1 list-disc list-inside ml-2">
                    <li>Use your current restaurant/personal number</li>
                    <li>Setup time: <strong>3-5 days</strong> (requires manual verification)</li>
                    <li>Cost: <strong>~₹150/month hosting fee</strong> + message charges</li>
                    <li><strong className="text-red-700">⚠️ Your number will be disconnected from personal WhatsApp app</strong></li>
                    <li>You'll only access WhatsApp through our dashboard</li>
                    <li>Only choose this if number is already printed on menus/signage</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 border border-yellow-300 mt-3">
                  <p className="font-semibold text-yellow-900 mb-1">💡 Our Recommendation:</p>
                  <p className="text-yellow-800">
                    Choose <strong>Standard Setup</strong> unless you absolutely need your existing number. 
                    Most restaurants prefer a dedicated business number for better organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Setup Type Selection - HIDDEN WHEN BYON_ENABLED = false */}
              {BYON_ENABLED && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestForm.useExistingNumber}
                      onChange={(e) => setRequestForm({
                        ...requestForm, 
                        useExistingNumber: e.target.checked,
                        businessPhone: e.target.checked ? requestForm.businessPhone : ''
                      })}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-purple-900">
                        I have an existing business number and want to use it for WhatsApp
                      </span>
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-purple-800 bg-purple-100 rounded px-2 py-1 border border-purple-300">
                        ✅ <strong>Ideal if:</strong> Your business number is already printed on menus, signage, business cards, 
                        or advertised publicly and customers already know this number.
                      </p>
                      <div className="bg-red-50 border border-red-300 rounded px-2 py-1.5">
                        <p className="text-xs text-red-800 font-semibold mb-1">
                          ⚠️ <strong>Critical Warnings:</strong>
                        </p>
                        <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside ml-1">
                          <li><strong>DO NOT use your personal WhatsApp number</strong> - it will be permanently disconnected</li>
                          <li>Your number will stop working in the regular WhatsApp app</li>
                          <li>You'll only access WhatsApp messages through our dashboard</li>
                          <li>This process requires manual verification and takes <strong>3-5 days</strong></li>
                          <li>Cannot be easily reversed once completed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              )}

              {/* Conditional Phone Input */}
              {BYON_ENABLED && requestForm.useExistingNumber && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Existing Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={requestForm.businessPhone}
                    onChange={(e) => setRequestForm({...requestForm, businessPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="+919876543210"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Enter the phone number you want to enable WhatsApp on. You must have access to receive 
                    verification codes during setup (3-5 days manual process).
                  </p>
                </div>
              )}

              {/* Show standard setup message when BYON disabled or not selected */}
              {(!BYON_ENABLED || !requestForm.useExistingNumber) && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Standard Setup:</strong> We'll provide a new dedicated WhatsApp number via Twilio. 
                    Setup takes 1-2 days and you keep using your personal WhatsApp normally.
                  </p>
                </div>
              )}

              {/* Use Case */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Use Case <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={requestForm.useCase}
                  onChange={(e) => setRequestForm({...requestForm, useCase: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="e.g., Daily special promotions, event notifications, customer updates..."
                />
                <p className="text-xs text-gray-500 mt-1">Describe how you plan to use WhatsApp marketing</p>
              </div>

              {/* Sample Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={requestForm.sampleMessage}
                  onChange={(e) => setRequestForm({...requestForm, sampleMessage: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="🍕 Special Offer Today! Get 20% off on all pizzas. Valid until 9 PM. Visit us now!"
                />
                <p className="text-xs text-gray-500 mt-1">Provide an example of the messages you'll send</p>
              </div>

              {/* Broadcast Frequency */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-800">📅 Broadcast Frequency Limits</h4>
                <p className="text-xs text-gray-600 mb-3">
                  Set your expected broadcast frequency for cost estimation purposes.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Broadcasts per Week <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requestForm.broadcastsPerWeek}
                      onChange={(e) => {
                        const weekly = parseInt(e.target.value);
                        setRequestForm({
                          ...requestForm, 
                          broadcastsPerWeek: weekly,
                          broadcastsPerMonth: weekly * 4
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1">1 per week</option>
                      <option value="2">2 per week</option>
                      <option value="3">3 per week</option>
                      <option value="5">5 per week (Daily)</option>
                      <option value="7">7 per week (Twice daily)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Broadcasts per Month <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={requestForm.broadcastsPerMonth}
                      onChange={(e) => setRequestForm({...requestForm, broadcastsPerMonth: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-100"
                      min="1"
                      max="200"
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Recipients per Broadcast
                  </label>
                  <select
                    value={requestForm.estimatedRecipientsPerBroadcast}
                    onChange={(e) => setRequestForm({...requestForm, estimatedRecipientsPerBroadcast: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="50">0-50 subscribers</option>
                    <option value="100">50-100 subscribers</option>
                    <option value="200">100-200 subscribers</option>
                    <option value="500">200-500 subscribers</option>
                    <option value="1000">500+ subscribers</option>
                  </select>
                </div>

                {/* Cost Estimate */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-lg p-3 mt-3">
                  <p className="text-xs font-semibold text-green-900 mb-2">💰 Estimated Monthly Cost:</p>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-green-800">
                      ${((requestForm.broadcastsPerMonth * requestForm.estimatedRecipientsPerBroadcast * 0.005).toFixed(2))} USD
                      <span className="text-sm font-normal text-green-700 ml-2">
                        (≈ ₹{((requestForm.broadcastsPerMonth * requestForm.estimatedRecipientsPerBroadcast * 0.005 * 83).toFixed(2))})
                      </span>
                    </p>
                    <p className="text-xs text-green-700">
                      Based on {requestForm.broadcastsPerMonth} broadcasts × {requestForm.estimatedRecipientsPerBroadcast} recipients × $0.005/message
                    </p>
                  </div>
                  
                  {/* Disclaimer */}
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-xs text-green-800 font-medium mb-1">⚠️ Important:</p>
                    <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                      <li>This is a <strong>variable cost estimate</strong> based on actual usage</li>
                      <li>Charges are <strong>in addition to</strong> monthly WhatsApp marketing subscription fees</li>
                      <li>Final pricing will be confirmed by admin after review</li>
                      <li>Exchange rate: 1 USD ≈ ₹83 (may vary)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={requestForm.agreedToTerms}
                  onChange={(e) => setRequestForm({...requestForm, agreedToTerms: e.target.checked})}
                  className="mt-1"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                  I agree to comply with WhatsApp Business Policy and will not send spam or unsolicited messages.
                  I understand that violation may result in account suspension.
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setRequestForm({
                    useExistingNumber: false,
                    businessPhone: '',
                    broadcastsPerWeek: 2,
                    broadcastsPerMonth: 8,
                    estimatedRecipientsPerBroadcast: 100,
                    useCase: '',
                    sampleMessage: '',
                    agreedToTerms: false,
                  });
                }}
                disabled={savingSettings}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWhatsAppRequest}
                disabled={savingSettings}
                className="px-5 py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-lg active:shadow-sm transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingSettings ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
