/**
 * Currency formatting utilities
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

/**
 * Format price with currency symbol
 * @param price - Price as number or string
 * @param currency - Currency code (defaults to INR if not provided or undefined)
 * @returns Formatted price string with currency symbol (e.g., "₹350")
 */
export function formatPrice(price: number | string, currency?: CurrencyCode | null): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const currencyCode = currency || DEFAULT_CURRENCY; // Always default to INR
  
  if (isNaN(numPrice)) {
    return `${CURRENCY_SYMBOLS[currencyCode]}0`;
  }

  const symbol = CURRENCY_SYMBOLS[currencyCode];
  const formattedNumber = numPrice.toFixed(2).replace(/\.00$/, ''); // Remove .00 for whole numbers
  
  return `${symbol}${formattedNumber}`;
}

/**
 * Parse price string to number, removing currency symbol
 * @param priceString - Price string with or without currency symbol
 * @returns Numeric price value
 */
export function parsePrice(priceString: string): number {
  const cleaned = priceString.replace(/[₹$€£]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Extract currency from price string
 * @param priceString - Price string with currency symbol
 * @returns Currency code
 */
export function extractCurrency(priceString: string): CurrencyCode {
  if (priceString.includes('₹')) return 'INR';
  if (priceString.includes('$')) return 'USD';
  if (priceString.includes('€')) return 'EUR';
  if (priceString.includes('£')) return 'GBP';
  return DEFAULT_CURRENCY;
}
