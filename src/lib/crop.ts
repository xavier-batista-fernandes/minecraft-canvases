export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Clamp a requested crop to the image. A width or height of 0 (or one that runs past the edge)
 * means "to the edge of the image". Returns null when nothing is left to show.
 */
export function resolveCrop(
  imageWidth: number,
  imageHeight: number,
  requested: Partial<CropRect> = {},
): CropRect | null {
  const x = Math.max(0, Math.floor(requested.x ?? 0));
  const y = Math.max(0, Math.floor(requested.y ?? 0));
  let width = Math.floor(requested.width ?? 0);
  let height = Math.floor(requested.height ?? 0);
  if (width <= 0 || x + width > imageWidth) width = imageWidth - x;
  if (height <= 0 || y + height > imageHeight) height = imageHeight - y;
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}
