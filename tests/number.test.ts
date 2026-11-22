import { describe, expect, it } from 'vitest';
import { clampWholeNumber, isWholeNumberInRange } from '../src/lib/number';

describe('clampWholeNumber', () => {
  it('keeps a value that is in range', () => {
    expect(clampWholeNumber('7', 1, 24, 24)).toBe(7);
  });

  it('clamps values below and above the bounds', () => {
    expect(clampWholeNumber('0', 1, 24, 24)).toBe(1);
    expect(clampWholeNumber('-5', 1, 24, 24)).toBe(1);
    expect(clampWholeNumber('99', 1, 24, 24)).toBe(24);
  });

  it('rounds decimals', () => {
    expect(clampWholeNumber('3.6', 1, 24, 24)).toBe(4);
    expect(clampWholeNumber(' 3.2 ', 1, 24, 24)).toBe(3);
  });

  it('falls back when the input is not a number', () => {
    expect(clampWholeNumber('', 1, 24, 10)).toBe(10);
    expect(clampWholeNumber('abc', 1, 24, 10)).toBe(10);
  });

  it('keeps the fallback itself within the bounds', () => {
    expect(clampWholeNumber('', 1, 8, 24)).toBe(8);
  });
});

describe('isWholeNumberInRange', () => {
  it('accepts whole numbers within the bounds', () => {
    expect(isWholeNumberInRange('1', 1, 24)).toBe(true);
    expect(isWholeNumberInRange('24', 1, 24)).toBe(true);
  });

  it('rejects empty, partial, decimal and out of range input', () => {
    for (const raw of ['', '-', '2.5', '0', '25', 'e3']) expect(isWholeNumberInRange(raw, 1, 24)).toBe(false);
  });
});
