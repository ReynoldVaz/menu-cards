import { Sparkles } from 'lucide-react';
import { MenuItem } from '../data/menuData';

interface TodaysSpecialProps {
  item: MenuItem;
}

export function TodaysSpecial({ item }: TodaysSpecialProps) {
  return (
    <div className="mb-12 bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-lg border-2 border-orange-300">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-orange-600" />
        <h2 className="text-2xl font-bold text-orange-900">Today's Special</h2>
      </div>

      <div className="group">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-xl font-semibold text-gray-800">
            {item.name}
          </h3>
          <span className="font-bold text-orange-600 text-xl whitespace-nowrap">
            {item.price}
          </span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}
