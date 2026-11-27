import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { linePath, logTicks, nearest, niceTicks, scale, type Point } from '../lib/chart';

interface Props {
  points: Point[];
  /** Optional low/high band per point (e.g. daily min/max) */
  band?: { t: number; lo: number; hi: number }[];
  height?: number;
  log?: boolean;
  formatValue: (v: number) => string;
  formatTime: (t: number) => string;
  label: string; // accessible description
}

const W = 720;
const PAD = { top: 12, right: 12, bottom: 26, left: 58 };

/** The one chart used across the site: line, optional band, crosshair tooltip, log scale. */
export function LineChart({ points, band, height = 240, log = false, formatValue, formatTime, label }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    if (points.length === 0) return null;
    const ts = points.map((p) => p.t);
    const vs = [...points.map((p) => p.v), ...(band ?? []).flatMap((b) => [b.lo, b.hi])];
    let lo = Math.min(...vs);
    let hi = Math.max(...vs);
    if (lo === hi) {
      lo = log ? lo / 2 : lo - Math.max(1, Math.abs(lo) * 0.05);
      hi = log ? hi * 2 : hi + Math.max(1, Math.abs(hi) * 0.05);
    }
    if (log) lo = Math.max(lo, 1);
    const x = scale(Math.min(...ts), Math.max(...ts), PAD.left, W - PAD.right);
    const y = scale(lo, hi, height - PAD.bottom, PAD.top, log);
    const yTicks = log ? logTicks(lo, hi) : niceTicks(lo, hi, 4);
    const tMin = Math.min(...ts);
    const tMax = Math.max(...ts);
    const xTicks = points.length > 1 ? [0, 1, 2, 3].map((i) => tMin + ((tMax - tMin) * i) / 3) : [tMin];
    const bandPath = band?.length
      ? `${band.map((b, i) => `${i ? 'L' : 'M'}${x(b.t).toFixed(1)},${y(b.hi).toFixed(1)}`).join('')}${[...band]
          .reverse()
          .map((b) => `L${x(b.t).toFixed(1)},${y(b.lo).toFixed(1)}`)
          .join('')}Z`
      : null;
    return { x, y, yTicks, xTicks, path: linePath(points, x, y), bandPath };
  }, [points, band, height, log]);

  if (!geo) return <div className="chart-empty muted">No data in this range yet.</div>;

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t0 = points[0]!.t;
    const t1 = points[points.length - 1]!.t;
    const t = t0 + ((px - PAD.left) / (W - PAD.left - PAD.right)) * (t1 - t0);
    setHover(nearest(points, t));
  }

  const h = hover !== null ? points[hover] : null;
  return (
    <figure className="chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label={label}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {geo.yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className="grid" />
            <text x={PAD.left - 8} y={geo.y(v)} className="tick" textAnchor="end" dominantBaseline="middle">
              {formatValue(v)}
            </text>
          </g>
        ))}
        {geo.xTicks.map((t, i) => (
          <text key={i} x={geo.x(t)} y={height - 6} className="tick" textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>
            {formatTime(t)}
          </text>
        ))}
        {geo.bandPath && <path d={geo.bandPath} className="band" />}
        <path d={geo.path} className="line" />
        {h && (
          <g>
            <line x1={geo.x(h.t)} x2={geo.x(h.t)} y1={PAD.top} y2={height - PAD.bottom} className="crosshair" />
            <circle cx={geo.x(h.t)} cy={geo.y(h.v)} r={4} className="dot-point" />
          </g>
        )}
      </svg>
      {h && (
        <figcaption className="chart-tip" style={{ left: `${(geo.x(h.t) / W) * 100}%` }}>
          <strong>{formatValue(h.v)}</strong>
          <span>{formatTime(h.t)}</span>
        </figcaption>
      )}
    </figure>
  );
}
