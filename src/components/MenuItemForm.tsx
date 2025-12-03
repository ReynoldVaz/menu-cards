import { useState } from 'react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  section: string;
  ingredients: string;
  image?: string | null;
  video?: string | null;
  dietType?: 'veg' | 'non-veg' | 'vegan';
  is_todays_special: boolean;
  spice_level?: number;
  sweet_level?: number;
}

interface MenuItemFormProps {
  restaurantCode: string;
  onSubmit: (data: MenuItemFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: MenuItemFormData;
  isLoading?: boolean;
  availableSections?: string[];
  onSectionsUpdate?: (sections: string[]) => void;
}

const DEFAULT_SECTIONS = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Soups', 'Breads'];
const DIET_TYPES = [
  { value: 'veg', label: '🥬 Vegetarian', color: 'bg-green-100 text-green-800' },
  { value: 'non-veg', label: '🍗 Non-Vegetarian', color: 'bg-orange-100 text-orange-800' },
  { value: 'vegan', label: '🌱 Vegan', color: 'bg-blue-100 text-blue-800' },
];

export function MenuItemForm({
  restaurantCode,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  availableSections = DEFAULT_SECTIONS,
  onSectionsUpdate,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>(
    initialData 
      ? {
          ...initialData,
          currency: initialData.currency || 'INR',
          dietType: initialData.dietType,
          section: initialData.section || availableSections[0] || DEFAULT_SECTIONS[0],
        }
      : {
          name: '',
          description: '',
          price: 0,
          currency: 'INR',
          section: availableSections[0] || DEFAULT_SECTIONS[0],
          ingredients: '',
          is_todays_special: false,
        }
  );

  const [sections, setSections] = useState<string[]>(availableSections);
  const [newSection, setNewSection] = useState('');
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const [videoPreview, setVideoPreview] = useState<string>(initialData?.video || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string>('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be less than 50MB');
      return;
    }

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }

    setVideoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setVideoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let imageUrl = formData.image;
      let videoUrl = formData.video;

      // Upload image if new file selected
      if (imageFile) {
        setUploadingImage(true);
        const result = await uploadToCloudinary(imageFile, {
          restaurantCode,
          fileType: 'image',
        });
        imageUrl = result.url;
        setUploadingImage(false);
      }

      // Upload video if new file selected
      if (videoFile) {
        setUploadingVideo(true);
        const result = await uploadToCloudinary(videoFile, {
          restaurantCode,
          fileType: 'video',
        });
        videoUrl = result.url;
        setUploadingVideo(false);
      }

      // Validate form
      if (!formData.name.trim()) {
        setError('Item name is required');
        return;
      }

      if (formData.price <= 0) {
        setError('Price must be greater than 0');
        return;
      }

      const submitData: any = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        currency: formData.currency || 'INR',
        section: formData.section,
        ingredients: formData.ingredients,
        is_todays_special: formData.is_todays_special,
      };

      // Only include optional fields if they have values
      if (formData.dietType) submitData.dietType = formData.dietType;
      if (imageUrl) submitData.image = imageUrl;
      if (videoUrl) submitData.video = videoUrl;
      if (formData.spice_level) submitData.spice_level = formData.spice_level;
      if (formData.sweet_level) submitData.sweet_level = formData.sweet_level;

      await onSubmit(submitData as MenuItemFormData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
      setUploadingImage(false);
      setUploadingVideo(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Butter Chicken"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <select
              value={formData.currency || 'INR'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'INR' | 'USD' | 'EUR' | 'GBP' })}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={isLoading}
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section & Vegetarian */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
          <select
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {availableSections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewSectionInput(!showNewSectionInput)}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded font-medium whitespace-nowrap"
            disabled={isLoading}
          >
            + New Section
          </button>
        </div>

