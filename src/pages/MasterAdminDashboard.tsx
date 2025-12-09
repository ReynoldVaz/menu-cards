import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase.config';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
// Removed sendResendEmail import; use sendEmailClient only
import { sendEmailClient } from '../utils/sendEmailClient'; // Corrected import statement
// import { sendApprovalEmail, sendRejectionEmail } from '../utils/emailService'; // TODO: Enable after SendGrid domain authentication

interface Restaurant {
  id: string;
  name: string;
  restaurantCode: string;
  ownerId: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

interface ApprovalRequest {
  id: string;
  ownerId: string;
  ownerEmail: string;
  restaurantCode: string;
  restaurantName: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

interface AdminTab {
  id: 'overview' | 'approvals' | 'theme-requests' | 'restaurants' | 'settings';
  label: string;
  icon: string;
}

export function MasterAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab['id']>('overview');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [themeRequests, setThemeRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const tabs: AdminTab[] = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'approvals', label: 'Approvals', icon: '📋' },
    { id: 'theme-requests', label: 'Theme Requests', icon: '✨' },
    { id: 'restaurants', label: 'All Restaurants', icon: '🏪' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      await Promise.all([loadRestaurants(), loadApprovalRequests(), loadThemeRequests()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function loadRestaurants() {
    try {
      const restaurantsRef = collection(db, 'restaurants');
      const snapshot = await getDocs(restaurantsRef);

      const restaurantsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        restaurantCode: doc.data().restaurantCode,
        ownerId: doc.data().ownerId,
        phone: doc.data().phone,
        email: doc.data().email,
        address: doc.data().address,
        description: doc.data().description,
        isActive: doc.data().isActive,
        createdAt: doc.data().createdAt,
      }));

      setRestaurants(restaurantsList);
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    }
  }

  async function loadApprovalRequests() {
    try {
      const approvalsRef = collection(db, 'approval_requests');
      const snapshot = await getDocs(approvalsRef);

      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ownerId: doc.data().ownerId,
        ownerEmail: doc.data().ownerEmail,
        restaurantCode: doc.data().restaurantCode,
        restaurantName: doc.data().restaurantName,
        phone: doc.data().phone,
        email: doc.data().email,
        address: doc.data().address,
        description: doc.data().description,
        status: doc.data().status,
        createdAt: doc.data().createdAt,
      })) as ApprovalRequest[];

