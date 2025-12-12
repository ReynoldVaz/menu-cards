import { useState } from 'react';
import { db } from '../firebase.config';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { ThemeStyles } from '../utils/themeUtils';

interface PhoneOptInModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  themeStyles: ThemeStyles;
}

export function PhoneOptInModal({ 
  isOpen, 
  onClose, 
  restaurantId, 
  restaurantName, 
  themeStyles 
}: PhoneOptInModalProps) {
  const [customerPhone, setCustomerPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [optInError, setOptInError] = useState('');
  const [optInInfo, setOptInInfo] = useState('');

  if (!isOpen) return null;

  function isValidCustomerPhone(input: string) {
    const cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) return false;
    return /^[+0-9 ()-]+$/.test(input);
  }

  const fullPhone = countryCode + ' ' + customerPhone.trim();

  async function handleOptInSubmit() {
    if (!isValidCustomerPhone(customerPhone)) {
      setOptInError('Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
      return;
    }

    try {
      const sanitized = (countryCode + customerPhone).replace(/\D/g, '');
      if (restaurantId && sanitized) {
        const ref = doc(db, `restaurants/${restaurantId}/subscribers`, sanitized);
        const existing = await getDoc(ref);
        
        if (existing.exists()) {
          setOptInInfo('This number is already subscribed. Thanks!');
        } else {
          await setDoc(
            ref,
            {
              phone: sanitized,
              originalInput: fullPhone,
              optedIn: true,
              preferredChannel: 'whatsapp',
              source: 'qr-prompt',
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
          setOptInInfo('Subscribed successfully. Thanks!');
        }
      }
    } catch (e) {
      console.error('Failed to save subscriber phone:', e);
    } finally {
      localStorage.setItem('customerPhoneOptIn', 'true');
      localStorage.setItem('customerPhoneNumber', fullPhone);
      setTimeout(() => onClose(), 1500);
    }
  }

  function handleOptInSkip() {
    localStorage.setItem('customerPhoneOptOut', 'true');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
      <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[12px_12px_24px_rgba(0,0,0,0.2),-12px_-12px_24px_rgba(255,255,255,0.9)] w-11/12 max-w-md p-6">
        <h4 className="text-lg font-semibold mb-2" style={{ color: themeStyles.primaryButtonBg }}>
          Stay up to date
        </h4>
        <p className="text-sm text-gray-700 mb-2">
          Share your phone number to receive updates and offers from {restaurantName}. You can skip if you prefer.
        </p>
        
        <div className="flex gap-2 mb-2">
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="px-2 py-2 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] w-28 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="+91">🇮🇳 +91</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+61">🇦🇺 +61</option>
            <option value="+971">🇦🇪 +971</option>
            <option value="+65">🇸🇬 +65</option>
            <option value="+7">🇷🇺 +7</option>
            <option value="+49">🇩🇪 +49</option>
            <option value="+33">🇫🇷 +33</option>
            <option value="+39">🇮🇹 +39</option>
          </select>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => { setCustomerPhone(e.target.value); setOptInError(''); }}
            placeholder="e.g., 98765 43210"
            inputMode="tel"
            className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        
        {optInError && <p className="text-red-600 text-xs mb-3">{optInError}</p>}
        {optInInfo && <p className="text-green-600 text-xs mb-3">{optInInfo}</p>}
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={handleOptInSkip} 
            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.1),-1px_-1px_3px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] transition-all font-medium"
          >
            Skip
          </button>
          <button 
            onClick={handleOptInSubmit} 
            className="px-5 py-2.5 rounded-xl text-white shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all font-medium" 
            style={{ backgroundColor: themeStyles.primaryButtonBg }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
