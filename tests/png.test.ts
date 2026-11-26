import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import manifest from '../src/data/paintings.json';
import { toHex } from '../src/lib/color';
import { decodePng, type Inflate } from '../src/lib/png';
import { buildChart, countColors } from '../src/lib/quantize';

const inflate: Inflate = async (data) => new Uint8Array(inflateSync(data));
const dir = fileURLToPath(new URL('../public/paintings/', import.meta.url));
const painting = (id: string) => decodePng(new Uint8Array(readFileSync(`${dir}${id}.png`)), inflate);

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set([...type].map((c) => c.charCodeAt(0)), 4);
  out.set(data, 8);
  return out; // the decoder does not check CRCs, so they are left as zero
}

/** A tiny PNG with the given header fields and already-filtered rows (each row starts with its filter byte). */
function png(width: number, height: number, depth: number, colorType: number, rows: number[], extra: Uint8Array[] = []): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr.set([depth, colorType, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    ...extra,
    chunk('IDAT', new Uint8Array(deflateSync(Uint8Array.from(rows)))),
    chunk('IEND', new Uint8Array()),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  parts.reduce((o, p) => (out.set(p, o), o + p.length), 0);
  return out;
}

describe('decodePng', () => {
  it('decodes RGB with every row filter', async () => {
    // 2×5 RGB, pixels (10,20,30) and (40,60,80) on every row, each row with a different filter.
    const plain = [10, 20, 30, 40, 60, 80];
    const rows = [
      [0, ...plain], // none
      [1, 10, 20, 30, 30, 40, 50], // sub
      [2, 0, 0, 0, 0, 0, 0], // up
      [3, 5, 10, 15, 15, 20, 25], // average: x - floor((left + up) / 2)
      [4, 0, 0, 0, 0, 0, 0], // paeth: predicts "up" here
    ].flat();
    const { width, height, data } = await decodePng(png(2, 5, 8, 2, rows), inflate);
    expect([width, height]).toEqual([2, 5]);
    for (let y = 0; y < 5; y++) {
      expect([...data.subarray(y * 8, y * 8 + 8)]).toEqual([10, 20, 30, 255, 40, 60, 80, 255]);
    }
  });

  it('decodes RGBA', async () => {
    const { data } = await decodePng(png(1, 1, 8, 6, [0, 1, 2, 3, 4]), inflate);
    expect([...data]).toEqual([1, 2, 3, 4]);
  });

  it('decodes 4-bit palettes with transparency', async () => {
    const plte = chunk('PLTE', Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255]));
    const trns = chunk('tRNS', Uint8Array.from([255, 0]));
    // 3 pixels at 4 bits: indices 0, 1, 2 → bytes 0x01, 0x20.
    const { data } = await decodePng(png(3, 1, 4, 3, [0, 0x01, 0x20], [plte, trns]), inflate);
    expect([...data]).toEqual([255, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 255]);
  });

  it('decodes grayscale with alpha', async () => {
    const { data } = await decodePng(png(1, 1, 8, 4, [0, 200, 100]), inflate);
    expect([...data]).toEqual([200, 200, 200, 100]);
  });

  it('rejects files that are not PNGs', async () => {
    await expect(decodePng(Uint8Array.from([1, 2, 3]), inflate)).rejects.toThrow('Not a PNG');
  });

  it.each(manifest)('decodes $id at its listed size', async (p) => {
    const { width, height, data } = await painting(p.id);
    expect([width, height]).toEqual([p.width, p.height]);
    expect(data.length).toBe(width * height * 4);
  });
});

describe('paint numbers are stable', () => {
  // Guards the numbering painters rely on: the same painting and paint count must always give
  // the same numbers. If this fails after an intentional algorithm change, say so in the changelog.
  it('Paradisträd with 25 paints', async () => {
    const source = await painting('plant');
    const area = { x: 0, y: 0, width: 16, height: 16 };
    expect(countColors(source, area)).toBe(210);
    const chart = buildChart(source, area, 25);
    expect(chart.palette.map((p) => `${p.number} ${toHex(p)} ×${p.count}`)).toMatchSnapshot();
    expect(toHex(chart.palette[20]!)).toBe('#B8CCBD');
  });
});
