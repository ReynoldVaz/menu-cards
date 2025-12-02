import { useState, useEffect } from 'react';
import { getUserRole, isMasterAdmin, getUserRestaurants, UserRole } from '../utils/adminUtils';

export interface MasterAdminState {
  role: UserRole | null;
  isMasterAdmin: boolean;
  restaurants: any[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to manage master admin state and permissions
 */
export function useMasterAdmin(userId: string | null): MasterAdminState {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadMasterAdminData() {
      try {
        setLoading(true);
        setError(null);

        // Get user role
        const userRole = await getUserRole(userId as string);
        setRole(userRole);

        // Check if master admin
        const isMasterAdmin_result = await isMasterAdmin(userId as string);
        setIsMaster(isMasterAdmin_result);

        // Get accessible restaurants
        const userRestaurants = await getUserRestaurants(userId as string);
        setRestaurants(userRestaurants);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }

    loadMasterAdminData();
  }, [userId]);

  return {
    role,
    isMasterAdmin: isMaster,
    restaurants,
    loading,
    error,
  };
}
