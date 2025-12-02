import { useState } from 'react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export interface ThemeRequest {
  restaurantCode: string;
  restaurantName: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  themeName: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl?: string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface ThemeRequestFormProps {
  restaurantCode: string;
  restaurantName: string;
  onSubmit: (data: ThemeRequest) => Promise<void>;
  isLoading?: boolean;
}

export function ThemeRequestForm({ restaurantCode, restaurantName, onSubmit, isLoading = false }: ThemeRequestFormProps) {
  const [formData, setFormData] = useState({
    themeName: '',
    description: '',
    primaryColor: '#FF6B5B',
    secondaryColor: '#4A4A4A',
    accentColor: '#F5EDE3',
    backgroundColor: '#FFFFFF',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!formData.themeName.trim()) {
        setError('Theme name is required');
        return;
      }

      if (!formData.description.trim()) {
        setError('Description is required');
        return;
      }

      let logoUrl: string | undefined;

      if (logoFile) {
        setUploadingLogo(true);
        const result = await uploadToCloudinary(logoFile, {
          restaurantCode,
          fileType: 'logo',
        });
        logoUrl = result.url;
        setUploadingLogo(false);
      }

      const themeRequest: ThemeRequest = {
        restaurantCode,
        restaurantName,
        requestedBy: restaurantCode,
        status: 'pending',
        themeName: formData.themeName,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        backgroundColor: formData.backgroundColor,
        requestedAt: new Date().toISOString(),
      };

      // Only add logoUrl if it exists
      if (logoUrl) {
        (themeRequest as any).logoUrl = logoUrl;
      }

      await onSubmit(themeRequest);
      setSuccess('Theme request submitted successfully! Awaiting master admin review.');
      setFormData({
        themeName: '',
        description: '',
        primaryColor: '#FF6B5B',
        secondaryColor: '#4A4A4A',
        accentColor: '#F5EDE3',
        backgroundColor: '#FFFFFF',
      });
      setLogoFile(null);
      setLogoPreview('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit theme request');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Theme Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name *</label>
        <input
          type="text"
          value={formData.themeName}
          onChange={(e) => setFormData({ ...formData, themeName: e.target.value })}
          placeholder="e.g., Juju Restaurant Theme"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || uploadingLogo}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your theme request and any special details..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || uploadingLogo}
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Logo (Optional, max 2MB)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="w-full"
          disabled={isLoading || uploadingLogo}
        />
        {logoPreview && (
          <div className="mt-2">
            <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-contain rounded" />
          </div>
        )}
      </div>

      {/* Color Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Color Scheme</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Primary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
                disabled={isLoading}
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Secondary Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
                disabled={isLoading}
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Accent Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
                disabled={isLoading}
              />
              <input
                type="text"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
                disabled={isLoading}
              />
              <input
                type="text"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Color Preview with Logo */}
        <div className="p-4 rounded-lg border-2 border-gray-300 space-y-3">
          <div className="text-xs font-medium text-gray-700">Live Theme Preview</div>

          {/* Header Container with Logo */}
          <div
            className="p-4 rounded-lg flex items-center gap-4 h-24"
            style={{ backgroundColor: formData.primaryColor }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo Preview" className="h-16 w-16 object-contain rounded bg-white/20 p-2" />
            ) : (
              <div className="h-16 w-16 rounded bg-white/20 flex items-center justify-center text-white text-2xl">
                🏪
              </div>
            )}
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{restaurantName}</p>
              <p className="text-white/80 text-xs">{formData.themeName || 'Theme Name'}</p>
            </div>
          </div>

          {/* Color Swatches */}
          <div className="flex gap-2">
            <div
              className="flex-1 h-12 rounded flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: formData.primaryColor }}
            >
              Primary
            </div>
            <div
              className="flex-1 h-12 rounded flex items-center justify-center text-white text-xs font-semibold"
              style={{ backgroundColor: formData.secondaryColor }}
            >
              Secondary
            </div>
            <div
              className="flex-1 h-12 rounded flex items-center justify-center text-gray-800 text-xs font-semibold"
              style={{ backgroundColor: formData.accentColor }}
            >
              Accent
            </div>
            <div
              className="flex-1 h-12 rounded flex items-center justify-center text-gray-800 text-xs font-semibold border border-gray-300"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              Background
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || uploadingLogo}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium"
      >
        {isLoading ? '⏳ Submitting...' : uploadingLogo ? '⏳ Uploading logo...' : '✓ Submit Theme Request'}
      </button>
    </form>
  );
}
