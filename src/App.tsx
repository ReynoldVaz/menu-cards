


import { Header } from './components/Header';
import { TopTabs } from './components/TopTabs';
import { MenuSection } from './components/MenuSection';
import { TodaysSpecial } from './components/TodaysSpecial';
import { EventsSection } from './components/EventsSection';
import { SideDrawer } from './components/SideDrawer';
import { useRestaurant } from './context/useRestaurant';
import { useState, useRef, useEffect } from 'react';
import { MenuFab } from './components/MenuFab';
import { SearchBar } from './components/SearchBar';
import { ItemModal } from './components/ItemModal';
import ChatBot from './components/ChatBot';
import { trackPageview } from "./lib/ga";
import { getThemeStyles, hexToRgba } from './utils/themeUtils';


function MobileAwareCallButton({ themeColor }: { themeColor?: string }) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const color = themeColor || '#EA580C';

  return isMobile ? (
    <a
      href="tel:+918698248506"
      className="inline-block bg-white text-black mt-4 px-5 py-2 rounded-full text-sm font-medium 
                 shadow-md hover:bg-opacity-90 transition-all"
      style={{ borderColor: color, borderWidth: '2px' }}
    >
      📞 +918698248506
    </a>
  ) : (
    <p className="text-gray-800 text-sm mt-3">📞 <span className="font-semibold">+918698248506</span></p>
  );
}

