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
    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">QR Code</h2>
      <p className="text-sm text-gray-600 mb-4">Share or download your menu QR code below.</p>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <QRCodeGenerator restaurantId={restaurant.id} restaurantName={restaurant.name} />
          <div className="mt-4">
            <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-50 to-white shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] font-mono text-sm break-all">{menuLink}</div>
            <div className="mt-4 flex gap-3">
              <button onClick={copyMenuLink} className="px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all text-sm font-medium">Copy Link</button>
              <a href={menuLink} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.05)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-all text-sm font-medium">Open Menu</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
