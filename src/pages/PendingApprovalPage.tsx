import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db, auth } from '../firebase.config';
import { doc, getDoc } from 'firebase/firestore';

interface LocationState {
  restaurantCode: string;
  userId: string;
}

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | 'checking'>('checking');
  const [checkCount, setCheckCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check approval status periodically
    const checkApprovalStatus = async () => {
      try {
        const userRef = doc(db, 'users', state?.userId || auth.currentUser?.uid || '');
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const status = userDoc.data().approvalStatus;
          if (status === 'approved') {
            setApprovalStatus('approved');
            setTimeout(() => {
              navigate('/admin/dashboard');
            }, 2000);
          } else if (status === 'rejected') {
            setApprovalStatus('rejected');
          } else {
            setApprovalStatus('pending');
          }
        } else {
          setApprovalStatus('pending');
        }
      } catch (err) {
        console.error('Error checking approval status:', err);
        setApprovalStatus('pending');
      } finally {
        setInitialized(true);
      }
    };

    // Check immediately
    checkApprovalStatus();

    // Then check every 5 seconds
    const interval = setInterval(() => {
      setCheckCount((prev) => prev + 1);
      checkApprovalStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [state?.userId, navigate]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Checking Approval Status...</h2>
          <p className="text-gray-600 mb-6">Please wait while we check your registration status.</p>
        </div>
      </div>
    );
  }
  if (!state?.restaurantCode) {
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

  if (approvalStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4 animate-spin">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Checking Approval Status...</h2>
          <p className="text-gray-600 mb-6">Please wait while we check your registration status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 text-center">
        {approvalStatus === 'pending' ? (
          <>
            <div className="text-6xl mb-4 animate-bounce">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Sent!</h2>
            <p className="text-gray-600 mb-6">
              Your registration request for <strong>{state.restaurantCode}</strong> has been submitted.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-3">
                ⏳ Waiting for master admin approval...
              </p>
              <p className="text-xs text-blue-600">
                Our admin team will review your request shortly. You'll be able to access your restaurant dashboard once approved.
              </p>
            </div>

            <div className="space-y-3 mb-6 text-left text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span>Registration details submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⏳</span>
                <span>Waiting for approval</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span>You'll be notified when approved</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-6">
              Checking status... {checkCount > 0 && `(${checkCount} checks)`}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                🔄 Refresh Status
              </button>
              <button
                onClick={() => navigate('/admin/auth')}
                className="w-full px-4 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </>
        ) : approvalStatus === 'approved' ? (
          <>
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Approved!</h2>
            <p className="text-gray-600 mb-6">
              Your restaurant has been approved. Redirecting to dashboard...
            </p>
            <div className="animate-spin inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Registration Rejected</h2>
            <p className="text-gray-600 mb-6">
              Unfortunately, your registration request could not be approved. Please contact support for more information.
            </p>
            <button
              onClick={() => navigate('/admin/auth')}
              className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              ← Back to Login
            </button>
            
          </>
        )}
      </div>
    </div>
  );
}
