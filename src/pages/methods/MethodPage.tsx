import type { MethodDetail } from '@skystats/api-client';
import { SkystatsApiError } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { GatedSection, Locked, useGated } from '../../components/Gate';
import { LineChart } from '../../components/LineChart';
import { api } from '../../lib/api';
import { coins } from '../../lib/format';
import { Link, navigate } from '../../lib/router';
import { useSession } from '../../lib/session';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const SOURCES = { instasell: 'instasell', instabuy: 'instabuy', npc: 'NPC', bin: 'lowest BIN' } as const;

export function MethodPage({ id }: { id: string }) {
  const { account } = useSession();
  const [m, setM] = useState<MethodDetail | null>(null);
  const [state, setState] = useState<'loading' | 'locked' | 'missing' | 'ok'>('loading');
  const [lockedMsg, setLockedMsg] = useState('');
  const [voted, setVoted] = useState<string | null>(null);
  const history = useGated(() => api.methods.history(id, 30), [id]);

  useEffect(() => {
    api.methods
      .get(id)
      .then((d) => (setM(d), setState('ok')))
      .catch((err) => {
        if (err instanceof SkystatsApiError && err.status === 403) {
          setLockedMsg(err.message);
          setState('locked');
        } else setState('missing');
      });
  }, [id]);

  async function vote(v: 1 | -1, stillWorks?: boolean) {
    await api.methods.vote(id, v, stillWorks === undefined ? {} : { stillWorks }).catch(() => {});
    setVoted('Thanks, your rating is saved.');
  }

  if (state === 'loading') return <main className="wrap narrow" />;
  if (state !== 'ok' || !m) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          {state === 'locked' ? <Locked message={lockedMsg} /> : <h2>Method not found</h2>}
          <Link href="/methods">All methods</Link>
        </section>
      </main>
    );
  }

  const custom = m.id.startsWith('custom:');
  return (
    <main className="wrap narrow">
      <p className="muted small"><Link href="/methods">Methods</Link></p>
      <h1 className="page-title">{m.name}</h1>
      <p className="value big-num">{m.value === null ? 'A price is missing' : `${coins(m.value)} ${m.unit === 'hour' ? 'per hour' : 'each'}`}</p>
      <p className="muted small">{m.source}</p>

      <section className="card">
        <h2>Breakdown at current prices</h2>
        <table className="data">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {m.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.side === 'in' ? '−' : '+'} <Link href={`/bazaar/${l.item}`}>{l.name}</Link></td>
                <td className="num">{l.qty}</td>
                <td className="num">{coins(l.unitPrice)} <span className="muted small">{SOURCES[l.source]}</span></td>
                <td className={`num ${(l.total ?? 0) >= 0 ? 'pos' : 'neg'}`}>{coins(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {m.requirements.length > 0 && (
        <section className="card">
          <h2>Requirements</h2>
          <ul className="checklist">
            {m.requirements.map((r) => (
              <li key={r}><label><input type="checkbox" /> {r}</label></li>
            ))}
          </ul>
        </section>
      )}

      {!custom && (
        <GatedSection title="Value over the last 30 days" state={history}>
          <LineChart
            height={180}
            points={(history.data?.points ?? []).map((p) => ({ t: new Date(p.hour).getTime(), v: p.value }))}
            formatValue={coins}
            formatTime={(t) => dateFmt.format(t)}
            label={`${m.name} value over 30 days`}
          />
        </GatedSection>
      )}

      {!custom && account && (
        <section className="card">
          <h2>Rate this method</h2>
          {voted ? (
            <p className="notice">{voted}</p>
          ) : (
            <div className="row">
              <button className="ghost" onClick={() => void vote(1, true)}>👍 Still works</button>
              <button className="ghost" onClick={() => void vote(-1, false)}>👎 Doesn&rsquo;t work any more</button>
            </div>
          )}
        </section>
      )}

      {custom && (
        <div className="row">
          <Link href={`/methods/edit/${m.id.slice(7)}`} className="button ghost">Edit</Link>
          <button className="ghost" onClick={() => void api.methods.deleteCustom(m.id.slice(7)).then(() => navigate('/methods'))}>Delete</button>
        </div>
      )}
    </main>
  );
}
