import { FiPhone } from 'react-icons/fi';

interface MobileAwareCallButtonProps {
  themeColor?: string;
  phone?: string | null;
}

export function MobileAwareCallButton({ themeColor, phone }: MobileAwareCallButtonProps) {
  if (!phone) return null;
  
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const color = themeColor || '#EA580C';
  const tel = `tel:${phone.replace(/\s|\(|\)|-/g, '')}`;

  return isMobile ? (
    <a
      href={tel}
      className="inline-flex items-center gap-2 text-black px-6 py-2.5 rounded-full text-sm font-medium 
                 shadow-[6px_6px_12px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(0,0,0,0.03)] 
                 hover:shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_4px_rgba(0,0,0,0.03)] 
                 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] transition-all"
      style={{ 
        background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        borderColor: color, 
        borderWidth: '2px' 
      }}
    >
      <FiPhone size={16} style={{ color }} />
      <span>{phone}</span>
    </a>
  ) : (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(0,0,0,0.03)]" style={{ background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)' }}>
      <FiPhone size={14} style={{ color }} />
      <p className="text-gray-800 text-sm">
        <span className="font-semibold">{phone}</span>
      </p>
    </div>
  );
}
