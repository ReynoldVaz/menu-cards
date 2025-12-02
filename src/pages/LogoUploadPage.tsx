import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase.config';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

interface LocationState {
  restaurantId: string;
  userId: string;
}

export function LogoUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');

    if (!file) return;

    // Validation
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setLogoFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!logoFile) {
      setError('Please select an image');
      return;
    }

    if (!state?.restaurantId) {
      setError('Restaurant ID missing');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Upload to Cloudinary
      const result = await uploadToCloudinary(logoFile, {
        restaurantCode: state.restaurantId,
        fileType: 'logo',
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      // Update restaurant document with Cloudinary URL
      const restaurantRef = doc(db, 'restaurants', state.restaurantId);
      await updateDoc(restaurantRef, {
        logo: result.url,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Logo uploaded:', result.url);

      // Navigate to dashboard
      navigate('/admin/dashboard', {
        state: { restaurantId: state.restaurantId },
      });
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setError(err.message || 'Failed to upload logo');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleSkip = () => {
    navigate('/admin/dashboard', {
      state: { restaurantId: state.restaurantId },
    });
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
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">📸 Upload Your Logo</h2>
        <p className="text-gray-600 text-sm mb-8">Optional - Add your restaurant logo (max 5MB)</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Logo Preview */}
        {logoPreview && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200 text-center">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="max-w-full h-32 mx-auto mb-2 object-contain"
            />
            <p className="text-xs text-gray-600">{logoFile?.name}</p>
          </div>
        )}

        {/* Upload Area */}
        {!logoPreview && (
          <label className="block mb-8">
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-600 transition-colors bg-orange-50">
              <p className="text-4xl mb-2">📤</p>
              <p className="text-sm font-medium text-gray-700">Click to select logo</p>
              <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
              <p className="text-xs text-gray-500 mt-2">Max 5MB • PNG, JPG, GIF</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
          </label>
        )}

        {/* Upload Progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{uploadProgress}% uploaded</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          {logoPreview ? (
            <>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                {loading ? '⏳ Uploading...' : '✓ Upload & Continue'}
              </button>
              <button
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview('');
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                🔄 Change
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSkip}
                disabled={loading}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                ⏭️ Skip for Now
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                ← Back
              </button>
            </>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can upload or change your logo anytime in settings
        </p>
      </div>
    </div>
  );
}
