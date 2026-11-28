let numberStyle: 'compact' | 'full' = 'compact';
/** Set from the display preference: "1.23M" (compact) or "1,234,567" (full) */
export function setNumberStyle(style: 'compact' | 'full') {
  numberStyle = style;
}
const fullFmt = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

// 1234 -> "1.23k", 3_400_000 -> "3.4M", 1_100_000_000 -> "1.1B" (or "1,234" with the full style)
export function coins(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (numberStyle === 'full') return fullFmt.format(n);
  const abs = Math.abs(n);
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'k'],
  ];
  for (const [size, suffix] of units) if (abs >= size) return `${trim(n / size)}${suffix}`;
  return trim(n);
}

function trim(n: number) {
  const digits = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
  return Number(n.toFixed(digits)).toString();
}

export function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Minecraft head for a UUID (rendered by mc-heads.net) */
export const avatarUrl = (uuid: string, size = 32) => `https://mc-heads.net/avatar/${uuid}/${size}`;

export const GAME_MODES: Record<string, string> = {
  normal: '',
  ironman: '♲ Ironman',
  island: '☀ Stranded',
  bingo: 'Ⓑ Bingo',
};
