import type { MethodSummary, Tier } from '@skystats/api-client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { coins } from '../../lib/format';
import { Link } from '../../lib/router';

const FAMILIES: Record<MethodSummary['family'], string> = { curated: 'Curated', flip: 'Order flips', npc: 'NPC sells', craft: 'Crafting', custom: 'Your methods' };
const unit = (u: MethodSummary['unit']) => (u === 'hour' ? '/h' : ' each');

export function MethodsPage() {
  const [data, setData] = useState<{ tier: Tier; methods: MethodSummary[] } | null>(null);
  const [family, setFamily] = useState<'all' | MethodSummary['family']>('all');
  const [compare, setCompare] = useState<string[]>([]);

  useEffect(() => {
    api.methods.list().then(setData).catch(() => {});
  }, []);

  const list = useMemo(() => (data?.methods ?? []).filter((m) => family === 'all' || m.family === family), [data, family]);
  const chosen = (data?.methods ?? []).filter((m) => compare.includes(m.id));
  const maxVal = Math.max(1, ...chosen.map((m) => Math.abs(m.value ?? 0)));

  return (
    <main className="wrap">
      <section className="hero">
        <h1>Money-making methods</h1>
        <p className="lede">Every method is valued from live bazaar, auction and NPC prices. If a price is missing we show nothing rather than guess.</p>
      </section>

      <div className="row" style={{ marginBottom: 16 }}>
        <div className="segmented">
          {(['all', ...Object.keys(FAMILIES)] as ('all' | MethodSummary['family'])[]).map((f) => (
            <button key={f} className={f === family ? 'on' : ''} onClick={() => setFamily(f)}>
              {f === 'all' ? 'All' : FAMILIES[f]}
            </button>
          ))}
        </div>
        {data?.tier === 'max' && (
          <Link href="/methods/new" className="button">New custom method</Link>
        )}
      </div>

      {chosen.length > 1 && (
        <section className="card">
          <div className="card-head">
            <h2>Comparing {chosen.length}</h2>
            <button className="ghost" onClick={() => setCompare([])}>Clear</button>
          </div>
          {chosen.map((m) => (
            <div key={m.id} className="compare-row">
              <span>{m.name}</span>
              <span className={`compare-bar ${(m.value ?? 0) >= 0 ? 'pos' : 'neg'}`} style={{ width: `${(Math.abs(m.value ?? 0) / maxVal) * 100}%` }} />
              <span className="num">{coins(m.value)}{unit(m.unit)}</span>
            </div>
          ))}
          <p className="muted small">Methods measured per item and per hour aren&rsquo;t directly comparable.</p>
        </section>
      )}

      <div className="grid methods">
        {list.map((m) => (
          <section key={m.id} className={`card method ${m.locked ? 'locked' : ''}`}>
            <div className="card-head">
              <h2>
                <Link href={`/methods/${encodeURIComponent(m.id)}`}>{m.name}</Link>
              </h2>
              {!m.locked && m.value !== null && (
                <label className="small compare-check">
                  <input
                    type="checkbox"
                    checked={compare.includes(m.id)}
                    disabled={!compare.includes(m.id) && compare.length >= 4}
                    onChange={(e) => setCompare(e.target.checked ? [...compare, m.id] : compare.filter((x) => x !== m.id))}
                  />
                  Compare
                </label>
              )}
            </div>
            <div className="row">
              <span className="badge">{FAMILIES[m.family]}</span>
              {m.tier !== 'free' && <span className="badge accent">{m.tier === 'pro' ? 'Pro' : 'Max'}</span>}
              {m.beta && <span className="badge">Beta</span>}
            </div>
            <p className="value big-num">{m.locked ? '—' : m.value === null ? 'Price missing' : `${coins(m.value)}${unit(m.unit)}`}</p>
            {m.locked && <p className="muted small">Included with {m.tier === 'pro' ? 'Pro' : 'Max'}.</p>}
            {m.rating && (
              <p className="muted small">
                {m.rating.score >= 0 ? '+' : ''}{m.rating.score} from {m.rating.votes} {m.rating.votes === 1 ? 'vote' : 'votes'}
                {m.rating.worksYes + m.rating.worksNo > 0 && ` · ${Math.round((m.rating.worksYes / (m.rating.worksYes + m.rating.worksNo)) * 100)}% say it still works`}
              </p>
            )}
          </section>
        ))}
      </div>
      {data && list.length === 0 && <p className="muted">No methods here yet.</p>}
    </main>
  );
}
