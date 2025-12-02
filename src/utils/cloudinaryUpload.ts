/**
 * Cloudinary Upload Utility
 * Handles image and video uploads for restaurants
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

export interface UploadResult {
  url: string;
  publicId: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UploadOptions {
  restaurantCode: string;
  fileType: 'image' | 'video' | 'logo';
  onProgress?: (progress: number) => void;
}

/**
 * Upload file to Cloudinary
 * @param file - File to upload
 * @param options - Upload options including restaurant code and file type
 * @returns Upload result with URL and metadata
 */
export const uploadToCloudinary = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary credentials not configured');
  }

  // Validate file
  const fileType = file.type.startsWith('video/') ? 'video' : 'image';
  
  // Size limits
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
  
  if (fileType === 'image' && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image must be less than 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (fileType === 'video' && file.size > MAX_VIDEO_SIZE) {
    throw new Error(`Video must be less than 50MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Create folder path based on file type
  let folder = `menu-cards/restaurants/${options.restaurantCode}`;
  if (options.fileType === 'image') {
    folder += '/menu-items';
  } else if (options.fileType === 'video') {
    folder += '/videos';
  } else if (options.fileType === 'logo') {
    folder += '/logo';
  }

  // Create FormData for upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('resource_type', fileType === 'video' ? 'video' : 'image');

  try {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (options.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          options.onProgress?.(progress);
        }
      });
    }

    // Upload to Cloudinary
    return await new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            publicId: response.public_id,
            size: response.bytes,
            width: response.width,
            height: response.height,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', CLOUDINARY_URL);
      xhr.send(formData);
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Generate optimized Cloudinary URL with transformations
 */
export const getOptimizedImageUrl = (publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
}): string => {
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  const transformations: string[] = [];
  
  if (options?.width) transformations.push(`w_${options.width}`);
  if (options?.height) transformations.push(`h_${options.height}`);
  if (options?.crop) transformations.push(`c_${options.crop}`);
  if (options?.quality) transformations.push(`q_${options.quality}`);
  
  // Auto quality and format for web optimization
  transformations.push('q_auto', 'f_auto');
  
  if (transformations.length > 0) {
    return `${baseUrl}/${transformations.join(',')}/${publicId}`;
  }
  
  return `${baseUrl}/${publicId}`;
};

/**
 * Delete file from Cloudinary (requires backend API)
 * Note: This requires server-side implementation with your API Secret
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // This would require a backend endpoint to handle deletion securely
  // For now, just log the public ID to delete
  console.log('To delete from Cloudinary, use public ID:', publicId);
};
