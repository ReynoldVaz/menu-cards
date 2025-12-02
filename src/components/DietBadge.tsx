interface DietBadgeProps {
  dietType?: 'veg' | 'non-veg' | 'vegan';
  size?: 'sm' | 'md';
}

const DIET_INFO = {
  veg: { emoji: '🥬', label: 'Veg', color: '#10b981' },
  'non-veg': { emoji: '🍗', label: 'Non-Veg', color: '#f97316' },
  vegan: { emoji: '🌱', label: 'Vegan', color: '#06b6d4' },
};

export function DietBadge({ dietType = 'veg', size = 'md' }: DietBadgeProps) {
  const info = DIET_INFO[dietType];
  const sizeClass = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div
      className={`${sizeClass} inline-flex items-center gap-1 rounded-full font-medium`}
      style={{
        backgroundColor: `${info.color}20`,
        color: info.color,
        border: `1px solid ${info.color}`,
      }}
    >
      <span>{info.emoji}</span>
      <span>{info.label}</span>
    </div>
  );
}
