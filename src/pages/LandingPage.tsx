import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { animate } from 'motion';

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
  const navigate = useNavigate();
  const [rocketFiring, setRocketFiring] = useState(false);
  const [shake, setShake] = useState(false);
  const rocketId = 'admin-rocket';
  const flameId = 'admin-rocket-flame';
  const exhaustId = 'admin-rocket-exhaust';
  const trailId = 'admin-rocket-trail';

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden overflow-x-hidden font-body">
      {/* Dynamic Galaxy Background Layers */}
      <div className="absolute inset-0 -z-10">
        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#010111] via-[#05051a] to-[#010111]" />

        {/* Animated Nebula Blobs (Subtle Floating effect) */}
        <div className="absolute -top-32 -left-16 sm:-top-40 sm:-left-24 w-[18rem] h-[18rem] sm:w-[28rem] sm:h-[28rem] rounded-full bg-purple-600/20 blur-3xl animate-[pulse_10s_ease-in-out_infinite] animate-float-slow" />
        <div className="absolute top-16 -right-14 sm:top-24 sm:-right-20 w-[22rem] h-[22rem] sm:w-[34rem] sm:h-[34rem] rounded-full bg-indigo-600/15 blur-3xl animate-[pulse_15s_ease-in-out_infinite_reverse] animate-float-slow" />

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

      <div className={`max-w-4xl mx-auto px-4 sm:px-6 text-center z-10 ${shake ? 'animate-[shake_350ms_ease-in-out_1]' : ''}`}
      >
        {/* Local CSS for richer rocket animation */}
        <style>
          {`
            @keyframes shake {
              0% { transform: translateX(0); }
              20% { transform: translateX(-2px); }
              40% { transform: translateX(2px); }
              60% { transform: translateX(-1px); }
              80% { transform: translateX(1px); }
              100% { transform: translateX(0); }
            }
            @keyframes liftoff {
              0% { transform: translateY(0) rotate(0deg); }
              30% { transform: translateY(-3px) rotate(-3deg); }
              60% { transform: translateY(-8px) rotate(0deg); }
              100% { transform: translateY(-16px) rotate(2deg); }
            }
            @keyframes flamePulse {
              0% { transform: scaleY(0.8); opacity: 0.8; }
              50% { transform: scaleY(1.2); opacity: 1; }
              100% { transform: scaleY(0.9); opacity: 0.85; }
            }
            @keyframes exhaust {
              0% { transform: translateY(0) scale(0.9); opacity: 0.9; }
              100% { transform: translateY(14px) scale(1.2); opacity: 0; }
            }
            @keyframes trailDown {
              0% { transform: translateY(0) scale(1); opacity: 0.9; }
              100% { transform: translateY(22px) scale(1.15); opacity: 0; }
            }

            /* Accessibility: reduce motion */
            @media (prefers-reduced-motion: reduce) {
              .reduce-motion { animation: none !important; transition: none !important; }
            }
          `}
        </style>
        <div className="mb-12">
          {/* MenuVerse Brand Title */}
          <h1 className="font-display text-4xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-space.neon.purple via-white to-space.neon.blue bg-clip-text text-transparent drop-shadow-[0_8px_32px_rgba(138,60,255,0.4)] mb-4">
            🌌 MenuVerse
          </h1>
          <p className="text-lg md:text-2xl text-white/90 font-medium h-8 md:h-10">
            {typed}
            {typed.length < fullText.length && (
              <span className="ml-0.5 inline-block w-[12px] h-[1.3em] align-middle bg-violet-300 animate-pulse" />
            )}
          </p>
        </div>

        {/* Glass card - Enhanced with slow float animation */}
        <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-[0_12px_32px_rgba(0,0,0,0.35)] md:shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 md:p-12 mb-12 text-violet-50 transition-all hover:shadow-[0_25px_80px_rgba(147,51,234,0.3)] animate-float-slow">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">
            Welcome to the Restaurant Galaxy!
          </h2>
          <p className="text-violet-100/90 mb-8 md:mb-10 text-base md:text-lg">
            Scan, browse, and explore menus like never before. Welcome to the future of dining.
          </p>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 text-left max-w-4xl mx-auto">
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
            <div className="mb-10 flex justify-center px-4">
          <button
            onClick={() => {
              if (rocketFiring) return;
              setRocketFiring(true);

              const rocket = document.getElementById(rocketId);
              const flame = document.getElementById(flameId);
              const exhaust = document.getElementById(exhaustId);
              const trail = document.getElementById(trailId);
              const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

              if (reduced) {
                if (rocket) animate(rocket, { scale: [1, 1.03, 1] }, { duration: 0.2 });
                setTimeout(() => navigate('/admin'), 220);
                return;
              }

              setShake(true);
              const container = document.getElementById('rocket-container');
              if (container) {
                (animate as any)(
                  container,
                  { transform: ['translateX(0px)', 'translateX(-3px)', 'translateX(3px)', 'translateX(-2px)', 'translateX(2px)', 'translateX(0px)'] },
                  { duration: 0.6, easing: 'ease-in-out' }
                );
              }

              const animations: Promise<void>[] = [];
              if (rocket) {
                animations.push(
                  (animate as any)(
                    rocket,
                    { transform: [
                      'translate(0px, -2px) scale(1)',
                      'translate(12px, -12px) scale(1.04)',
                      'translate(600px, -600px) scale(1.06)'
                    ] },
                    { duration: 0.6, easing: 'ease-out' }
                  ).finished
                );
              }
              if (flame) {
                animations.push(
                  (animate as any)(
                    flame,
                    {
                      opacity: [1, 0.6, 0],
                      transform: [
                        'translate(0px, 0px) scale(1)',
                        'translate(6px, -6px) scale(1.06)',
                        'translate(18px, -18px) scale(0.95)'
                      ]
                    },
                    { duration: 0.45 }
                  ).finished
                );
              }
              if (exhaust) {
                animations.push(
                  (animate as any)(
                    exhaust,
                    { opacity: [0.9, 0.4, 0], transform: ['translate(0px, 0px)', 'translate(16px, -16px)', 'translate(32px, -32px)'] },
                    { duration: 0.5, easing: 'ease-out' }
                  ).finished
                );
              }
              if (trail) {
                animations.push(
                  (animate as any)(
                    trail,
                    { opacity: [1, 0.5, 0], transform: ['translate(0px, 0px)', 'translate(24px, -24px)', 'translate(48px, -48px)'] },
                    { duration: 0.45, easing: 'ease-out' }
                  ).finished
                );
              }

              Promise.all(animations)
                .then(() => navigate('/admin'))
                .finally(() => { setShake(false); setRocketFiring(false); });
            }}
            className="relative overflow-hidden text-white font-bold text-base md:text-lg py-3 px-6 md:py-3.5 md:px-8 rounded-full transition-all duration-300 transform hover:scale-[1.05] shadow-xl group"
            style={{
              background:
                'linear-gradient(135deg, rgba(147,51,234,1), rgba(59,130,246,1))',
              boxShadow: '0 0 40px rgba(147,51,234,0.6)'
            }}
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              {/* Rocket + effects in a positioned wrap so fire/smoke can be absolute */}
              <span id="rocket-wrap" className="relative inline-block">
                <span id={rocketId} className="relative inline-block select-none">🚀</span>
                {rocketFiring && (
                  <>
                    {/* Flame (small glowing teardrop) positioned at rocket tail, 45° direction */}
                    <span
                      id={flameId}
                      className="absolute"
                      style={{
                        left: '-10px',
                        top: '24px',
                        width: '8px',
                        height: '12px',
                        borderRadius: '6px',
                        background: 'linear-gradient(180deg, #ffd27a, #ff8a00)',
                        boxShadow: '0 0 8px rgba(255,138,0,0.8)',
                        transform: 'rotate(45deg)'
                      }}
                    />
                    {/* Exhaust/Smoke puff (start near tail, drift at 45° while fading) */}
                    <span
                      id={exhaustId}
                      className="absolute"
                      style={{
                        left: '-2px',
                        top: '22px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.85)',
                        filter: 'blur(0.6px)'
                      }}
                    />
                    {/* Trail ember (small elongated particle) */}
                    <span
                      id={trailId}
                      className="absolute"
                      style={{
                        left: '-4px',
                        top: '24px',
                        width: '4px',
                        height: '10px',
                        borderRadius: '3px',
                        background: 'rgba(255,181,101,0.9)',
                        filter: 'blur(0.4px)'
                      }}
                    />
                  </>
                )}
              </span>
              <span>Admin Portal - Launch Control</span>
            </span>
            {/* Animated Light Sweep Effect */}
            <div className="absolute inset-0 w-full h-full bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-[0.07] transform skew-x-[-20deg] translate-x-[-150%] group-hover:translate-x-[150%] ease-out" />
          </button>
        </div>

        <div className="text-violet-200/80 text-xs sm:text-sm px-4">
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

