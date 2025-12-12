import { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import type { Restaurant } from '../../hooks/useFirebaseRestaurant';

interface SubscribersTabProps {
  restaurant: Restaurant;
}

export function SubscribersTab({ restaurant }: SubscribersTabProps) {
  const [subscribers, setSubscribers] = useState<Array<{ id: string; phone: string; originalInput?: string; createdAt?: any }>>([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  useEffect(() => {
    const ref = collection(db, `restaurants/${restaurant.id}/subscribers`);
    getDocs(ref).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSubscribers(list);
    }).catch((err) => {
      console.error('Failed to load subscribers:', err);
    });
  }, [restaurant.id]);

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

  async function handleBroadcast() {
    setBroadcastLoading(true);
    setBroadcastStatus(null);
    try {
      // Use port 3000 for API if running on localhost for local testing
      let apiUrl = '/api/broadcast-whatsapp';
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        apiUrl = 'http://localhost:3000/api/broadcast-whatsapp';
      }
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMsg,
          phones: subscribers.map(s => s.phone),
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // If not JSON, show status text
        setBroadcastStatus('Server error: ' + res.status + ' ' + res.statusText);
        return;
      }
      if (!res.ok) {
        setBroadcastStatus(data?.message || `Error: ${res.status} ${res.statusText}`);
      } else {
        setBroadcastStatus(data?.message || 'Unknown response');
      }
    } catch (err) {
      setBroadcastStatus('Network error or server unavailable.');
    } finally {
      setBroadcastLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Subscribers ({subscribers.length})</h2>
        <button
          className="px-5 py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowBroadcast(true)}
          disabled={subscribers.length === 0}
        >
          📢 Broadcast WhatsApp Message
        </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Broadcast WhatsApp Message</h3>
            <textarea
              className="w-full rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              placeholder="Enter your message..."
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              disabled={broadcastLoading}
            />
            <div className="mb-3 text-sm text-gray-600">
              <b>Recipients:</b> {subscribers.length} phone numbers
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
    </div>
  );
}
