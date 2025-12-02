import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.config';

/**
 * Check if a restaurant code is already taken
 */
export async function isRestaurantCodeTaken(code: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'restaurants'),
      where('restaurantCode', '==', code.toLowerCase())
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0;
  } catch (err) {
    console.error('Error checking code:', err);
    return false;
  }
}

/**
 * Generate slug from restaurant name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50); // Limit to 50 chars
}

/**
 * Suggest available codes based on a taken code
 */
export async function suggestAvailableCodes(baseCode: string, count: number = 3): Promise<string[]> {
  const suggestions: string[] = [];
  let counter = 1;

  while (suggestions.length < count && counter <= 100) {
    const suggestion = `${baseCode}-${counter}`;
    const taken = await isRestaurantCodeTaken(suggestion);
    if (!taken) {
      suggestions.push(suggestion);
    }
    counter++;
  }

  return suggestions;
}

/**
 * Validate restaurant code format
 */
export function validateRestaurantCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: 'Code cannot be empty' };
  }

  if (code.length < 3) {
    return { valid: false, error: 'Code must be at least 3 characters' };
  }

  if (code.length > 50) {
    return { valid: false, error: 'Code must be less than 50 characters' };
  }

  if (!/^[a-z0-9-]+$/.test(code.toLowerCase())) {
    return { valid: false, error: 'Code can only contain letters, numbers, and hyphens' };
  }

  if (code.startsWith('-') || code.endsWith('-')) {
    return { valid: false, error: 'Code cannot start or end with a hyphen' };
  }

  if (code.includes('--')) {
    return { valid: false, error: 'Code cannot contain consecutive hyphens' };
  }

  return { valid: true };
}
