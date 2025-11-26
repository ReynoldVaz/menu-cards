import { Flame } from 'lucide-react';

export function Header() {
  return (
    <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-8 text-center text-white">
      <div className="flex justify-center mb-4">
        <Flame className="w-10 h-10" strokeWidth={1.5} />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Cota Cozinha</h1>
      <p className="text-orange-100 font-light text-sm tracking-wide">
        AUTHENTIC INDIAN CUISINE
      </p>
    </div>
  );
}
