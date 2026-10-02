/**
 * Shared number formatting for the UI.
 *
 * Large game values must fit inside small cards, so we abbreviate (12.5K, 1.3M) and use
 * a grouped fallback for medium values. Keep every currency/stat display on these helpers
 * so the formatting stays consistent across screens.
 */

/** Compact form: 950 → "950", 12500 → "12.5K", 3_400_000 → "3.4M". */
export function formatCompact(num: number | null | undefined): string {
  const value = Number(num) || 0;
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return `${sign}${abs}`;
}

/** Grouped form with thin spaces (ru/uz style): 1234567 → "1 234 567". */
export function formatNumber(num: number | null | undefined): string {
  const value = Math.round(Number(num) || 0);
  return value.toLocaleString('ru-RU');
}

/** Currency with an emoji prefix, abbreviated for small cards. */
export function formatCurrency(num: number | null | undefined, emoji: string): string {
  return `${emoji} ${formatCompact(num)}`;
}
