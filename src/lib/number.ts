/**
 * Read a whole number typed by the user and keep it within `min`..`max`.
 * Decimals are rounded; anything that is not a number (empty, "abc") gives `fallback`.
 */
export function clampWholeNumber(raw: string, min: number, max: number, fallback: number): number {
  const text = raw.trim();
  const n = text === '' ? NaN : Number(text);
  if (!Number.isFinite(n)) return Math.min(max, Math.max(min, fallback));
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** True when `raw` is already a whole number within `min`..`max`, so it can be applied as typed. */
export function isWholeNumberInRange(raw: string, min: number, max: number): boolean {
  const text = raw.trim();
  if (!/^-?\d+$/.test(text)) return false;
  const n = Number(text);
  return n >= min && n <= max;
}
