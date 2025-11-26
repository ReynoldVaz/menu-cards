import { Event } from '../data/menuData';
import { EventCard } from './EventCard';

interface EventsSectionProps {
  events: Event[];
}

export function EventsSection({ events }: EventsSectionProps) {
  return (
    <div className="mt-12 pt-8 border-t border-orange-100">
      <h2 className="text-3xl font-bold text-orange-900 mb-8 text-center">
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
