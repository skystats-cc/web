import { describe, expect, it } from 'vitest';
import { linePath, logTicks, nearest, niceTicks, scale } from './chart';

describe('chart helpers', () => {
  it('scales linearly and logarithmically', () => {
    expect(scale(0, 10, 0, 100)(5)).toBe(50);
    expect(scale(1, 1000, 0, 3, true)(100)).toBeCloseTo(2);
  });
  it('makes round ticks', () => {
    expect(niceTicks(0, 100, 4)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(1.2e9, 1.9e9, 3)).toEqual([1.25e9, 1.5e9, 1.75e9]);
    expect(logTicks(5e5, 2e9)).toEqual([1e6, 1e7, 1e8, 1e9]);
  });
  it('finds the nearest point', () => {
    const pts = [0, 10, 20, 30].map((t) => ({ t, v: t }));
    expect(nearest(pts, 14)).toBe(1);
    expect(nearest(pts, 16)).toBe(2);
    expect(nearest(pts, 99)).toBe(3);
    expect(nearest([], 1)).toBe(-1);
  });
  it('draws a path', () => {
    expect(linePath([{ t: 0, v: 0 }, { t: 1, v: 1 }], (t) => t * 10, (v) => 10 - v * 10)).toBe('M0.0,10.0L10.0,0.0');
  });
});
