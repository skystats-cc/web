// Pure helpers for the shared chart component (easy to unit test).

export interface Point {
  t: number; // epoch ms
  v: number;
}

/** Linear or log10 scale from [d0, d1] to [r0, r1] */
export function scale(d0: number, d1: number, r0: number, r1: number, log = false) {
  const f = log ? (x: number) => Math.log10(Math.max(x, 1)) : (x: number) => x;
  const a = f(d0);
  const b = f(d1);
  const span = b - a || 1;
  return (x: number) => r0 + ((f(x) - a) / span) * (r1 - r0);
}

/** About `count` round tick values covering [min, max] */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1e6; v += step) ticks.push(Number(v.toPrecision(12)));
  return ticks;
}

/** Log ticks: powers of ten inside the range */
export function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  for (let p = Math.floor(Math.log10(Math.max(min, 1))); 10 ** p <= max; p++) if (10 ** p >= min) ticks.push(10 ** p);
  return ticks.length ? ticks : [min, max];
}

/** Index of the point nearest to time `t` (points sorted by t) */
export function nearest(points: Point[], t: number): number {
  let lo = 0;
  let hi = points.length - 1;
  if (hi < 0) return -1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.t < t) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(points[lo - 1]!.t - t) <= Math.abs(points[lo]!.t - t)) return lo - 1;
  return lo;
}

/** SVG path for a line through the points */
export function linePath(points: Point[], x: (t: number) => number, y: (v: number) => number): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
}
