import { useEffect, useRef, useState } from 'react';
import { useThemeStyles } from '../context/useThemeStyles';

interface SectionTab {
  id: string;
  title: string;
  icon?: string; // optional emoji/icon
}

export function TopTabs({ sections }: { sections: SectionTab[] }) {
  const [active, setActive] = useState<string | null>(sections?.[0]?.id ?? null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const themeStyles = useThemeStyles();

  useEffect(() => {
    if (!sections || sections.length === 0) return;
    const rootMarginTop = `-${containerRef.current?.offsetHeight ?? 80}px`;
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (best && best.target) {
          setActive((best.target as HTMLElement).id || null);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px -40% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const topOffset = containerRef.current?.offsetHeight ?? 0;
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - topOffset - 8; // small gap
    window.scrollTo({ top: targetY, behavior: 'smooth' });
    setActive(id);
  }

  if (!sections || sections.length === 0) return null;

  return (
    <div 
      ref={containerRef} 
      className="sticky top-0 z-30 backdrop-blur-sm shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]"
      style={{ 
        background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}, ${themeStyles.backgroundColor}f0)`,
        borderBottomColor: themeStyles.borderColor,
        borderBottomWidth: '1px'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-10">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 py-3">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-1 rounded-xl text-sm transition-all ${
                  active === s.id ? 'font-semibold shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]' : 'shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.8)] hover:shadow-[1px_1px_2px_rgba(0,0,0,0.08),-1px_-1px_2px_rgba(255,255,255,0.8)]'
                }`}
                style={
                  active === s.id
                    ? {
                        background: `linear-gradient(to bottom, ${themeStyles.accentBg}, ${themeStyles.accentBg}dd)`,
                        color: themeStyles.primaryButtonBg,
                      }
                    : {
                        background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}, ${themeStyles.backgroundColor}f5)`,
                        color: themeStyles.textColor,
                      }
                }
              >
                {s.icon ? <span className="text-lg">{s.icon}</span> : null}
                <span>{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
