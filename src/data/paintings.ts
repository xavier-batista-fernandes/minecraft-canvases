import manifest from './paintings.json';
import { PIXELS_PER_BLOCK } from '../lib/render';

export interface Painting {
  /** Texture name in Minecraft, also the PNG file name in `public/paintings/`. */
  id: string;
  /** Title as listed on the Minecraft Wiki. */
  name: string;
  /** Size in texture pixels (16 per block). */
  width: number;
  height: number;
}

export const PAINTINGS: readonly Painting[] = manifest;

export const DEFAULT_PAINTING_ID = 'kebab';

export function paintingUrl(painting: Painting): string {
  return `${import.meta.env.BASE_URL}paintings/${painting.id}.png`;
}

export interface PaintingGroup {
  /** e.g. "2×1" (width × height in blocks). */
  label: string;
  width: number;
  height: number;
  paintings: Painting[];
}

/** Filter by name or id, then group by size in blocks, smallest first (like the wiki's Painting page). */
export function groupPaintings(paintings: readonly Painting[], query = ''): PaintingGroup[] {
  const q = query.trim().toLowerCase();
  const groups = new Map<string, PaintingGroup>();
  [...paintings]
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.id.includes(q))
    .sort((a, b) => a.width * a.height - b.width * b.height || a.width - b.width)
    .forEach((p) => {
      const label = `${p.width / PIXELS_PER_BLOCK}×${p.height / PIXELS_PER_BLOCK}`;
      let group = groups.get(label);
      if (!group) {
        group = { label, width: p.width, height: p.height, paintings: [] };
        groups.set(label, group);
      }
      group.paintings.push(p);
    });
  return [...groups.values()];
}
