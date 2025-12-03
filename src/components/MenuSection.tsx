

import { useState } from "react";
import { MenuItem } from "../data/menuData";
import { SmartImage } from "./SmartImage";
import { DietBadge } from "./DietBadge";
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

  function openModal(item: MenuItem) {
    const imgs = (item.images && item.images.length > 0 && item.images[0])
        ? item.images
        : [];

    trackEvent("Menu", "Click Item", item.name);
    if (onOpen) onOpen(item, imgs);
  }

  const handleToggle = () => {
    const action = open ? "Collapse Section" : "Expand Section";
    trackEvent("Menu Section", action, title);
    setOpen(!open);
  };


  return (
    <div id={id} className="mb-6">
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
        className={`overflow-hidden ${
          open ? "max-h-[5000px] mt-4" : "max-h-0"
        }`}
      >
        <div className="space-y-6 px-1 sm:px-2">
          {items.map((item) => (
            <div
              key={item.name}
              className="group p-3 sm:p-4 rounded-lg flex items-center gap-4"
              style={{ backgroundColor: `${themeStyles.accentBg}20` }}
            >
              {/* Thumbnail */}
              <button
                onClick={() => openModal(item)}
                className="flex-shrink-0 rounded overflow-hidden border-2 hover:opacity-80"
                style={{ borderColor: themeStyles.borderColor }}
              >
                <div className="w-20 h-16 overflow-hidden">
                  {/* <img src={ `https://dummyimage.com/600x400/000/fff&text=${encodeURIComponent(item.name)}` }/> */}
                  <SmartImage
                    // src={item.image ?? thumbnailFor(item.name)}
                    // src={ item.image ? item.image : unsplashThumbnail(item.name) }
                    // src={ item.image  ?? resolvedImages[item.name]  }
                    // src={ `https://dummyimage.com/600x400/000/fff&text=${encodeURIComponent(item.name)}` }
                    // alt={item.name}
                    src={ item.image  ?? ""  }
                    className="w-20 h-16 rounded"
                  />
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
                        </h3>
                      </button>
                      {(item as any).dietType && <DietBadge dietType={(item as any).dietType} size="sm" />}
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
