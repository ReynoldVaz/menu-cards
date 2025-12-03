import { useState, useEffect } from 'react';
import type { MenuItem } from '../data/menuData';
import { SmartImage } from './SmartImage';
import { ParallaxImage } from './ParallaxImage';
import { VideoPlayer } from './VideoPlayer';
import { useThemeStyles } from '../context/useThemeStyles';
import { formatPrice } from '../utils/formatPrice';

interface ItemModalProps {
  item: MenuItem | null;
  images?: string[];
  onClose: () => void;
}

export function ItemModal({ item, images = [], onClose }: ItemModalProps) {
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<'description' | 'ingredients' | 'price'>('description');
  const themeStyles = useThemeStyles();

  useEffect(() => {
    setIndex(0);
    setTab('description');
  }, [item]);

  // Lock background scroll when modal is open
useEffect(() => {
  if (item) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }

  return () => {
    document.body.style.overflow = "";
  };
}, [item]);

  if (!item) return null;

  // Prepare media arrays for modal
  const modalVideos = item.videos?.length
    ? item.videos
    : item.video
    ? [item.video]
    : [];
  const modalImages = images && images.length > 0 ? images : [];
  const modalMedia = [
    ...modalVideos.map((v) => ({ type: 'video' as const, src: v })),
    ...modalImages.map((s) => ({ type: 'image' as const, src: s })),
  ];
  const activeMedia = modalMedia[index];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative max-w-3xl w-full mx-0 sm:mx-0 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" style={{ backgroundColor: themeStyles.backgroundColor }}>
        
        {/* Header */}
        <div className="flex justify-between items-start p-4 flex-shrink-0" style={{ backgroundColor: themeStyles.backgroundColor, borderBottomColor: themeStyles.borderColor, borderBottomWidth: '1px' }}>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-800 break-words">
              {item.name}
            </h3>
            <p className="text-sm font-semibold" style={{ color: themeStyles.primaryButtonBg }}>{formatPrice(item.price, (item as any).currency)}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Media Section */}
            <div className="relative rounded">
              {modalMedia.length === 0 ? (
                <div className="w-full h-64 sm:h-80 flex items-center justify-center rounded" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.95))' }}>
                  <span className="text-gray-400">No media available</span>
                </div>
              ) : (
                <>
                  <div
                    className="w-full h-[40vh] sm:h-[55vh] md:h-[60vh] rounded-lg overflow-hidden flex items-center justify-center shadow-md ring-1 ring-white/10 touch-pan-y"
                    style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.95))' }}
                    onPointerDown={(e) => {
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const target = e.currentTarget;
                      function onMove() {}
                      function onUp(ue: PointerEvent) {
                        target.releasePointerCapture?.(e.pointerId);
                        target.removeEventListener('pointermove', onMove as any);
                        target.removeEventListener('pointerup', onUp as any);
                        const dx = ue.clientX - startX;
                        const dy = ue.clientY - startY;
                        if (Math.abs(dx) > 30 && Math.abs(dy) < 40) {
                          if (dx < 0) {
                            setIndex((i) => (i + 1) % modalMedia.length);
                          } else {
                            setIndex((i) => (i - 1 + modalMedia.length) % modalMedia.length);
                          }
                        }
                      }
                      try { target.setPointerCapture?.(e.pointerId); } catch {}
                      target.addEventListener('pointermove', onMove as any);
                      target.addEventListener('pointerup', onUp as any);
                    }}
                  >
                    {activeMedia?.type === 'video' ? (
                      <VideoPlayer src={activeMedia.src} autoPlayPreview className="rounded object-contain" />
                    ) : (
                      <ParallaxImage
                        src={activeMedia.src}
                        alt={`${item.name} image ${index + 1}`}
                        fit="contain"
                        intensity={0}
                        backgroundClass=""
                      />
                    )}
                  </div>

                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {modalMedia.map((m, i) => (
                      <button
                        key={`${m.type}:${m.src}`}
                        onClick={() => setIndex(i)}
                        className="flex-shrink-0 rounded-md overflow-hidden border bg-black/40"
                        style={{
                          borderWidth: i === index ? '2px' : '1px',
                          borderColor: i === index ? themeStyles.accentBg : themeStyles.borderColor + '40',
                          boxShadow: i === index ? `0 2px 8px ${themeStyles.accentBg}30` : 'none',
                        }}
                      >
                        <div className="w-20 h-14 overflow-hidden rounded bg-black/60 flex items-center justify-center">
                          {m.type === 'image' ? (
                            <SmartImage src={m.src} alt={`${item.name} thumb ${i + 1}`} className="w-full h-full" fit="cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                              ▶ Video
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* End Media Section; next column renders details */}

            {/* Tabs + Content */}
            <div>
              <div className="flex gap-2 flex-wrap" role="tablist">
                {['description', 'ingredients', 'price'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors`}
                    style={
                      tab === t
                        ? {
                            backgroundColor: themeStyles.accentBg,
                            color: themeStyles.primaryButtonBg,
                          }
                        : {
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                          }
                    }
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                {tab === 'description' && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Description</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                )}

                {tab === 'ingredients' && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Ingredients</h4>
                    {item.ingredients && (
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                        {(typeof item.ingredients === 'string' 
                          ? (item.ingredients as string).split(',').map((ing: string) => ing.trim())
                          : (item.ingredients as any)
                        ).map((ing: string, idx: number) => (
                          <li key={idx}>{ing}</li>
                        ))}
                      </ul>
                    ) || (
                      <p className="text-sm text-gray-500 mt-1">Ingredients not available.</p>
                    )}
                  </div>
                )}

                {tab === 'price' && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Price</h4>
                    <p className="text-sm text-gray-600 mt-1">{formatPrice(item.price, (item as any).currency)}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
