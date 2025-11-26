import { Header } from './components/Header';
import { MenuSection } from './components/MenuSection';
import { TodaysSpecial } from './components/TodaysSpecial';
import { EventsSection } from './components/EventsSection';
import { menuSections, todaysSpecial, upcomingEvents } from './data/menuData';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      <div className="flex items-center justify-center p-4 py-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-orange-100">
            <Header />

            <div className="p-6 sm:p-10 space-y-12">
              <TodaysSpecial item={todaysSpecial} />

              {menuSections.map((section, idx) => (
                <div key={section.id}>
                  <MenuSection title={section.title} items={section.items} />
                  {idx < menuSections.length - 1 && (
                    <div className="border-b border-orange-100 mt-12"></div>
                  )}
                </div>
              ))}

              <EventsSection events={upcomingEvents} />
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
