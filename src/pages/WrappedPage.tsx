import type { Wrapped } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { coins } from '../lib/format';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });

export function WrappedPage() {
  const { account, loading } = useSession();
  const year = new Date().getUTCFullYear();
  const [period, setPeriod] = useState(String(year));
  const [w, setW] = useState<Wrapped | null>(null);
  useEffect(() => {
    if (account) api.social.wrapped(period).then(setW).catch(() => setW(null));
  }, [account?.uuid, period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <main className="wrap narrow" />;
  if (!account) return <main className="wrap narrow"><section className="card center"><Link href="/link" className="button">Link Minecraft</Link></section></main>;

  const months = Array.from({ length: new Date().getUTCMonth() + 1 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  return (
    <main className="wrap narrow wrapped">
      <h1 className="page-title">Your SkyBlock {period.length === 4 ? 'year' : 'month'}</h1>
      <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Period">
        <option value={String(year)}>{year}</option>
        {months.map((m) => <option key={m} value={m}>{new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(`${m}-01`))}</option>)}
      </select>
      {w && (
        <div className="slides">
          {w.clippedByPlan && <p className="muted small">Your plan keeps part of this period, so this covers from {dateFmt.format(new Date(w.from))}.</p>}
          <section className="slide s1"><span className="label">Coins gained</span><span className="huge">{w.coinsGained >= 0 ? '+' : ''}{coins(w.coinsGained)}</span></section>
          {w.bestDay && <section className="slide s2"><span className="label">Best day</span><span className="huge">{dateFmt.format(new Date(w.bestDay.day))}</span><span>+{coins(w.bestDay.change)} coins</span></section>}
          <section className="slide s3"><span className="label">You played</span><span className="huge">{w.hoursPlayed}h</span><span>over {w.sessions} {w.sessions === 1 ? 'session' : 'sessions'} and {w.daysPlayed} {w.daysPlayed === 1 ? 'day' : 'days'}</span></section>
          <section className="slide s4"><span className="label">Longest streak</span><span className="huge">{w.longestStreak} days</span><span>{Math.round(w.consistency * 100)}% of days were up</span></section>
          {w.topActivity && <section className="slide s5"><span className="label">Mostly</span><span className="huge cap">{w.topActivity}</span></section>}
          {w.topDrops.length > 0 && <section className="slide s1"><span className="label">Top drops</span>{w.topDrops.map((d) => <span key={d.name} className="big">{d.name} ×{d.count}</span>)}</section>}
          {w.achievements.length > 0 && <section className="slide s2"><span className="label">Unlocked</span>{w.achievements.map((a) => <span key={a} className="big">{a}</span>)}</section>}
        </div>
      )}
    </main>
  );
}
