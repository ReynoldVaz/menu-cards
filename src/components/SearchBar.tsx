import { useEffect, useMemo, useState, forwardRef } from 'react';
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

    function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
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
      setFocusedIndex(-1);
      if (s.type === 'section') onSelectSection?.(s.sectionId!);
      else if (s.type === 'item') onSelectItem?.(s.item!);
    }

    return (
      <div className="relative max-w-2xl mx-auto">
        <input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search dishes, drinks or sections..."
          style={{
            borderColor: themeStyles.borderColor,
          }}
          className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
        />

        {filtered.length > 0 && (
          <ul className="absolute z-40 left-0 right-0 mt-2 rounded shadow max-h-60 overflow-auto text-sm" style={{ backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor, borderWidth: '1px' }}>
            {filtered.map((s, i) => (
              <li
                key={`${s.type}-${s.title}-${i}`}
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  select(s);
                }}
                style={{
                  backgroundColor: i === focusedIndex ? `${themeStyles.accentBg}30` : 'transparent',
                }}
                className="px-3 py-2 cursor-pointer"
              >
                <div className="font-medium">{s.title}</div>
                {s.subtitle && <div className="text-xs text-gray-500">{s.subtitle}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
