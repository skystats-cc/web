import { SkystatsApiError } from '@skystats/api-client';
import { useState } from 'react';
import { api } from '../lib/api';

interface Ping {
  ms: number | null; // null = failed
  at: number;
}

const MAX = 20;

export function PingCard() {
  const [pings, setPings] = useState<Ping[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  async function ping() {
    setBusy(true);
    const start = performance.now();
    try {
      await api.health();
      setPings((p) => [...p, { ms: Math.round(performance.now() - start), at: Date.now() }].slice(-MAX));
      setLastError(null);
    } catch (err) {
      setPings((p) => [...p, { ms: null, at: Date.now() }].slice(-MAX));
      setLastError(err instanceof SkystatsApiError && err.unreachable ? 'API unreachable' : String(err));
    } finally {
      setBusy(false);
    }
  }

  const ok = pings.filter((p) => p.ms !== null).map((p) => p.ms!);
  const last = pings.at(-1);
  const avg = ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null;
  const peak = Math.max(50, ...ok);

  return (
    <section className="card">
      <div className="card-head">
        <h2>SkyStats API</h2>
        <button onClick={() => void ping()} disabled={busy}>
          {busy ? 'Pinging…' : 'Ping'}
        </button>
      </div>

      <div className="stats">
        <div>
          <span className="label">Last</span>
          <span className="value">{last ? (last.ms === null ? 'failed' : `${last.ms} ms`) : '—'}</span>
        </div>
        <div>
          <span className="label">Average</span>
          <span className="value">{avg !== null ? `${avg} ms` : '—'}</span>
        </div>
        <div>
          <span className="label">Pings</span>
          <span className="value">{pings.length}</span>
        </div>
      </div>

      <div className="bars" aria-label="Recent ping times">
        {pings.length === 0 && <span className="muted">Press Ping to measure round-trip time.</span>}
        {pings.map((p) => (
          <span
            key={p.at}
            className={`bar ${p.ms === null ? 'failed' : ''}`}
            style={{ height: p.ms === null ? '100%' : `${Math.max(6, (p.ms / peak) * 100)}%` }}
            title={p.ms === null ? 'failed' : `${p.ms} ms`}
          />
        ))}
      </div>
      {lastError && <p className="error">{lastError}</p>}
    </section>
  );
}
