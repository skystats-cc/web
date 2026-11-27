import type { Annotation, MoneyDays, PlaySession, Profile } from '@skystats/api-client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { coins } from '../lib/format';
import { GatedSection, useGated } from './Gate';
import { LineChart } from './LineChart';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });
const signed = (n: number | null) => (n === null ? '—' : `${n >= 0 ? '+' : ''}${coins(n)}`);

/** Everything below the coins chart on /me: heatmap, best days, sessions, breakdown, notes, drops */
export function Dashboard({ profiles }: { profiles: Profile[] }) {
  const profileId = profiles.find((p) => p.selected)?.id ?? profiles[0]?.id ?? '';
  const [days, setDays] = useState<MoneyDays | null>(null);
  useEffect(() => {
    if (profileId) api.insight.days(profileId, 365).then(setDays).catch(() => setDays(null));
  }, [profileId]);
  if (!profileId) return null;
  return (
    <>
      <div className="grid two">
        <Heatmap days={days} />
        <BestDays days={days} />
      </div>
      <div className="grid two">
        <Sessions />
        <Breakdown profileId={profileId} />
      </div>
      <div className="grid two">
        <ComparePeriods profileId={profileId} />
        <Notes profileId={profileId} />
      </div>
      <Drops />
    </>
  );
}

function Heatmap({ days }: { days: MoneyDays | null }) {
  const cells = useMemo(() => {
    const byDay = new Map((days?.days ?? []).map((d) => [d.day, d.change]));
    const max = Math.max(1, ...[...byDay.values()].map((v) => Math.abs(v ?? 0)));
    const out: { day: string; v: number | null; level: number }[] = [];
    const today = new Date();
    for (let i = 7 * 26 - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000).toISOString().slice(0, 10);
      const v = byDay.get(d) ?? null;
      out.push({ day: d, v, level: v === null ? 0 : Math.ceil((Math.abs(v) / max) * 4) * Math.sign(v) });
    }
    return out;
  }, [days]);
  return (
    <section className="card">
      <h2>Daily coin gain</h2>
      <div className="heatmap" role="img" aria-label="Coin gain per day over the last 26 weeks">
        {cells.map((c) => (
          <span key={c.day} className={`hm l${c.level}`} title={`${dateFmt.format(new Date(c.day))}: ${c.v === null ? 'no data' : signed(c.v)}`} />
        ))}
      </div>
      <p className="muted small">Last 26 weeks, as far as your plan keeps. Green days gained coins, red days lost.</p>
    </section>
  );
}

