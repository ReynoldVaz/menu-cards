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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Subscribers ({subscribers.length})</h2>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setShowBroadcast(true)}
          disabled={subscribers.length === 0}
        >
          📢 Broadcast WhatsApp Message
        </button>
      </div>
      {subscribers.length === 0 ? (
        <p className="text-gray-600">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">Original Input</th>
                <th className="text-left px-3 py-2">Opt-in Date</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{s.phone}</td>
                  <td className="px-3 py-2">{s.originalInput || ''}</td>
                  <td className="px-3 py-2">{s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Broadcast WhatsApp Message</h3>
            <textarea
              className="w-full border rounded p-2 mb-3"
              rows={4}
              placeholder="Enter your message..."
              value={broadcastMsg}
              onChange={e => setBroadcastMsg(e.target.value)}
              disabled={broadcastLoading}
            />
            <div className="mb-2 text-sm text-gray-600">
              <b>Recipients:</b> {subscribers.length} phone numbers
            </div>
            {broadcastStatus && (
              <div className="mb-2 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-sm">
                {broadcastStatus}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => { setShowBroadcast(false); setBroadcastMsg(''); setBroadcastStatus(null); }}
                disabled={broadcastLoading}
              >Cancel</button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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
