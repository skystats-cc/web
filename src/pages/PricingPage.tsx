import { useState } from 'react';
import { api } from '../lib/api';
import { gbp, PLANS } from '../lib/legal';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

// Plain comparison, no countdowns or pressure: UK consumer law bans aggressive selling and
// direct exhortations to children to buy, and many SkyBlock players are under 18.
export function PricingPage() {
  const { account } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Creator codes come from a creator's link (?creator=name). They're paid partnerships, so the
  // page says so (ASA/CAP code). No discount is promised here; discount codes go on Stripe's page.
  const [creator] = useState(() => {
    const c = new URLSearchParams(window.location.search).get('creator');
    return c && /^[A-Za-z0-9_-]{2,24}$/.test(c) ? c : null;
  });

  async function choose(tier: 'pro' | 'max') {
    setBusy(tier);
    setError(null);
    try {
      window.location.href = (await api.billing.checkout(tier, 'month', creator ?? undefined)).url;
    } catch {
      setError('Checkout isn’t available right now.');
      setBusy(null);
    }
  }

  return (
    <main className="wrap">
      <section className="hero">
        <h1>Plans</h1>
        <p className="lede">Free covers the basics. Paid plans keep your history for longer and unlock more methods and alerts.</p>
      </section>
      {error && <p className="error">{error}</p>}
      {creator && (
        <p className="notice small">
          <span className="badge">Ad</span> You came from <strong>{creator}</strong>&rsquo;s link. SkyStats pays {creator} a share if you subscribe. It doesn&rsquo;t change your price.
        </p>
      )}
      <div className="grid plans">
        {PLANS.map((p) => (
          <section key={p.tier} className="card plan">
            <h2>{p.name}</h2>
            <p className="price">
              {gbp(p.monthly)}
              {p.monthly > 0 && <span className="muted"> a month</span>}
            </p>
            <ul className="list">
              <li>History kept: {p.retention}</li>
              <li>{p.modules}</li>
              <li>Hypixel outage and patch alerts</li>
              <li>Data download and deletion</li>
            </ul>
            {p.tier !== 'free' &&
              (account ? (
                <button onClick={() => void choose(p.tier)} disabled={busy !== null}>
                  {busy === p.tier ? 'Opening checkout…' : `Choose ${p.name}`}
                </button>
              ) : (
                <Link href="/link" className="button">Link Minecraft to subscribe</Link>
              ))}
          </section>
        ))}
      </div>
      <section className="card terms-summary">
        <h2>Before you pay</h2>
        <ul>
          <li>Prices include VAT. The price shown is the total you pay each month.</li>
          <li>Plans renew automatically each month until you cancel.</li>
          <li>Cancel at any time from the billing page, in as few steps as it took to sign up. You keep paid features until the end of the month you paid for.</li>
          <li>Changed your mind? Cancel within 14 days of buying for a full refund.</li>
          <li>If a payment fails, paid features stay on for 7 days while you sort it out.</li>
          <li>Got a discount code? Enter it on the payment page.</li>
          <li>When you leave a paid plan, older history is hidden for 30 days, then deleted. Resubscribe within 30 days to get it back.</li>
        </ul>
        <p className="muted small">
          Full details are in the <Link href="/terms">terms</Link>. If you&rsquo;re under 18, check with a parent or carer before buying anything.
        </p>
      </section>
    </main>
  );
}
