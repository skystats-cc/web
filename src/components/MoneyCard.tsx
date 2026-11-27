import type { MoneyHistory, MoneyRange, Profile } from '@skystats/api-client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { coins } from '../lib/format';
import { Link } from '../lib/router';
import { LineChart } from './LineChart';

const RANGES: MoneyRange[] = ['1d', '7d', '30d', '90d', '1y', 'all'];
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export function MoneyCard({ profiles }: { profiles: Profile[] }) {
  const [profileId, setProfileId] = useState(profiles.find((p) => p.selected)?.id ?? profiles[0]?.id);
  const [range, setRange] = useState<MoneyRange>('7d');
  const [log, setLog] = useState(false);
  const [data, setData] = useState<MoneyHistory | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let live = true;
    api.me
      .money(profileId, range)
      .then((d) => live && (setData(d), setError(false)))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [profileId, range]);

  const series = useMemo(() => {
    const pts = (data?.points ?? [])
      .filter((p) => p.total !== null)
      .map((p) => ({ t: new Date(p.t).getTime(), v: p.total as number, lo: p.min ?? null, hi: p.max ?? null }));
    const band = data?.resolution === 'daily' ? pts.filter((p) => p.lo !== null && p.hi !== null).map((p) => ({ t: p.t, lo: p.lo!, hi: p.hi! })) : undefined;
    return { points: pts.map(({ t, v }) => ({ t, v })), band };
  }, [data]);

  const first = series.points[0]?.v;
  const last = series.points[series.points.length - 1]?.v;
  const change = first !== undefined && last !== undefined ? last - first : null;
  const short = range === '1d' || range === '7d';

  return (
    <section className="card money">
      <div className="card-head">
        <h2>Coins over time</h2>
        <div className="row">
          {profiles.length > 1 && (
            <select value={profileId} onChange={(e) => setProfileId(e.target.value)} aria-label="Profile">
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? 'Profile'}
                </option>
              ))}
            </select>
          )}
          <div className="segmented" role="group" aria-label="Range">
            {RANGES.map((r) => (
              <button key={r} className={r === range ? 'on' : ''} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <label className="switch small">
            <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} />
            <span className="slider" aria-hidden />
            Log
          </label>
        </div>
      </div>

      <div className="stats">
        <div>
          <span className="label">Now</span>
          <span className="value">{coins(last)}</span>
        </div>
        <div>
          <span className="label">Change ({range})</span>
          <span className={`value ${change !== null && change < 0 ? 'neg' : 'pos'}`}>
            {change === null ? '—' : `${change >= 0 ? '+' : ''}${coins(change)}`}
          </span>
        </div>
        <div>
          <span className="label">Kept by your plan</span>
          <span className="value">{data ? (data.retentionDays === null ? 'All time' : `${data.retentionDays} days`) : '—'}</span>
        </div>
      </div>

      {error ? (
        <p className="error">Couldn't load your history.</p>
      ) : (
        <LineChart
          points={series.points}
          band={series.band}
          log={log}
          formatValue={coins}
          formatTime={(t) => (short && range === '1d' ? timeFmt.format(t) : dateFmt.format(t))}
          label={`Total coins (purse and banks) over ${range}`}
        />
      )}

      <p className="muted small">
        Recorded by the SkyStats mod while you play. Purse, personal bank and shared bank added together.
        {data?.clippedByTier && (
          <>
            {' '}
            Your plan keeps {data.retentionDays} days, so older data isn't shown. <Link href="/pricing">Compare plans</Link>.
          </>
        )}
      </p>
    </section>
  );
}
