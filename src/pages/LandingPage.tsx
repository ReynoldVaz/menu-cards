import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

// New Tailwind CSS Keyframes for a gentle float effect (assuming you have tailwind.config.js access)
// If not, you can define them using arbitrary values, but adding to config is better.
/* // Example for tailwind.config.js:
// theme: {
//   extend: {
//     keyframes: {
//       'float-slow': {
//         '0%, 100%': { transform: 'translateY(0) translateX(0)' },
//         '33%': { transform: 'translateY(-10px) translateX(5px)' },
//         '66%': { transform: 'translateY(10px) translateX(-5px)' },
//       },
//     },
//     animation: {
//       'float-slow': 'float-slow 15s ease-in-out infinite',
//     }
//   }
// }
*/

export function LandingPage() {
  const [typed, setTyped] = useState('');
  const fullText = 'The Next-Generation Restaurant Menu Management System';

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setTyped(fullText.slice(0, i));
      i += 1;
      if (i > fullText.length) clearInterval(id);
    }, 20); // Faster typing for better UX
    return () => clearInterval(id);
  }, []);

  type FloatingStarProps = {
    top: string;
    left: string;
    size: string;
    delay: string;
    color?: string;
  };

  // Utility component for a subtle floating star element
  const FloatingStar = ({ top, left, size, delay, color = 'bg-white/70' }: FloatingStarProps) => (
    <div
      className={`absolute ${color} rounded-full opacity-50 blur-sm animate-pulse`}
      style={{
        top: top,
        left: left,
        width: size,
        height: size,
        animationDelay: delay,
        animationDuration: `${Math.random() * 10 + 10}s`, // Randomize pulse speed
      }}
    />
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-body">
      {/* Dynamic Galaxy Background Layers */}
      <div className="absolute inset-0 -z-10">
        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#010111] via-[#05051a] to-[#010111]" />

        {/* Animated Nebula Blobs (Subtle Floating effect) */}
        <div className="absolute -top-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-purple-600/20 blur-3xl animate-[pulse_10s_ease-in-out_infinite] animate-float-slow" />
        <div className="absolute top-24 -right-20 w-[34rem] h-[34rem] rounded-full bg-indigo-600/15 blur-3xl animate-[pulse_15s_ease-in-out_infinite_reverse] animate-float-slow" />

        {/* Scattered Stars/Cosmic Dust (using radial gradients for performance) */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(0.5px 0.5px at 10% 90%, rgba(255,255,255,.6) 50%, transparent 50%),\
               radial-gradient(1px 1px at 40% 10%, rgba(255,255,255,.35) 50%, transparent 50%),\
               radial-gradient(1.5px 1.5px at 80% 50%, rgba(255,255,255,.45) 50%, transparent 50%),\
               radial-gradient(0.75px 0.75px at 25% 40%, rgba(255,255,255,.8) 50%, transparent 50%),\
               radial-gradient(1px 1px at 65% 75%, rgba(255,255,255,.3) 50%, transparent 50%)',
            backgroundSize: 'auto',
          }}
        />
        
        {/* Floating elements for extra dynamic feel */}
        <FloatingStar top="20%" left="10%" size="6px" delay="0s" />
        <FloatingStar top="70%" left="85%" size="8px" delay="2s" color="bg-cyan-300/60" />
        <FloatingStar top="45%" left="5%" size="4px" delay="4s" />
        <FloatingStar top="10%" left="50%" size="10px" delay="6s" color="bg-fuchsia-300/60" />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center z-10">
        <div className="mb-12">
          {/* MenuVerse Brand Title */}
          <h1 className="font-display text-5xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-space.neon.purple via-white to-space.neon.blue bg-clip-text text-transparent drop-shadow-[0_8px_32px_rgba(138,60,255,0.4)] mb-4">
            🌌 MenuVerse
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-medium h-8 md:h-10">
            {typed}
            {typed.length < fullText.length && (
              <span className="ml-0.5 inline-block w-[12px] h-[1.3em] align-middle bg-violet-300 animate-pulse" />
            )}
          </p>
        </div>

        {/* Glass card - Enhanced with slow float animation */}
        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-8 md:p-12 mb-12 text-violet-50 transition-all hover:shadow-[0_25px_80px_rgba(147,51,234,0.3)] animate-float-slow">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
            Welcome to the Restaurant Galaxy!
          </h2>
          <p className="text-violet-100/90 mb-10 text-lg">
            Scan, browse, and explore menus like never before. Welcome to the future of dining.
          </p>

          <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            {/* Key Differentiator 1: AI Assisted */}
            <FeatureCard
              icon="🧠"
              title="AI-Assisted Menu Curation"
              description="Smart suggestions for pricing, dish descriptions, and categorization based on market trends."
            />

            {/* Key Differentiator 2: Custom Themes */}
            <FeatureCard
              icon="🎨"
              title="Custom Galaxy Themes"
              description="Instantly change the look of your digital menu with unique, brand-matching themes and layouts."
            />
            
            {/* Key Differentiator 3: Real Time Updates */}
            <FeatureCard
              icon="⚡"
              title="Real-Time Stellar Updates"
              description="Apply price changes or mark items 'Sold Out' instantly across all customer devices."
            />

            {/* Key Differentiator 4: Video Feeds */}
            <FeatureCard
              icon="🎬"
              title="HD Dish Video Feeds"
              description="Showcase your signature dishes with embedded, auto-playing video clips for a rich customer experience."
            />
          </div>
        </div>

        {/* Admin Link (High-energy, glowing button) */}
        <div className="mb-10 flex justify-center">
          <Link
            to="/admin"
            className="relative overflow-hidden text-white font-bold text-lg py-3.5 px-8 rounded-full transition-all duration-300 transform hover:scale-[1.05] shadow-xl group"
            style={{
              background:
                'linear-gradient(135deg, rgba(147,51,234,1), rgba(59,130,246,1))',
              boxShadow: '0 0 40px rgba(147,51,234,0.6)'
            }}
          >
            <span className="relative z-10">🚀 Admin Portal - Launch Control</span>
            {/* Animated Light Sweep Effect */}
            <div className="absolute inset-0 w-full h-full bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07] transform skew-x-[-20deg] translate-x-[-150%] group-hover:translate-x-[150%] ease-out" />
          </Link>
        </div>

        <div className="text-violet-200/80 text-sm">
          <p>
            **For Galaxy Managers:** Use the Launch Control Admin Portal to manage your menu universe.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper component for cleaner feature listing
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 border border-violet-500/30 rounded-lg transition-all hover:border-violet-400/50 hover:bg-white/5 backdrop-blur-sm">
      <span className="text-3xl p-2 rounded-full bg-violet-500/20 shadow-lg">{icon}</span>
      <div>
        <h3 className="font-semibold text-white text-xl mb-1">{title}</h3>
        <p className="text-sm text-violet-100/80">{description}</p>
      </div>
    </div>
  );
}



