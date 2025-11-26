import { Calendar, Clock, Music } from 'lucide-react';
import { Event } from '../data/menuData';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white border border-orange-200 rounded-lg p-4 sm:p-6 hover:shadow-lg hover:border-orange-400 transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        <Music className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span className="text-sm">{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-sm">{event.time}</span>
        </div>
      </div>

      <p className="text-gray-600 text-sm leading-relaxed">
        {event.description}
      </p>
    </div>
  );
}
