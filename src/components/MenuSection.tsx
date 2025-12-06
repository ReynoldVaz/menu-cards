

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
  enableAnalytics?: boolean;
  restaurantId?: string;
  analyticsSummary?: Record<string, number> | null;
}


export function MenuSection({ id, title, items, onOpen, isLoading, enableAnalytics, restaurantId, analyticsSummary }: MenuSectionProps) {
  const [open, setOpen] = useState(false);
  const themeStyles = useThemeStyles();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<string>("0px");
  const [lastTracked, setLastTracked] = useState<string | null>(null);


  const sectionViews = analyticsSummary
  ? items.reduce((sum, item) => sum + (analyticsSummary[item.name] || 0), 0)
  : 0;

  // Handle item click for analytics
  const handleItemClick = (item: MenuItem) => {
    if (enableAnalytics && restaurantId) {
      // Send event name and label as before, but log the intended payload for custom GA4 param
      trackEvent('menu_item_click', `${restaurantId}|${item.name}`);
      setLastTracked(`Tracked click: ${item.name} (ID: ${item.id}) for restaurant ${restaurantId}`);
      // Log the intended analytics payload for developer
      console.log('[Analytics] menu_item_click', {
        event_label: item.name,
        restaurant_id: restaurantId,
        item_id: item.id,
      });
    } else {
      setLastTracked('Analytics not enabled or restaurantId missing.');
    }
  };

  function openModal(item: MenuItem) {
    const imgs = (item.images && item.images.length > 0)
      ? item.images
      : (item.image ? [item.image] : []);

    if (enableAnalytics && restaurantId) {
      // Use a composite label for uniqueness: `${restaurantId}|${item.name}`
      trackEvent("Menu", `Click Item - ${restaurantId}`, `${restaurantId}|${item.name}`);
    }
    if (onOpen) onOpen(item, imgs);
  }

  const handleToggle = () => {
    const action = open ? "Collapse Section" : "Expand Section";
    if (enableAnalytics && restaurantId) {
      // Use a composite label for uniqueness: `${restaurantId}|${title}`
      trackEvent("Menu Section", action, `${restaurantId}|${title}`);
    }
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

  // Fetch GA4 analytics summary (event counts per item)
  // Analytics summary is now passed as a prop from above; no fetch here.

  function LazyVideo({ src }: { src: string }) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
      const el = videoRef.current;
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting) {
            // Play when visible
            const playPromise = el.play();
            if (playPromise && typeof playPromise.then === 'function') {
              playPromise.catch(() => {});
            }
          } else {
            // Pause when not visible but keep frame to avoid flicker
            el.pause();
          }
        },
        { rootMargin: '120px', threshold: 0.15 }
      );
      io.observe(el);
      return () => io.disconnect();
    }, []);

    return (
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        className="w-20 h-16 object-cover rounded"
        muted
        loop
        playsInline
        autoPlay
      />
    );
  }
  return (
    <div id={id} className={containerSpacing}>


      {/* Analytics status indicator and last tracked event message */}


      {/* <div style={{ marginBottom: 8 }}>
        <span style={{
          color: enableAnalytics ? 'green' : 'red',
          fontWeight: 'bold',
          marginRight: 12,
        }}>
          Analytics: {enableAnalytics ? 'ENABLED' : 'DISABLED'}
        </span>
        {enableAnalytics && restaurantId && (
          <span style={{ color: '#555', fontSize: 12 }}>
            Restaurant ID: {restaurantId}
          </span>
        )}
      </div>
      {lastTracked && (
        <div style={{ color: '#2563eb', fontSize: 13, marginBottom: 8 }}>
          {lastTracked}
        </div>
      )} */}



      {/* HEADER — Collapsible */}
      {/* <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg shadow-sm"
        style={{
          backgroundColor: themeStyles.accentBg,
          color: themeStyles.primaryButtonBg,
        }}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
              {enableAnalytics && sectionViews > 0 && (
<span
  style={{
    color: '#374151', // Tailwind's text-gray-700 (darker)
    fontSize: '10px',
    marginTop: '4px',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  }}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 24 24"
    style={{ display: 'inline', verticalAlign: 'middle' }}
  >
    <path
      fill="currentColor"
      d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"
    />
  </svg>
  {sectionViews}
</span>

)}
        <span className="text-xl">
          {open ? "−" : "+"}
        </span>
      </button> */}

      <button
  onClick={handleToggle}
  className="w-full flex items-center justify-between px-4 py-3 rounded-lg shadow-sm"
  style={{
    backgroundColor: themeStyles.accentBg,
    color: themeStyles.primaryButtonBg,
  }}
>
  <h2 className="text-lg font-semibold flex items-center gap-2">
    {title}
    {enableAnalytics && sectionViews > 0 && (
      <span
        style={{
          color: '#374151',
          fontSize: '10px',
          marginLeft: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          style={{ display: 'inline', verticalAlign: 'middle' }}
        >
          <path
            fill="currentColor"
            d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"
          />
        </svg>
        {sectionViews}
      </span>
    )}
  </h2>
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
                onClick={() => { handleItemClick(item); openModal(item); }}
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
                        <LazyVideo src={videos[0]} />
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
                        onClick={() => { handleItemClick(item); openModal(item); }}
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
                            <span className="ml-2 inline-flex items-center gap-1 leading-none">
                              {((item as any).dietType === 'veg') && (
                                <span title="Veg" className="text-[10px] leading-none align-middle">🥬</span>
                              )}
                              {((item as any).dietType === 'non-veg') && (
                                <span title="Non-Veg" className="text-[10px] leading-none align-middle">🍗</span>
                              )}
                              {((item as any).dietType === 'vegan') && (
                                <span title="Vegan" className="text-[10px] leading-none align-middle">🌱</span>
                              )}
                            </span>
                          )}
                        </h3>
                      </button>
                      {/* Removed badge; icon appended inline to dish name */}
                    </div>                    {/* Spice / Sweet Icons */}
                    {/* Availability disclaimer */}
                    {((item as any).is_unavailable === true) && (
                      <div className="mt-0.5 text-xs text-red-600">
                        Currently unavailable
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {/* Spice rating */}
                      {typeof item.spice === "number" && item.spice > 0 && (
                        <div className="flex items-center text-red-500 text-[10px] leading-none gap-0.5">
                          {Array.from({ length: item.spice }).map((_, i) => (
                            <span key={i} className="leading-none">🌶️</span>
                          ))}
                        </div>
                      )}

                      {/* Sweet rating */}
                      {typeof item.sweet === "number" && item.sweet > 0 && (
                        <div className="flex items-center text-amber-600 text-[10px] leading-none gap-0.5">
                          {Array.from({ length: item.sweet }).map((_, i) => (
                            <span key={i} className="leading-none">🍯</span>
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
                    {analyticsSummary && analyticsSummary[item.name] > 0 && (
                      <div className="text-[10px] text-gray-700 mt-1 whitespace-nowrap flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                          style={{ display: 'inline', verticalAlign: 'middle' }}
                        >
                          <path
                            fill="currentColor"
                            d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8a3 3 0 100 6 3 3 0 000-6z"
                          />
                        </svg>
                        {analyticsSummary[item.name]}
                      </div>
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
