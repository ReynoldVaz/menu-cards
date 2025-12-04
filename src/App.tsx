


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
import { SearchIconButton } from './components/SearchIconButton';
import { ItemModal } from './components/ItemModal';
import ChatBot from './components/ChatBot';
import { trackPageview } from "./lib/ga";
import { getThemeStyles } from './utils/themeUtils';
import { SocialLinksCard } from './components/SocialLinksCard';
import { db } from './firebase.config';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';


function MobileAwareCallButton({ themeColor, phone }: { themeColor?: string; phone?: string | null }) {
  if (!phone) return null;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const color = themeColor || '#EA580C';
  const tel = `tel:${phone.replace(/\s|\(|\)|-/g, '')}`;

  return isMobile ? (
    <a
      href={tel}
      className="inline-block bg-white text-black mt-4 px-5 py-2 rounded-full text-sm font-medium 
                 shadow-md hover:bg-opacity-90 transition-all"
      style={{ borderColor: color, borderWidth: '2px' }}
    >
      ☎️ {phone}
    </a>
  ) : (
    <p className="text-gray-800 text-sm mt-3">☎️ <span className="font-semibold">{phone}</span></p>
  );
}

function App() {
  const { restaurant, menuSections, todaysSpecial, upcomingEvents, loading, theme } = useRestaurant();
  const themeStyles = getThemeStyles(theme || null);
  const companyPhone = import.meta.env.VITE_COMPANY_PHONE as string | undefined;
  const [showOptIn, setShowOptIn] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [optInError, setOptInError] = useState('');
  const [optInInfo, setOptInInfo] = useState('');
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<null | any>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<Set<'veg' | 'non-veg' | 'vegan'>>(
    new Set(['veg', 'non-veg', 'vegan'])
  );

  const searchBarRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Track initial load
    trackPageview(window.location.pathname);

    // Optional: track hash or URL changes if you have routing logic
    const handlePopState = () => trackPageview(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Show opt-in dialog if restaurant requests capture and user not already opted/skipped
  useEffect(() => {
    if (!restaurant) return;
    const shouldPrompt = restaurant.captureCustomerPhone;
    const alreadyOpted = localStorage.getItem('customerPhoneOptIn') === 'true';
    const skipped = localStorage.getItem('customerPhoneOptOut') === 'true';
    if (shouldPrompt && !alreadyOpted && !skipped) {
      setShowOptIn(true);
    }
  }, [restaurant]);

  function isValidCustomerPhone(input: string) {
    const cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) return false;
    return /^[+0-9 ()-]+$/.test(input);
  }

  function handleOptInSubmit() {
    if (!isValidCustomerPhone(customerPhone)) {
      setOptInError('Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
      return;
    }
    const save = async () => {
      try {
        const sanitized = customerPhone.replace(/\D/g, '');
        if (restaurant?.id && sanitized) {
          const ref = doc(db, `restaurants/${restaurant.id}/subscribers`, sanitized);
          const existing = await getDoc(ref);
          if (existing.exists()) {
            setOptInInfo('This number is already subscribed. Thanks!');
          } else {
            await setDoc(
              ref,
              {
                phone: sanitized,
                originalInput: customerPhone,
                optedIn: true,
                preferredChannel: 'whatsapp',
                source: 'qr-prompt',
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
            setOptInInfo('Subscribed successfully. Thanks!');
          }
        }
      } catch (e) {
        console.error('Failed to save subscriber phone:', e);
      } finally {
        localStorage.setItem('customerPhoneOptIn', 'true');
        localStorage.setItem('customerPhoneNumber', customerPhone);
        setTimeout(() => setShowOptIn(false), 1000);
      }
    };
    void save();
  }

  function handleOptInSkip() {
    localStorage.setItem('customerPhoneOptOut', 'true');
    setShowOptIn(false);
  }

  return (
    <div 
      className="min-h-screen overflow-y-scroll scroll-smooth"
      style={{
        background: themeStyles.gradientBg,
      }}
    >
      <div className="w-full">
        <div className="w-full">
          <div className="rounded-lg shadow-xl overflow-hidden relative" style={{ backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor, borderWidth: '1px' }}>             <SearchIconButton searchBarRef={searchBarRef} />
            <Header onMenuClick={() => setDrawerOpen(true)} />



            <div className="hidden md:block">
              <TopTabs
                sections={[
                  ...(todaysSpecial ? [{ id: 'todays-special', title: "Today's Special", icon: '⭐' }] : []),
                  ...menuSections.map((s) => ({ id: s.id, title: s.title })),
                  { id: 'events', title: 'Events', icon: '🎉' },
                ]}
              />
            </div>

            <SideDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              sections={[
                ...(todaysSpecial ? [{ id: 'todays-special', title: "Today's Special", icon: '⭐' }] : []),
                ...menuSections.map((s) => ({ id: s.id, title: s.title })),
                { id: 'events', title: 'Events', icon: '🎉' },
              ]}
              selectedDiets={selectedDiets}
              onDietChange={(diet) => {
                const newDiets = new Set(selectedDiets);
                if (newDiets.has(diet)) {
                  newDiets.delete(diet);
                } else {
                  newDiets.add(diet);
                }
                setSelectedDiets(newDiets);
              }}
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

              {menuSections.map((section, idx) => {
                // Filter items based on selected diets
                const filteredItems = section.items.filter((item) => {
                  const dietType = (item as any).dietType;
                  // Show items without dietType (drinks, etc) always
                  if (!dietType) return true;
                  // Show items with dietType if selected
                  return selectedDiets.has(dietType);
                });

                // Don't render section if no items match filter
                if (filteredItems.length === 0) return null;

                return (
                  <div key={section.id}>
                    <MenuSection
                      id={section.id}
                      title={section.title}
                      items={filteredItems}
                      onOpen={(it, imgs) => {
                        setSelectedItem(it);
                        setSelectedImages(imgs || []);
                      }}
                      isLoading={loading} // ✨ PASSING THE LOADING STATE
                    />
                    {idx < menuSections.length - 1 && (
                      <div 
                        className="border-b mt-3"
                        style={{ borderColor: themeStyles.borderColor + '20' }}
                      ></div>
                    )}
                  </div>
                );
              })}

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

            <div 
              className="backdrop-blur-md py-8 px-6 sm:px-12 text-center shadow-lg"
              style={{ 
                backgroundColor: themeStyles.backgroundColor,
                borderTop: '1px solid ' + themeStyles.borderColor
              }}
            >
              {/* Social links card shown above footer when available */}
              <SocialLinksCard restaurant={restaurant} />
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
                ðŸ“ž <span className="font-semibold">+91 9233456789</span>
              </p> */}

              {/* <button className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg text-sm shadow-md transition-all">
                Digitize Your Menu Today
              </button> */}
              <MobileAwareCallButton themeColor={themeStyles.primaryButtonBg} phone={companyPhone ?? null} />
            </div>

            {showOptIn && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-md p-5">
                  <h4 className="text-lg font-semibold mb-2" style={{ color: themeStyles.primaryButtonBg }}>Stay up to date</h4>
                  <p className="text-sm text-gray-700 mb-2">Share your phone number to receive updates and offers from {restaurant?.name}. You can skip if you prefer.</p>
                  <p className="text-xs text-gray-500 mb-3">Format: include country code, e.g., +91 98765 43210 or +1 415 555 1234.</p>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => { setCustomerPhone(e.target.value); setOptInError(''); }}
                    placeholder="e.g., +91 98765 43210"
                    inputMode="tel"
                    className="w-full px-3 py-2 border rounded mb-2"
                  />
                  {optInError && <p className="text-red-600 text-xs mb-3">{optInError}</p>}
                  {optInInfo && <p className="text-green-600 text-xs mb-3">{optInInfo}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleOptInSkip} className="px-4 py-2 rounded border">Skip</button>
                    <button onClick={handleOptInSubmit} className="px-4 py-2 rounded text-white" style={{ backgroundColor: themeStyles.primaryButtonBg }}>Submit</button>
                  </div>
                </div>
              </div>
            )}

            {/* FLOATING CHAT ICON */}
            <ChatBot menuSections={menuSections} todaysSpecial={todaysSpecial} events={upcomingEvents} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

