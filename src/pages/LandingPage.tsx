import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            🍽️ Menu Cards
          </h1>
          <p className="text-xl text-gray-600">
            Restaurant Menu Management System
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Welcome to Menu Cards
          </h2>
          <p className="text-gray-600 mb-6">
            Scan a QR code at your favorite restaurant to view their menu, or use a direct link to access a restaurant's digital menu.
          </p>

          <div className="space-y-4 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-semibold text-gray-800">Scan QR Code</h3>
                <p className="text-sm text-gray-600">
                  Point your phone camera at the restaurant's QR code to view their menu
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <h3 className="font-semibold text-gray-800">Browse Menu</h3>
                <p className="text-sm text-gray-600">
                  Explore items, check prices, and read descriptions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <h3 className="font-semibold text-gray-800">Daily Specials</h3>
                <p className="text-sm text-gray-600">
                  Check out today's special offers and upcoming events
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin & Upload Links */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            to="/upload"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            📤 Quick Upload
          </Link>
          <Link
            to="/admin"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            🛠️ Admin Portal
          </Link>
        </div>

        <div className="text-gray-600 text-sm">
          <p>
            <strong>For Restaurants:</strong> Use the Quick Upload or Admin Portal to manage your menu.
          </p>
        </div>
      </div>
    </div>
  );
}
