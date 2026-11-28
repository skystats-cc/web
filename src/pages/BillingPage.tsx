import { SkystatsApiError, type Entitlement } from '@skystats/api-client';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { gbp, PLANS } from '../lib/legal';
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
      <GiftsCard onRedeemed={(x) => setE(x)} />
    </main>
  );
}

function GiftsCard({ onRedeemed }: { onRedeemed: (e: Entitlement) => void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const gifted = new URLSearchParams(window.location.search).get('gift') === 'success';

  async function buy(tier: 'pro' | 'max') {
    setBusy(true);
    try {
      window.location.href = (await api.billing.gift(tier)).url;
    } catch {
      setMsg('Gifts aren’t available right now.');
      setBusy(false);
    }
  }
  async function redeem(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    try {
      onRedeemed(await api.billing.redeem(code));
      setMsg('Redeemed. Enjoy!');
      setCode('');
    } catch (err) {
      setMsg(err instanceof SkystatsApiError ? err.message : 'That code didn’t work.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card" style={{ marginTop: 20 }}>
      <h2>Gifts</h2>
      {gifted && <p className="notice">Thanks! The gift code is in your <Link href="/alerts">inbox</Link> in a minute or two.</p>}
      <p className="muted small">
        Give a friend one month of Pro ({gbp(PLANS[1]!.monthly)}) or Max ({gbp(PLANS[2]!.monthly)}), including VAT. It&rsquo;s a one-off payment, it never renews, and the code lasts two years. Not redeemed yet? We refund it within 14 days of buying.
      </p>
      <div className="row">
        <button className="ghost" disabled={busy} onClick={() => void buy('pro')}>Gift Pro</button>
        <button className="ghost" disabled={busy} onClick={() => void buy('max')}>Gift Max</button>
      </div>
      <form className="row" style={{ marginTop: 12 }} onSubmit={(e) => void redeem(e)}>
        <label className="grow">
          <span className="sr-only">Gift code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD-EFGH-JKLM-NPQR" maxLength={24} autoComplete="off" />
        </label>
        <button type="submit" disabled={busy || code.trim().length < 16}>Redeem</button>
      </form>
      {msg && <p className="small">{msg}</p>}
    </section>
  );
}
