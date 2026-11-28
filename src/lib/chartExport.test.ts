import { describe, expect, it } from 'vitest';
import { safeFileName } from './chartExport';

describe('chart export', () => {
  it('makes safe file names', () => {
    expect(safeFileName('Enchanted Diamond: buy price (7d)')).toBe('enchanted-diamond-buy-price-7d');
    expect(safeFileName('***')).toBe('chart');
  });
});
