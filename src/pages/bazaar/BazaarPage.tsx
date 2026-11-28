import type { BazaarProduct, Movers } from '@skystats/api-client';
import { useEffect, useMemo, useState } from 'react';
import { GatedSection, useGated } from '../../components/Gate';
import { LineChart } from '../../components/LineChart';
import { api } from '../../lib/api';
import { coins } from '../../lib/format';
import { Link } from '../../lib/router';
import { useSession } from '../../lib/session';

type Tab = 'all' | 'movers' | 'watchlist' | 'flips' | 'npc' | 'anomalies';
type SortKey = 'name' | 'buyPrice' | 'sellPrice' | 'margin' | 'volume';
const pct = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export function BazaarPage() {
  const { account } = useSession();
  const [products, setProducts] = useState<BazaarProduct[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'volume', desc: true });
  const [watch, setWatch] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.bazaar.list().then((r) => setProducts(r.products)).catch(() => {});
  }, []);
  useEffect(() => {
    if (account) api.market.watchlist().then((r) => setWatch(new Set(r.items.map((i) => i.productId)))).catch(() => {});
  }, [account?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    const val = (p: BazaarProduct) => (sort.key === 'volume' ? Math.min(p.buyMovingWeek, p.sellMovingWeek) : sort.key === 'name' ? p.name : p[sort.key]);
    return products
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.id.toLowerCase().includes(needle))
      .filter((p) => tab !== 'watchlist' || watch.has(p.id))
      .sort((a, b) => {
        const [x, y] = [val(a), val(b)];
        const c = typeof x === 'string' ? x.localeCompare(y as string) : (x as number) - (y as number);
        return sort.desc ? -c : c;
      });
  }, [products, q, sort, tab, watch]);

  async function toggleWatch(id: string) {
    const next = new Set(watch);
    if (watch.has(id)) {
      next.delete(id);
      await api.market.unwatch(id).catch(() => {});
    } else {
      next.add(id);
      await api.market.watch(id).catch(() => {});
    }
    setWatch(next);
  }

  const th = (key: SortKey, label: string) => (
    <th>
      <button className="th" onClick={() => setSort({ key, desc: sort.key === key ? !sort.desc : key !== 'name' })}>
        {label}
        {sort.key === key ? (sort.desc ? ' ↓' : ' ↑') : ''}
      </button>
    </th>
  );

  return (
    <main className="wrap">
      <section className="hero">
        <h1>Bazaar</h1>
        <p className="lede">Live prices for every bazaar item, updated about every 30 seconds. Price history is free at every range.</p>
      </section>

      <EconomyIndex />

      <div className="segmented tabs" role="tablist">
        {(
          [
            ['all', 'All items'],
            ['movers', 'Movers'],
            ...(account ? [['watchlist', `Watchlist (${watch.size})`]] : []),
            ['npc', 'NPC flips'],
            ['flips', 'Flip finder'],
            ['anomalies', 'Unusual moves'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {(tab === 'all' || tab === 'watchlist') && (
        <section className="card">
          <input className="search" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items" />
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  {account && <th aria-label="Watch" />}
                  {th('name', 'Item')}
                  {th('buyPrice', 'Instabuy')}
                  {th('sellPrice', 'Instasell')}
                  {th('margin', 'Spread')}
                  {th('volume', 'Weekly volume')}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 300).map((p) => (
                  <tr key={p.id}>
                    {account && (
                      <td>
                        <button className={`star ${watch.has(p.id) ? 'on' : ''}`} onClick={() => void toggleWatch(p.id)} aria-label={watch.has(p.id) ? 'Stop watching' : 'Watch'}>
                          ★
                        </button>
                      </td>
                    )}
                    <td>
                      <Link href={`/bazaar/${p.id}`}>{p.name}</Link>
                    </td>
                    <td className="num">{coins(p.buyPrice)}</td>
                    <td className="num">{coins(p.sellPrice)}</td>
                    <td className="num">{coins(p.margin)}</td>
                    <td className="num">{coins(Math.min(p.buyMovingWeek, p.sellMovingWeek))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 300 && <p className="muted small">Showing 300 of {rows.length}. Search to narrow it down.</p>}
        </section>
      )}
      {tab === 'movers' && <MoversCard names={new Map(products.map((p) => [p.id, p.name]))} />}
      {tab === 'npc' && <NpcCard />}
      {tab === 'flips' && <FlipsCard />}
      {tab === 'anomalies' && <AnomaliesCard names={new Map(products.map((p) => [p.id, p.name]))} />}
    </main>
  );
}

function EconomyIndex() {
  const [pts, setPts] = useState<{ t: number; v: number }[]>([]);
  useEffect(() => {
    api.market.index(30).then((r) => setPts(r.points.map((p) => ({ t: new Date(p.t).getTime(), v: p.value })))).catch(() => {});
  }, []);
  if (pts.length < 2) return null;
  const last = pts[pts.length - 1]!.v;
  return (
    <section className="card">
      <div className="card-head">
        <h2>SkyBlock economy index</h2>
        <span className={`value ${last >= 100 ? 'pos' : 'neg'}`}>{last.toFixed(1)}</span>
      </div>
      <LineChart height={160} points={pts} formatValue={(v) => v.toFixed(0)} formatTime={(t) => dateFmt.format(t)} label="Economy index over 30 days" />
      <p className="muted small">The 50 most traded items, equally weighted, 100 = 30 days ago.</p>
    </section>
  );
}

function MoversCard({ names }: { names: Map<string, string> }) {
  const [window, setWindow] = useState<'1h' | '24h' | '7d'>('24h');
  const [m, setM] = useState<Movers | null>(null);
  useEffect(() => {
    api.market.movers(window).then(setM).catch(() => {});
  }, [window]);
  const list = (rows: Movers['gainers']) => (
    <ul className="list">
      {rows.map((r) => (
        <li key={r.productId}>
          <Link href={`/bazaar/${r.productId}`}>{names.get(r.productId) ?? r.productId}</Link>
          <span className={`right num ${r.change >= 0 ? 'pos' : 'neg'}`}>{pct(r.change)}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="card">
      <div className="card-head">
        <h2>Biggest moves</h2>
        <div className="segmented">
          {(['1h', '24h', '7d'] as const).map((w) => (
            <button key={w} className={w === window ? 'on' : ''} onClick={() => setWindow(w)}>
              {w}
            </button>
          ))}
        </div>
      </div>
      {m && (
        <div className="grid two">
          <div>
            <h3>Up</h3>
            {list(m.gainers)}
          </div>
          <div>
            <h3>Down</h3>
            {list(m.losers)}
          </div>
        </div>
      )}
    </section>
  );
}

function NpcCard() {
  const [items, setItems] = useState<{ productId: string; name?: string; buyPrice: number; npcPrice: number; profit: number }[]>([]);
  useEffect(() => {
    api.market.npcArbitrage().then((r) => setItems(r.items as typeof items)).catch(() => {});
  }, []);
  return (
    <section className="card">
      <h2>Buy from the bazaar, sell to an NPC</h2>
      <table className="data">
        <thead>
          <tr><th>Item</th><th>Instabuy</th><th>NPC pays</th><th>Profit each</th></tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.productId}>
              <td><Link href={`/bazaar/${i.productId}`}>{i.name ?? i.productId}</Link></td>
              <td className="num">{coins(i.buyPrice)}</td>
              <td className="num">{coins(i.npcPrice)}</td>
              <td className="num pos">{coins(i.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">NPCs limit how much they buy each day, and prices move fast.</p>
    </section>
  );
}

function FlipsCard() {
  const s = useGated(() => api.market.flips(), []);
  return (
    <GatedSection title="Flip finder" state={s}>
      <table className="data">
        <thead>
          <tr><th>Item</th><th>Buy order</th><th>Sell offer</th><th>Margin after tax</th><th>Hourly volume</th><th>At 1% of volume</th></tr>
        </thead>
        <tbody>
          {s.data?.flips.map((f) => (
            <tr key={f.productId}>
              <td><Link href={`/bazaar/${f.productId}`}>{f.name}</Link></td>
              <td className="num">{coins(f.buyAt)}</td>
              <td className="num">{coins(f.sellAt)}</td>
              <td className="num pos">{coins(f.margin)} ({(f.marginPct * 100).toFixed(1)}%)</td>
              <td className="num">{coins(f.hourlyVolume)}</td>
              <td className="num">{coins(f.potentialPerHour)}/h</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Bazaar tax of {((s.data?.tax ?? 0) * 100).toFixed(2)}% included. &ldquo;At 1% of volume&rdquo; is an illustration, not a promise: your orders have to fill.</p>
    </GatedSection>
  );
}

function AnomaliesCard({ names }: { names: Map<string, string> }) {
  const s = useGated(() => api.market.anomalies(), []);
  return (
    <GatedSection title="Unusual moves" state={s}>
      {s.data?.anomalies.length === 0 ? (
        <p className="muted small">Nothing unusual in the last 30 days.</p>
      ) : (
        <ul className="list">
          {s.data?.anomalies.map((a) => (
            <li key={`${a.productId}${a.detectedAt}`}>
              <Link href={`/bazaar/${a.productId}`}>{names.get(a.productId) ?? a.productId}</Link>
              <span className={`num ${a.z > 0 ? 'pos' : 'neg'}`}>{a.z > 0 ? 'jumped' : 'dropped'} to {coins(a.price)}</span>
              <span className="muted small right">{dateFmt.format(new Date(a.detectedAt))}</span>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}
