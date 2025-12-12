import { useState, useRef } from 'react';
import type { MenuItemFormData } from './MenuItemForm';

interface SmartMenuImportProps {
  onExtractedData: (items: MenuItemFormData[]) => void;
  onClose: () => void;
  restaurantId: string;
}

interface ExtractedItem extends MenuItemFormData {
  confidence?: 'high' | 'medium' | 'low';
  selected?: boolean;
}

export function SmartMenuImport({ onExtractedData, onClose, restaurantId }: SmartMenuImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'upload' | 'preview' | 'edit'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload an image (JPG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(''); // PDF preview not needed
    }

    setStep('preview');
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleProcessImage = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');

    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Call Vercel serverless function
      const response = await fetch('/api/extract-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
          restaurantId,
          fileType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        setError('No menu items detected. Please try a clearer image or enter items manually.');
        setProcessing(false);
        return;
      }

      // Mark all items as selected by default
      const itemsWithSelection = data.items.map((item: ExtractedItem) => ({
        ...item,
        selected: true,
        confidence: item.confidence || 'medium',
      }));

      setExtractedItems(itemsWithSelection);
      setStep('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleItemEdit = (index: number, field: keyof ExtractedItem, value: any) => {
    setExtractedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleToggleSelect = (index: number) => {
    setExtractedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = () => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const handleDeselectAll = () => {
    setExtractedItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleApprove = () => {
    const selectedItems = extractedItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      setError('Please select at least one item to import');
      return;
    }

    // Remove selection and confidence fields before passing to parent
    const cleanedItems = selectedItems.map(({ selected, confidence, ...item }) => item);
    onExtractedData(cleanedItems);
  };

  const getConfidenceColor = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">📸 Smart Menu Import</h2>
            <p className="text-sm opacity-90">Upload menu image/PDF and extract items automatically</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Upload Your Menu</h3>
                <p className="text-sm text-gray-600">Take a photo or upload an existing menu image/PDF</p>
              </div>

              {/* Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-center"
                >
                  <div className="text-6xl mb-4">📁</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Upload File</h4>
                  <p className="text-sm text-gray-600">JPG, PNG, WebP, or PDF</p>
                  <p className="text-xs text-gray-500 mt-2">Max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Camera Capture */}
                <div
                  onClick={handleCameraCapture}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer text-center"
                >
                  <div className="text-6xl mb-4">📷</div>
                  <h4 className="font-semibold text-gray-800 mb-2">Take Photo</h4>
                  <p className="text-sm text-gray-600">Use your camera</p>
                  <p className="text-xs text-gray-500 mt-2">Best for mobile</p>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview & Process */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Preview & Process</h3>
                <p className="text-sm text-gray-600">Review your upload and start extraction</p>
              </div>

              {preview && (
                <div className="flex justify-center">
                  <img src={preview} alt="Menu preview" className="max-w-full max-h-96 rounded-lg shadow-lg" />
                </div>
              )}

              {file && !preview && (
                <div className="text-center bg-gray-100 p-8 rounded-lg">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep('upload');
                    setFile(null);
                    setPreview('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-medium transition-all"
                  disabled={processing}
                >
                  ← Back
                </button>
                <button
                  onClick={handleProcessImage}
                  disabled={processing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    '🚀 Extract Items'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Edit Extracted Items */}
          {step === 'edit' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Review & Edit Extracted Items</h3>
                  <p className="text-sm text-gray-600">
                    {extractedItems.filter((item) => item.selected).length} of {extractedItems.length} items selected
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition-all"
                  >
                    ✓ Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-all"
                  >
                    ✗ Deselect All
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Extracted Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" className="w-4 h-4" checked={extractedItems.every(item => item.selected)} onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()} />
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Currency</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Section</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedItems.map((item, index) => (
                        <tr key={index} className={`border-t ${item.selected ? 'bg-blue-50' : 'bg-white'}`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleSelect(index)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleItemEdit(index, 'price', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                              step="0.01"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={item.currency || 'INR'}
                              onChange={(e) => handleItemEdit(index, 'currency', e.target.value)}
                              className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="INR">₹</option>
                              <option value="USD">$</option>
                              <option value="EUR">€</option>
                              <option value="GBP">£</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.section}
                              onChange={(e) => handleItemEdit(index, 'section', e.target.value)}
                              className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemEdit(index, 'description', e.target.value)}
                              className="w-48 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(item.confidence)}`}>
                              {item.confidence?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setStep('preview');
                    setExtractedItems([]);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-medium transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all"
                >
                  ✓ Import {extractedItems.filter((item) => item.selected).length} Items
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
