import type { Leaderboard } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { coins } from '../lib/format';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

const BOARDS = { gain: 'Coins gained', consistency: 'Consistency', coop: 'Co-ops' } as const;
const SCOPES = [
  ['global', 'Everyone'],
  ['mode:normal', 'Classic'],
  ['mode:ironman', 'Ironman'],
  ['mode:island', 'Stranded'],
] as const;

export function LeaderboardsPage() {
  const { account } = useSession();
  const [board, setBoard] = useState<keyof typeof BOARDS>('gain');
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [scope, setScope] = useState('global');
  const [data, setData] = useState<Leaderboard | null>(null);

  useEffect(() => {
    api.social.leaderboard({ board, period, scope: board === 'gain' ? scope : 'global' }).then(setData).catch(() => setData(null));
  }, [board, period, scope]);

  const show = (v: number) => (board === 'consistency' ? `${Math.round(v * 100)}% of days` : coins(v));
  return (
    <main className="wrap narrow">
      <h1 className="page-title">Leaderboards</h1>
      <p className="muted">
        Only players who chose to appear are listed, ranked from coins recorded by the SkyStats mod.
        {account && <> Turn it on or off in <Link href="/settings">Privacy settings</Link>.</>}
      </p>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="segmented">
          {(Object.keys(BOARDS) as (keyof typeof BOARDS)[]).map((b) => (
            <button key={b} className={b === board ? 'on' : ''} onClick={() => setBoard(b)}>{BOARDS[b]}</button>
          ))}
        </div>
        <div className="segmented">
          {(['7d', '30d'] as const).map((p) => (
            <button key={p} className={p === period ? 'on' : ''} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        {board === 'gain' && (
          <select value={scope} onChange={(e) => setScope(e.target.value)} aria-label="Game mode">
            {SCOPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </div>
      <section className="card">
        {data?.you && <p className="notice">You&rsquo;re #{data.you.rank} with {show(data.you.value)}.</p>}
        {data && data.entries.length === 0 && <p className="muted small">Nobody here yet.</p>}
        <ol className="board">
          {data?.entries.map((e) => (
            <li key={e.rank} className={e.isYou ? 'you' : ''}>
              <span className="rank">{e.rank}</span>
              <span>{e.label}</span>
              <span className="num right">{show(e.value)}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
