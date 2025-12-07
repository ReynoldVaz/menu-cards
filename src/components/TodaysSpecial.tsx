import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { MenuItem } from '../data/menuData';
import { ItemModal } from './ItemModal';
import { useThemeStyles } from '../context/useThemeStyles';
import { hexToRgba } from '../utils/themeUtils';
import { formatPrice } from '../utils/formatPrice';

// interface TodaysSpecialProps {
//   item: MenuItem | null;
// }

interface TodaysSpecialProps {
  items: MenuItem[];
}

function modalImagesFor(name: string) {
  const q = encodeURIComponent(name);
  return [
    `https://source.unsplash.com/800x600/?${q}&sig=11`,
    `https://source.unsplash.com/800x600/?${q}&sig=12`,
    `https://source.unsplash.com/800x600/?${q}&sig=13`,
  ];
}

export function TodaysSpecial({ items }: TodaysSpecialProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const themeStyles = useThemeStyles();

  return (
    <div
      className="mb-12 p-4 sm:p-6 rounded-lg"
      style={{
        background: `linear-gradient(to right, ${hexToRgba(themeStyles.accentBg, 0.5)}, ${hexToRgba(themeStyles.accentBg, 0.3)})`,
        borderColor: themeStyles.borderColor,
        borderWidth: '2px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" style={{ color: themeStyles.primaryButtonBg }} />
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: themeStyles.primaryButtonBg }}>Today's Special</h2>
      </div>

      <div className="group">
        {items.map((item, idx) => {
          const images = item.images && item.images.length > 0
            ? item.images
            : (item.image ? [item.image] : modalImagesFor(item.name));
          return (
            <div key={item.id ?? item.name} className="flex justify-between items-center gap-4 mb-2">
              <button onClick={() => setOpenIdx(idx)} className="text-left hover:underline">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  {item.name}
                </h3>
              </button>
              <span className="font-bold text-lg sm:text-xl whitespace-nowrap" style={{ color: themeStyles.primaryButtonBg }}>
                {formatPrice(item.price)}
              </span>
            </div>
          );
        })}
      </div>

      {openIdx !== null && (
        <ItemModal
          item={items[openIdx]}
          images={items[openIdx].images && items[openIdx].images.length > 0
            ? items[openIdx].images
            : (items[openIdx].image ? [items[openIdx].image] : modalImagesFor(items[openIdx].name))}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </div>
  );
}
