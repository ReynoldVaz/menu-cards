import { Header } from './components/Header';
import { TopTabs } from './components/TopTabs';
import { MenuSection } from './components/MenuSection';
import { TodaysSpecial } from './components/TodaysSpecial';
import { EventsSection } from './components/EventsSection';
import { SideDrawer } from './components/SideDrawer';
import { useSheetsData } from './lib/useSheets';
import { useState } from 'react';
import { MenuFab } from './components/MenuFab';
import { SearchBar } from './components/SearchBar';
import { ItemModal } from './components/ItemModal';

function App() {
  const { menuSections, todaysSpecial, upcomingEvents, loading, error, refresh, lastFetchedAt, lastFetchedRaw } = useSheetsData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<null | any>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      <div className="flex items-center justify-center p-4 py-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-orange-100">
            <Header onMenuClick={() => setDrawerOpen(true)} />

            {/* top tabs for quick navigation between sections (includes Today's special and Events)
                hidden on small screens where the drawer is used instead */}
            <div className="hidden md:block">
              <TopTabs
                sections={[
                  { id: 'todays-special', title: "Today's", icon: '⭐' },
                  ...menuSections.map((s) => ({ id: s.id, title: s.title, icon: s.title.toLowerCase().includes('dessert') ? '🍨' : undefined })),
                  { id: 'events', title: 'Events', icon: '🎉' },
                ]}
              />
            </div>

            {/* mobile drawer */}
            <SideDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              sections={[
                { id: 'todays-special', title: "Today's", icon: '⭐' },
                ...menuSections.map((s) => ({ id: s.id, title: s.title, icon: s.title.toLowerCase().includes('dessert') ? '🍨' : undefined })),
                { id: 'events', title: 'Events', icon: '🎉' },
              ]}
            />
            {/* floating menu button for mobile so user can open drawer without scrolling to top */}
            <MenuFab onClick={() => setDrawerOpen(true)} />

            <div className="p-6 sm:p-10 space-y-12">
              <SearchBar
                sections={menuSections}
                onSelectItem={(it) => {
                  // open modal with item
                  const imgs = it.images && it.images.length > 0 ? it.images : (it.image ? [it.image] : []);
                  setSelectedImages(imgs.length > 0 ? imgs : []);
                  setSelectedItem(it);
                }}
                onSelectSection={(id) => {
                  const el = document.getElementById(id);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />

              {selectedItem && (
                <ItemModal
                  item={selectedItem}
                  images={selectedImages}
                  onClose={() => setSelectedItem(null)}
                />
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
                  />
                  {idx < menuSections.length - 1 && (
                    <div className="border-b border-orange-100 mt-12"></div>
                  )}
                </div>
              ))}

              <div id="events">
                <EventsSection events={upcomingEvents} />
              </div>

              {loading && (
                <p className="text-center text-sm text-gray-500">Refreshing menu from Google Sheets...</p>
              )}

              {/* Debug panel - visible to help diagnose sheet issues */}
              <div className="mt-6 p-3 bg-gray-50 rounded text-xs text-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Sheets Debug</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => refresh()} className="text-sm underline text-blue-600">Refresh now</button>
                  </div>
                </div>
                <div className="space-y-1">
                    <div>Last fetch: <strong>{lastFetchedAt ?? 'never'}</strong></div>
                    <div>Error: <strong className="text-red-600">{error ?? 'none'}</strong></div>
                    <div>Menu sections: <strong>{menuSections.length}</strong></div>
                    <div>Events: <strong>{upcomingEvents.length}</strong></div>
                    <div>Configured sheetId: <strong>{lastFetchedAt ? (lastFetchedAt && '' ) : (import.meta.env.VITE_SHEET_ID ?? 'not set')}</strong></div>
                    <div>Using API key: <strong>{String(import.meta.env.VITE_SHEETS_API_KEY ? true : false)}</strong></div>
                  <details className="mt-2 text-left">
                    <summary className="cursor-pointer">Preview fetched rows (first few)</summary>
                    <pre className="mt-2 max-h-40 overflow-auto text-xs bg-white p-2 rounded border">{JSON.stringify(lastFetchedRaw, null, 2)}</pre>
                  </details>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 sm:px-10 py-6 text-center border-t border-orange-100">
              <p className="text-gray-600 text-sm font-light">
                Crafted with love and tradition
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
