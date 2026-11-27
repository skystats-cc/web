import type { HypixelStatus, StatusIndicator } from '@skystats/api-client';

export type Tone = 'good' | 'warn' | 'bad' | 'unknown';

export function toneFor(indicator: StatusIndicator | undefined): Tone {
  switch (indicator) {
    case 'none':
      return 'good';
    case 'minor':
      return 'warn';
    case 'major':
    case 'critical':
      return 'bad';
    default:
      return 'unknown';
  }
}

export function componentTone(status: string): Tone {
  if (status === 'operational') return 'good';
  if (status === 'degraded_performance' || status === 'under_maintenance') return 'warn';
  if (status.includes('outage')) return 'bad';
  return 'unknown';
}

export function skyblockComponent(s: HypixelStatus | null) {
  return s?.components.find((c) => /skyblock/i.test(c.name)) ?? null;
}

export function humanize(status: string) {
  return status.replace(/_/g, ' ');
}

export function ago(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return 'never';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}