function BestDays({ days }: { days: MoneyDays | null }) {
  return (
    <section className="card">
      <h2>Best and worst days</h2>
      <div className="grid cols2">
        <ul className="list">
          {days?.best.map((d) => (
            <li key={d.day}>{dayFmt.format(new Date(d.day))}<span className="num pos right">{signed(d.change)}</span></li>
          ))}
        </ul>
        <ul className="list">
          {days?.worst.filter((d) => (d.change ?? 0) < 0).map((d) => (
            <li key={d.day}>{dayFmt.format(new Date(d.day))}<span className="num neg right">{signed(d.change)}</span></li>
          ))}
        </ul>
      </div>
      {days && days.milestones.length > 0 && (
        <>
          <h3>Milestones</h3>
          <ul className="list">
            {days.milestones.map((m) => (
              <li key={m.amount}>First {coins(m.amount)} coins<span className="muted right">{dateFmt.format(new Date(m.day))}</span></li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Sessions() {
  const [list, setList] = useState<PlaySession[]>([]);
  useEffect(() => {
    api.insight.sessions(7).then((r) => setList(r.sessions)).catch(() => {});
  }, []);
  const maxMin = Math.max(30, ...list.map((s) => s.minutes));
  return (
    <section className="card">
      <h2>Play sessions this week</h2>
      {list.length === 0 ? (
        <p className="muted small">Sessions appear once the SkyStats mod has seen you play.</p>
      ) : (
        <ul className="sessions">
          {list.slice(0, 12).map((s) => (
            <li key={s.id}>
              <span className="muted small">{dayFmt.format(new Date(s.startedAt))} {timeFmt.format(new Date(s.startedAt))}</span>
              <span className={`session-bar ${s.activity ?? ''}`} style={{ width: `${Math.max(4, (s.minutes / maxMin) * 100)}%` }} title={s.activity ?? undefined} />
              <span className="num small">{s.minutes}m · {signed(s.coins)}{s.coinsPerHour !== null ? ` · ${coins(s.coinsPerHour)}/h` : ''}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">Turn on activity labels in Privacy settings to see what each session was.</p>
    </section>
  );
}

function Breakdown({ profileId }: { profileId: string }) {
  const s = useGated(() => api.insight.breakdown(profileId, 14), [profileId]);
  const max = Math.max(1, ...(s.data?.days ?? []).flatMap((d) => [d.income, d.spending]));
  return (
    <GatedSection title="Income and spending" state={s}>
      {s.data?.days.length === 0 && <p className="muted small">Not enough data yet.</p>}
      <ul className="breakdown">
        {s.data?.days.slice(-10).map((d) => (
          <li key={d.day}>
            <span className="muted small">{dateFmt.format(new Date(d.day))}</span>
            <span className="bars2">
              <span className="pos-bar" style={{ width: `${(d.income / max) * 100}%` }} title={`Income ${coins(d.income)}`} />
              <span className="neg-bar" style={{ width: `${(d.spending / max) * 100}%` }} title={`Spending ${coins(d.spending)}`} />
            </span>
            <span className="num small">{signed(d.income - d.spending)}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">Moving coins between purse and bank isn&rsquo;t counted.</p>
    </GatedSection>
  );
}

function ComparePeriods({ profileId }: { profileId: string }) {
  const s = useGated(() => api.insight.compare(profileId, 7), [profileId]);
  const last = (arr?: { change: number }[]) => (arr && arr.length ? arr[arr.length - 1]!.change : null);
  return (
    <GatedSection title="This week vs last week" state={s}>
      {s.data && (
        <>
          <div className="stats">
            <div><span className="label">This week</span><span className="value">{signed(last(s.data.current))}</span></div>
            <div><span className="label">Last week</span><span className="value">{signed(last(s.data.previous))}</span></div>
            <div><span className="label">Difference</span><span className="value">{signed((last(s.data.current) ?? 0) - (last(s.data.previous) ?? 0))}</span></div>
          </div>
          <LineChart
            height={140}
            points={s.data.current.map((p) => ({ t: p.offsetHours * 3_600_000, v: p.change }))}
            formatValue={coins}
            formatTime={(t) => `day ${Math.floor(t / 86_400_000) + 1}`}
            label="Coins gained this week"
          />
        </>
      )}
    </GatedSection>
  );
}

function Notes({ profileId }: { profileId: string }) {
  const [list, setList] = useState<Annotation[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const load = () => api.insight.annotations(profileId).then((r) => setList(r.annotations)).catch(() => {});
  useEffect(() => {
    void load();
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api.insight.addAnnotation(profileId, new Date().toISOString(), text);
      setText('');
      setError(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }
  return (
    <section className="card">
      <h2>Notes</h2>
      <ul className="list">
        {list.slice(-8).map((a) => (
          <li key={a.id}>
            {a.text}
            <span className="muted small right">{dateFmt.format(new Date(a.at))}</span>
            <button className="ghost small-btn" onClick={() => void api.insight.deleteAnnotation(a.id).then(load)} aria-label="Delete note">×</button>
          </li>
        ))}
      </ul>
      <form className="row alert-form" onSubmit={(e) => void add(e)}>
        <input placeholder="e.g. bought a Hyperion" maxLength={120} value={text} onChange={(e) => setText(e.target.value)} required aria-label="Note" />
        <button type="submit">Add note</button>
      </form>
      {error && <p className="muted small">{error}</p>}
      <p className="muted small">Notes are private and show on your coins chart. Adding notes comes with Pro and Max.</p>
    </section>
  );
}

function Drops() {
  const [events, setEvents] = useState<{ at: string; itemName: string | null; qty?: number | null }[]>([]);
  useEffect(() => {
    api.insight.drops(7).then((r) => setEvents(r.events)).catch(() => {});
  }, []);
  if (events.length === 0) return null;
  return (
    <section className="card">
      <h2>Rare drops this week</h2>
      <ul className="list">
        {events.slice(0, 15).map((e, i) => (
          <li key={i}>{e.itemName}{e.qty && e.qty > 1 ? ` ×${e.qty}` : ''}<span className="muted small right">{dayFmt.format(new Date(e.at))}</span></li>
        ))}
      </ul>
    </section>
  );
}
