import { MenuItem } from '../data/menuData';

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
}

export function MenuSection({ title, items }: MenuSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px bg-gradient-to-r from-orange-400 to-transparent flex-1"></div>
        <h2 className="text-2xl font-semibold text-orange-900 px-2 text-center min-w-max">
          {title}
        </h2>
        <div className="h-px bg-gradient-to-l from-orange-400 to-transparent flex-1"></div>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.name}
            className="group hover:bg-orange-50 p-4 rounded-lg transition-colors duration-200"
          >
            <div className="flex justify-between items-start gap-4 mb-1">
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-700 transition-colors">
                {item.name}
              </h3>
              <span className="font-bold text-orange-600 text-lg whitespace-nowrap ml-2">
                {item.price}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-light leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
