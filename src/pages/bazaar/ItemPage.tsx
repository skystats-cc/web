import type { AuctionPrices, BazaarProduct, BazaarSnapshot } from '@skystats/api-client';
import { useEffect, useMemo, useState } from 'react';
import { GatedSection, useGated } from '../../components/Gate';
import { LineChart } from '../../components/LineChart';
import { api } from '../../lib/api';
import { coins } from '../../lib/format';
import { Link, useQueryParam } from '../../lib/router';
import { useSession } from '../../lib/session';

const RANGES = [
  ['1d', 1],
  ['7d', 7],
  ['30d', 30],
  ['90d', 90],
  ['1y', 365],
  ['All', 3650],
] as const;
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ItemPage({ id }: { id: string }) {
  const { account } = useSession();
  const [p, setP] = useState<BazaarProduct | null>(null);
  const [missing, setMissing] = useState(false);
  const [rangeKey, setRangeKey] = useQueryParam('range', RANGES.map(([l]) => l), RANGES.find(([, d]) => d === 7)![0]);
  const days = RANGES.find(([l]) => l === rangeKey)![1];
  const setDays = (d: number) => setRangeKey(RANGES.find(([, x]) => x === d)![0]);
  const [hist, setHist] = useState<BazaarSnapshot[]>([]);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [markers, setMarkers] = useState<{ t: number; label: string }[]>([]);
  const [watching, setWatching] = useState(false);
  const [auction, setAuction] = useState<AuctionPrices | null>(null);

  useEffect(() => {
    setP(null);
    api.bazaar.get(id).then(setP).catch(() => setMissing(true));
    api.market.auction(id).then(setAuction).catch(() => setAuction(null));
    // Game updates as chart markers
    api.news().then((n) => setMarkers(n.news.filter((x) => x.publishedAt).map((x) => ({ t: new Date(x.publishedAt!).getTime(), label: 'Update' })))).catch(() => {});
  }, [id]);
  useEffect(() => {
    api.bazaar.history(id, days).then((r) => setHist(r.snapshots)).catch(() => setHist([]));
  }, [id, days]);
  useEffect(() => {
    if (account) api.market.watchlist().then((r) => setWatching(r.items.some((i) => i.productId === id))).catch(() => {});
  }, [account?.uuid, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const points = useMemo(() => hist.map((h) => ({ t: new Date(h.takenAt).getTime(), v: side === 'buy' ? h.buyPrice : h.sellPrice })), [hist, side]);

  if (missing) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          <h2>No bazaar item called {id}</h2>
          <Link href="/bazaar">Back to the bazaar</Link>
        </section>
      </main>
    );
  }
  if (!p) return <main className="wrap" />;

  async function toggleWatch() {
    if (watching) await api.market.unwatch(id).catch(() => {});
    else await api.market.watch(id).catch(() => {});
    setWatching(!watching);
  }

  const embed = new URL(api.market.embedUrl(id, 7), window.location.origin).toString();
  return (
    <main className="wrap">
      <section className="me-head">
        <div className="me-info">
          <p className="muted small"><Link href="/bazaar">Bazaar</Link> / {p.id}</p>
          <h1>{p.name}</h1>
        </div>
        {account && (
          <div className="me-actions">
            <button className="ghost" onClick={() => void toggleWatch()}>{watching ? '★ Watching' : '☆ Watch'}</button>
          </div>
        )}
      </section>

      <section className="card">
        <div className="stats four">
          <div><span className="label">Instabuy</span><span className="value">{coins(p.buyPrice)}</span></div>
          <div><span className="label">Instasell</span><span className="value">{coins(p.sellPrice)}</span></div>
          <div><span className="label">Spread</span><span className="value">{coins(p.margin)}</span></div>
          <div><span className="label">Weekly volume</span><span className="value">{coins(Math.min(p.buyMovingWeek, p.sellMovingWeek))}</span></div>
        </div>
        <div className="card-head" style={{ marginTop: 16 }}>
          <div className="segmented">
            {(['buy', 'sell'] as const).map((s) => (
              <button key={s} className={s === side ? 'on' : ''} onClick={() => setSide(s)}>{s === 'buy' ? 'Instabuy' : 'Instasell'}</button>
            ))}
          </div>
          <div className="segmented">
            {RANGES.map(([label, d]) => (
              <button key={label} className={d === days ? 'on' : ''} onClick={() => setDays(d)}>{label}</button>
            ))}
          </div>
        </div>
        <LineChart
          points={points}
          markers={markers}
          formatValue={coins}
          formatTime={(t) => (days <= 1 ? timeFmt.format(t) : dateFmt.format(t))}
          label={`${p.name} ${side === 'buy' ? 'instabuy' : 'instasell'} price`}
        />
        <p className="muted small">Snapshots every 2 hours. Dashed lines mark SkyBlock updates.</p>
      </section>

      {auction && auction.lowestBin !== null && (
        <section className="card">
          <h2>Auction house</h2>
          <p>Lowest BIN <strong>{coins(auction.lowestBin)}</strong> · {auction.listings} listings</p>
        </section>
      )}

      <div className="grid two">
        <DepthCard id={id} />
        <SpreadCard id={id} />
        <SeasonalityCard id={id} />
        <CraftCard id={id} />
        <CorrelationsCard id={id} />
        <section className="card">
          <h2>Embed this chart</h2>
          <img src={embed} alt={`${p.name} price chart`} width={480} height={160} className="embed-preview" />
          <input className="search" readOnly value={`<img src="${embed}" alt="${p.name} price">`} onFocus={(e) => e.target.select()} aria-label="Embed code" />
        </section>
      </div>
    </main>
  );
}

