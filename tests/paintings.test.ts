import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import manifest from '../src/data/paintings.json';
import { groupPaintings } from '../src/data/paintings';

const dir = fileURLToPath(new URL('../public/paintings/', import.meta.url));

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('painting manifest', () => {
  it('has unique ids', () => {
    const ids = manifest.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(manifest)('$id has a PNG of the listed size, in whole blocks', (p) => {
    expect(pngSize(`${dir}${p.id}.png`)).toEqual({ width: p.width, height: p.height });
    expect(p.width % 16).toBe(0);
    expect(p.height % 16).toBe(0);
  });

  it('has no PNGs missing from the manifest', () => {
    const files = readdirSync(dir).filter((f) => f.endsWith('.png'));
    expect(files.sort()).toEqual(manifest.map((p) => `${p.id}.png`).sort());
  });
});

describe('groupPaintings', () => {
  it('groups by block size, smallest first', () => {
    const labels = groupPaintings(manifest).map((g) => g.label);
    expect(labels[0]).toBe('1×1');
    expect(labels).toContain('4×4');
  });

  it('filters by name or id, case-insensitively', () => {
    const names = groupPaintings(manifest, 'WANDER').flatMap((g) => g.paintings.map((p) => p.id));
    expect(names).toEqual(['wanderer']);
    expect(groupPaintings(manifest, 'no such painting')).toEqual([]);
  });
});
