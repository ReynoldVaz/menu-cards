import { Calendar, Clock, Music } from 'lucide-react';
import { Event } from '../data/menuData';
import { useThemeStyles } from '../context/useThemeStyles';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const themeStyles = useThemeStyles();
  return (
    <div 
      className="rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300" 
      style={{ 
        backgroundColor: themeStyles.backgroundColor, 
        borderColor: themeStyles.borderColor, 
        borderWidth: '1px',
        borderRadius: '12px'
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <Music className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: themeStyles.primaryButtonBg }} />
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="mb-3">
            <div className="flex items-center gap-4 text-gray-600 flex-wrap">
              <span className="inline-flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: themeStyles.primaryButtonBg }} />
                <span className="text-sm">{event.date}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: themeStyles.primaryButtonBg }} />
                <span className="text-sm">{event.time}</span>
              </span>
            </div>
          </div>

          {event.description && (
            <p className="text-gray-600 text-sm leading-relaxed">
              {event.description}
            </p>
          )}
        </div>

        {(event as any).image && (
          <img
            src={(event as any).image}
            alt={event.title}
            loading="lazy"
            className="w-32 h-24 object-cover rounded border"
          />
        )}
      </div>
    </div>
  );
}
