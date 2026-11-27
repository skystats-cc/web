import type { Entitlement } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function BillingPage() {
  const { account, loading } = useSession();
  const [e, setE] = useState<Entitlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const justPaid = new URLSearchParams(window.location.search).get('checkout') === 'success';

  useEffect(() => {
    if (account) api.billing.entitlement().then(setE).catch(() => setError("Couldn't load your plan."));
  }, [account?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <main className="wrap narrow" />;
  if (!account) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          <Link href="/link" className="button">Link Minecraft</Link>
        </section>
      </main>
    );
  }

  async function portal() {
    try {
      window.location.href = (await api.billing.portal()).url;
    } catch {
      setError('The billing portal isn’t available right now.');
    }
  }

  const paid = e && e.tier !== 'free';
  return (
    <main className="wrap narrow">
      <h1 className="page-title">Billing</h1>
      {justPaid && <p className="notice">Thanks! Your plan can take a minute to show here.</p>}
      {error && <p className="error">{error}</p>}
      <section className="card">
        <div className="stats">
          <div>
            <span className="label">Plan</span>
            <span className="value cap">{e?.tier ?? '—'}</span>
          </div>
          <div>
            <span className="label">History kept</span>
            <span className="value">{e ? (e.retentionDays === null ? 'All time' : `${e.retentionDays} days`) : '—'}</span>
          </div>
          <div>
            <span className="label">{e?.cancelAtPeriodEnd || e?.status === 'canceled' ? 'Ends' : 'Renews'}</span>
            <span className="value">{e?.currentPeriodEnd ? dateFmt.format(new Date(e.currentPeriodEnd)) : '—'}</span>
          </div>
        </div>
        {e?.status === 'past_due' && e.graceUntil && (
          <p className="warn">Your last payment failed. Paid features stay on until {dateFmt.format(new Date(e.graceUntil))}.</p>
        )}
        <div className="row" style={{ marginTop: 16 }}>
          {paid || e?.status === 'canceled' ? (
            <button onClick={() => void portal()}>Manage or cancel plan</button>
          ) : (
            <Link href="/pricing" className="button">See plans</Link>
          )}
        </div>
        <p className="muted small">Cancelling, changing plan and invoices are handled by Stripe. Cancel within 14 days of buying for a full refund.</p>
      </section>
    </main>
  );
}
