import { db } from '../firebase.config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export type UserRole = 'master-admin' | 'restaurant-owner' | 'staff';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  restaurantCode: string | null;
  role: UserRole;
  createdAt: string;
}

/**
 * Get user's role from Firestore
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return (data.role as UserRole) || 'restaurant-owner';
    }
    return null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        userId,
        email: data.email,
        displayName: data.displayName,
        restaurantCode: data.restaurantCode || null,
        role: (data.role as UserRole) || 'restaurant-owner',
        createdAt: data.createdAt,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Check if user is master admin
 */
export async function isMasterAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'master-admin';
}

/**
 * Check if user can access a specific restaurant
 */
export async function canAccessRestaurant(
  userId: string,
  restaurantCode: string
): Promise<boolean> {
  try {
    // Master admin can access all restaurants
    const role = await getUserRole(userId);
    if (role === 'master-admin') {
      return true;
    }

    // Check if user owns this restaurant
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.restaurantCode === restaurantCode;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking restaurant access:', error);
    return false;
  }
}

/**
 * Get all restaurants (for master admin)
 */
export async function getAllRestaurants() {
  try {
    const restaurantsRef = collection(db, 'restaurants');
    const snapshot = await getDocs(restaurantsRef);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching all restaurants:', error);
    return [];
  }
}

/**
 * Get restaurants accessible to a user
 */
export async function getUserRestaurants(userId: string) {
  try {
    const role = await getUserRole(userId);
    
    // Master admin gets all restaurants
    if (role === 'master-admin') {
      return getAllRestaurants();
    }

    // Regular owner gets only their restaurant
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.restaurantCode) {
        const restaurantRef = doc(db, 'restaurants', userData.restaurantCode);
        const restaurantDoc = await getDoc(restaurantRef);
        
        if (restaurantDoc.exists()) {
          return [
            {
              id: restaurantDoc.id,
              ...restaurantDoc.data(),
            },
          ];
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching user restaurants:', error);
    return [];
  }
}
