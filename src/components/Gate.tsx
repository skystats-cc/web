import { SkystatsApiError } from '@skystats/api-client';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '../lib/router';

/** Loads gated data; shows a short, neutral note instead of the content when the plan doesn't include it. */
export function useGated<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; locked?: string; error?: boolean }>({});
  useEffect(() => {
    let live = true;
    setState({});
    load()
      .then((data) => live && setState({ data }))
      .catch((err) => {
        if (!live) return;
        if (err instanceof SkystatsApiError && err.status === 403) setState({ locked: err.message });
        else setState({ error: true });
      });
    return () => {
      live = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

export function Locked({ message }: { message: string }) {
  return (
    <p className="muted small locked">
      {message}. <Link href="/pricing">Compare plans</Link>.
    </p>
  );
}

export function GatedSection({ title, state, children }: { title: string; state: { data?: unknown; locked?: string; error?: boolean }; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {state.locked ? <Locked message={state.locked} /> : state.error ? <p className="error small">Couldn&rsquo;t load this.</p> : state.data ? children : <p className="muted small">Loading…</p>}
    </section>
  );
}
