/**
 * ThemePreview Component
 * Shows exact mockup of actual menu with chosen colors
 * Updates instantly without any transitions
 */

import { getThemeStyles, getTemplateComponentStyles } from '../utils/themeUtils';
import type { Theme } from '../hooks/useFirebaseRestaurant';
import { formatPrice } from '../utils/formatPrice';

interface ThemePreviewProps {
  theme: Theme & {
    mode: 'light' | 'dark' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  restaurantName?: string;
  logoUrl?: string;
}

export function ThemePreview({ theme, restaurantName = 'Flames', logoUrl }: ThemePreviewProps) {
  const themeStyles = getThemeStyles(theme);
  const templateStyles = getTemplateComponentStyles(theme);

  return (
    <div className="rounded-lg overflow-hidden" style={{
      border: `1px solid ${themeStyles.borderColor}`,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }}>
      {/* HEADER - Top Bar with gradient */}
      <div
        className="relative px-6 py-6 sm:px-8 sm:py-8 text-center flex items-center justify-center"
        style={{
          background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
          minHeight: logoUrl ? '250px' : 'auto',
        }}
      >
        {logoUrl ? (
          /* Logo fills entire header */
          <img 
            src={logoUrl} 
            alt="Restaurant Logo" 
            className="w-full h-full object-cover"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            }}
          />
        ) : (
          /* Original content when no logo */
          <div className="w-full">
            {/* Logo Icon */}
            <div className="flex justify-center mb-4">
              <div 
                className="flex items-center justify-center rounded-full"
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  fontSize: '28px',
                }}
              >
                🔥
              </div>
            </div>
            
            {/* Restaurant Name - using template typography if available */}
            <h1 
              className="tracking-tight mb-2"
              style={{
                color: '#FFFFFF',
                fontSize: templateStyles.typography.restaurantName?.fontSize || '2.5rem',
                fontWeight: templateStyles.typography.restaurantName?.fontWeight || 'bold',
                fontFamily: templateStyles.typography.restaurantName?.fontFamily || 'sans-serif',
                letterSpacing: templateStyles.typography.restaurantName?.letterSpacing || '0px',
              }}
            >
              {restaurantName}
            </h1>
            
