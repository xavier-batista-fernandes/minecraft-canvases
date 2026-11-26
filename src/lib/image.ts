import { decodePng, type Inflate } from './png';
import type { PixelSource } from './quantize';

/** zlib inflate with the browser's built-in DecompressionStream. */
const inflate: Inflate = async (data) => {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

/**
 * Fetch a PNG and decode its exact pixels. This deliberately avoids drawing on a canvas: some
 * browsers add privacy noise to canvas reads, which would change the colors on every visit.
 */
export async function loadPixels(url: string): Promise<PixelSource> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not read image: ${url}`);
  return decodePng(new Uint8Array(await response.arrayBuffer()), inflate);
}
