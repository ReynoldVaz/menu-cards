import { useThemeStyles } from '../context/useThemeStyles';

interface DietFilterProps {
  selectedDiets: Set<'veg' | 'non-veg' | 'vegan'>;
  onDietChange: (diet: 'veg' | 'non-veg' | 'vegan') => void;
}

const DIET_OPTIONS = [
  { value: 'veg', label: '🥬 Vegetarian', emoji: '🥬' },
  { value: 'non-veg', label: '🍗 Non-Veg', emoji: '🍗' },
  { value: 'vegan', label: '🌱 Vegan', emoji: '🌱' },
] as const;

export function DietFilter({ selectedDiets, onDietChange }: DietFilterProps) {
  const themeStyles = useThemeStyles();
  const isAllSelected = selectedDiets.size === 3;

  const handleToggleAll = () => {
    if (isAllSelected) {
      selectedDiets.clear();
    } else {
      DIET_OPTIONS.forEach(opt => selectedDiets.add(opt.value));
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center p-4 rounded-lg" 
      style={{ backgroundColor: `${themeStyles.accentBg}30` }}>
      <span className="text-sm font-semibold text-gray-700">Filter by Diet:</span>
      
      {/* Show All Button */}
      <button
        onClick={handleToggleAll}
        className="px-3 py-1 rounded-full text-sm font-medium transition-all"
        style={{
          backgroundColor: isAllSelected ? themeStyles.primaryButtonBg : '#e5e7eb',
          color: isAllSelected ? '#ffffff' : '#374151',
          border: `2px solid ${themeStyles.borderColor}`,
        }}
      >
        All
      </button>

      {/* Diet Option Buttons */}
      {DIET_OPTIONS.map(({ value, label, emoji }) => (
        <button
          key={value}
          onClick={() => onDietChange(value)}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: selectedDiets.has(value) ? themeStyles.primaryButtonBg : '#f3f4f6',
            color: selectedDiets.has(value) ? '#ffffff' : '#374151',
            border: `2px solid ${selectedDiets.has(value) ? themeStyles.primaryButtonBg : themeStyles.borderColor}`,
          }}
        >
          <span className="mr-1">{emoji}</span>
          {label.split(' ')[1]}
        </button>
      ))}
    </div>
  );
}
