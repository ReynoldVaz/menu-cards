/**
 * ThemePreview Component
 * Shows exact mockup of actual menu with chosen colors
 * Updates instantly without any transitions
 */

import { getThemeStyles } from '../utils/themeUtils';

interface ThemePreviewProps {
  theme: {
    mode: 'light' | 'dark' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
  };
  restaurantName?: string;
}

export function ThemePreview({ theme, restaurantName = 'Flames' }: ThemePreviewProps) {
  const themeStyles = getThemeStyles(theme);

  return (
    <div className="rounded-lg overflow-hidden" style={{
      border: `1px solid ${themeStyles.borderColor}`,
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Header - Exact match to Header.tsx */}
      <div
        className="relative px-6 py-6 sm:px-8 sm:py-8 text-center text-white"
        style={{
          background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
        }}
      >
        <div className="flex justify-center mb-4">
          <div className="text-4xl">🔥</div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          {restaurantName}
        </h1>
        <p
          className="font-light text-xs sm:text-sm tracking-wide"
          style={{ color: `rgba(255, 255, 255, 0.9)` }}
        >
          AUTHENTIC CUISINE
        </p>
      </div>

      {/* Digital Solutions Info - Exact match to App.tsx */}
      <div
        className="py-8 px-6 sm:px-12 text-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderTopWidth: '1px',
          borderTopColor: themeStyles.borderColor,
        }}
      >
        <h3 className="text-xl font-bold" style={{ color: themeStyles.primaryButtonBg }}>
          Digital Solutions
        </h3>
        <p className="text-gray-700 text-sm mt-1">
          Crafted by <span className="font-semibold">Reynold</span> & <span className="font-semibold">Savio Vaz</span>
        </p>
        <p className="text-gray-600 text-sm mt-2">
          Powering <span className="font-semibold" style={{ color: themeStyles.primaryButtonBg }}>50+ restaurants</span> • Fast • Modern • Fully Customized
        </p>
        <button
          className="inline-block text-white mt-4 px-5 py-2 rounded-full text-sm font-medium shadow-md"
          style={{
            backgroundColor: theme.backgroundColor,
            borderColor: theme.primaryColor,
            borderWidth: '2px',
            color: theme.primaryColor,
          }}
        >
          📞 +918698248506
        </button>
      </div>

      {/* Search Bar - Exact match */}
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
            placeholder="🔍 Search dishes, drinks or sections..."
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

      {/* Menu Section - Exact match */}
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
          <h2 className="text-lg font-semibold">Main Course</h2>
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
            <h4 className="font-bold text-sm" style={{ color: themeStyles.textColor }}>
              Butter Mango
            </h4>
            <p className="text-xs text-gray-600 mt-1">Heya</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-bold" style={{ color: theme.primaryColor }}>
                ₹350
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

      {/* Color Legend - Shows all 4 colors */}
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
