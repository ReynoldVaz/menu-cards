import { useState, useEffect } from 'react';
import type { MenuItem } from '../data/menuData';
import { SmartImage } from './SmartImage';
import { ParallaxImage } from './ParallaxImage';
import { VideoPlayer } from './VideoPlayer';

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
                {/* merge videos (if any) and images into a single media array */}
                {(() => {
                  const videos = item.videos && item.videos.length > 0 ? item.videos : (item.video ? [item.video] : []);
                  const media = [
                    ...videos.map((v) => ({ type: 'video' as const, src: v })),
                    ...images.map((s) => ({ type: 'image' as const, src: s })),
                  ];

                  if (media.length === 0) {
                    return (
                      <div className="w-full h-64 sm:h-80 bg-gray-100 flex items-center justify-center rounded">
                        <span className="text-gray-400">No media available</span>
                      </div>
                    );
                  }

                  const active = media[index];

                  return (
                    <>
                      <div className="w-full h-64 sm:h-80 rounded overflow-hidden">
                        <div className="w-full h-full">
                          {active.type === 'video' ? (
                            <VideoPlayer src={active.src} poster={item.image ?? images[0]} />
                          ) : (
                            <ParallaxImage src={active.src} alt={`${item.name} image ${index + 1}`} />
                          )}
                        </div>
                      </div>

                      {media.length > 1 && (
                        <div className="absolute inset-x-0 top-1/2 flex justify-between px-2 -translate-y-1/2">
                          <button
                            className="bg-white/80 rounded-full p-1 shadow"
                            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
                            aria-label="Previous media"
                          >
                            ‹
                          </button>
                          <button
                            className="bg-white/80 rounded-full p-1 shadow"
                            onClick={() => setIndex((i) => (i + 1) % media.length)}
                            aria-label="Next media"
                          >
                            ›
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {media.map((m, i) => (
                          <button
                            key={`${m.type}:${m.src}`}
                            onClick={() => setIndex(i)}
                            className={`flex-shrink-0 rounded overflow-hidden border ${i === index ? 'ring-2 ring-orange-400' : 'border-transparent'}`}
                          >
                            <div className="w-20 h-14 overflow-hidden rounded bg-gray-50 flex items-center justify-center">
                              {m.type === 'image' ? (
                                <SmartImage src={m.src} alt={`${item.name} thumb ${i + 1}`} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <span className="text-sm">▶︎ Video</span>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
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
