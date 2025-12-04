// no-op import removed
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { useThemeStyles } from '../context/useThemeStyles';
import { FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';
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

  const links = [
    { key: 'instagram' as const, label: 'Instagram', icon: <IconInstagram />, url: restaurant.instagram, bg: '#FCE7F3' },
    { key: 'facebook' as const, label: 'Facebook', icon: <IconFacebook />, url: restaurant.facebook, bg: '#DBEAFE' },
    { key: 'youtube' as const, label: 'YouTube', icon: <IconYouTube />, url: restaurant.youtube, bg: '#FEE2E2' },
    { key: 'website' as const, label: 'Website', icon: <IconWebsite />, url: restaurant.website, bg: '#E5E7EB' },
    { key: 'googleReviews' as const, label: 'Google Reviews', icon: <IconGoogle />, url: restaurant.googleReviews, bg: '#FEF3C7' },
  ].filter((l) => !!l.url);

  if (links.length === 0) return null;

  return (
    <div
      className="mx-6 sm:mx-10 mb-8 rounded-lg shadow p-4"
      style={{ backgroundColor: themeStyles.backgroundColor, border: `1px solid ${themeStyles.borderColor}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold" style={{ color: themeStyles.textColor }}>
          Connect with {restaurant.name}
        </h4>
      </div>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <a
            key={l.key}
            href={l.url!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full text-base"
            style={{
              backgroundColor: l.bg,
              color: themeStyles.primaryButtonBg,
              border: `1px solid ${themeStyles.borderColor}`,
            }}
          >
            <span aria-label={l.label} title={l.label}>{l.icon}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
