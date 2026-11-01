export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `#RRGGBB`, upper case. */
export function toHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function toCss({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Relative luminance on a 0–255 scale (Rec. 709 weights). */
export function luminance({ r, g, b }: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Spreadsheet-style column label for a zero-based index: 0 → A, 25 → Z, 26 → AA. */
export function columnName(index: number): string {
  let s = '';
  let i = index + 1;
  while (i > 0) {
    const m = (i - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    i = Math.floor((i - 1) / 26);
  }
  return s;
}