function DepthCard({ id }: { id: string }) {
  const s = useGated(() => api.market.depth(id), [id]);
  const max = Math.max(1, ...(s.data ? [...s.data.sellOffers, ...s.data.buyOrders].map((l) => l.amount) : [1]));
  const rows = (levels: { amount: number; pricePerUnit: number; orders: number }[], cls: string) =>
    levels.slice(0, 8).map((l, i) => (
      <div key={i} className="depth-row">
        <span className="num">{coins(l.pricePerUnit)}</span>
        <span className={`depth-bar ${cls}`} style={{ width: `${(l.amount / max) * 100}%` }} />
        <span className="num muted">{coins(l.amount)}</span>
      </div>
    ));
  return (
    <GatedSection title="Order book" state={s}>
      <h3>Sell offers (you buy from)</h3>
      {s.data && rows(s.data.sellOffers, 'neg')}
      <h3>Buy orders (you sell into)</h3>
      {s.data && rows(s.data.buyOrders, 'pos')}
    </GatedSection>
  );
}

function SpreadCard({ id }: { id: string }) {
  const s = useGated(() => api.market.spread(id, 30), [id]);
  return (
    <GatedSection title="Spread, last 30 days" state={s}>
      <LineChart
        height={160}
        points={(s.data?.points ?? []).filter((p) => p.spreadPct !== null).map((p) => ({ t: new Date(p.t).getTime(), v: p.spreadPct! * 100 }))}
        formatValue={(v) => `${v.toFixed(1)}%`}
        formatTime={(t) => dateFmt.format(t)}
        label="Spread as a percentage of the instasell price"
      />
    </GatedSection>
  );
}

function SeasonalityCard({ id }: { id: string }) {
  const s = useGated(() => api.market.seasonality(id), [id]);
  const bars = (vals: (number | null)[], labels: (string | number)[]) => {
    const dev = Math.max(1e-6, ...vals.map((v) => (v === null ? 0 : Math.abs(v - 1))));
    return (
    <div className="season">
      {vals.map((v, i) => (
        <div key={i} className="season-col" title={v === null ? 'No data' : `${labels[i]}: ${((v - 1) * 100).toFixed(1)}% vs average`}>
          <span className={`season-bar ${v !== null && v >= 1 ? 'pos' : 'neg'}`} style={{ height: v === null ? 0 : `${Math.max(4, (Math.abs(v - 1) / dev) * 85)}%` }} />
          <span className="season-label">{labels[i]}</span>
        </div>
      ))}
    </div>
    );
  };
  return (
    <GatedSection title="When it's cheapest (last 30 days)" state={s}>
      {s.data && (
        <>
          <h3>Hour of day (UTC)</h3>
          {bars(s.data.byHour, HOURS)}
          <h3>Day of week</h3>
          {bars(s.data.byWeekday, DAYS)}
          <p className="muted small">Taller bars are further above (green) or below (red) the 30-day average. Hover for the exact difference.</p>
        </>
      )}
    </GatedSection>
  );
}

function CraftCard({ id }: { id: string }) {
  const s = useGated(() => api.market.craft(id), [id]);
  if (s.error) return null; // no recipe for this item
  return (
    <GatedSection title="Craft or buy" state={s}>
      {s.data && (
        <>
          <p>
            Cheapest way: <strong>{s.data.craft ? 'craft it' : 'buy it'}</strong> for {coins(s.data.cost)}.
            {s.data.profit !== null && (
              <> Selling makes <span className={s.data.profit >= 0 ? 'pos' : 'neg'}>{coins(s.data.profit)}</span> each.</>
            )}
          </p>
          {s.data.parts && (
            <ul className="list">
              {(s.data.parts as { id: string; cost: number | null; craft: boolean }[]).map((part) => (
                <li key={part.id}>
                  <Link href={`/bazaar/${part.id}`}>{part.id}</Link>
                  <span className="muted small">{part.craft ? 'craft' : 'buy'}</span>
                  <span className="num right">{coins(part.cost)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </GatedSection>
  );
}

function CorrelationsCard({ id }: { id: string }) {
  const s = useGated(() => api.market.correlations(id), [id]);
  return (
    <GatedSection title="Moves with" state={s}>
      {s.data?.related.length === 0 ? (
        <p className="muted small">Nothing closely related this week.</p>
      ) : (
        <ul className="list">
          {s.data?.related.map((r) => (
            <li key={r.otherId}>
              <Link href={`/bazaar/${r.otherId}`}>{r.otherId}</Link>
              <span className="num right">{r.r > 0 ? '+' : ''}{r.r.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}
