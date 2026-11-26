import type { PixelSource } from './quantize';

/** Inflates zlib-wrapped data (the format of a PNG's joined IDAT chunks). */
export type Inflate = (data: Uint8Array) => Promise<Uint8Array>;

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Channels per pixel for each PNG color type. */
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/**
 * Decode a PNG file into exact RGBA pixels. Reading the file ourselves, instead of drawing it on a
 * canvas and calling getImageData, keeps the pixels exact everywhere: browsers with
 * anti-fingerprinting protection (Safari, Brave, Firefox) add random noise to canvas reads, which
 * changed the colors, and so the paint numbers, from one visit to the next.
 *
 * Supports every non-interlaced PNG up to 8 bits per channel (gray, RGB, palette, with alpha or
 * tRNS transparency); 16-bit and interlaced files throw.
 */
export async function decodePng(bytes: Uint8Array, inflate: Inflate): Promise<PixelSource> {
  if (!SIGNATURE.every((v, i) => bytes[i] === v)) throw new Error('Not a PNG file.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let palette: Uint8Array | null = null;
  let transparency: Uint8Array | null = null;
  const parts: Uint8Array[] = [];

  for (let at = 8; at + 8 <= bytes.length; ) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(at + 8);
      height = view.getUint32(at + 12);
      depth = data[8]!;
      colorType = data[9]!;
      if (data[12] !== 0) throw new Error('Interlaced PNGs are not supported.');
      if (depth > 8 || !(colorType in CHANNELS)) throw new Error('Unsupported PNG format.');
    } else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') transparency = data;
    else if (type === 'IDAT') parts.push(data);
    else if (type === 'IEND') break;
    at += 12 + length;
  }
  if (!width || !height) throw new Error('PNG has no header.');

  const joined = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  parts.reduce((offset, p) => (joined.set(p, offset), offset + p.length), 0);
  const raw = await inflate(joined);

  // Undo the per-row filters, byte by byte.
  const channels = CHANNELS[colorType]!;
  const bpp = Math.max(1, (channels * depth) >> 3); // bytes per pixel, at least 1
  const stride = Math.ceil((width * channels * depth) / 8);
  if (raw.length < height * (stride + 1)) throw new Error('PNG data is truncated.');
  const rows = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    const src = y * (stride + 1) + 1;
    const out = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? rows[out + x - bpp]! : 0;
      const b = y > 0 ? rows[out - stride + x]! : 0;
      const c = x >= bpp && y > 0 ? rows[out - stride + x - bpp]! : 0;
      const v = raw[src + x]!;
      const predicted = filter === 1 ? a : filter === 2 ? b : filter === 3 ? (a + b) >> 1 : filter === 4 ? paeth(a, b, c) : 0;
      rows[out + x] = (v + predicted) & 255;
    }
  }

  // Expand to RGBA.
  const pixels = new Uint8ClampedArray(width * height * 4);
  const max = (1 << depth) - 1;
  const sample = (y: number, index: number): number => {
    if (depth === 8) return rows[y * stride + index]!;
    const bit = index * depth;
    return (rows[y * stride + (bit >> 3)]! >> (8 - depth - (bit & 7))) & max;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const i = x * channels;
      let r: number, g: number, b: number, alpha = 255;
      if (colorType === 3) {
        const p = sample(y, i);
        if (!palette || p * 3 + 2 >= palette.length) throw new Error('PNG palette index out of range.');
        [r, g, b] = [palette[p * 3]!, palette[p * 3 + 1]!, palette[p * 3 + 2]!];
        if (transparency && p < transparency.length) alpha = transparency[p]!;
      } else if (colorType === 0 || colorType === 4) {
        const v = sample(y, i);
        r = g = b = Math.round((v * 255) / max);
        if (colorType === 4) alpha = sample(y, i + 1);
        else if (transparency && v === ((transparency[0]! << 8) | transparency[1]!)) alpha = 0;
      } else {
        [r, g, b] = [sample(y, i), sample(y, i + 1), sample(y, i + 2)];
        if (colorType === 6) alpha = sample(y, i + 3);
        else if (
          transparency &&
          r === ((transparency[0]! << 8) | transparency[1]!) &&
          g === ((transparency[2]! << 8) | transparency[3]!) &&
          b === ((transparency[4]! << 8) | transparency[5]!)
        )
          alpha = 0;
      }
      pixels[o] = r;
      pixels[o + 1] = g;
      pixels[o + 2] = b;
      pixels[o + 3] = alpha;
    }
  }
  return { width, height, data: pixels };
}
