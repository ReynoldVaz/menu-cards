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
  const [mounted, setMounted] = useState(false);
  const themeStyles = useThemeStyles();
  // Portion selection logic
  const portions = Array.isArray((item as any)?.portions) && (item as any).portions.length > 0
    ? (item as any).portions
    : [{
        label: 'Full',
        price: item?.price ?? 0,
        currency: (item as any)?.currency ?? 'INR',
        default: true,
      }];
  const defaultPortionIdx = portions.findIndex((p: any) => p.default) >= 0 ? portions.findIndex((p: any) => p.default) : 0;
  const [selectedPortionIdx, setSelectedPortionIdx] = useState<number>(defaultPortionIdx);

  useEffect(() => {
    setIndex(0);
    setTab('description');
    setMounted(true);
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

  // Prepare media arrays for modal: combine uploaded videos and YouTube links
  const uploadedVideos = item.videos?.length
    ? item.videos
    : item.video
    ? [item.video]
    : [];
  const youtubeLinks = (item as any).youtubeLinks && Array.isArray((item as any).youtubeLinks)
    ? (item as any).youtubeLinks
    : [];
  const allVideos = [...uploadedVideos, ...youtubeLinks];
  const modalImages = images && images.length > 0 ? images : [];
  const modalMedia = [
    ...allVideos.map((v) => {
      if (typeof v === 'string' && v.includes('youtube.com')) {
        // YouTube link
        return { type: 'youtube' as const, src: v };
      }
      return { type: 'video' as const, src: v };
    }),
    ...modalImages.map((s) => ({ type: 'image' as const, src: s })),
  ];
  const activeMedia = modalMedia[index];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop with fade-in */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal card with scale/opacity entrance */}
      <div
        className={`relative max-w-3xl w-full mx-0 sm:mx-0 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transform transition-all duration-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{ backgroundColor: themeStyles.backgroundColor }}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start p-4 flex-shrink-0" style={{ backgroundColor: themeStyles.backgroundColor, borderBottomColor: themeStyles.borderColor, borderBottomWidth: '1px' }}>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-800 break-words">
              {item.name}
            </h3>
            {/* Portions dropdown and price */}
{/* {portions.length > 1 ? (
  <div className="flex flex-wrap gap-2 mt-1">
    {portions.map((portion: any, idx: number) => (
      <span
        key={idx}
        className="inline-block text-xs sm:text-sm font-semibold px-2 py-1 rounded bg-gray-100"
        style={{ color: themeStyles.primaryButtonBg }}
      >
        {portion.label} - {formatPrice(portion.price, portion.currency)}
      </span>
    ))}
  </div>
) : (
  <p className="text-sm font-semibold mt-1" style={{ color: themeStyles.primaryButtonBg }}>
    {formatPrice(portions[0].price, portions[0].currency)}
  </p>
)} */}
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
                    className="w-full h-[40vh] sm:h-[55vh] md:h-[60vh] rounded-lg overflow-hidden flex items-center justify-center shadow-md ring-1 ring-white/10 relative touch-pan-y"
                    style={{ background: activeMedia?.type === 'image' ? 'transparent' : 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.95))' }}
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
                    {/* Crossfade for media */}
                    <div className="w-full h-full flex items-center justify-center">
                      {activeMedia?.type === 'video' ? (
                        <div className="w-full h-full transition-opacity duration-300 ease-out opacity-100">
                          <VideoPlayer src={activeMedia.src} autoPlayPreview className="w-full h-full object-contain" />
                        </div>
                      ) : activeMedia?.type === 'youtube' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          {/* Extract YouTube video ID and embed */}
                          {(() => {
                            const match = activeMedia.src.match(/[?&]v=([^&#]+)/);
                            const vid = match ? match[1] : null;
                            if (vid) {
                              return (
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={`https://www.youtube.com/embed/${vid}`}
                                  title="YouTube video preview"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full object-contain rounded"
                                />
                              );
                            }
                            return <span className="text-gray-400">Invalid YouTube link</span>;
                          })()}
                        </div>
                      ) : (
                        <div className="w-full h-full transition-opacity duration-300 ease-out opacity-100 flex items-center justify-center">
                          <img
                            src={activeMedia.src}
                            alt={`${item.name} image ${index + 1}`}
                            className="w-full h-full object-contain"
                            style={{ background: 'transparent' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {modalMedia.map((m, i) => (
                      <button
                        key={`${m.type}:${m.src}`}
                        onClick={() => setIndex(i)}
                        className="flex-shrink-0 rounded-md overflow-hidden border bg-black/40 hover:scale-[1.03] transition-transform duration-200"
                        style={{
                          borderWidth: i === index ? '2px' : '1px',
                          borderColor: i === index ? themeStyles.accentBg : themeStyles.borderColor + '40',
                          boxShadow: i === index ? `0 2px 8px ${themeStyles.accentBg}30` : 'none',
                        }}
                      >
                        <div className="w-20 h-14 overflow-hidden rounded bg-black/60 flex items-center justify-center relative">
                          {m.type === 'image' ? (
                            <SmartImage src={m.src} alt={`${item.name} thumb ${i + 1}`} className="w-full h-full" fit="cover" />
                          ) : m.type === 'youtube' ? (
                            (() => {
                              const match = m.src.match(/[?&]v=([^&#]+)/);
                              const vid = match ? match[1] : null;
                              if (vid) {
                                return (
                                  <>
                                    <img
                                      src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
                                      alt="YouTube thumbnail"
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="19" cy="19" r="19" fill="rgba(0,0,0,0.45)" />
                                        <polygon points="15,12 28,19 15,26" fill="#fff" />
                                      </svg>
                                    </span>
                                  </>
                                );
                              }
                              return <span className="text-red-600 text-xs font-bold">YT</span>;
                            })()
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
                    {portions.length > 1 ? (
  <div className="flex flex-wrap gap-2 mt-1">
    {portions.map((portion: any, idx: number) => {
      let shortLabel = portion.label;
      if (shortLabel === 'Small') shortLabel = 'S';
      else if (shortLabel === 'Medium') shortLabel = 'M';
      else if (shortLabel === 'Large') shortLabel = 'L';
      return (
        <span
          key={idx}
          className="inline-block text-xs sm:text-sm font-semibold px-2 py-1 rounded bg-gray-100"
          style={{ color: themeStyles.primaryButtonBg }}
        >
          {shortLabel} | {formatPrice(portion.price, portion.currency)}
        </span>
      );
    })}
  </div>
) : (
  <p className="text-sm font-semibold mt-1" style={{ color: themeStyles.primaryButtonBg }}>
    {formatPrice(portions[0].price, portions[0].currency)}
  </p>
)}
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
