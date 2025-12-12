import type { ThemeStyles } from '../utils/themeUtils';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { SocialLinksCard } from './SocialLinksCard';
import { MobileAwareCallButton } from './MobileAwareCallButton';

interface FooterProps {
  restaurant: Restaurant | null;
  themeStyles: ThemeStyles;
  companyPhone?: string;
}

export function Footer({ restaurant, themeStyles, companyPhone }: FooterProps) {
  return (
    <div 
      className="backdrop-blur-md py-8 px-6 sm:px-12 text-center shadow-[inset_0_6px_12px_rgba(0,0,0,0.1),inset_0_-2px_6px_rgba(0,0,0,0.03)]"
      style={{ 
        background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}f8, ${themeStyles.backgroundColor})`,
        borderTop: '1px solid ' + themeStyles.borderColor + '60'
      }}
    >
      <div className="mb-6">
        <SocialLinksCard restaurant={restaurant} />
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-bold" style={{ color: themeStyles.primaryButtonBg }}>
          Digital Solutions
        </h3>

        <p className="text-sm" style={{ color: themeStyles.textColor }}>
          Crafted by <span className="font-semibold">Reynold</span> & <span className="font-semibold">Savio Vaz</span>
        </p>

        <p className="text-sm" style={{ color: themeStyles.textColor }}>
          Powering <span className="font-semibold" style={{ color: themeStyles.primaryButtonBg }}>50+ restaurants</span> • 
          Fast • Modern • Fully Customized
        </p>
      </div>

      <div className="mt-6">
        <MobileAwareCallButton themeColor={themeStyles.primaryButtonBg} phone={companyPhone ?? null} />
      </div>
    </div>
  );
}