// import { Link } from 'react-router-dom';
// import { useEffect, useState } from 'react';

// export function LandingPage() {
//   const [typed, setTyped] = useState('');
//   const fullText = 'Restaurant Menu Management System';

//   useEffect(() => {
//     let i = 0;
//     const id = setInterval(() => {
//       setTyped(fullText.slice(0, i));
//       i += 1;
//       if (i > fullText.length) clearInterval(id);
//     }, 25);
//     return () => clearInterval(id);
//   }, []);

//   return (
//     <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-body">
//       {/* Space background layers */}
//       <div className="absolute inset-0 -z-10">
//         <div className="absolute inset-0 bg-gradient-to-b from-[#0b1020] via-[#0f1229] to-[#0b1020]" />
//         <div className="absolute -top-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-purple-500/30 blur-3xl animate-pulse" />
//         <div className="absolute top-24 -right-20 w-[34rem] h-[34rem] rounded-full bg-indigo-500/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
//         <div
//           className="absolute inset-0 opacity-50"
//           style={{
//             backgroundImage:
//               'radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,.6) 50%, transparent 50%),\
//                radial-gradient(1px 1px at 35% 80%, rgba(255,255,255,.35) 50%, transparent 50%),\
//                radial-gradient(1.5px 1.5px at 75% 30%, rgba(255,255,255,.45) 50%, transparent 50%),\
//                radial-gradient(1px 1px at 60% 60%, rgba(255,255,255,.3) 50%, transparent 50%)',
//             backgroundSize: 'auto',
//           }}
//         />
//       </div>

//       <div className="max-w-3xl mx-auto px-6 text-center">
//         <div className="mb-10">
//           <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-space.neon.purple via-white to-space.neon.blue bg-clip-text text-transparent drop-shadow-[0_6px_28px_rgba(138,60,255,0.25)] mb-3">
//             🍽️ Menu Cards
//           </h1>
//           <p className="text-lg md:text-xl text-white/85 font-medium h-7 md:h-8">
//             {typed}
//             {typed.length < fullText.length && (
//               <span className="ml-0.5 inline-block w-[10px] h-[1.2em] align-middle bg-violet-200 animate-pulse" />
//             )}
//           </p>
//         </div>

//         {/* Glass card */}
//         <div className="relative rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md shadow-2xl p-8 md:p-10 mb-10 text-violet-50">
//           <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Welcome to Menu Cards</h2>
//           <p className="text-violet-100/90 mb-6">
//             Scan a QR code at your favorite restaurant to view their menu, or use a direct link to access a restaurant's digital menu.
//           </p>

//           <div className="space-y-5 text-left max-w-xl mx-auto">
//             <div className="flex items-start gap-3">
//               <span className="text-2xl">📱</span>
//               <div>
//                 <h3 className="font-semibold text-white">Scan QR Code</h3>
//                 <p className="text-sm text-violet-100/80">
//                   Point your phone camera at the restaurant's QR code to view their menu
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-start gap-3">
//               <span className="text-2xl">🍽️</span>
//               <div>
//                 <h3 className="font-semibold text-white">Browse Menu</h3>
//                 <p className="text-sm text-violet-100/80">
//                   Explore items, check prices, and read descriptions
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-start gap-3">
//               <span className="text-2xl">⭐</span>
//               <div>
//                 <h3 className="font-semibold text-white">Daily Specials</h3>
//                 <p className="text-sm text-violet-100/80">
//                   Check out today's special offers and upcoming events
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Admin Link (centered) */}
//         <div className="mb-10 flex justify-center">

//           <Link
//             to="/admin"
//             className="relative overflow-hidden text-white font-semibold py-3 px-4 rounded-lg transition-transform hover:scale-[1.02] shadow-lg"
//             style={{
//               background:
//                 'linear-gradient(135deg, rgba(147,51,234,0.95), rgba(59,130,246,0.95))',
//               boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
//             }}
//           >
//             🛠️ Admin Portal
//           </Link>
//         </div>

//         <div className="text-violet-200/90 text-sm">
//           <p>
//             <strong>For Restaurants:</strong> Use the Quick Upload or Admin Portal to manage your menu.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
