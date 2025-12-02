import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase.config';
import { doc, updateDoc } from 'firebase/firestore';

interface LocationState {
  restaurantId: string;
  userId: string;
}

interface Theme {
  mode: 'light' | 'dark' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const PRESET_THEMES: Record<string, Theme> = {
  orange: {
    mode: 'light',
    primaryColor: '#EA580C',
    secondaryColor: '#FB923C',
    accentColor: '#FED7AA',
  },
  blue: {
    mode: 'light',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6',
    accentColor: '#BFDBFE',
  },
  green: {
    mode: 'light',
    primaryColor: '#15803D',
    secondaryColor: '#4ADE80',
    accentColor: '#DCFCE7',
  },
  purple: {
    mode: 'light',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    accentColor: '#EDE9FE',
  },
  red: {
    mode: 'light',
    primaryColor: '#DC2626',
    secondaryColor: '#EF4444',
    accentColor: '#FEE2E2',
  },
  dark: {
    mode: 'dark',
    primaryColor: '#1F2937',
    secondaryColor: '#374151',
    accentColor: '#6B7280',
  },
};

export function ThemeSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('orange');
  const [customTheme, setCustomTheme] = useState<Theme>(PRESET_THEMES.orange);
  const [useCustom, setUseCustom] = useState(false);

  const currentTheme = useCustom ? customTheme : PRESET_THEMES[selectedPreset];

  const handleColorChange = (colorKey: keyof Omit<Theme, 'mode'>, value: string) => {
    setCustomTheme((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handleSave = async () => {
    if (!state?.restaurantId) {
      alert('Error: Restaurant ID missing');
      return;
    }

    try {
      setLoading(true);
      const restaurantRef = doc(db, 'restaurants', state.restaurantId);
      await updateDoc(restaurantRef, {
        theme: currentTheme,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Theme saved:', currentTheme);

      // Navigate to logo upload (or dashboard)
      navigate('/admin/logo-upload', {
        state: { restaurantId: state.restaurantId, userId: state.userId },
      });
    } catch (err: any) {
      console.error('Error saving theme:', err);
      alert('Failed to save theme: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!state?.restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Error</h2>
          <p className="text-gray-600 mb-6">Session expired. Please start over.</p>
          <button
            onClick={() => navigate('/admin/auth')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg"
          >
            ← Back to Auth
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎨 Choose Your Theme</h2>
        <p className="text-gray-600 text-sm mb-8">Customize how your menu will look to customers</p>

        {/* Preview */}
        <div className="mb-8 p-6 rounded-lg border-2" style={{ borderColor: currentTheme.primaryColor }}>
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-lg"
              style={{ backgroundColor: currentTheme.primaryColor }}
            />
            <div>
              <h3 className="font-bold text-gray-800">Preview</h3>
              <p className="text-sm text-gray-600">Your menu will use these colors</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded" style={{ backgroundColor: currentTheme.primaryColor + '20' }}>
              <p className="text-xs text-gray-600 mb-2">Primary</p>
              <p className="font-mono text-sm text-gray-800">{currentTheme.primaryColor}</p>
            </div>
            <div className="p-4 rounded" style={{ backgroundColor: currentTheme.secondaryColor + '20' }}>
              <p className="text-xs text-gray-600 mb-2">Secondary</p>
              <p className="font-mono text-sm text-gray-800">{currentTheme.secondaryColor}</p>
            </div>
            <div className="p-4 rounded" style={{ backgroundColor: currentTheme.accentColor }}>
              <p className="text-xs text-gray-600 mb-2">Accent</p>
              <p className="font-mono text-sm text-gray-800">{currentTheme.accentColor}</p>
            </div>
          </div>
        </div>

        {/* Preset Themes */}
        {!useCustom && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 mb-4">📌 Preset Themes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedPreset === key ? 'border-gray-800 scale-105' : 'border-gray-200'
                  }`}
                >
                  <div className="flex gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: theme.secondaryColor }}
                    />
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: theme.accentColor }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-700 capitalize">{key}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Theme */}
        <div className="mb-8">
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="font-semibold text-gray-800">✏️ Create Custom Theme</span>
          </label>

          {useCustom && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={customTheme.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customTheme.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={customTheme.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customTheme.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={customTheme.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customTheme.accentColor}
                    onChange={(e) => handleColorChange('accentColor', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {loading ? '⏳ Saving...' : '✓ Continue'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
