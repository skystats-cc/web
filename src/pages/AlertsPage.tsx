import type { AlertRule, Entitlement, Goal, NewAlertRule, Notification, NotificationPrefs, Profile } from '@skystats/api-client';
import { SkystatsApiError } from '@skystats/api-client';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { coins } from '../lib/format';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';
import { ago } from '../lib/status';

type BoolPref = 'discordDm' | 'outages' | 'patchNotes' | 'dailyDigest' | 'weeklyRecap' | 'coopActivity' | 'mayorReminder';
const PREFS: { key: BoolPref; title: string; help: string; paid: boolean }[] = [
  { key: 'discordDm', title: 'Send alerts as Discord DMs', help: 'Needs Discord connected in Privacy settings. Otherwise they only appear here.', paid: false },
  { key: 'outages', title: 'SkyBlock outages', help: 'When SkyBlock goes down and when it comes back.', paid: false },
  { key: 'patchNotes', title: 'SkyBlock updates', help: 'New patch notes from Hypixel.', paid: false },
  { key: 'dailyDigest', title: 'Morning digest', help: 'Yesterday’s coins and the biggest bazaar moves, at 8am.', paid: true },
  { key: 'weeklyRecap', title: 'Monday recap', help: 'Your coins over the last week.', paid: true },
  { key: 'coopActivity', title: 'Co-op activity', help: 'When a co-op member starts playing, if they allow it.', paid: true },
  { key: 'mayorReminder', title: 'Election reminder', help: 'When SkyBlock voting opens.', paid: true },
];
const KINDS: Record<AlertRule['kind'], string> = { price: 'Price', anomaly: 'Unusual move', manipulation: 'Possible manipulation' };
const toTime = (m: number | null) => (m === null ? '' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
const fromTime = (s: string) => (s ? Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5)) : null);

