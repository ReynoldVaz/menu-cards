import { useState, useEffect } from 'react';
import type { MenuItem } from '../data/menuData';

interface ItemModalProps {
  item: MenuItem | null;
  images?: string[];
  onClose: () => void;
}

export function ItemModal({ item, images = [], onClose }: ItemModalProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative max-w-3xl w-full mx-4 sm:mx-0 bg-white rounded-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-start p-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
            <p className="text-sm text-orange-600 font-semibold">{item.price}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="relative bg-gray-50 rounded">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[index]}
                      alt={`${item.name} image ${index + 1}`}
                      className="w-full h-64 sm:h-80 object-cover rounded"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        // eslint-disable-next-line no-console
                        console.error('[ItemModal] image failed to load', img.src);
                        const retries = Number(img.dataset.retryCount || '0');
                        if (retries >= 3) {
                          img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="20">image unavailable</text></svg>';
                          return;
                        }
                        img.dataset.retryCount = String(retries + 1);
                        const driveMatch = img.src.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
                        if (driveMatch) {
                          const id = driveMatch[1];
                          const alternatives = [
                            `https://drive.google.com/uc?export=view&id=${id}`,
                            `https://drive.google.com/uc?export=download&id=${id}`,
                            `https://drive.google.com/thumbnail?id=${id}`,
                          ];
                          img.src = alternatives[retries] || alternatives[alternatives.length - 1];
                          return;
                        }
                        // fallback to picsum
                        // eslint-disable-next-line no-console
                        console.log('[ItemModal] using picsum fallback for', item.name);
                        // img.src = `https://picsum.photos/seed/${encodeURIComponent(item.name)}/800/600`;
                      }}
                    />

                    {images.length > 1 && (
                      <div className="absolute inset-x-0 top-1/2 flex justify-between px-2 -translate-y-1/2">
                        <button
                          className="bg-white/80 rounded-full p-1 shadow"
                          onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          className="bg-white/80 rounded-full p-1 shadow"
                          onClick={() => setIndex((i) => (i + 1) % images.length)}
                          aria-label="Next image"
                        >
                          ›
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {images.map((src, i) => (
                        <button
                          key={src}
                          onClick={() => setIndex(i)}
                          className={`flex-shrink-0 rounded overflow-hidden border ${i === index ? 'ring-2 ring-orange-400' : 'border-transparent'}`}
                        >
                          <img src={src} alt={`${item.name} thumb ${i + 1}`} className="w-20 h-14 object-cover" onError={(e)=>{
                            const img = e.target as HTMLImageElement;
                            const retries = Number(img.dataset.retryCount || '0');
                            if (retries >= 2) { img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="56"><rect width="100%" height="100%" fill="%23f3f4f6"/></svg>'; return; }
                            img.dataset.retryCount = String(retries + 1);
                            const m = img.src.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
                            if (m) { const id = m[1]; img.src = `https://drive.google.com/uc?export=view&id=${id}`; return; }
                            img.src = `https://source.unsplash.com/160x120/?${encodeURIComponent(item.name)}`;
                          }} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-64 sm:h-80 bg-gray-100 flex items-center justify-center rounded">
                    <span className="text-gray-400">No images available</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">Description</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800">Ingredients</h4>
                {item.ingredients && item.ingredients.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {item.ingredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Ingredients not available.</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800">Price</h4>
                <p className="text-sm text-gray-600 mt-1">{item.price}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
