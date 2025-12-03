

import { useRef, useState, useEffect } from "react";
import { MenuItem } from "../data/menuData";
import { SmartImage } from "./SmartImage";
// DietBadge no longer used; inline icons appended to dish name
import { trackEvent } from "../lib/ga";
import { useThemeStyles } from "../context/useThemeStyles";
import { formatPrice } from "../utils/formatPrice";




interface MenuSectionProps {
  id?: string;
  title: string;
  items: MenuItem[];
  onOpen?: (item: MenuItem, images: string[]) => void;
  isLoading?: boolean;
}

export function MenuSection({ id, title, items, onOpen, isLoading }: MenuSectionProps) {
  const [open, setOpen] = useState(false);
  const themeStyles = useThemeStyles();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<string>("0px");

  function openModal(item: MenuItem) {
    const imgs = (item.images && item.images.length > 0)
      ? item.images
      : (item.image ? [item.image] : []);

    trackEvent("Menu", "Click Item", item.name);
    if (onOpen) onOpen(item, imgs);
  }

  const handleToggle = () => {
    const action = open ? "Collapse Section" : "Expand Section";
    trackEvent("Menu Section", action, title);
    setOpen((prev) => !prev);
  };

  // Smooth height transition by measuring content
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (open) {
      const full = el.scrollHeight;
      setHeight(full + "px");
    } else {
      setHeight("0px");
    }
  }, [open, items.length]);

  // Recalculate height on window resize (content width affects height)
  useEffect(() => {
    const onResize = () => {
      if (!contentRef.current) return;
      if (open) setHeight(contentRef.current.scrollHeight + "px");
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [open]);
  const containerSpacing = open ? 'mb-4' : 'mb-1';

  return (
    <div id={id} className={containerSpacing}>
      {/* HEADER — Collapsible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg shadow-sm"
        style={{
          backgroundColor: themeStyles.accentBg,
          color: themeStyles.primaryButtonBg,
        }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xl">
          {open ? "−" : "+"}
        </span>
      </button>

      {/* COLLAPSIBLE CONTENT */}
      <div
        className={`overflow-hidden ${open ? "mt-4" : "mt-0"}`}
        style={{ height, transition: "height 320ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        ref={contentRef}
      >
        <div
          className="space-y-6 px-1 sm:px-2"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-6px)",
            transition: "opacity 280ms ease-out, transform 320ms ease-out",
          }}
        >
          {items.map((item) => (
            <div
              key={item.name}
              className="group p-3 sm:p-4 rounded-lg flex items-center gap-4"
              style={{ backgroundColor: `${themeStyles.accentBg}20` }}
            >
              {/* Thumbnail: prefer video preview if available */}
              <button
                onClick={() => openModal(item)}
                className="flex-shrink-0 rounded overflow-hidden border-2 hover:opacity-80"
                style={{ borderColor: themeStyles.borderColor }}
              >
                <div className="w-20 h-16 overflow-hidden">
                  {(() => {
                    const videos = (item as any).videos && (item as any).videos.length > 0
                      ? (item as any).videos
                      : ((item as any).video ? [(item as any).video] : []);
                    const images = item.images && item.images.length > 0
                      ? item.images
                      : (item.image ? [item.image] : []);
                    // Prefer showing a video preview if available
                    if (videos.length > 0) {
                      return (
                        <video
                          src={videos[0]}
                          className="w-20 h-16 object-cover rounded"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                      );
                    }
                    if (images.length > 0) {
                      return (
                        <SmartImage
                          src={images[0]}
                          alt={item.name}
                          className="w-20 h-16 rounded"
                        />
                      );
                    }
                    return (
                      <div className="w-20 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No media
                      </div>
                    );
                  })()}
                </div>
              </button>

                {/* DETAILS */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => openModal(item)}
                        className="text-left flex-1"
                      >
                        <h3 
                          className="text-base sm:text-lg font-semibold text-gray-800 break-words whitespace-normal leading-snug"
                          style={{
                            color: 'inherit',
                          }}
                        >
                          {item.name}
                          {(item as any).dietType && (
                            <span className="ml-2 inline-flex items-center">
                              {((item as any).dietType === 'veg') && (
                                <span title="Veg" className="text-xs leading-none align-middle">🥬</span>
                              )}
                              {((item as any).dietType === 'non-veg') && (
                                <span title="Non-Veg" className="text-xs leading-none align-middle">🍖</span>
                              )}
                              {((item as any).dietType === 'vegan') && (
                                <span title="Vegan" className="text-xs leading-none align-middle">🌱</span>
                              )}
                            </span>
                          )}
                        </h3>
                      </button>
                      {/* Removed badge; icon appended inline to dish name */}
                    </div>                    {/* Spice / Sweet Icons */}
                    <div className="flex items-center gap-2 mt-1">

                      {/* {item.spice > 0 && (
                        <div className="flex text-red-500 text-sm">
                          {Array.from({ length: item.spice }).map((_, i) => (
                            <span key={i}>🌶️</span>
                          ))}
                        </div>
                      )}

                      {item.sweet > 0 && (
                        <div className="flex text-amber-600 text-sm">
                          {Array.from({ length: item.sweet }).map((_, i) => (
                            <span key={i}>🍯</span>
                          ))}
                        </div>
                      )} */}
                        {/* Spice rating */}
  {typeof item.spice === "number" && item.spice > 0 && (
    <div className="flex items-center text-red-500 text-sm">
      {Array.from({ length: item.spice }).map((_, i) => (
        <span key={i}>🌶️</span>
      ))}
    </div>
  )}

  {/* Sweet rating */}
  {typeof item.sweet === "number" && item.sweet > 0 && (
    <div className="flex items-center text-amber-600 text-sm">
      {Array.from({ length: item.sweet }).map((_, i) => (
        <span key={i}>🍯</span>
      ))}
    </div>
  )}


                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="flex-none ml-2">
                    {isLoading ? (
                      <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <span className="font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: themeStyles.primaryButtonBg }}>
                        {formatPrice(item.price, (item as any).currency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* DESCRIPTION */}
                {/* <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description}
                </p> */}

                {/* IMAGE URL FOR DEBUG */}
                {/* <div className="text-xs text-gray-400 mt-2 break-all">
                  {item.image ? (
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      image link
                    </a>
                  ) : (
                    <span className="italic">(no image)</span>
                  )}
                </div> */}


              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