export function AlertsPage() {
  const { account, loading } = useSession();
  const [plan, setPlan] = useState<Entitlement | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [inbox, setInbox] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [items, setItems] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [p, e, r, g, n, pr] = await Promise.all([
      api.alerts.prefs(),
      api.billing.entitlement(),
      api.alerts.list(),
      api.alerts.goals(),
      api.alerts.inbox(),
      api.me.profiles(),
    ]);
    setPrefs(p);
    setPlan(e);
    setRules(r.alerts);
    setGoals(g.goals);
    setInbox(n.notifications);
    setProfiles(pr.profiles);
  };

  useEffect(() => {
    if (!account) return;
    load().catch(() => setError("Couldn't load your alerts."));
    api.bazaar.list().then((b) => setItems(b.products.map((p) => ({ id: p.id, name: p.name })))).catch(() => {});
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

  const paid = plan ? plan.tier !== 'free' : false;
  const fail = (err: unknown) => setError(err instanceof SkystatsApiError ? err.message : 'Something went wrong.');

  async function setPref(patch: Partial<NotificationPrefs>) {
    try {
      setPrefs(await api.alerts.updatePrefs(patch));
      setError(null);
    } catch (err) {
      fail(err);
    }
  }

  return (
    <main className="wrap narrow">
      <h1 className="page-title">Alerts</h1>
      <p className="muted">Outage and update notices are free. Bazaar alerts, digests and co-op alerts come with Pro and Max.</p>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Notifications</h2>
        <ul className="settings">
          {PREFS.map((p) => (
            <li key={p.key}>
              <div>
                <strong>{p.title}</strong>
                {p.paid && <span className="badge">Pro</span>}
                <p className="muted small">{p.help}</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={prefs?.[p.key] ?? false}
                  disabled={!prefs || (p.paid && !paid && !prefs[p.key])}
                  onChange={() => void setPref({ [p.key]: !prefs![p.key] })}
                />
                <span className="slider" aria-hidden />
                <span className="sr-only">{p.title}</span>
              </label>
            </li>
          ))}
        </ul>
        {prefs && (
          <div className="row quiet">
            <label className="small">
              Quiet from <input type="time" disabled={!paid} value={toTime(prefs.quietStartMin)} onChange={(e) => void setPref({ quietStartMin: fromTime(e.target.value) })} />
            </label>
            <label className="small">
              until <input type="time" disabled={!paid} value={toTime(prefs.quietEndMin)} onChange={(e) => void setPref({ quietEndMin: fromTime(e.target.value) })} />
            </label>
            <span className="muted small">({prefs.timeZone}) Alerts wait until quiet hours end.</span>
          </div>
        )}
      </section>

      <RulesCard paid={paid} rules={rules} items={items} onChange={load} onError={fail} />
      <GoalsCard goals={goals} profiles={profiles} paid={paid} onChange={load} onError={fail} />

      <section className="card">
        <div className="card-head">
          <h2>Recent notifications</h2>
          {inbox.some((n) => !n.readAt) && (
            <button className="ghost" onClick={() => void api.alerts.readAll().then(load)}>
              Mark all read
            </button>
          )}
        </div>
        {inbox.length === 0 ? (
          <p className="muted small">Nothing yet.</p>
        ) : (
          <ul className="list inbox">
            {inbox.map((n) => (
              <li key={n.id} className={n.readAt ? '' : 'unread'}>
                <div>
                  <strong>{n.url ? <a href={n.url}>{n.title}</a> : n.title}</strong>
                  <p className="muted small">{n.body}</p>
                </div>
                <span className="muted small right">{ago(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function RulesCard(props: { paid: boolean; rules: AlertRule[]; items: { id: string; name: string }[]; onChange: () => Promise<void>; onError: (e: unknown) => void }) {
  const [kind, setKind] = useState<NewAlertRule['kind']>('price');
  const [item, setItem] = useState('');
  const [op, setOp] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');
  const name = (id: string) => props.items.find((i) => i.id === id)?.name ?? id;

  async function add(e: FormEvent) {
    e.preventDefault();
    const productId = props.items.find((i) => i.name.toLowerCase() === item.toLowerCase())?.id ?? item.trim().toUpperCase().replace(/\s+/g, '_');
    try {
      await api.alerts.create({ kind, productId, side: 'buy', cooldownMinutes: 60, ...(kind === 'price' ? { op, threshold: Number(threshold) } : {}) });
      setItem('');
      setThreshold('');
      await props.onChange();
    } catch (err) {
      props.onError(err);
    }
  }

  return (
    <section className="card">
      <h2>Bazaar alerts</h2>
      {props.rules.length > 0 && (
        <ul className="list">
          {props.rules.map((r) => (
            <li key={r.id}>
              <span>
                <strong>{name(r.productId)}</strong> · {KINDS[r.kind]}
                {r.kind === 'price' && ` ${r.op} ${coins(r.threshold)}`}
                {r.lastFiredAt && <span className="muted small"> · last fired {ago(r.lastFiredAt)}</span>}
              </span>
              <button className="ghost right" onClick={() => void api.alerts.remove(r.id).then(props.onChange)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      {props.paid ? (
        <form className="row alert-form" onSubmit={(e) => void add(e)}>
          <select value={kind} onChange={(e) => setKind(e.target.value as NewAlertRule['kind'])} aria-label="Alert type">
            {Object.entries(KINDS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input list="bazaar-items" placeholder="Item" value={item} onChange={(e) => setItem(e.target.value)} required aria-label="Item" />
          <datalist id="bazaar-items">
            {props.items.map((i) => (
              <option key={i.id} value={i.name} />
            ))}
          </datalist>
          {kind === 'price' && (
            <>
              <select value={op} onChange={(e) => setOp(e.target.value as 'above' | 'below')} aria-label="Direction">
                <option value="above">goes above</option>
                <option value="below">goes below</option>
              </select>
              <input type="number" min="0" step="any" placeholder="Coins" value={threshold} onChange={(e) => setThreshold(e.target.value)} required aria-label="Price" />
            </>
          )}
          <button type="submit">Add alert</button>
        </form>
      ) : (
        <p className="muted small">
          Bazaar alerts come with Pro and Max. <Link href="/pricing">Compare plans</Link>.
        </p>
      )}
    </section>
  );
}

const etaFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function GoalsCard(props: { goals: Goal[]; profiles: Profile[]; paid: boolean; onChange: () => Promise<void>; onError: (e: unknown) => void }) {
  const [profileId, setProfileId] = useState('');
  const [target, setTarget] = useState('');
  const pid = profileId || props.profiles.find((p) => p.selected)?.id || props.profiles[0]?.id || '';
  const pname = (id: string) => props.profiles.find((p) => p.id === id)?.name ?? 'Profile';

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = Number(target.replace(/[,_\s]/g, '').replace(/k$/i, 'e3').replace(/m$/i, 'e6').replace(/b$/i, 'e9'));
    if (!pid || !Number.isFinite(n) || n <= 0) return props.onError(new Error('bad'));
    try {
      await api.alerts.createGoal(pid, n);
      setTarget('');
      await props.onChange();
    } catch (err) {
      props.onError(err);
    }
  }

  return (
    <section className="card">
      <h2>Coin goals</h2>
      {props.goals.length > 0 && (
        <ul className="list">
          {props.goals.map((g) => (
            <li key={g.id}>
              <span>
                <strong>{coins(g.target)}</strong> on {pname(g.profileId)}
                {g.reachedAt ? <span className="badge accent">Reached</span> : null}
                {!g.reachedAt && (
                  <span className="muted small">
                    {' '}
                    {g.eta
                      ? `· about ${etaFmt.format(new Date(g.eta))} at your recent pace (${coins(g.perDay ?? 0)}/day)`
                      : g.perDay !== null && g.perDay !== undefined
                        ? '· no estimate: your balance hasn’t been growing lately'
                        : ''}
                  </span>
                )}
              </span>
              <button className="ghost right" onClick={() => void api.alerts.removeGoal(g.id).then(props.onChange)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
      {props.profiles.length > 0 && (
        <form className="row alert-form" onSubmit={(e) => void add(e)}>
          {props.profiles.length > 1 && (
            <select value={pid} onChange={(e) => setProfileId(e.target.value)} aria-label="Profile">
              {props.profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name ?? 'Profile'}</option>
              ))}
            </select>
          )}
          <input placeholder="Target, e.g. 5b" value={target} onChange={(e) => setTarget(e.target.value)} required aria-label="Target coins" />
          <button type="submit">Add goal</button>
        </form>
      )}
      <p className="muted small">Goals are tracked for everyone. {props.paid ? 'You’ll get an alert when you reach one.' : 'Alerts when you reach one come with Pro and Max.'}</p>
    </section>
  );
}
