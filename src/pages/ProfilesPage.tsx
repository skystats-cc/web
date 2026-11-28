import type { MyProfiles, Profile, ProfileMember } from '@skystats/api-client';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Dashboard } from '../components/Dashboard';
import { MoneyCard } from '../components/MoneyCard';
import { avatarUrl, coins, GAME_MODES } from '../lib/format';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';
import { ago } from '../lib/status';

export function ProfilesPage() {
  const session = useSession();
  const { account } = session;
  const [data, setData] = useState<MyProfiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setData(await api.me.profiles());
      setError(null);
    } catch {
      setError("Couldn't load your profiles.");
    }
  }

  useEffect(() => {
    if (account) void load();
  }, [account?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // The worker may still be fetching from Hypixel (first visit) or resolving co-op names.
  // Keep polling until both are done, for up to ~2 minutes.
  const pending =
    !data || !data.lastFetchedAt || data.profiles.some((p) => p.members.some((m) => m.username === null));
  const polls = useRef(0);
  useEffect(() => {
    if (!account || !pending || refreshing || polls.current >= 40) return;
    const t = setTimeout(() => {
      polls.current++;
      void load();
    }, 3000);
    return () => clearTimeout(t);
  }, [account, data, pending, refreshing]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session.loading) return <main className="wrap narrow" />;
  if (!account) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          <h2>Link your Minecraft account first</h2>
          <p className="muted">Your profiles and co-op appear here once this browser is linked.</p>
          <Link href="/link" className="button">
            Link Minecraft
          </Link>
        </section>
      </main>
    );
  }

  async function refresh() {
    setRefreshing(true);
    const before = data?.lastFetchedAt;
    await api.me.refreshProfiles().catch(() => {});
    // Wait for the worker to finish (lastFetchedAt changes), up to ~30s
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const next = await api.me.profiles().catch(() => null);
      if (next) setData(next);
      if (next?.lastFetchedAt !== before) break;
    }
    setRefreshing(false);
  }

  async function toggleTracking() {
    setSaving(true);
    try {
      session.setAccount(await api.me.updateSettings({ trackingEnabled: !account!.trackingEnabled }));
    } finally {
      setSaving(false);
    }
  }

  const modSeen = account.modLastSeenAt ? `last seen ${ago(account.modLastSeenAt)}` : 'not seen yet';

  return (
    <main className="wrap">
      <section className="me-head">
        <img className="avatar-lg" src={avatarUrl(account.uuid, 64)} alt="" width={64} height={64} />
        <div className="me-info">
          <h1>{account.username}</h1>
          <p className="muted">
            SkyStats mod {modSeen}
            {account.modVersion ? ` · v${account.modVersion}` : ''}
            {data?.lastFetchedAt ? ` · profiles updated ${ago(data.lastFetchedAt)}` : ''}
          </p>
        </div>
        <div className="me-actions">
          <label className="switch" title="When off, SkyStats stops recording your money history">
            <input type="checkbox" checked={account.trackingEnabled} disabled={saving} onChange={() => void toggleTracking()} />
            <span className="slider" aria-hidden />
            Tracking {account.trackingEnabled ? 'on' : 'off'}
          </label>
          <button className="ghost" onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link href="/settings" className="button ghost">
            Privacy
          </Link>
          <button className="ghost" onClick={() => void session.logout()}>
            Sign out
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {data && !data.lastFetchedAt && (
        <section className="card center">
          <span className="spinner" aria-hidden />
          <p>Fetching your profiles from Hypixel…</p>
        </section>
      )}

      {data?.lastFetchedAt && data.profiles.length === 0 && (
        <section className="card center">
          <p>No SkyBlock profiles found for {account.username}.</p>
        </section>
      )}

      {data && data.profiles.length > 0 && <MoneyCard profiles={data.profiles} />}

      <div className="profiles">
        {data?.profiles.map((p) => <ProfileCard key={p.id} profile={p} />)}
      </div>

      {data && data.profiles.length > 0 && <Dashboard profiles={data.profiles} />}
    </main>
  );
}

function ProfileCard({ profile: p }: { profile: Profile }) {
  const mode = GAME_MODES[p.gameMode] ?? p.gameMode;
  return (
    <section className={`card profile ${p.selected ? 'selected' : ''}`}>
      <div className="card-head">
        <h2>
          {p.name ?? 'Profile'}
          {p.selected && <span className="badge accent">Selected</span>}
          {mode && <span className="badge">{mode}</span>}
          {p.coop ? (
            <Link href={`/coop/${p.id}`} className="badge accent">Co-op · {p.members.length} →</Link>
          ) : (
            <span className="badge">Solo</span>
          )}
        </h2>
        {p.bank !== null && (
          <div className="bank" title="Shared bank balance">
            <span className="label">Bank</span>
            <span className="value">{coins(p.bank)}</span>
          </div>
        )}
      </div>
      <ul className="members">
        {p.members.map((m) => (
          <MemberRow key={m.uuid} m={m} />
        ))}
      </ul>
    </section>
  );
}

function MemberRow({ m }: { m: ProfileMember }) {
  let chip: { text: string; tone: string; title: string };
  if (m.usesMod && m.trackingEnabled) chip = { text: 'SkyStats mod', tone: 'good', title: 'Uses the SkyStats mod' };
  else if (m.trackingEnabled === false) chip = { text: 'Tracking off', tone: 'warn', title: 'Turned tracking off in SkyStats' };
  else if (m.onSkyStats) chip = { text: 'On SkyStats', tone: 'neutral', title: "Has a SkyStats account but the mod hasn't been seen recently" };
  else chip = { text: 'Not on SkyStats', tone: 'dim', title: 'Not on SkyStats; shown from Hypixel profile data only' };

  return (
    <li>
      <img src={avatarUrl(m.uuid, 32)} alt="" width={32} height={32} className="avatar" />
      <div className="member-name">
        <span>
          {m.username ?? <span className="muted">Loading name…</span>}
          {m.isYou && <span className="badge">You</span>}
        </span>
        <span className={`chip ${chip.tone}`} title={chip.title}>
          {chip.text}
        </span>
      </div>
      <div className="member-stats">
        <div>
          <span className="label">Purse</span>
          <span className="value" title={m.purse === null && !m.isYou ? 'Hidden by this player' : undefined}>
            {coins(m.purse)}
          </span>
        </div>
        <div>
          <span className="label">SB level</span>
          <span className="value">{m.skyblockLevel ?? '—'}</span>
        </div>
      </div>
    </li>
  );
}