      setApprovalRequests(requests);
    } catch (err) {
      console.error('Failed to load approval requests:', err);
    }
  }

  async function loadThemeRequests() {
    try {
      const themeReqRef = collection(db, 'theme_requests');
      const snapshot = await getDocs(themeReqRef);

      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setThemeRequests(requests);
    } catch (err) {
      console.error('Failed to load theme requests:', err);
    }
  }

  async function handleApproveRequest(request: ApprovalRequest) {
    try {
      // Create restaurant document
      const restaurantDocRef = doc(db, 'restaurants', request.restaurantCode);
      await setDoc(restaurantDocRef, {
        name: request.restaurantName,
        restaurantCode: request.restaurantCode,
        ownerId: request.ownerId,
        phone: request.phone,
        email: request.email,
        address: request.address,
        description: request.description,
        logo: null,
        theme: {
          mode: 'light',
          primaryColor: '#EA580C',
          secondaryColor: '#FB923C',
          accentColor: '#FED7AA',
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update user document with approved status
      const userDocRef = doc(db, 'users', request.ownerId);
      await updateDoc(userDocRef, {
        approvalStatus: 'approved',
      });

      // Update approval request status
      const approvalDocRef = doc(db, 'approval_requests', request.id);
      await updateDoc(approvalDocRef, {
        status: 'approved',
        updatedAt: new Date().toISOString(),
      });


      // Send approval email to restaurant owner using sendEmailClient
      const companyName = import.meta.env.VITE_COMPANY_NAME || 'Our Team';
      const appUrl = import.meta.env.VITE_APP_URL || 'https://menu-cards-ten.vercel.app';
      await sendEmailClient({
        to: request.ownerEmail,
        subject: `Your restaurant registration is approved!`,
        html: `<p>Hi, your restaurant <b>${request.restaurantName}</b> has been approved. Welcome aboard!</p>
        <p>You can now <a href="${appUrl}/login" target="_blank">log in to your dashboard</a> to manage your restaurant.</p>
        <p>Best regards,<br/>${companyName}</p>`
      });



      // Send approval email to restaurant owner
      // TODO: Enable after SendGrid domain authentication is complete
      /*
      console.log('[DEBUG] === EMAIL APPROVAL FLOW ===');
      console.log('[DEBUG] Owner Email:', request.ownerEmail);
      console.log('[DEBUG] Restaurant Name:', request.restaurantName);
      console.log('[DEBUG] Restaurant Code:', request.restaurantCode);
      console.log('[DEBUG] Calling sendApprovalEmail()...');
      
      const emailResult = await sendApprovalEmail(
        request.ownerEmail,
        request.restaurantName,
        request.restaurantCode
      );
      
      console.log('[DEBUG] Email result:', emailResult);
      console.log('[DEBUG] Email success:', emailResult.success);
      console.log('[DEBUG] Email message:', emailResult.message);
      
      if (emailResult.success) {
        console.log('✅ Approval email sent successfully to:', request.ownerEmail);
      } else {
        console.warn('⚠️ Approval email FAILED:', emailResult.message);
        console.warn('⚠️ But registration WAS approved for:', request.restaurantCode);
      }
      */

      // Reload data
      await loadData();
      console.log('✅ Request approved:', request.restaurantCode);
    } catch (err) {
      console.error('[DEBUG] Error in handleApproveRequest:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  }

  async function handleRejectRequest(request: ApprovalRequest) {
    try {
      // Get rejection reason from admin (for now using a default message)
      const rejectionReason = 'Your registration request does not meet our requirements. Please contact support for more information.';

      // Update user document with rejected status
      const userDocRef = doc(db, 'users', request.ownerId);
      await updateDoc(userDocRef, {
        approvalStatus: 'rejected',
      });

      // Update approval request status
      const approvalDocRef = doc(db, 'approval_requests', request.id);
      await updateDoc(approvalDocRef, {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });



            // Send rejection email to restaurant owner using sendEmailClient
      const companyName = import.meta.env.VITE_COMPANY_NAME || 'Our Team';
      const companyEmail = import.meta.env.VITE_COMPANY_EMAIL || 'support@example.com';
      const companyPhone = import.meta.env.VITE_COMPANY_PHONE || '';
      await sendEmailClient({
        to: request.ownerEmail,
        subject: 'Your restaurant registration was rejected',
        html: `<p>Hi, your restaurant <b>${request.restaurantName}</b> was rejected. Reason: ${rejectionReason}</p>
        <p>For more details or support, contact us at <a href="mailto:${companyEmail}">${companyEmail}</a>${companyPhone ? ` or call ${companyPhone}` : ''}.</p>
        <p>Best regards,<br/>${companyName}</p>`
      });

      // Send rejection email to restaurant owner
      // TODO: Enable after SendGrid domain authentication is complete
      /*
      console.log('[Rejection] Sending email to:', request.ownerEmail);
      const emailResult = await sendRejectionEmail(
        request.ownerEmail,
        request.restaurantName,
        rejectionReason
      );
      
      if (emailResult.success) {
        console.log('✅ Rejection email sent successfully');
      } else {
        console.warn('⚠️ Rejection email failed, but request was rejected:', emailResult.message);
      }
      */

      // Reload data
      await loadData();
      console.log('✅ Request rejected:', request.restaurantCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  }

  async function handleDeregisterPendingRequest(request: ApprovalRequest) {
    if (!window.confirm(`Are you sure you want to deregister ${request.restaurantName}? This cannot be undone.`)) {
      return;
    }

    try {
      // Delete user document
      const userDocRef = doc(db, 'users', request.ownerId);
      await updateDoc(userDocRef, {
        restaurantCode: null,
        approvalStatus: 'deregistered',
      });


      // Delete approval request
      const approvalDocRef = doc(db, 'approval_requests', request.id);
      await updateDoc(approvalDocRef, {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });

      // Send deregister email to restaurant owner using sendEmailClient
      await sendEmailClient({
        to: request.ownerEmail,
        subject: 'Your restaurant registration was deregistered',
        html: `<p>Hi, your restaurant <b>${request.restaurantName}</b> has been deregistered. Please contact support for more information.</p>`
      });

      // Reload data
      await loadData();
      console.log('✅ Pending request deregistered:', request.restaurantCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deregister request');
    }
  }

  async function handleDeregisterRestaurantOwner(restaurant: Restaurant) {
    if (!window.confirm(`Are you sure you want to deregister ${restaurant.name}? This will delete all data including menu items and events. This cannot be undone.`)) {
      return;
    }

    try {
      // Delete menu items
      const menuItemsRef = collection(db, `restaurants/${restaurant.restaurantCode}/menu_items`);
      const menuItemsSnapshot = await getDocs(menuItemsRef);
      for (const doc of menuItemsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete events
      const eventsRef = collection(db, `restaurants/${restaurant.restaurantCode}/events`);
      const eventsSnapshot = await getDocs(eventsRef);
      for (const doc of eventsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }

      // Delete restaurant
      const restaurantRef = doc(db, 'restaurants', restaurant.restaurantCode);
      await deleteDoc(restaurantRef);

      // Delete user document
      const userDocRef = doc(db, 'users', restaurant.ownerId);
      await updateDoc(userDocRef, {
        restaurantCode: null,
        approvalStatus: 'deregistered',
      });

      // Reload data
      await loadData();
      console.log('✅ Restaurant owner deregistered:', restaurant.restaurantCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deregister restaurant owner');
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate('/admin/auth');
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    }
  }

  async function toggleRestaurantStatus(restaurantCode: string, currentStatus: boolean) {
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantCode);
      await updateDoc(restaurantRef, { isActive: !currentStatus });
      
      // Update local state
      setRestaurants(
        restaurants.map((r) =>
          r.restaurantCode === restaurantCode ? { ...r, isActive: !currentStatus } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update restaurant');
    }
  }

  function navigateToRestaurantDashboard(restaurantCode: string) {
    navigate(`/admin/dashboard?restaurant=${restaurantCode}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">👑 Master Admin Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage all restaurants</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4 mt-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Total Restaurants</h3>
              <p className="text-4xl font-bold text-orange-600 mt-2">{restaurants.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Active Restaurants</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">
                {restaurants.filter((r) => r.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Inactive Restaurants</h3>
              <p className="text-4xl font-bold text-red-600 mt-2">
                {restaurants.filter((r) => !r.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 text-sm font-medium">Pending Approvals</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">
                {approvalRequests.filter((r) => r.status === 'pending').length}
              </p>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            {approvalRequests.filter((r) => r.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">✓ No pending approval requests</p>
              </div>
            ) : (
              approvalRequests
                .filter((r) => r.status === 'pending')
                .map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{request.restaurantName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Code: {request.restaurantCode}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Submitted: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Email</p>
                        <p className="text-xs sm:text-sm text-gray-900 font-mono mt-1 break-all">{request.ownerEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Phone</p>
                        <p className="text-xs sm:text-sm text-gray-900 mt-1">{request.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Address</p>
                        <p className="text-xs sm:text-sm text-gray-900 mt-1 break-all">{request.address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Owner ID</p>
                        <p className="text-xs sm:text-sm text-gray-900 font-mono mt-1">
                          {request.ownerId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>

                    {request.description && (
                      <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium mb-2">Description</p>
                        <p className="text-xs sm:text-sm text-blue-900">{request.description}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="w-full sm:flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="w-full sm:flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
                      >
                        ✕ Reject
                      </button>
                      <button
                        onClick={() => handleDeregisterPendingRequest(request)}
                        className="w-full sm:flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium transition-colors"
                      >
                        🗑️ Deregister
                      </button>
                    </div>
                  </div>
                ))
            )}

            {/* Approved Requests */}
            {approvalRequests.filter((r) => r.status === 'approved').length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Approved Requests</h3>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Restaurant</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Code</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Owner Email</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Approved Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {approvalRequests
                        .filter((r) => r.status === 'approved')
                        .map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 font-medium text-gray-900">{request.restaurantName}</td>
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{request.restaurantCode}</td>
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 break-all">{request.ownerEmail}</td>
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{new Date(request.updatedAt || request.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Theme Requests Tab */}
        {activeTab === 'theme-requests' && (
          <div className="space-y-4">
            {themeRequests.filter((r) => r.status === 'pending').length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">✓ No pending theme requests</p>
              </div>
            ) : (
              themeRequests
                .filter((r) => r.status === 'pending')
                .map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-gray-900">{request.themeName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">Restaurant: {request.restaurantName}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Code: {request.restaurantCode}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Submitted: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4 sm:mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 font-medium mb-2">Description</p>
                      <p className="text-xs sm:text-sm text-gray-900">{request.description}</p>
                    </div>

                    {/* Color Preview */}
                    <div className="mb-4 sm:mb-6">
                      <p className="text-xs text-gray-600 font-medium mb-2">Color Scheme</p>
                      <div className="flex flex-wrap gap-2">
                        <div
                          className="flex-1 min-w-[80px] h-12 sm:h-16 rounded flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: request.primaryColor }}
                          title={`Primary: ${request.primaryColor}`}
                        >
                          Primary
                        </div>
                        <div
                          className="flex-1 min-w-[80px] h-12 sm:h-16 rounded flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: request.secondaryColor }}
                          title={`Secondary: ${request.secondaryColor}`}
                        >
                          Secondary
                        </div>
                        <div
                          className="flex-1 min-w-[80px] h-12 sm:h-16 rounded flex items-center justify-center text-gray-800 text-xs font-semibold"
                          style={{ backgroundColor: request.accentColor }}
                          title={`Accent: ${request.accentColor}`}
                        >
                          Accent
                        </div>
                        <div
                          className="flex-1 min-w-[80px] h-12 sm:h-16 rounded border-2 border-gray-300 flex items-center justify-center text-gray-800 text-xs font-semibold"
                          style={{ backgroundColor: request.backgroundColor }}
                          title={`Background: ${request.backgroundColor}`}
                        >
                          Background
                        </div>
                      </div>
                    </div>

                    {/* Logo Preview */}
                    {request.logoUrl && (
                      <div className="mb-4 sm:mb-6">
                        <p className="text-xs text-gray-600 font-medium mb-2">Logo Preview</p>
                        <img src={request.logoUrl} alt="Logo" className="h-16 sm:h-20 w-16 sm:w-20 object-contain rounded" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={async () => {
                          try {
                            // Approve request - add to approved list and update restaurant
                            await updateDoc(doc(db, 'theme_requests', request.id), {
                              status: 'approved',
                              reviewedAt: new Date().toISOString(),
                            });
                            loadData();
                          } catch (err) {
                            alert('Error approving request: ' + err);
                          }
                        }}
                        className="w-full sm:flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={async () => {
                          const reason = prompt('Rejection reason (optional):');
                          try {
                            await updateDoc(doc(db, 'theme_requests', request.id), {
                              status: 'rejected',
                              reviewedAt: new Date().toISOString(),
                              rejectionReason: reason || 'Rejected by master admin',
                            });
                            loadData();
                          } catch (err) {
                            alert('Error rejecting request: ' + err);
                          }
                        }}
                        className="w-full sm:flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))
            )}

            {/* Approved Theme Requests */}
            {themeRequests.filter((r) => r.status === 'approved').length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Approved Theme Requests</h3>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Theme Name</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Restaurant</th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Approved Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {themeRequests
                        .filter((r) => r.status === 'approved')
                        .map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-4 font-medium text-gray-900">{request.themeName}</td>
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{request.restaurantName}</td>
                            <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{new Date(request.reviewedAt || request.requestedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Restaurant</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Code</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Owner ID</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="font-medium text-gray-900">{restaurant.name}</div>
                      {restaurant.address && (
                        <div className="text-xs sm:text-sm text-gray-500 break-all">{restaurant.address}</div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{restaurant.restaurantCode}</td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 font-mono">{restaurant.ownerId ? restaurant.ownerId.slice(0, 8) + '...' : 'N/A'}</td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 break-all">{restaurant.email}</td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${restaurant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{restaurant.isActive ? '✓ Active' : '✗ Inactive'}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={() => navigateToRestaurantDashboard(restaurant.restaurantCode)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors w-full sm:w-auto">Edit</button>
                        <button onClick={() => toggleRestaurantStatus(restaurant.restaurantCode, restaurant.isActive)} className={`px-3 py-1 rounded font-medium transition-colors text-white w-full sm:w-auto ${restaurant.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>{restaurant.isActive ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => handleDeregisterRestaurantOwner(restaurant)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors w-full sm:w-auto">🗑️ Deregister</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Master Admin Settings</h2>
            <div className="space-y-4">
              <div className="p-2 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Current User</h3>
                <p className="text-xs sm:text-sm text-blue-800">Email: <span className="font-mono break-all">{auth.currentUser?.email}</span></p>
                <p className="text-xs sm:text-sm text-blue-800">Role: <span className="font-semibold">Master Admin</span></p>
              </div>
              <div className="p-2 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Manage Restaurants</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">Use the "All Restaurants" tab to view, edit, and manage all restaurants on the platform.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
