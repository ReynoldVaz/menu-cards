// export function SideDrawer({ open, onClose, sections }: { open: boolean; onClose: () => void; sections: { id: string; title: string; icon?: string }[] }) {
//   if (!open) return (
//     <div aria-hidden />
//   );

//   function goTo(id: string) {
//     const el = document.getElementById(id);
//     if (!el) return;
//     const topOffset = 64; // small default; TopTabs will compute exact offset on desktop
//     const rect = el.getBoundingClientRect();
//     const targetY = window.scrollY + rect.top - topOffset - 8;
//     window.scrollTo({ top: targetY, behavior: 'smooth' });
//     onClose();
//   }

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/40" onClick={onClose} />
//       <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-lg p-4 overflow-auto">
//         <div className="flex items-center justify-between mb-4">
//           <div className="text-lg font-semibold">Navigate</div>
//           <button onClick={onClose} aria-label="Close" className="text-gray-600">✕</button>
//         </div>
//         <div className="space-y-2">
//           {sections.map((s) => (
//             <button
//               key={s.id}
//               onClick={() => goTo(s.id)}
//               className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-3"
//             >
//               {s.icon ? <span className="text-xl">{s.icon}</span> : null}
//               <span className="font-medium">{s.title}</span>
//             </button>
//           ))}
//         </div>
//       </aside>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useThemeStyles } from '../context/useThemeStyles';
import { hexToRgba } from '../utils/themeUtils';

