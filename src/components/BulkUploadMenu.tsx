import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { MenuItemFormData } from './MenuItemForm';

interface BulkUploadMenuProps {
  onUpload: (items: MenuItemFormData[]) => Promise<void>;
  isLoading?: boolean;
}

const SAMPLE_CSV = `name,section,price,description,ingredients,dietType,spice_level,sweet_level,is_todays_special
Paneer Tikka,Appetizers,250,Grilled cottage cheese with spices,Paneer - Yogurt - Spices,veg,3,,false
Butter Chicken,Main Course,320,Creamy tomato-based curry with chicken,Chicken - Butter - Cream - Tomato,non-veg,2,,false
Chocolate Cake,Desserts,150,Rich chocolate dessert,Chocolate - Flour - Sugar - Eggs,veg,,4,false
Mango Lassi,Beverages,80,Yogurt-based mango drink,Yogurt - Mango - Sugar,veg,,3,false
Caesar Salad,Salads,200,Fresh greens with Caesar dressing,Lettuce - Croutons - Parmesan,veg,1,,false`;

const TEMPLATE_CSV = `name,section,price,description,ingredients,dietType,spice_level,sweet_level,is_todays_special
[REQUIRED],,[REQUIRED],[optional],[optional],[optional: veg/non-veg/vegan],[optional: 1-5],[optional: 1-5],[optional: true/false]
Example Item,Main Course,299,Brief description here,Ingredient1 - Ingredient2 - Ingredient3,veg,2,1,false`;

export function BulkUploadMenu({ onUpload, isLoading = false }: BulkUploadMenuProps) {
  const [preview, setPreview] = useState<MenuItemFormData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'uploading'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'menu_items_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadSample = () => {
    const element = document.createElement('a');
    const file = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'menu_items_sample.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const validateAndParseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const newErrors: string[] = [];
        const parsedItems: MenuItemFormData[] = [];

        if (!results.data || results.data.length === 0) {
          newErrors.push('CSV file is empty');
          setErrors(newErrors);
          return;
        }

        results.data.forEach((row: any, index: number) => {
          const lineNum = index + 2; // +2 because of header and 0-indexing

          // Validate mandatory fields
          if (!row.name || row.name.trim() === '') {
            newErrors.push(`Row ${lineNum}: "name" is required`);
            return;
          }

          if (!row.section || row.section.trim() === '') {
            newErrors.push(`Row ${lineNum}: "section" is required`);
            return;
          }

          if (!row.price || isNaN(parseFloat(row.price))) {
            newErrors.push(`Row ${lineNum}: "price" must be a valid number`);
            return;
          }

          // Validate optional fields
          const dietType = row.dietType?.trim().toLowerCase();
          if (dietType && !['veg', 'non-veg', 'vegan'].includes(dietType)) {
            newErrors.push(`Row ${lineNum}: "dietType" must be veg, non-veg, or vegan`);
            return;
          }

          const spiceLevel = row.spice_level ? parseInt(row.spice_level) : undefined;
          if (spiceLevel && (isNaN(spiceLevel) || spiceLevel < 1 || spiceLevel > 5)) {
            newErrors.push(`Row ${lineNum}: "spice_level" must be between 1-5`);
            return;
          }

          const sweetLevel = row.sweet_level ? parseInt(row.sweet_level) : undefined;
          if (sweetLevel && (isNaN(sweetLevel) || sweetLevel < 1 || sweetLevel > 5)) {
            newErrors.push(`Row ${lineNum}: "sweet_level" must be between 1-5`);
            return;
          }

          const isTodaysSpecial = row.is_todays_special?.trim().toLowerCase() === 'true';

          // Build item
          const item: MenuItemFormData = {
            name: row.name.trim(),
            section: row.section.trim(),
            price: parseFloat(row.price),
            description: row.description?.trim() || '',
            ingredients: row.ingredients?.trim() || '',
            dietType: (dietType as 'veg' | 'non-veg' | 'vegan' | undefined),
            is_todays_special: isTodaysSpecial,
            spice_level: spiceLevel,
            sweet_level: sweetLevel,
          };

          parsedItems.push(item);
        });

        if (newErrors.length > 0) {
          setErrors(newErrors);
          setPreview([]);
        } else {
          setErrors([]);
          setPreview(parsedItems);
          setStep('preview');
        }
      },
      error: (error: any) => {
        setErrors([`CSV parsing error: ${error.message}`]);
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrors(['Please select a CSV file']);
      return;
    }

    validateAndParseCSV(file);
  };

  const handleUpload = async () => {
    setStep('uploading');
    try {
      await onUpload(preview);
      setStep('upload');
      setPreview([]);
      setErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setErrors([`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setStep('preview');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">📦 Bulk Import Menu Items</h3>

      {step === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
               onClick={() => fileInputRef.current?.click()}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="text-gray-600">
              <p className="text-lg font-medium mb-2">📤 Click to upload CSV file</p>
              <p className="text-sm text-gray-500">or drag and drop</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={downloadTemplate}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              📋 Download Template
            </button>
            <button
              onClick={downloadSample}
              className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              📊 Download Sample
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📝 CSV Format Guide:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Required fields:</strong> name, section, price</li>
              <li><strong>Optional fields:</strong> description, ingredients, dietType, spice_level, sweet_level, is_todays_special</li>
              <li><strong>Diet Type values:</strong> veg, non-veg, or vegan</li>
              <li><strong>Spice/Sweet levels:</strong> 1-5 (numeric)</li>
              <li><strong>Today's Special:</strong> true or false</li>
            </ul>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">❌ Errors:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {step === 'preview' && preview.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-green-900 font-medium">
              ✅ {preview.length} items ready to import
            </p>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2">Section</th>
                  <th className="text-left px-4 py-2">Price</th>
                  <th className="text-left px-4 py-2">Diet Type</th>
                  <th className="text-left px-4 py-2">Spice</th>
                  <th className="text-left px-4 py-2">Sweet</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">{item.section}</td>
                    <td className="px-4 py-2">₹{item.price}</td>
                    <td className="px-4 py-2">{item.dietType || '-'}</td>
                    <td className="px-4 py-2">{item.spice_level || '-'}</td>
                    <td className="px-4 py-2">{item.sweet_level || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep('upload');
                setPreview([]);
                setErrors([]);
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition"
            >
              ← Back
            </button>
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              {isLoading ? '⏳ Uploading...' : '✅ Import All Items'}
            </button>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">❌ Errors:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {step === 'uploading' && (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600 font-medium">Uploading {preview.length} items...</p>
        </div>
      )}
    </div>
  );
}
