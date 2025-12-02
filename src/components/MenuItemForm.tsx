import { useState } from 'react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  section: string;
  ingredients: string;
  image?: string;
  video?: string;
  is_todays_special: boolean;
  spice_level?: number;
  is_vegetarian: boolean;
}

interface MenuItemFormProps {
  restaurantCode: string;
  onSubmit: (data: MenuItemFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: MenuItemFormData;
  isLoading?: boolean;
}

const SECTIONS = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Soups', 'Breads'];

export function MenuItemForm({
  restaurantCode,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: MenuItemFormProps) {
  const [formData, setFormData] = useState<MenuItemFormData>(
    initialData || {
      name: '',
      description: '',
      price: 0,
      section: SECTIONS[0],
      ingredients: '',
      is_todays_special: false,
      is_vegetarian: false,
    }
  );

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

      await onSubmit({
        ...formData,
        image: imageUrl,
        video: videoUrl,
      });
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
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
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
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_vegetarian}
              onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
              className="w-4 h-4"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">Vegetarian</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_todays_special}
              onChange={(e) => setFormData({ ...formData, is_todays_special: e.target.checked })}
              className="w-4 h-4"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">Today's Special</span>
          </label>
        </div>
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

      {/* Spice Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Spice Level (1-5)</label>
        <input
          type="range"
          min="1"
          max="5"
          value={formData.spice_level || 2}
          onChange={(e) => setFormData({ ...formData, spice_level: parseInt(e.target.value) })}
          className="w-full"
          disabled={isLoading}
        />
        <div className="text-xs text-gray-600 mt-1">
          Level: {formData.spice_level || 2} {['🌶️', '🌶️🌶️', '🌶️🌶️🌶️', '🌶️🌶️🌶️🌶️', '🌶️🌶️🌶️🌶️🌶️'][
            (formData.spice_level || 2) - 1
          ]}
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
