import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase.config';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import {
  isRestaurantCodeTaken,
  generateSlug,
  suggestAvailableCodes,
  validateRestaurantCode,
} from '../utils/restaurantCodeUtils';

interface LocationState {
  userId: string;
  email: string;
}

export function RestaurantRegistrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string>('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantCode, setRestaurantCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<'available' | 'taken' | 'invalid' | 'unchecked'>('unchecked');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [email] = useState(state?.email || '');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Auto-generate code from restaurant name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setRestaurantName(name);

    // Auto-generate slug
    const slug = generateSlug(name);
    setRestaurantCode(slug);
    setCodeStatus('unchecked');
    setSuggestions([]);
  };

  // Check if code is available
  const handleCheckCode = async () => {
    const validation = validateRestaurantCode(restaurantCode);

    if (!validation.valid) {
      setError(validation.error || 'Invalid code');
      setCodeStatus('invalid');
      return;
    }

    try {
      setChecking(true);
      setError('');
      const taken = await isRestaurantCodeTaken(restaurantCode);

      if (taken) {
        setCodeStatus('taken');
        const suggested = await suggestAvailableCodes(restaurantCode);
        setSuggestions(suggested);
        setError(`"${restaurantCode}" is already taken. Try one of the suggestions below.`);
      } else {
        setCodeStatus('available');
        setSuggestions([]);
        setError('');
      }
    } catch (err: any) {
      setError('Error checking code: ' + err.message);
      setCodeStatus('invalid');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!restaurantName || !phone || !email) {
      setError('Please fill in required fields');
      return;
    }

    if (codeStatus !== 'available') {
      setError('Please select an available restaurant code');
      return;
    }

    if (!/^[0-9+\-\s()]{10,}$/.test(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);

      // Create approval request instead of directly creating restaurant
      const approvalRequestRef = collection(db, 'approval_requests');
      await addDoc(approvalRequestRef, {
        ownerId: state?.userId,
        ownerEmail: state?.email,
        restaurantCode: restaurantCode,
        restaurantName: restaurantName,
        phone,
        email,
        address,
        description,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Create user document with pending status
      const userDocRef = doc(db, 'users', state?.userId);
      await setDoc(
        userDocRef,
        {
          email: state?.email,
          displayName: restaurantName,
          restaurantCode,
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log('✅ Approval request created for:', restaurantCode);

      // Navigate to pending page
      navigate('/admin/pending-approval', {
        state: { restaurantCode, userId: state?.userId },
      });
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  if (!state?.userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">⚠️ Error</h2>
          <p className="text-gray-600 mb-6">Session expired. Please sign up again.</p>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🏪 Register Your Restaurant</h2>
        <p className="text-gray-600 text-sm mb-6">Basic information to get started</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Restaurant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
            <input
              type="text"
              value={restaurantName}
              onChange={handleNameChange}
              placeholder="e.g., Juju, The Spice House"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Restaurant Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Code *
              <span className="text-xs font-normal text-gray-500 ml-2">
                (will be used in your menu URL: yoursite.com/r/{restaurantCode || 'your-code'})
              </span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={restaurantCode}
                onChange={(e) => {
                  setRestaurantCode(e.target.value.toLowerCase());
                  setCodeStatus('unchecked');
                  setSuggestions([]);
                }}
                placeholder="e.g., juju, pizza-house"
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  codeStatus === 'available'
                    ? 'border-green-300 focus:ring-green-500 bg-green-50'
                    : codeStatus === 'taken'
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-orange-500'
                }`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleCheckCode}
                disabled={loading || checking || !restaurantCode}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                {checking ? '⏳' : '✓'} Check
              </button>
            </div>

            {/* Status Indicator */}
            {codeStatus === 'available' && (
              <p className="text-sm text-green-600 mt-2">✅ "{restaurantCode}" is available!</p>
            )}
            {codeStatus === 'taken' && suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-medium text-yellow-800 mb-2">💡 Try these instead:</p>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setRestaurantCode(suggestion);
                        setCodeStatus('available');
                        setSuggestions([]);
                        setError('');
                      }}
                      className="block w-full text-left px-2 py-1 text-sm bg-white hover:bg-yellow-100 border border-yellow-300 rounded transition-colors text-yellow-900 font-mono"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Email Address (auto-populated, not editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              aria-readonly="true"
              title="Auto-filled from your account"
            />
            <p className="text-xs text-gray-500 mt-1">This is your account email and cannot be changed here.</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, postal code"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your restaurant"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || codeStatus !== 'available'}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            {/* {loading ? '⏳ Creating...' : '✓ Next: Theme Selection'} */}
            {loading ? '⏳ Creating...' : 'Submit Registration Request'}
          </button>
        </form>

        <button
          onClick={() => navigate('/admin/auth')}
          className="w-full mt-4 text-gray-600 hover:text-gray-700 font-medium text-sm"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
