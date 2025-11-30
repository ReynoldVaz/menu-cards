// import { MenuItem } from '../data/menuData';
// import { SmartImage } from './SmartImage';

// interface MenuSectionProps {
//   id?: string;
//   title: string;
//   items: MenuItem[];
//   // optional callback used when opening the item modal from a parent
//   onOpen?: (item: MenuItem, images: string[]) => void;
// }

// function thumbnailFor(name: string) {
//   return `https://source.unsplash.com/160x120/?${encodeURIComponent(name)}`;
// }

// function modalImagesFor(name: string) {
//   const q = encodeURIComponent(name);
//   return [
//     `https://source.unsplash.com/800x600/?${q}&sig=1`,
//     `https://source.unsplash.com/800x600/?${q}&sig=2`,
//     `https://source.unsplash.com/800x600/?${q}&sig=3`,
//   ];
// }

// export function MenuSection({ id, title, items, onOpen }: MenuSectionProps) {
//   // when a parent provides onOpen, defer opening the modal to the parent
//   function openModal(item: MenuItem) {
//     const imgs = item.images && item.images.length > 0 ? item.images : modalImagesFor(item.name);
//     if (onOpen) onOpen(item, imgs);
//   }

//   return (
//     <div id={id}>
//       <div className="flex items-center gap-3 mb-8">
//         <div className="h-px bg-gradient-to-r from-orange-400 to-transparent flex-1"></div>
//         <h2 className="text-xl sm:text-2xl font-semibold text-orange-900 px-2 text-center min-w-max">
//           {title}
//         </h2>
//         <div className="h-px bg-gradient-to-l from-orange-400 to-transparent flex-1"></div>
//       </div>

//       <div className="space-y-6">
//         {items.map((item) => (
//           <div
//             key={item.name}
//             className="group hover:bg-orange-50 p-3 sm:p-4 rounded-lg transition-colors duration-200 flex items-center gap-4"
//           >
//             <button
//               onClick={() => openModal(item)}
//               className="flex-shrink-0 rounded overflow-hidden border-2 border-orange-100 hover:border-orange-300"
//               aria-label={`Open ${item.name}`}
//             >
//               <div className="w-20 h-16 overflow-hidden">
//                 <SmartImage
//                   src={item.image ?? thumbnailFor(item.name)}
//                   alt={item.name}
//                   className="w-20 h-16 rounded"
//                 />
//               </div>
//             </button>

//             <div className="flex-1 min-w-0">
//               <div className="flex items-start gap-4 mb-1">
//                 <div className="flex-1 min-w-0">
//                   <button onClick={() => openModal(item)} className="text-left w-full">
//                     <h3 className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-orange-700 transition-colors break-words whitespace-normal">
//   <>{console.log("item -", item)}</>
//                       {item.name}
//                     </h3>
//                   </button>
//                   <div className="flex items-center gap-2 mt-1">
//   {/* Spice rating */}
//   {item.spice && item.spice > 0 && (
//     <div className="flex items-center text-red-500 text-sm">
//       {Array.from({ length: item.spice }).map((_, i) => (
//         <span key={i}>🌶️</span>
//       ))}
//     </div>
//   )}

//   {/* Sweet rating */}
//   {item.sweet && item.sweet > 0 && (
//     <div className="flex items-center text-amber-600 text-sm">
//       {Array.from({ length: item.sweet }).map((_, i) => (
//         <span key={i}>🍯</span>
//       ))}
//     </div>
//   )}
// </div>

//                 </div>

//                 <div className="flex-none ml-2">
//                   <span className="font-bold text-orange-600 text-base sm:text-lg whitespace-nowrap">
//                     {item.price}
//                   </span>
//                 </div>
//               </div>
//               <p className="text-gray-500 text-sm font-light leading-relaxed">
//                 {item.description}
//               </p>
//               {/* debug: show resolved image URL so owner can open it directly */}
//               <div className="text-xs text-gray-400 mt-2 break-all">
//                 Image URL: {item.image ? (
//                   <a href={item.image} target="_blank" rel="noreferrer" className="underline">
//                     open
//                   </a>
//                 ) : (
//                   <span className="italic">(none)</span>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* modal is lifted to parent (App) when using search or global selection */}
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { getRelevantImage } from "../utils/getRelevantImage";