export function SideDrawer({
  open,
  onClose,
  sections,
  selectedDiets,
  onDietChange,
}: {
  open: boolean;
  onClose: () => void;
  sections: { id: string; title: string; icon?: string }[];
  selectedDiets?: Set<'veg' | 'non-veg' | 'vegan'>;
  onDietChange?: (diet: 'veg' | 'non-veg' | 'vegan') => void;
}) {
  const themeStyles = useThemeStyles();
  const [dietFilterOpen, setDietFilterOpen] = useState(true);

  // ✨ NEW: Effect to prevent background scrolling when the drawer is open
  useEffect(() => {
    if (open) {
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Re-enable body scroll
      document.body.style.overflow = "";
    }

    // Cleanup function: runs when the component unmounts or before the next effect runs
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]); // Re-run effect whenever 'open' changes

  if (!open) return <div aria-hidden />;

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 64;
    const rect = el.getBoundingClientRect();
    const target = window.scrollY + rect.top - offset - 8;

    window.scrollTo({ top: target, behavior: "smooth" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Blurred transparent background */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className="absolute left-0 top-0 h-full w-72 shadow-[16px_0_32px_rgba(0,0,0,0.2)] 
                   rounded-r-2xl p-5 overflow-y-auto 
                   border-r animate-slideRightSoft"
        style={{ 
          background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}, ${themeStyles.backgroundColor}f8)`,
          borderColor: themeStyles.borderColor 
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-semibold tracking-wide" style={{ color: themeStyles.primaryButtonBg }}>
            Menu Sections
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-black text-xl w-8 h-8 rounded-full flex items-center justify-center shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all"
          >
            ✕
          </button>
        </div>

        {/* Diet Filter Section */}
        {selectedDiets && onDietChange && (
          <div className="mb-6 rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.8)]" style={{ borderColor: themeStyles.borderColor + '40', borderWidth: '1px' }}>
            {/* Header - Collapsable */}
            <button
              onClick={() => setDietFilterOpen(!dietFilterOpen)}
              className="w-full p-4 flex items-center justify-between rounded-xl transition-all"
              style={{ background: `linear-gradient(to bottom, ${hexToRgba(themeStyles.accentBg, 0.15)}, ${hexToRgba(themeStyles.accentBg, 0.05)})` }}
            >
              <div className="text-sm font-semibold" style={{ color: themeStyles.primaryButtonBg }}>🥗 Filter by Diet</div>
              <span style={{ color: themeStyles.primaryButtonBg, transform: dietFilterOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.3s' }}>
                ▼
              </span>
            </button>

            {/* Diet Options - Collapsable Content */}
            {dietFilterOpen && (
              <div className="p-4 border-t" style={{ borderColor: themeStyles.borderColor }}>
                <div className="flex flex-wrap gap-2">
                  {/* Veg badge */}
                  <button
                    onClick={() => onDietChange('veg')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      selectedDiets.has('veg') 
                        ? 'shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]' 
                        : 'shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[1px_1px_2px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.9)]'
                    }`}
                    style={{
                      backgroundColor: selectedDiets.has('veg') ? themeStyles.primaryButtonBg : hexToRgba(themeStyles.primaryButtonBg, 0.08),
                      color: selectedDiets.has('veg') ? 'white' : themeStyles.primaryButtonBg,
                      borderColor: selectedDiets.has('veg') ? 'transparent' : themeStyles.primaryButtonBg + '30',
                      borderWidth: '1px',
                    }}
                    title="Vegetarian"
                    aria-label="Vegetarian"
                  >
                    <span className="text-[12px] leading-none">🥬</span>
                  </button>

                  {/* Non-Veg badge */}
                  <button
                    onClick={() => onDietChange('non-veg')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      selectedDiets.has('non-veg') 
                        ? 'shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]' 
                        : 'shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[1px_1px_2px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.9)]'
                    }`}
                    style={{
                      backgroundColor: selectedDiets.has('non-veg') ? themeStyles.primaryButtonBg : hexToRgba(themeStyles.primaryButtonBg, 0.08),
                      color: selectedDiets.has('non-veg') ? 'white' : themeStyles.primaryButtonBg,
                      borderColor: selectedDiets.has('non-veg') ? 'transparent' : themeStyles.primaryButtonBg + '30',
                      borderWidth: '1px',
                    }}
                    title="Non-Veg"
                    aria-label="Non-Veg"
                  >
                    <span className="text-[12px] leading-none">🍗</span>
                  </button>

                  {/* Vegan badge */}
                  <button
                    onClick={() => onDietChange('vegan')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      selectedDiets.has('vegan') 
                        ? 'shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]' 
                        : 'shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.9)] hover:shadow-[1px_1px_2px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.9)]'
                    }`}
                    style={{
                      backgroundColor: selectedDiets.has('vegan') ? themeStyles.primaryButtonBg : hexToRgba(themeStyles.primaryButtonBg, 0.08),
                      color: selectedDiets.has('vegan') ? 'white' : themeStyles.primaryButtonBg,
                      borderColor: selectedDiets.has('vegan') ? 'transparent' : themeStyles.primaryButtonBg + '30',
                      borderWidth: '1px',
                    }}
                    title="Vegan"
                    aria-label="Vegan"
                  >
                    <span className="text-[12px] leading-none">🌱</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex flex-col space-y-3">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              className="w-full px-4 py-3 rounded-xl border flex items-center gap-3 shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all"
              style={{
                background: `linear-gradient(to bottom, ${hexToRgba(themeStyles.backgroundColor, 0.8)}, ${hexToRgba(themeStyles.backgroundColor, 0.6)})`,
                borderColor: themeStyles.borderColor + '50',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(to bottom, ${hexToRgba(themeStyles.accentBg, 0.2)}, ${hexToRgba(themeStyles.accentBg, 0.1)})`;
                e.currentTarget.style.borderColor = themeStyles.accentBg + '80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(to bottom, ${hexToRgba(themeStyles.backgroundColor, 0.8)}, ${hexToRgba(themeStyles.backgroundColor, 0.6)})`;
                e.currentTarget.style.borderColor = themeStyles.borderColor + '50';
              }}
            >
              {/* Premium Icon */}
              <span className="text-lg" style={{ color: themeStyles.primaryButtonBg }}>★</span>

              <span className="font-medium" style={{ color: '#374151' }}>{s.title}</span>
            </button>
          ))}
        </div>
        {/* Bottom small branding */}
        <div className="mt-auto pt-6 text-center text-xs text-gray-500 opacity-60">
          © Digital Solutions by Reynold & Savio
        </div>
      </aside>
    </div>
  );
}

