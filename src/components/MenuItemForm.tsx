import { useRef, useState } from 'react';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  section: string;
  ingredients: string;
  image?: string | null;
  images?: string[] | null;
  video?: string | null;
  videos?: string[] | null;
  dietType?: 'veg' | 'non-veg' | 'vegan';
  is_todays_special: boolean;
  is_unavailable?: boolean;
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
          is_unavailable: false,
        }
  );

  const [sections, setSections] = useState<string[]>(availableSections);
  const [newSection, setNewSection] = useState('');
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    (initialData?.images && initialData.images.length > 0)
      ? initialData.images
      : (initialData?.image ? [initialData.image] : [])
  );
  const [videoPreviews, setVideoPreviews] = useState<string[]>(
    (initialData?.videos && initialData.videos.length > 0)
      ? initialData.videos
      : (initialData?.video ? [initialData.video] : [])
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [videoError, setVideoError] = useState<string>('');
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);
  const [replacingVideoIndex, setReplacingVideoIndex] = useState<number | null>(null);
  const videoReplaceInputRef = useRef<HTMLInputElement>(null);
  const imageReplaceInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 3;
  const MAX_VIDEOS = 2;
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB per image
  const MAX_VIDEO_SIZE = 2.5 * 1024 * 1024; // 2.5MB per video
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB combined

  const validateTotalSize = (imgs: File[], vids: File[]) => {
    const total = [...imgs, ...vids]
      .filter((f) => !!f)
      .reduce((sum, f) => sum + (f?.size || 0), 0);
    if (total > MAX_TOTAL_SIZE) {
      throw new Error('Total media must be under 10MB per item');
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // If replacing a specific image
    if (replacingImageIndex !== null) {
      const file = files[0]; // Take only the first file for replacement
        if (!file.type.startsWith('image/')) {
          setImageError('Please select an image file');
        if (imageReplaceInputRef.current) {
          imageReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }
        if (file.size > MAX_IMAGE_SIZE) {
          setImageError('Each image must be under 2MB');
        if (imageReplaceInputRef.current) {
          imageReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }

      const newImageFiles = [...imageFiles];
      // Ensure array can hold replacement at this index
      if (replacingImageIndex >= newImageFiles.length) {
        const padding = new Array(replacingImageIndex - newImageFiles.length + 1).fill(undefined as any);
        newImageFiles.push(...padding);
      }
      newImageFiles[replacingImageIndex] = file;

      try {
        validateTotalSize(newImageFiles, videoFiles);
      } catch (err) {
          setImageError(err instanceof Error ? err.message : 'Total size too large');
        if (imageReplaceInputRef.current) {
          imageReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }

      setImageError('');
      setImageFiles(newImageFiles);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => {
          const newPreviews = [...prev];
          newPreviews[replacingImageIndex!] = event.target?.result as string;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);
      setReplacingImageIndex(null);
      return;
    }

    // Normal add mode
    if (files.length + imageFiles.length > MAX_IMAGES) {
        setImageError(`You can select up to ${MAX_IMAGES} images`);
      (e.target as HTMLInputElement).value = '';
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
          setImageError('Please select only image files');
        (e.target as HTMLInputElement).value = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
          setImageError('Each image must be under 2MB');
        (e.target as HTMLInputElement).value = '';
        return;
      }
    }

    try {
      validateTotalSize([...imageFiles, ...files], videoFiles);
    } catch (err) {
        setImageError(err instanceof Error ? err.message : 'Total size too large');
      (e.target as HTMLInputElement).value = '';
      return;
    }

    setImageError('');
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration || 0);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to read video metadata'));
      };
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleVideosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // If replacing a specific video
    if (replacingVideoIndex !== null) {
      const file = files[0]; // Take only the first file for replacement
      if (!file.type.startsWith('video/')) {
        setVideoError('Please select a video file');
        if (videoReplaceInputRef.current) {
          videoReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }
      if (file.size > MAX_VIDEO_SIZE) {
        setVideoError('Each video must be under 2.5MB');
        // Reset input so user can re-select
        if (videoReplaceInputRef.current) {
          videoReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }
      try {
        const duration = await getVideoDuration(file);
        if (duration < 4.5 || duration > 6.5) {
          setVideoError('Each video must be 5-6 seconds long');
          if (videoReplaceInputRef.current) {
            videoReplaceInputRef.current.value = '';
          }
          (e.target as HTMLInputElement).value = '';
          return;
        }
      } catch (err) {
        setVideoError('Unable to validate video duration');
        if (videoReplaceInputRef.current) {
          videoReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }

      const newVideoFiles = [...videoFiles];
      // Ensure array can hold replacement at this index
      if (replacingVideoIndex >= newVideoFiles.length) {
        const padding = new Array(replacingVideoIndex - newVideoFiles.length + 1).fill(undefined as any);
        newVideoFiles.push(...padding);
      }
      newVideoFiles[replacingVideoIndex] = file;

      try {
        validateTotalSize(imageFiles, newVideoFiles);
      } catch (err) {
        setVideoError(err instanceof Error ? err.message : 'Total size too large');
        if (videoReplaceInputRef.current) {
          videoReplaceInputRef.current.value = '';
        }
        (e.target as HTMLInputElement).value = '';
        return;
      }

      setVideoError('');
      setVideoFiles(newVideoFiles);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoPreviews((prev) => {
          const newPreviews = [...prev];
          newPreviews[replacingVideoIndex!] = event.target?.result as string;
          return newPreviews;
        });
      };
      reader.readAsDataURL(file);
      setReplacingVideoIndex(null);
      return;
    }

    // Normal add mode
    if (files.length + videoFiles.length > MAX_VIDEOS) {
      setVideoError(`You can select up to ${MAX_VIDEOS} videos`);
      (e.target as HTMLInputElement).value = '';
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        setVideoError('Please select only video files');
        (e.target as HTMLInputElement).value = '';
        return;
      }
      if (file.size > MAX_VIDEO_SIZE) {
        setVideoError('Each video must be under 2.5MB');
        (e.target as HTMLInputElement).value = '';
        return;
      }
      try {
        const duration = await getVideoDuration(file);
        if (duration < 4.5 || duration > 6.5) {
          setVideoError('Each video must be 5-6 seconds long');
          (e.target as HTMLInputElement).value = '';
          return;
        }
      } catch (err) {
        setVideoError('Unable to validate video duration');
        (e.target as HTMLInputElement).value = '';
        return;
      }
    }

    try {
      validateTotalSize(imageFiles, [...videoFiles, ...files]);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : 'Total size too large');
      if (videoReplaceInputRef.current) {
        videoReplaceInputRef.current.value = '';
      }
      (e.target as HTMLInputElement).value = '';
      return;
    }

    setVideoError('');
    setVideoFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setVideoPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startReplaceVideo = (index: number) => {
    setReplacingVideoIndex(index);
    videoReplaceInputRef.current?.click();
  };

  const startReplaceImage = (index: number) => {
    setReplacingImageIndex(index);
    imageReplaceInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let imageUrl = formData.image || (formData.images?.[0] ?? undefined);
      let videoUrl = formData.video || (formData.videos?.[0] ?? undefined);
      let uploadedImageUrls: string[] = formData.images ? [...formData.images] : [];
      let uploadedVideoUrls: string[] = formData.videos ? [...formData.videos] : [];

      if (imageFiles.length > 0) {
        setUploadingImage(true);
        const newUrls: string[] = [];
        for (const file of imageFiles) {
          const result = await uploadToCloudinary(file, {
            restaurantCode,
            fileType: 'image',
          });
          newUrls.push(result.url);
        }
        uploadedImageUrls = [...uploadedImageUrls, ...newUrls].slice(0, MAX_IMAGES);
        imageUrl = uploadedImageUrls[0];
        setUploadingImage(false);
      }

      if (videoFiles.length > 0) {
        setUploadingVideo(true);
        const newUrls: string[] = [];
        for (const file of videoFiles) {
          const result = await uploadToCloudinary(file, {
            restaurantCode,
            fileType: 'video',
          });
          newUrls.push(result.url);
        }
        uploadedVideoUrls = [...uploadedVideoUrls, ...newUrls].slice(0, MAX_VIDEOS);
        videoUrl = uploadedVideoUrls[0];
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
        is_unavailable: Boolean(formData.is_unavailable),
      };

      // Only include optional fields if they have values
      if (formData.dietType) submitData.dietType = formData.dietType;
      if (imageUrl) submitData.image = imageUrl;
      if (videoUrl) submitData.video = videoUrl;
      if (uploadedImageUrls && uploadedImageUrls.length > 0) submitData.images = uploadedImageUrls.slice(0, MAX_IMAGES);
      if (uploadedVideoUrls && uploadedVideoUrls.length > 0) submitData.videos = uploadedVideoUrls.slice(0, MAX_VIDEOS);
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

      {/* Availability (Currently Unavailable) */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(formData.is_unavailable)}
            onChange={(e) => setFormData({ ...formData, is_unavailable: e.target.checked })}
            className="w-4 h-4"
            disabled={isLoading}
          />
          <span className="text-sm font-medium text-gray-700">⚠️ Currently Unavailable</span>
        </label>
        <p className="text-xs text-gray-500 ml-6">Check to mark item unavailable. If unchecked, saved as false.</p>
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

      {/* Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Images (up to 3, 2MB each) 
          <span className="text-xs text-gray-500 ml-2">({imagePreviews.length}/{MAX_IMAGES})</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">PNG/JPG preferred. Total media (images+videos) must be under 10MB.</p>
        
        {imageError && (
          <div className="mb-2 text-xs bg-red-100 border border-red-300 text-red-700 px-2 py-1 rounded">
            {imageError}
          </div>
        )}
        {imagePreviews.length < MAX_IMAGES && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="w-full mb-2"
            disabled={isLoading || uploadingImage || replacingImageIndex !== null}
          />
        )}
        {/* Hidden single-file input used for reliable image replacement */}
        <input
          ref={imageReplaceInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagesChange}
          className="hidden"
        />
        
        {imagePreviews.length >= MAX_IMAGES && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded mb-2">
            ⚠️ Maximum {MAX_IMAGES} images reached. Click on an image to replace it.
          </div>
        )}

        {imagePreviews.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {imagePreviews.slice(0, MAX_IMAGES).map((src, idx) => (
              <div key={idx} className="relative group">
                <img src={src} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded border-2 border-gray-300" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => startReplaceImage(idx)}
                    className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-xs px-2 py-1 rounded transition-opacity"
                    disabled={isLoading || uploadingImage}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white text-xs px-2 py-1 rounded transition-opacity ml-1"
                    disabled={isLoading || uploadingImage}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Videos Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Videos (up to 2, 5-6s, 2.5MB each)
          <span className="text-xs text-gray-500 ml-2">({videoPreviews.length}/{MAX_VIDEOS})</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">MP4/WebM/MOV. Each video 5–6 seconds. Total media under 10MB.</p>
        
        {videoError && (
          <div className="mb-2 text-xs bg-red-100 border border-red-300 text-red-700 px-2 py-1 rounded">
            {videoError}
          </div>
        )}
        {videoPreviews.length < MAX_VIDEOS && (
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideosChange}
            className="w-full mb-2"
            disabled={isLoading || uploadingVideo || replacingVideoIndex !== null}
          />
        )}
        {/* Hidden single-file input used for reliable replacement */}
        <input
          ref={videoReplaceInputRef}
          type="file"
          accept="video/*"
          onChange={handleVideosChange}
          className="hidden"
        />
        
        {videoPreviews.length >= MAX_VIDEOS && (
          <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded mb-2">
            ⚠️ Maximum {MAX_VIDEOS} videos reached. Click on a video to replace it.
          </div>
        )}

        {videoPreviews.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {videoPreviews.slice(0, MAX_VIDEOS).map((src, idx) => (
              <div key={idx} className="relative group">
                <video src={src} className="w-20 h-20 object-cover rounded border-2 border-gray-300" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => startReplaceVideo(idx)}
                    className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-xs px-2 py-1 rounded transition-opacity"
                    disabled={isLoading || uploadingVideo}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVideo(idx)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white text-xs px-2 py-1 rounded transition-opacity ml-1"
                    disabled={isLoading || uploadingVideo}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading || uploadingImage || uploadingVideo || !!imageError || !!videoError}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded font-medium"
        >
          {isLoading
            ? '⏳ Saving...'
            : uploadingImage
            ? '⏳ Uploading images...'
            : uploadingVideo
            ? '⏳ Uploading videos...'
            : (imageError || videoError)
            ? '⚠️ Fix validation errors'
            : '✓ Save Item'}
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
