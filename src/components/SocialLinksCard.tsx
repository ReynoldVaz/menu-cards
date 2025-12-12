// no-op import removed
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { useThemeStyles } from '../context/useThemeStyles';
import { FaInstagram, FaFacebook, FaYoutube, FaPhone } from 'react-icons/fa';
import { FiGlobe } from 'react-icons/fi';
import { SiGoogle } from 'react-icons/si';

interface SocialLinksCardProps {
  restaurant: Restaurant | null;
}

export function SocialLinksCard({ restaurant }: SocialLinksCardProps) {
  const themeStyles = useThemeStyles();
  if (!restaurant) return null;

  const IconInstagram = () => <FaInstagram size={18} aria-hidden />;
  const IconFacebook = () => <FaFacebook size={18} aria-hidden />;
  const IconYouTube = () => <FaYoutube size={18} aria-hidden />;
  const IconWebsite = () => <FiGlobe size={18} aria-hidden />;
  const IconGoogle = () => <SiGoogle size={18} aria-hidden />;
  const IconPhone = () => <FaPhone size={18} aria-hidden />;

  const links = [
    { key: 'phone' as const, label: 'Call', icon: <IconPhone />, url: restaurant.contactPhone ? `tel:${restaurant.contactPhone.replace(/\s|\(|\)|-/g, '')}` : undefined, bg: '#E5FFE5' },
    { key: 'instagram' as const, label: 'Instagram', icon: <IconInstagram />, url: restaurant.instagram, bg: '#FCE7F3' },
    { key: 'facebook' as const, label: 'Facebook', icon: <IconFacebook />, url: restaurant.facebook, bg: '#DBEAFE' },
    { key: 'youtube' as const, label: 'YouTube', icon: <IconYouTube />, url: restaurant.youtube, bg: '#FEE2E2' },
    { key: 'website' as const, label: 'Website', icon: <IconWebsite />, url: restaurant.website, bg: '#E5E7EB' },
    { key: 'googleReviews' as const, label: 'Google Reviews', icon: <IconGoogle />, url: restaurant.googleReviews, bg: '#FEF3C7' },
  ].filter((l) => !!l.url);

  if (links.length === 0) return null;

  return (
    <div
      className="mx-auto max-w-md rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.08),-6px_-6px_12px_rgba(255,255,255,0.8)] p-4"
      style={{ 
        background: `linear-gradient(to bottom, ${themeStyles.backgroundColor}, ${themeStyles.backgroundColor}f5)`,
        border: `1px solid ${themeStyles.borderColor}60` 
      }}
    >
      <div className="mb-3 text-center font-medium text-gray-600 text-sm">
        Connect with {restaurant.name}
      </div>
      <div className="flex flex-nowrap items-center justify-center gap-3 overflow-x-auto no-scrollbar">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.url!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full text-base shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)] transition-all"
            style={{
              background: `linear-gradient(to bottom, ${l.bg}, ${l.bg}dd)`,
              color: themeStyles.primaryButtonBg,
              border: `1px solid ${themeStyles.borderColor}40`,
            }}
          >
            <span aria-label={l.label} title={l.label}>{l.icon}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