            {/* Subtitle */}
            <p
              className="font-light text-xs sm:text-sm tracking-wide"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              AUTHENTIC CUISINE
            </p>
          </div>
        )}
      </div>

      {/* Digital Solutions Section - Top info */}
      <div
        className="py-8 px-6 sm:px-12 text-center backdrop-blur-md shadow-lg"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderTopWidth: '1px',
          borderTopColor: themeStyles.borderColor,
        }}
      >
        <h3 
          className="text-xl font-bold" 
          style={{ color: theme.primaryColor }}
        >
          Digital Solutions
        </h3>
        <p 
          className="text-sm mt-1" 
          style={{ color: themeStyles.textColor }}
        >
          Crafted by <span className="font-semibold">Reynold</span> & <span className="font-semibold">Savio Vaz</span>
        </p>
        <p 
          className="text-sm mt-2" 
          style={{ color: themeStyles.textColor }}
        >
          Powering <span className="font-semibold" style={{ color: theme.primaryColor }}>50+ restaurants</span> • Fast • Modern • Fully Customized
        </p>
        <button
          className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-medium shadow-md"
          style={{
            backgroundColor: theme.backgroundColor,
            borderColor: theme.primaryColor,
            borderWidth: '2px',
            color: theme.primaryColor,
          }}
        >
          ☎️ Contact
        </button>
      </div>

      {/* Search Bar */}
      <div
        className="px-6 py-4 sm:px-10"
        style={{
          backgroundColor: theme.backgroundColor,
          borderBottomWidth: '1px',
          borderBottomColor: themeStyles.borderColor,
        }}
      >
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="🔍 Search dishes..."
            disabled
            className="w-full px-4 py-2 rounded-full text-sm"
            style={{
              backgroundColor: theme.backgroundColor,
              borderColor: theme.primaryColor,
              borderWidth: '1px',
              color: themeStyles.textColor,
            }}
          />
        </div>
      </div>

      {/* Menu Section */}
      <div
        className="px-6 py-4 sm:px-10"
        style={{ backgroundColor: theme.backgroundColor }}
      >
        {/* Section Header */}
        <div
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg shadow-sm"
          style={{
            backgroundColor: themeStyles.accentBg,
            color: theme.backgroundColor,
          }}
        >
          <h2 
            className="font-semibold"
            style={{
              fontSize: templateStyles.typography.sectionHeader?.fontSize || '1.5rem',
              fontWeight: templateStyles.typography.sectionHeader?.fontWeight || 'bold',
            }}
          >
            Main Course
          </h2>
          <span className="text-xl">+</span>
        </div>

        {/* Menu Item Card */}
        <div
          className="p-3 sm:p-4 rounded-lg flex items-center gap-4 mt-4"
          style={{
            backgroundColor: theme.backgroundColor,
            borderWidth: '2px',
            borderColor: theme.accentColor,
          }}
        >
          <div
            className="flex-shrink-0 rounded overflow-hidden border-2 w-16 h-16"
            style={{
              backgroundColor: theme.accentColor,
              borderColor: theme.primaryColor,
            }}
          />
          <div className="flex-1">
            <h4 
              className="font-bold"
              style={{ 
                color: themeStyles.textColor,
                fontSize: templateStyles.typography.itemName?.fontSize || '1.1rem',
              }}
            >
              Butter Mango
            </h4>
            <p className="text-xs text-gray-600 mt-1">Delicious item</p>
            <div className="flex justify-between items-center mt-2">
              <span 
                className="font-bold"
                style={{ 
                  color: theme.primaryColor,
                  fontSize: templateStyles.typography.price?.fontSize || '1.25rem',
                }}
              >
                {formatPrice(350)}
              </span>
              <button
                className="px-3 py-1 rounded text-xs font-semibold text-white"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Buttons Preview */}
      <div
        className="relative px-6 py-6 sm:px-10"
        style={{
          backgroundColor: theme.backgroundColor,
          borderTopColor: themeStyles.borderColor,
          borderTopWidth: '1px',
          minHeight: '200px',
        }}
      >
        <p className="text-xs font-semibold text-gray-600 mb-4">Floating Buttons (as shown in actual UI)</p>
        
        {/* Search Button */}
        <button
          className="absolute right-6 bottom-36 text-white rounded-full shadow-md hover:scale-110 transition-transform z-[40]"
          style={{
            backgroundColor: `rgba(${parseInt(theme.primaryColor.slice(1, 3), 16)}, ${parseInt(theme.primaryColor.slice(3, 5), 16)}, ${parseInt(theme.primaryColor.slice(5, 7), 16)}, 0.85)`,
            padding: '4.5px',
          }}
          title="Search menu"
          aria-label="Search menu"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"></circle>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
          </svg>
        </button>

        {/* Chat Button */}
        <button
          className="absolute bottom-24 right-6 text-white rounded-full shadow-lg hover:scale-110 transition-transform z-50"
          aria-label="Open chat"
          title="Chat with AI"
          style={{
            backgroundColor: `rgba(${parseInt(theme.primaryColor.slice(1, 3), 16)}, ${parseInt(theme.primaryColor.slice(3, 5), 16)}, ${parseInt(theme.primaryColor.slice(5, 7), 16)}, 0.9)`,
            padding: '4.5px',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 3.8.9 8.5 8.5 0 0 1 4.7 7.6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>

        {/* Menu Button */}
        <button
          aria-label="Open menu"
          className="absolute right-6 bottom-6 z-40 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
          title="Open navigation"
          style={{
            backgroundColor: `rgba(${parseInt(theme.primaryColor.slice(1, 3), 16)}, ${parseInt(theme.primaryColor.slice(3, 5), 16)}, ${parseInt(theme.primaryColor.slice(5, 7), 16)}, 0.9)`,
            padding: '4.5px',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </button>

        {/* Info text */}
        <div className="text-left">
          <p className="text-xs text-gray-500 mt-2">
            🔍 <span className="font-semibold">Search:</span> Opens search bar
          </p>
          <p className="text-xs text-gray-500 mt-1">
            💬 <span className="font-semibold">Chat:</span> Opens AI chat assistant
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ☰ <span className="font-semibold">Menu:</span> Opens navigation
          </p>
        </div>
      </div>

      {/* FOOTER - Digital Solutions Section at bottom */}
      <div 
        className="backdrop-blur-md py-8 px-6 sm:px-12 text-center shadow-lg border-t"
        style={{ 
          backgroundColor: theme.backgroundColor,
          borderTopColor: themeStyles.borderColor,
        }}
      >
        <h3 
          className="text-xl font-bold" 
          style={{ color: themeStyles.primaryButtonBg }}
        >
          Digital Solutions
        </h3>

        <p 
          className="text-sm mt-1"
          style={{ color: themeStyles.textColor }}
        >
          Crafted by <span className="font-semibold">Reynold</span> & <span className="font-semibold">Savio Vaz</span>
        </p>

        <p 
          className="text-sm mt-2"
          style={{ color: themeStyles.textColor }}
        >
          Powering <span className="font-semibold" style={{ color: themeStyles.primaryButtonBg }}>50+ restaurants</span> • 
          Fast • Modern • Fully Customized
        </p>

        <button
          className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-medium shadow-md"
          style={{
            backgroundColor: 'transparent',
            borderColor: theme.primaryColor,
            borderWidth: '2px',
            color: theme.primaryColor,
          }}
        >
          ☎️ Contact Us
        </button>
      </div>

      {/* Color Legend */}
      <div
        className="px-6 py-6 sm:px-10 grid grid-cols-4 gap-3"
        style={{
          backgroundColor: theme.accentColor,
          borderTopWidth: '1px',
          borderTopColor: themeStyles.borderColor,
        }}
      >
        <div className="text-center">
          <div
            className="h-10 rounded mb-2"
            style={{ backgroundColor: theme.primaryColor }}
          />
          <p className="text-xs font-semibold text-gray-700">Primary</p>
        </div>
        <div className="text-center">
          <div
            className="h-10 rounded mb-2"
            style={{ backgroundColor: theme.secondaryColor }}
          />
          <p className="text-xs font-semibold text-gray-700">Secondary</p>
        </div>
        <div className="text-center">
          <div
            className="h-10 rounded mb-2 border-2"
            style={{ backgroundColor: 'transparent', borderColor: theme.primaryColor }}
          />
          <p className="text-xs font-semibold text-gray-700">Accent</p>
        </div>
        <div className="text-center">
          <div
            className="h-10 rounded mb-2 border-2"
            style={{ backgroundColor: theme.backgroundColor, borderColor: theme.primaryColor }}
          />
          <p className="text-xs font-semibold text-gray-700">Background</p>
        </div>
      </div>
    </div>
  );
}
