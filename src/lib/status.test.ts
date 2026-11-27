import { describe, expect, it } from 'vitest';
import { ago, componentTone, toneFor } from './status';

describe('status helpers', () => {
  it('maps indicators to tones', () => {
    expect(toneFor('none')).toBe('good');
    expect(toneFor('minor')).toBe('warn');
    expect(toneFor('critical')).toBe('bad');
    expect(toneFor('unknown')).toBe('unknown');
  });
  it('maps component status', () => {
    expect(componentTone('operational')).toBe('good');
    expect(componentTone('partial_outage')).toBe('bad');
  });
  it('formats relative time', () => {
    const now = Date.parse('2026-01-01T00:10:00Z');
    expect(ago('2026-01-01T00:09:30Z', now)).toBe('30s ago');
    expect(ago('2026-01-01T00:05:00Z', now)).toBe('5m ago');
    expect(ago(null, now)).toBe('never');
  });
});