import { MenuItem } from "../data/menuData";
import { SmartImage } from "./SmartImage";
import { trackEvent } from "../lib/ga";




// at top of file (or wherever you handle imports)
function unsplashThumbnail(name: string) {
  const q = encodeURIComponent(name + " food");
  return `https://source.unsplash.com/160x120/?${q}`;
}

function unsplashModalImage(name: string) {
  const q = encodeURIComponent(name + " food");
  return `https://source.unsplash.com/800x600/?${q}`;
}

function fallbackImage(name: string) {
  const q = encodeURIComponent(name + " food");
  return `https://loremflickr.com/640/480/${q}`;
}

interface MenuSectionProps {
  id?: string;
  title: string;
  items: MenuItem[];
  onOpen?: (item: MenuItem, images: string[]) => void;
  isLoading?: boolean; // ✨ NEW PROP
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

export function MenuSection({ id, title, items, onOpen, isLoading }: MenuSectionProps) {
  const [open, setOpen] = useState(false);
  

  function openModal(item: MenuItem) {
    // const imgs =
      // item.images && item.images.length > 0
       // Prefer provided images, else fallback to one unsplash result
    const imgs = (item.images && item.images.length > 0 && item.images[0])
        ? item.images
        // : modalImagesFor(item.name);
          // : [unsplashModalImage(item.name)];
          // : [fallbackImage(item.name)];
          // : [resolvedImages[item.name]] ;
          : [] ;

          // Track the click in GA
  trackEvent("Menu", "Click Item", item.name);

    if (onOpen) onOpen(item, imgs);


  }

  
  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  const handleToggle = () => {
  const action = open ? "Collapse Section" : "Expand Section";

  trackEvent("Menu Section", action, title);

  setOpen(!open);
};


  return (
    <div id={id} className="mb-6">
      {/* HEADER — Collapsible */}
      <button
        // onClick={() => setOpen(!open)}
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-100 rounded-lg shadow-sm hover:bg-orange-200 transition"
      >
        <h2 className="text-lg font-semibold text-orange-800">{title}</h2>
        <span className="text-orange-700 text-xl">
          {open ? "−" : "+"}
        </span>
      </button>

      {/* COLLAPSIBLE CONTENT */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          open ? "max-h-[5000px] mt-4" : "max-h-0"
        }`}
      >
        <div className="space-y-6 px-1 sm:px-2">
          {items.map((item) => (
            <div
              key={item.name}
              className="group hover:bg-orange-50 p-3 sm:p-4 rounded-lg transition-colors duration-200 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <button
                onClick={() => openModal(item)}
                className="flex-shrink-0 rounded overflow-hidden border-2 border-orange-100 hover:border-orange-300"
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
                    <button
                      onClick={() => openModal(item)}
                      className="text-left w-full"
                    >
                      <h3 
                      // className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-orange-700 transition"

                        className="text-base sm:text-lg font-semibold text-gray-800 
             group-hover:text-orange-700 transition 
             break-words whitespace-normal leading-snug"
                      
                      >
                        {item.name}
                      </h3>
                    </button>

                    {/* Spice / Sweet Icons */}
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
                  {/* <div className="flex-none ml-2">
                    <span className="font-bold text-orange-600 text-base sm:text-lg whitespace-nowrap">
                      {item.price}
                    </span>
                  </div> */}
                  {/* <>{console.log("item - ",item)}</> */}
                  <div className="flex-none ml-2">
                    {isLoading ? ( // ✨ Conditional rendering based on loading state
                      <div className="h-5 w-12 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      <span className="font-bold text-orange-600 text-base sm:text-lg whitespace-nowrap">
                        {item.price}
                      </span>
                    )}
                  </div>


                </div>

                {/* DESCRIPTION */}
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.description}
                </p>

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
