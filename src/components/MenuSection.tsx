import { MenuItem } from '../data/menuData';
import { SmartImage } from './SmartImage';

interface MenuSectionProps {
  id?: string;
  title: string;
  items: MenuItem[];
  // optional callback used when opening the item modal from a parent
  onOpen?: (item: MenuItem, images: string[]) => void;
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

export function MenuSection({ id, title, items, onOpen }: MenuSectionProps) {
  // when a parent provides onOpen, defer opening the modal to the parent
  function openModal(item: MenuItem) {
    const imgs = item.images && item.images.length > 0 ? item.images : modalImagesFor(item.name);
    if (onOpen) onOpen(item, imgs);
  }

  return (
    <div id={id}>
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
            className="group hover:bg-orange-50 p-3 sm:p-4 rounded-lg transition-colors duration-200 flex items-center gap-4"
          >
            <button
              onClick={() => openModal(item)}
              className="flex-shrink-0 rounded overflow-hidden border-2 border-orange-100 hover:border-orange-300"
              aria-label={`Open ${item.name}`}
            >
              <div className="w-20 h-16 overflow-hidden">
                <SmartImage
                  src={item.image ?? thumbnailFor(item.name)}
                  alt={item.name}
                  className="w-20 h-16 rounded"
                />
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <button onClick={() => openModal(item)} className="text-left w-full">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-orange-700 transition-colors break-words whitespace-normal">
  <>{console.log("item -", item)}</>
                      {item.name}
                    </h3>
                  </button>
                  <div className="flex items-center gap-2 mt-1">
  {/* Spice rating */}
  {item.spice && item.spice > 0 && (
    <div className="flex items-center text-red-500 text-sm">
      {Array.from({ length: item.spice }).map((_, i) => (
        <span key={i}>🌶️</span>
      ))}
    </div>
  )}

  {/* Sweet rating */}
  {item.sweet && item.sweet > 0 && (
    <div className="flex items-center text-amber-600 text-sm">
      {Array.from({ length: item.sweet }).map((_, i) => (
        <span key={i}>🍯</span>
      ))}
    </div>
  )}
</div>

                </div>

                <div className="flex-none ml-2">
                  <span className="font-bold text-orange-600 text-base sm:text-lg whitespace-nowrap">
                    {item.price}
                  </span>
                </div>
              </div>
              <p className="text-gray-500 text-sm font-light leading-relaxed">
                {item.description}
              </p>
              {/* debug: show resolved image URL so owner can open it directly */}
              <div className="text-xs text-gray-400 mt-2 break-all">
                Image URL: {item.image ? (
                  <a href={item.image} target="_blank" rel="noreferrer" className="underline">
                    open
                  </a>
                ) : (
                  <span className="italic">(none)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* modal is lifted to parent (App) when using search or global selection */}
    </div>
  );
}
