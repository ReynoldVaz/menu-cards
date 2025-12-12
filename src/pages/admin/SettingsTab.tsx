import { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, getDocs, doc, updateDoc, query, where, deleteField } from 'firebase/firestore';
import type { Restaurant } from '../../hooks/useFirebaseRestaurant';
import { ThemePreview } from '../../components/ThemePreview';
import { TEMPLATES, TEMPLATE_NAMES, TEMPLATE_DESCRIPTIONS, getTemplateColors, type TemplateType } from '../../utils/templateStyles';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

interface SettingsTabProps {
  restaurant: Restaurant;
  onUpdate: () => void;
}

export function SettingsTab({ restaurant, onUpdate }: SettingsTabProps) {
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description || '');
  const [phone, setPhone] = useState(restaurant.phone || '');
  const [contactPhone, setContactPhone] = useState(restaurant.contactPhone || '');
  const [email, setEmail] = useState(restaurant.email || '');
  const [instagram, setInstagram] = useState(restaurant.instagram || '');
  const [facebook, setFacebook] = useState(restaurant.facebook || '');
  const [youtube, setYoutube] = useState(restaurant.youtube || '');
  const [website, setWebsite] = useState(restaurant.website || '');
  const [googleReviews, setGoogleReviews] = useState(restaurant.googleReviews || '');
  const [captureCustomerPhone, setCaptureCustomerPhone] = useState<boolean>(restaurant.captureCustomerPhone || false);
  const [enableAnalytics, setEnableAnalytics] = useState<boolean>(restaurant.enableAnalytics ?? false);
  const [themeMode, setThemeMode] = useState(restaurant.theme?.mode || 'custom');
  const [primaryColor, setPrimaryColor] = useState(restaurant.theme?.primaryColor || '#EA580C');
  const [secondaryColor, setSecondaryColor] = useState(restaurant.theme?.secondaryColor || '#FB923C');
  const [accentColor, setAccentColor] = useState(restaurant.theme?.accentColor || '#FED7AA');
  const [backgroundColor, setBackgroundColor] = useState(restaurant.theme?.backgroundColor || '#FFFFFF');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    (restaurant.theme?.template as TemplateType) || 'modern'
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string>('');
  const [approvedThemes, setApprovedThemes] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(restaurant.logo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [contactPhoneError, setContactPhoneError] = useState<string>('');

  function isValidPhone(input: string) {
    if (!input) return true; // allow empty
    const cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) return false; // require at least 10 digits
    return /^[+0-9 ()-]+$/.test(input);
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    setPhoneError(isValidPhone(value) ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
  }

  function handleContactPhoneChange(value: string) {
    setContactPhone(value);
    setContactPhoneError(isValidPhone(value) ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
  }

  // Load approved custom themes for this restaurant
  useEffect(() => {
    async function loadApprovedThemes() {
      try {
        const themeReqRef = collection(db, 'theme_requests');
        const q = query(
          themeReqRef,
          where('restaurantCode', '==', restaurant.restaurantCode),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(q);
        const themes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApprovedThemes(themes);
      } catch (err) {
        console.error('Failed to load approved themes:', err);
      }
    }

    if (restaurant.restaurantCode) {
      loadApprovedThemes();
    }
  }, [restaurant.restaurantCode]);

  const templateColors = getTemplateColors(selectedTemplate);

  const currentTheme = {
    mode: themeMode as 'light' | 'dark' | 'custom',
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    template: selectedTemplate,
    ...TEMPLATES[selectedTemplate],
  };

  async function handleSave() {
    try {
      setSaving(true);
      
      let logoUrl = logoPreview;
      
      // Upload logo if a new file was selected
      if (logoFile) {
        setUploadingLogo(true);
        const result = await uploadToCloudinary(logoFile, {
          restaurantCode: restaurant.restaurantCode || '',
          fileType: 'logo',
        });
        logoUrl = result.url;
        setUploadingLogo(false);
      }
      const updates: any = {
        name,
        description,
        phone,
        email,
        theme: currentTheme,
      };
      if (logoFile && logoUrl) {
        updates.logo = logoUrl;
      } else if (removeLogo) {
        updates.logo = deleteField();
      }

      await updateDoc(doc(db, 'restaurants', restaurant.id), updates);
      onUpdate();
      setSavedNotice('Saved successfully');
      setTimeout(() => setSavedNotice(''), 1000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails() {
    try {
      // Validate phone numbers
      const phoneOk = isValidPhone(phone);
      const contactOk = isValidPhone(contactPhone);
      setPhoneError(phoneOk ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
      setContactPhoneError(contactOk ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
      if (!phoneOk || !contactOk) {
        return;
      }
      setSaving(true);
      let logoUrl = logoPreview;
      if (logoFile) {
        setUploadingLogo(true);
        const result = await uploadToCloudinary(logoFile, {
          restaurantCode: restaurant.restaurantCode || '',
          fileType: 'logo',
        });
        logoUrl = result.url;
        setUploadingLogo(false);
      }
      const updates: any = {
        name,
        description,
        phone,
        email,
        instagram: instagram || null,
        facebook: facebook || null,
        youtube: youtube || null,
        website: website || null,
        googleReviews: googleReviews || null,
        contactPhone: contactPhone || null,
        captureCustomerPhone: Boolean(captureCustomerPhone),
        enableAnalytics: Boolean(enableAnalytics),
      };
      if (logoFile && logoUrl) {
        updates.logo = logoUrl;
      } else if (removeLogo) {
        updates.logo = deleteField();
      }

      await updateDoc(doc(db, 'restaurants', restaurant.id), updates);
      onUpdate();
      setSavedNotice('Details saved');
      setTimeout(() => setSavedNotice(''), 1000);
    } catch (err) {
      console.error('Failed to save details:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo must be less than 5MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  }

  function applyColorCombination(combination: ReturnType<typeof getTemplateColors>[0]) {
    setPrimaryColor(combination.primary);
    setSecondaryColor(combination.secondary);
    setAccentColor(combination.accent);
    setBackgroundColor(combination.background);
    setThemeMode('custom');
  }

  function applySeasonalTheme(name: 'christmas') {
    if (name === 'christmas') {
      setPrimaryColor('#C62828'); // rich red
      setSecondaryColor('#2E7D32'); // evergreen
      setAccentColor('#FFD54F'); // warm gold
      setBackgroundColor('#0b1020'); // deep night sky
      setThemeMode('custom');
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
        
        {/* Restaurant Details */}
        <div className="space-y-4 pb-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Restaurant Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-shadow h-24"
            />
          </div>
          {/* Enable Analytics Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enable Analytics</label>
            <div className="flex items-center gap-2">
              <input
                id="enableAnalytics"
                type="checkbox"
                checked={enableAnalytics}
                onChange={e => setEnableAnalytics(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={saving}
              />
              <label htmlFor="enableAnalytics" className="text-sm text-gray-700">
                Track menu item clicks and show analytics for this restaurant
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone (private)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {phoneError && (<p className="text-xs text-red-600 mt-1">{phoneError}</p>)}
            <p className="text-xs text-gray-500 mt-1">Not shown on menu. Used for admin notifications.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Social Links (compact) */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Social & Web Links</label>
            <p className="text-xs text-gray-500">Click a platform to reveal its input.</p>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Instagram</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://instagram.com/yourhandle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Full profile URL (optional)</p>
                  {instagram && (
                    <button
                      type="button"
                      onClick={() => setInstagram('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear Instagram link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Public Contact Number</summary>
              <div className="mt-3">
                <input
                  type="tel"
                  placeholder="e.g. +1 555 123 4567"
                  value={contactPhone}
                  onChange={(e) => handleContactPhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {contactPhoneError && (<p className="text-xs text-red-600 mt-1">{contactPhoneError}</p>)}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Shown on the public menu. Tap-to-call on mobile.</p>
                  {contactPhone && (
                    <button
                      type="button"
                      onClick={() => setContactPhone('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear contact number"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Facebook</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Full page URL (optional)</p>
                  {facebook && (
                    <button
                      type="button"
                      onClick={() => setFacebook('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear Facebook link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">YouTube</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Channel or video URL (optional)</p>
                  {youtube && (
                    <button
                      type="button"
                      onClick={() => setYoutube('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear YouTube link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Website</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://www.yourrestaurant.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Official website URL (optional)</p>
                  {website && (
                    <button
                      type="button"
                      onClick={() => setWebsite('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear website link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Google Reviews Page</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://www.google.com/maps/place/..."
                  value={googleReviews}
                  onChange={(e) => setGoogleReviews(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Link to your Google Business reviews page (optional)</p>
                  {googleReviews && (
                    <button
                      type="button"
                      onClick={() => setGoogleReviews('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear Google Reviews link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>
            {/* Customer phone capture opt-in – moved below Social links */}
            <div className="flex items-start gap-3 p-3 border rounded">
              <input
                id="captureCustomerPhone"
                type="checkbox"
                className="mt-1"
                checked={captureCustomerPhone}
                onChange={(e) => setCaptureCustomerPhone(e.target.checked)}
              />
              <label htmlFor="captureCustomerPhone" className="text-sm text-gray-700">
                Enable phone collection prompt for customers scanning the QR. If enabled, visitors will see a dialog asking to provide their phone number to receive updates. They can skip this.
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Logo (Optional, max 5MB)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full"
              disabled={uploadingLogo || saving}
            />
            {logoPreview && (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Logo Preview:</p>
                <div className="flex items-center gap-4">
                  <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-contain rounded border border-gray-300" />
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(''); setRemoveLogo(true); }}
                    disabled={saving || uploadingLogo}
                    className="px-3 py-2 text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                    title="Remove current logo"
                  >
                    Remove Logo
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="pt-2 flex flex-col items-center gap-2">
            {savedNotice && (
              <div className="text-green-700 bg-green-100 border border-green-200 rounded px-3 py-1 text-sm animate-fade">
                {savedNotice}
              </div>
            )}
            <button
              onClick={handleSaveDetails}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="pt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🎨 Theme Customization</h3>
          <p className="text-sm text-gray-600 mb-6">Choose a template style and customize colors. Changes update instantly in the preview below.</p>
          
          {/* Templates Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">📱 Design Templates</label>
            <p className="text-xs text-gray-600 mb-4">Each template has different typography, button styles, and icon designs</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(TEMPLATES) as TemplateType[]).map((templateKey) => (
                <button
                  key={templateKey}
                  onClick={() => setSelectedTemplate(templateKey)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === templateKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-800">
                    {TEMPLATE_NAMES[templateKey]}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {TEMPLATE_DESCRIPTIONS[templateKey]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Approved Custom Themes */}
          {approvedThemes.length > 0 && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">✅ Your Approved Custom Themes</h4>
              <p className="text-xs text-green-800 mb-4">These custom themes were approved by the master admin and are ready to use!</p>
              <div className="space-y-3">
                {approvedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setPrimaryColor(theme.primaryColor);
                      setSecondaryColor(theme.secondaryColor);
                      setAccentColor(theme.accentColor);
                      setBackgroundColor(theme.backgroundColor);
                      setThemeMode('custom');
                    }}
                    className="w-full p-4 rounded-lg border-2 border-green-300 hover:bg-green-100 transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      {theme.logoUrl && (
                        <img src={theme.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded bg-white p-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{theme.themeName}</div>
                        <p className="text-xs text-gray-600 mt-1">{theme.description}</p>
                        <div className="flex gap-2 mt-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.primaryColor }}
                            title={`Primary: ${theme.primaryColor}`}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.secondaryColor }}
                            title={`Secondary: ${theme.secondaryColor}`}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.accentColor }}
                            title={`Accent: ${theme.accentColor}`}
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.backgroundColor }}
                            title={`Background: ${theme.backgroundColor}`}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template Color Combinations */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">🎨 Color Combinations for {TEMPLATE_NAMES[selectedTemplate]}</label>
            <p className="text-xs text-gray-600 mb-4">Click any color combination to apply all 4 colors instantly</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templateColors.map((combo) => (
                <button
                  key={combo.name}
                  onClick={() => applyColorCombination(combo)}
                  className="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{combo.emoji}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{combo.name}</div>
                      <div className="text-xs text-gray-600">Color combination preset</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-10 rounded"
                      style={{ backgroundColor: combo.primary }}
                      title={`Primary: ${combo.primary}`}
                    ></div>
                    <div
                      className="flex-1 h-10 rounded"
                      style={{ backgroundColor: combo.secondary }}
                      title={`Secondary: ${combo.secondary}`}
                    ></div>
                    <div
                      className="flex-1 h-10 rounded"
                      style={{ backgroundColor: combo.accent }}
                      title={`Accent: ${combo.accent}`}
                    ></div>
                    <div
                      className="flex-1 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: combo.background }}
                      title={`Background: ${combo.background}`}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seasonal Themes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">🎄 Seasonal Themes</label>
            <p className="text-xs text-gray-600 mb-4">Apply festive presets for special occasions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => applySeasonalTheme('christmas')}
                className="p-4 rounded-lg border-2 border-gray-300 hover:border-green-500 transition-all hover:shadow-md text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎅</span>
                  <div>
                    <div className="font-semibold text-gray-800">Christmas</div>
                    <div className="text-xs text-gray-600">Red • Green • Gold • Night Sky</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded" style={{ backgroundColor: '#C62828' }} title="Primary: #C62828"></div>
                  <div className="flex-1 h-10 rounded" style={{ backgroundColor: '#2E7D32' }} title="Secondary: #2E7D32"></div>
                  <div className="flex-1 h-10 rounded" style={{ backgroundColor: '#FFD54F' }} title="Accent: #FFD54F"></div>
                  <div className="flex-1 h-10 rounded border border-gray-300" style={{ backgroundColor: '#0b1020' }} title="Background: #0b1020"></div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Colors */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">Custom Colors</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">📱 Live Preview</label>
            <p className="text-xs text-gray-600 mb-3">This shows exactly how your menu will look to customers</p>
            <ThemePreview theme={currentTheme} restaurantName={name || 'Your Restaurant'} logoUrl={logoPreview} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      {savedNotice && (
        <div className="mt-2 text-center text-green-700 bg-green-100 border border-green-200 rounded px-3 py-1 text-sm animate-fade">
          {savedNotice}
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? 'Saving...' : 'Save Theme Settings'}
      </button>
    </div>
  );
}
