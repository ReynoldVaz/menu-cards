import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { MenuItem } from '../data/menuData';
import { ItemModal } from './ItemModal';

interface TodaysSpecialProps {
  item: MenuItem;
}

function modalImagesFor(name: string) {
  const q = encodeURIComponent(name);
  return [
    `https://source.unsplash.com/800x600/?${q}&sig=11`,
    `https://source.unsplash.com/800x600/?${q}&sig=12`,
    `https://source.unsplash.com/800x600/?${q}&sig=13`,
  ];
}

export function TodaysSpecial({ item }: TodaysSpecialProps) {
  const [open, setOpen] = useState(false);
  const images = item.images && item.images.length > 0 ? item.images : modalImagesFor(item.name);

  return (
    <div className="mb-12 bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-6 rounded-lg border-2 border-orange-300">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl sm:text-2xl font-bold text-orange-900">Today's Special</h2>
      </div>

      <div className="group">
        <div className="flex justify-between items-start gap-4 mb-2">
          <button onClick={() => setOpen(true)} className="text-left">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              {item.name}
            </h3>
          </button>
          <span className="font-bold text-orange-600 text-lg sm:text-xl whitespace-nowrap">
            {item.price}
          </span>
        </div>
        <button onClick={() => setOpen(true)} className="text-sm text-gray-600 hover:text-gray-800">
          View more
        </button>
        <p className="text-gray-600 text-sm leading-relaxed mt-3">
          {item.description}
        </p>
      </div>

      {open && <ItemModal item={item} images={images} onClose={() => setOpen(false)} />}
    </div>
  );
}