function App() {
  const { menuSections, todaysSpecial, upcomingEvents, loading, theme } = useRestaurant();
  const themeStyles = getThemeStyles(theme || null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<null | any>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const searchBarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Track initial load
    trackPageview(window.location.pathname);

    // Optional: track hash or URL changes if you have routing logic
    const handlePopState = () => trackPageview(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);



  //   const [data, setData] = useState<any>(null);

  // useEffect(() => {
  //   fetch("/api/analytics")
  //     .then(res => res.json())
  //     .then(setData)
  //     .catch(console.error);
  // }, []);


  return (
    <div 
      className="min-h-screen overflow-y-scroll scroll-smooth"
      style={{
        background: themeStyles.gradientBg,
      }}
    >
      <div className="flex items-center justify-center p-4 py-8">






        <div className="max-w-4xl w-full">
          <div className="rounded-lg shadow-xl overflow-hidden relative" style={{ backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor, borderWidth: '1px' }}>

            {/* SEARCH ICON - Fixed to the bottom right (Highest Z-index) */}
            <button
              onClick={() => searchBarRef.current?.focus()}
              className="fixed right-4 bottom-36 text-white p-3 rounded-full shadow z-[40]"
              style={{ backgroundColor: hexToRgba(themeStyles.backgroundColor, 0.55) }}
            >
              🔍
            </button>
            <Header onMenuClick={() => setDrawerOpen(true)} />
                  <div>
                    {/* <>{console.log("Analytics data:", data)}</> */}
      {/* <h2>Popularrrrrr Items</h2>
      <ul>
        {data?.rows?.map((row: any) => (
          <li key={row.dimensionValues[0].value}>
            {row.dimensionValues[0].value}: {row.metricValues[0].value} clicks
          </li>
        ))}
      </ul> */}
    </div>

              <div className="backdrop-blur-md py-8 px-6 sm:px-12 text-center shadow-lg" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderTopColor: themeStyles.borderColor,
                borderTopWidth: '1px'
              }}>
                <h3 className="text-xl font-bold" style={{ color: themeStyles.primaryButtonBg }}>
                  Digital Solutions
                </h3>

                <p className="text-gray-700 text-sm mt-1">
                  Crafted by <span className="font-semibold">Reynold</span> & <span className="font-semibold">Savio Vaz</span>
                </p>

                <p className="text-gray-600 text-sm mt-2">
                  Powering <span className="font-semibold" style={{ color: themeStyles.primaryButtonBg }}>50+ restaurants</span> • 
                  Fast • Modern • Fully Customized
                </p>

                <MobileAwareCallButton themeColor={themeStyles.primaryButtonBg} />
              </div>

            <div className="hidden md:block">
              <TopTabs
                sections={[{ id: 'todays-special', title: "Today's Special", icon: '⭐' },
                  ...menuSections.map((s) => ({ id: s.id, title: s.title })),
                  { id: 'events', title: 'Events', icon: '🎉' },]}
              />
            </div>

            <SideDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              sections={[{ id: 'todays-special', title: "Today's Special", icon: '⭐' },
                ...menuSections.map((s) => ({ id: s.id, title: s.title })),
                { id: 'events', title: 'Events', icon: '🎉' },]}
            />

            <MenuFab onClick={() => setDrawerOpen(true)} />

            <div className="p-6 sm:p-10 space-y-12">

              <SearchBar
                ref={searchBarRef}
                sections={menuSections}
                onSelectItem={(it) => {
                  const imgs = it.images?.length ? it.images : it.image ? [it.image] : [];
                  setSelectedImages(imgs);
                  setSelectedItem(it);
                }}
                onSelectSection={(id) => {
                  const el = document.getElementById(id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />

              {selectedItem && (
                <ItemModal item={selectedItem} images={selectedImages} onClose={() => setSelectedItem(null)} />
              )}

              <div id="todays-special">
                <TodaysSpecial item={todaysSpecial} />
              </div>

              {menuSections.map((section, idx) => (
                <div key={section.id}>
                  <MenuSection
                    id={section.id}
                    title={section.title}
                    items={section.items}
                    onOpen={(it, imgs) => {
                      setSelectedItem(it);
                      setSelectedImages(imgs || []);
                    }}
                    isLoading={loading} // ✨ PASSING THE LOADING STATE


                  />
                  {idx < menuSections.length - 1 && <div className="border-b mt-12" style={{ borderColor: `${themeStyles.borderColor}20` }}></div>}
                </div>
              ))}

              <div id="events">
                <EventsSection events={upcomingEvents} />
              </div>

              {/* {loading && <p className="text-center text-sm text-gray-500">Refreshing menu...</p>}

              <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Sheets Debug</div>
                  <button onClick={() => refresh()} className="text-sm underline text-blue-600">Refresh now</button>
                </div>
                <div className="space-y-1">
                  <div>Last fetch: <strong>{lastFetchedAt ?? 'never'}</strong></div>
                  <div>Error: <strong className="text-red-600">{error ?? 'none'}</strong></div>
                  <div>Sections: <strong>{menuSections.length}</strong></div>
                </div>
              </div> */}
              
            </div>

            <div className="backdrop-blur-md py-8 px-6 sm:px-12 text-center shadow-lg" style={{ backgroundColor: themeStyles.backgroundColor, borderTop: `1px solid ${themeStyles.borderColor}` }}>
              <h3 className="text-xl font-bold" style={{ color: themeStyles.primaryButtonBg }}>
                Digital Solutions
              </h3>

              <p className="text-sm mt-1" style={{ color: themeStyles.textColor }}>
                Crafted by <span className="font-semibold">Reynold</span> & <span className="font-semibold">Savio Vaz</span>
              </p>

              <p className="text-sm mt-2" style={{ color: themeStyles.textColor }}>
                Powering <span className="font-semibold" style={{ color: themeStyles.primaryButtonBg }}>50+ restaurants</span> • 
                Fast • Modern • Fully Customized
              </p>

              {/* <p className="text-gray-800 text-sm mt-3">
                📞 <span className="font-semibold">+91 9233456789</span>
              </p> */}

              {/* <button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm shadow-md transition-all">
                Digitize Your Menu Today
              </button> */}
              <MobileAwareCallButton />
            </div>

            {/* FLOATING CHAT ICON */}
            <ChatBot menuSections={menuSections} todaysSpecial={todaysSpecial} events={upcomingEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
