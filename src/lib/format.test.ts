import { describe, expect, it } from 'vitest';
import { coins, mmss } from './format';

describe('format', () => {
  it('coins', () => {
    expect(coins(4_200_000.25)).toBe('4.2M');
    expect(coins(125_000_000.5)).toBe('125M');
    expect(coins(null)).toBe('—');
  });
  it('mmss', () => {
    expect(mmss(600_000)).toBe('10:00');
    expect(mmss(61_000)).toBe('1:01');
    expect(mmss(-5)).toBe('0:00');
  });
});

describe('number style', () => {
  it('switches between compact and full', async () => {
    const { coins, setNumberStyle } = await import('./format');
    setNumberStyle('full');
    expect(coins(1234567.8)).toBe('1,234,568');
    setNumberStyle('compact');
    expect(coins(1234567)).toBe('1.23M');
  });
});
