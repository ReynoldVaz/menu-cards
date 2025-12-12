import { useEffect, useMemo, useState, forwardRef, useRef } from 'react';
import type { MenuItem, MenuSection } from '../data/menuData';
import { useThemeStyles } from '../context/useThemeStyles';

type Suggestion = {
  type: 'item' | 'section';
  title: string;
  subtitle?: string;
  sectionId?: string;
  item?: MenuItem;
};

interface SearchBarProps {
  sections: MenuSection[];
  onSelectItem?: (item: MenuItem) => void;
  onSelectSection?: (sectionId: string) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ sections, onSelectItem, onSelectSection }, ref) => {
    const themeStyles = useThemeStyles();
    const [query, setQuery] = useState('');
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const allSuggestions: Suggestion[] = useMemo(() => {
      const out: Suggestion[] = [];
      sections.forEach((s) => {
        out.push({ type: 'section', title: s.title, sectionId: s.id });
        s.items.forEach((it) => {
          out.push({
            type: 'item',
            title: it.name,
            subtitle: s.title,
            sectionId: s.id,
            item: it,
          });
        });
      });
      return out;
    }, [sections]);

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const matches = allSuggestions.filter((s) => {
        return (
          s.title.toLowerCase().includes(q) ||
          (s.subtitle && s.subtitle.toLowerCase().includes(q))
        );
      });
      matches.sort((a, b) => (a.type === b.type ? 0 : a.type === 'item' ? -1 : 1));
      return matches.slice(0, 8);
    }, [query, allSuggestions]);

    useEffect(() => {
      setFocusedIndex(filtered.length > 0 ? 0 : -1);
    }, [filtered.length]);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setQuery('');
          setShowSuggestions(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setQuery('');
        setShowSuggestions(false);
        return;
      }
      if (filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && filtered[focusedIndex]) select(filtered[focusedIndex]);
      }
    }

    function select(s: Suggestion) {
      setQuery('');
      setShowSuggestions(false);
      setFocusedIndex(-1);
      if (s.type === 'section') onSelectSection?.(s.sectionId!);
      else if (s.type === 'item') onSelectItem?.(s.item!);
    }

    function clearSearch() {
      setQuery('');
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }

    return (
        <div ref={containerRef} className="relative max-w-2xl mx-auto">
        <div className="relative">
          <input
            ref={ref}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={onKey}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search dishes, drinks or sections..."
            style={{
              borderColor: themeStyles.borderColor + '40',
              background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}, ${themeStyles.backgroundColor}f8)`,
            }}
            className="w-full border rounded-xl px-4 py-2 pr-10 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
          />

          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
              aria-label="Clear search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {filtered.length > 0 && showSuggestions && (
          <ul className="absolute z-40 left-0 right-0 mt-2 rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.12),-4px_-4px_12px_rgba(255,255,255,0.8)] max-h-60 overflow-auto text-sm" style={{ background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}, ${themeStyles.backgroundColor}f8)`, borderColor: themeStyles.borderColor + '50', borderWidth: '1px' }}>
            {filtered.map((s, i) => (
              <li
                key={`${s.type}-${s.title}-${i}`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  select(s);
                }}
                style={{
                  backgroundColor: i === focusedIndex ? `${themeStyles.accentBg}40` : 'transparent',
                }}
                className="px-3 py-2 cursor-pointer transition-colors hover:bg-opacity-20 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="font-medium">{s.title}</div>
                {s.subtitle && <div className="text-xs text-gray-500">{s.subtitle}</div>}
              </li>
            ))}
          </ul>
        )}

        {/* Collapsible Legend Pane */}
        <LegendPane />
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

function LegendPane() {
  const themeStyles = useThemeStyles();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.8)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.08),-2px_-2px_4px_rgba(255,255,255,0.8)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all"
        style={{ background: `linear-gradient(to bottom, ${themeStyles.accentBg}25, ${themeStyles.accentBg}15)`, color: themeStyles.primaryButtonBg }}
      >
        <span className="font-semibold">Legend</span>
        <span className="text-xs">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs px-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] leading-none">🌶️</span>
            <span>Spice level</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] leading-none">🍯</span>
            <span>Sweetness</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] leading-none">🥬</span>
            <span>Vegetarian</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] leading-none">🍗</span>
            <span>Non-Veg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] leading-none">🌱</span>
            <span>Vegan</span>
          </div>
        </div>
      )}
    </div>
  );
}