        {showNewSectionInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="e.g., Breakfast, Combos"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => {
                if (newSection.trim() && !sections.includes(newSection)) {
                  const updatedSections = [...sections, newSection];
                  setSections(updatedSections);
                  setFormData({ ...formData, section: newSection });
                  setNewSection('');
                  setShowNewSectionInput(false);
                  onSectionsUpdate?.(updatedSections);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              disabled={isLoading || !newSection.trim()}
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Diet Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Diet Type <span className="text-gray-400">(Optional)</span></label>
        <div className="grid grid-cols-3 gap-3">
          {DIET_TYPES.map((diet) => (
            <button
              key={diet.value}
              type="button"
              onClick={() => setFormData({ ...formData, dietType: diet.value as any })}
              className={`px-3 py-2 rounded font-medium transition-all ${
                formData.dietType === diet.value
                  ? `${diet.color} ring-2 ring-offset-1 ring-blue-500`
                  : `${diet.color} opacity-50 hover:opacity-75`
              }`}
              disabled={isLoading}
            >
              {diet.label}
            </button>
          ))}
          {/* Clear Diet Type Button */}
          {formData.dietType && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, dietType: undefined })}
              className="px-3 py-2 rounded font-medium transition-all bg-gray-200 hover:bg-gray-300 text-gray-700"
              disabled={isLoading}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Today's Special */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_todays_special}
            onChange={(e) => setFormData({ ...formData, is_todays_special: e.target.checked })}
            className="w-4 h-4"
            disabled={isLoading}
          />
          <span className="text-sm font-medium text-gray-700">⭐ Mark as Today's Special</span>
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the dish..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
        <textarea
          value={formData.ingredients}
          onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
          placeholder="Comma-separated ingredients"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Spice & Sweet Levels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Flavor Profile (Combined max 5)</label>
        <div className="space-y-4">
          {/* Spice Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">🌶️ Spice</span>
              <span className="text-sm font-semibold text-red-600">{formData.spice_level || 0}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={formData.spice_level || 0}
              onChange={(e) => {
                const newSpice = parseInt(e.target.value);
                const currentSweet = formData.sweet_level || 0;
                // Allow spice level but cap total at 5
                const maxSpice = Math.min(newSpice, 5 - currentSweet);
                setFormData({ ...formData, spice_level: maxSpice });
              }}
              className="w-full"
              disabled={isLoading}
            />
            <div className="text-xs text-red-500 mt-1">
              {Array.from({ length: formData.spice_level || 0 }).map((_, i) => (
                <span key={i}>🌶️</span>
              ))}
            </div>
          </div>

          {/* Sweet Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">🍯 Sweet</span>
              <span className="text-sm font-semibold text-amber-600">{formData.sweet_level || 0}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={formData.sweet_level || 0}
              onChange={(e) => {
                const newSweet = parseInt(e.target.value);
                const currentSpice = formData.spice_level || 0;
                // Allow sweet level but cap total at 5
                const maxSweet = Math.min(newSweet, 5 - currentSpice);
                setFormData({ ...formData, sweet_level: maxSweet });
              }}
              className="w-full"
              disabled={isLoading}
            />
            <div className="text-xs text-amber-600 mt-1">
              {Array.from({ length: formData.sweet_level || 0 }).map((_, i) => (
                <span key={i}>🍯</span>
              ))}
            </div>
          </div>

          {/* Combined Total */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <span className="text-xs text-blue-700 font-medium">
              Total: {(formData.spice_level || 0) + (formData.sweet_level || 0)} / 5
            </span>
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image (max 5MB)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full"
          disabled={isLoading || uploadingImage}
        />
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded" />
          </div>
        )}
      </div>

      {/* Video Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Video (max 50MB)</label>
        <input
          type="file"
          accept="video/*"
          onChange={handleVideoChange}
          className="w-full"
          disabled={isLoading || uploadingVideo}
        />
        {videoPreview && (
          <div className="mt-2">
            <video src={videoPreview} className="w-20 h-20 object-cover rounded" />
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading || uploadingImage || uploadingVideo}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium"
        >
          {isLoading ? '⏳ Saving...' : uploadingImage ? '⏳ Uploading image...' : uploadingVideo ? '⏳ Uploading video...' : '✓ Save Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
