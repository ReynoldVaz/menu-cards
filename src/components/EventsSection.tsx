import { Event } from '../data/menuData';
import { EventCard } from './EventCard';
import { useThemeStyles } from '../context/useThemeStyles';

interface EventsSectionProps {
  events: Event[];
}

export function EventsSection({ events }: EventsSectionProps) {
  const themeStyles = useThemeStyles();
  return (
    <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${themeStyles.borderColor}` }}>
      <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center" style={{ color: themeStyles.primaryButtonBg }}>
        Upcoming Events
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
