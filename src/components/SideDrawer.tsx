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


import { useEffect } from "react";
import { useThemeStyles } from '../context/useThemeStyles';
import { hexToRgba } from '../utils/themeUtils';

export function SideDrawer({
  open,
  onClose,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  sections: { id: string; title: string; icon?: string }[];
}) {
  const themeStyles = useThemeStyles();

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
        className="absolute left-0 top-0 h-full w-72 shadow-2xl 
                   rounded-r-2xl p-5 overflow-y-auto 
                   border-r animate-slideRightSoft"
        style={{ backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-semibold tracking-wide" style={{ color: themeStyles.primaryButtonBg }}>
            Menu Sections
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col space-y-3">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              className="w-full px-4 py-3 rounded-xl border flex items-center gap-3 shadow-sm"
              style={{
                backgroundColor: hexToRgba(themeStyles.backgroundColor, 0.05),
                borderColor: themeStyles.borderColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hexToRgba(themeStyles.accentBg, 0.1);
                e.currentTarget.style.borderColor = themeStyles.accentBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = hexToRgba(themeStyles.backgroundColor, 0.05);
                e.currentTarget.style.borderColor = themeStyles.borderColor;
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

