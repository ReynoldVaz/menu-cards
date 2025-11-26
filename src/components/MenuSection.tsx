import { useState } from 'react';
import { MenuItem } from '../data/menuData';
import { ItemModal } from './ItemModal';

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
}

function thumbnailFor(name: string) {
  return `https://source.unsplash.com/160x120/?${encodeURIComponent(name)}`;
}

function modalImagesFor(name: string) {
  const q = encodeURIComponent(name);
  return [
    `https://source.unsplash.com/800x600/?${q}&sig=1`,
    `https://source.unsplash.com/800x600/?${q}&sig=2`,
    `https://source.unsplash.com/800x600/?${q}&sig=3`,
  ];
}

export function MenuSection({ title, items }: MenuSectionProps) {
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [images, setImages] = useState<string[]>([]);

  function openModal(item: MenuItem) {
    setSelected(item);
    // prefer explicit images on the item if present, otherwise generate
    if (item.images && item.images.length > 0) setImages(item.images);
    else setImages(modalImagesFor(item.name));
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px bg-gradient-to-r from-orange-400 to-transparent flex-1"></div>
        <h2 className="text-xl sm:text-2xl font-semibold text-orange-900 px-2 text-center min-w-max">
          {title}
        </h2>
        <div className="h-px bg-gradient-to-l from-orange-400 to-transparent flex-1"></div>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.name}
            className="group hover:bg-orange-50 p-3 sm:p-4 rounded-lg transition-colors duration-200 flex items-start gap-4"
          >
            <button
              onClick={() => openModal(item)}
              className="flex-shrink-0 rounded overflow-hidden border-2 border-orange-100 hover:border-orange-300"
              aria-label={`Open ${item.name}`}
            >
              <img src={item.image ?? thumbnailFor(item.name)} alt={item.name} className="w-20 h-16 object-cover" />
            </button>

            <div className="flex-1">
              <div className="flex justify-between items-start gap-4 mb-1">
                <button onClick={() => openModal(item)} className="text-left">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                    {item.name}
                  </h3>
                </button>

                <span className="font-bold text-orange-600 text-base sm:text-lg whitespace-nowrap ml-2">
                  {item.price}
                </span>
              </div>
              <p className="text-gray-500 text-sm font-light leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ItemModal
          item={selected}
          images={images}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
