import { describe, expect, it } from 'vitest';
import { resolveCrop } from '../src/lib/crop';

describe('resolveCrop', () => {
  it('uses the whole image by default', () => {
    expect(resolveCrop(32, 16)).toEqual({ x: 0, y: 0, width: 32, height: 16 });
  });

  it('treats 0 width/height as "to the edge"', () => {
    expect(resolveCrop(64, 64, { x: 16, y: 32, width: 0, height: 0 })).toEqual({ x: 16, y: 32, width: 48, height: 32 });
  });

  it('clamps a crop that runs past the edge', () => {
    expect(resolveCrop(32, 32, { x: 20, y: 0, width: 32, height: 16 })).toEqual({ x: 20, y: 0, width: 12, height: 16 });
  });

  it('returns null when the offset is outside the image', () => {
    expect(resolveCrop(16, 16, { x: 16 })).toBeNull();
  });
});
