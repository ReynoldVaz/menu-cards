import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function LandingPage() {
  const [typed, setTyped] = useState('');
  const fullText = 'Restaurant Menu Management System';

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped(fullText.slice(0, i));
      i += 1;
      if (i > fullText.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-body">
      {/* Space background layers */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1020] via-[#0f1229] to-[#0b1020]" />
        <div className="absolute -top-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
        <div className="absolute top-24 -right-20 w-[34rem] h-[34rem] rounded-full bg-indigo-500/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,.6) 50%, transparent 50%),\
               radial-gradient(1px 1px at 35% 80%, rgba(255,255,255,.35) 50%, transparent 50%),\
               radial-gradient(1.5px 1.5px at 75% 30%, rgba(255,255,255,.45) 50%, transparent 50%),\
               radial-gradient(1px 1px at 60% 60%, rgba(255,255,255,.3) 50%, transparent 50%)',
            backgroundSize: 'auto',
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-space.neon.purple via-white to-space.neon.blue bg-clip-text text-transparent drop-shadow-[0_6px_28px_rgba(138,60,255,0.25)] mb-3">
            🍽️ Menu Cards
          </h1>
          <p className="text-lg md:text-xl text-white/85 font-medium h-7 md:h-8">
            {typed}
            {typed.length < fullText.length && (
              <span className="ml-0.5 inline-block w-[10px] h-[1.2em] align-middle bg-violet-200 animate-pulse" />
            )}
          </p>
        </div>

        {/* Glass card */}
        <div className="relative rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-2xl p-8 md:p-10 mb-10 text-violet-50">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Welcome to Menu Cards</h2>
          <p className="text-violet-100/90 mb-6">
            Scan a QR code at your favorite restaurant to view their menu, or use a direct link to access a restaurant's digital menu.
          </p>

          <div className="space-y-5 text-left max-w-xl mx-auto">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-semibold text-white">Scan QR Code</h3>
                <p className="text-sm text-violet-100/80">
                  Point your phone camera at the restaurant's QR code to view their menu
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <h3 className="font-semibold text-white">Browse Menu</h3>
                <p className="text-sm text-violet-100/80">
                  Explore items, check prices, and read descriptions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <h3 className="font-semibold text-white">Daily Specials</h3>
                <p className="text-sm text-violet-100/80">
                  Check out today's special offers and upcoming events
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Link (centered) */}
        <div className="mb-10 flex justify-center">

          <Link
            to="/admin"
            className="relative overflow-hidden text-white font-semibold py-3 px-4 rounded-lg transition-transform hover:scale-[1.02] shadow-lg"
            style={{
              background:
                'linear-gradient(135deg, rgba(147,51,234,0.95), rgba(59,130,246,0.95))',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
            }}
          >
            🛠️ Admin Portal
          </Link>
        </div>

        <div className="text-violet-200/90 text-sm">
          <p>
            <strong>For Restaurants:</strong> Use the Quick Upload or Admin Portal to manage your menu.
          </p>
        </div>
      </div>
    </div>
  );
}
