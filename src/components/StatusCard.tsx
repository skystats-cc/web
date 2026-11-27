import type { HypixelStatus } from '@skystats/api-client';
import { ago, componentTone, humanize, toneFor } from '../lib/status';

interface Props {
  data: HypixelStatus | null;
  error: Error | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function StatusCard({ data, error, loading, refresh }: Props) {
  const issues = data?.components.filter((c) => c.status !== 'operational') ?? [];
  const ok = (data?.components.length ?? 0) - issues.length;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Hypixel status</h2>
        <button className="ghost" onClick={() => void refresh()} disabled={loading}>
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="error">Couldn't load status: {error.message}</p>}

      {data && (
        <>
          <div className={`big tone-${toneFor(data.indicator)}`}>
            <span className="dot" aria-hidden />
            {data.description}
          </div>
          <p className="muted">
            {data.components.length > 0
              ? `${ok}/${data.components.length} components operational`
              : 'No component data yet'}{' '}
            · checked {ago(data.checkedAt)}
          </p>

          {issues.length > 0 && (
            <ul className="list">
              {issues.map((c) => (
                <li key={c.name}>
                  <span className={`dot tone-${componentTone(c.status)}`} aria-hidden />
                  {c.name}
                  <span className="muted right">{humanize(c.status)}</span>
                </li>
              ))}
            </ul>
          )}

          {data.incidents.length > 0 && (
            <>
              <h3>Incidents</h3>
              <ul className="list">
                {data.incidents.map((i) => (
                  <li key={i.name}>
                    {i.url ? (
                      <a href={i.url} target="_blank" rel="noreferrer">
                        {i.name}
                      </a>
                    ) : (
                      i.name
                    )}
                    <span className="muted right">{i.status}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
