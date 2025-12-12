import type { Restaurant } from '../../hooks/useFirebaseRestaurant';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';

interface QRTabProps {
  restaurant: Restaurant;
}

export function QRTab({ restaurant }: QRTabProps) {
  const appUrl = import.meta.env.VITE_APP_URL || 'https://menu-cards.vercel.app';
  const menuLink = `${appUrl}/r/${restaurant.id}`;

  function copyMenuLink() {
    navigator.clipboard.writeText(menuLink).catch(() => {
      alert('Copy failed. Please copy manually.');
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">QR Code</h2>
      <p className="text-sm text-gray-600 mb-4">Share or download your menu QR code below.</p>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <QRCodeGenerator restaurantId={restaurant.id} restaurantName={restaurant.name} />
          <div className="mt-4">
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm break-all">{menuLink}</div>
            <div className="mt-3 flex gap-3">
              <button onClick={copyMenuLink} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Copy Link</button>
              <a href={menuLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black text-sm">Open Menu</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
