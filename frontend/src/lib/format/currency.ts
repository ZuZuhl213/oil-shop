/**
 * VND currency formatting and display utilities.
 *
 * Money is stored as Long (VND, no decimals) in the backend.
 */

const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
});

/**
 * Format a VND amount deterministically to prevent hydration mismatch.
 * @example formatVnd(170000) → "170.000 ₫"
 */
export function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return 'Liên hệ';
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
}

/** Alias for formatVnd */
export const formatCurrencyVnd = formatVnd;

/**
 * Format a number with Vietnamese locale (dots as thousand separator).
 * @example formatNumber(170000) → "170.000"
 */
export function formatNumber(amount: number): string {
  return compactFormatter.format(amount);
}

/**
 * Format a price range from variants.
 * @example formatPriceRange(90000, 800000) → "90.000 – 800.000 ₫"
 */
export function formatPriceRange(
  min: number | null,
  max: number | null,
): string {
  if (min == null && max == null) return 'Liên hệ';
  if (min === max) return formatVnd(min);
  return `${formatNumber(min!)} – ${formatVnd(max!)}`;
}

/**
 * Get min price from a list of variant prices.
 */
export function getMinPrice(prices: (number | null)[]): number | null {
  const valid = prices.filter((p): p is number => p != null);
  return valid.length > 0 ? Math.min(...valid) : null;
}

/**
 * Get max price from a list of variant prices.
 */
export function getMaxPrice(prices: (number | null)[]): number | null {
  const valid = prices.filter((p): p is number => p != null);
  return valid.length > 0 ? Math.max(...valid) : null;
}
