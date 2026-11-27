import type { CoopView } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { avatarUrl, coins } from '../lib/format';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function CoopPage({ profileId }: { profileId: string }) {
  const { account, loading } = useSession();
  const [d, setD] = useState<CoopView | null>(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (account) api.insight.coop(profileId, days).then(setD).catch(() => setError(true));
  }, [account?.uuid, profileId, days]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <main className="wrap" />;
  if (!account || error) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          <p>{account ? 'You’re not in that co-op.' : 'Sign in to see your co-op.'}</p>
          <Link href="/me">Your profiles</Link>
        </section>
      </main>
    );
  }
  if (!d) return <main className="wrap" />;

  const name = (uuid: string) => d.members.find((m) => m.uuid === uuid)?.username ?? 'Member';
  const active = d.members.filter((m) => m.active);
  const left = d.members.filter((m) => !m.active);
  const notOn = active.filter((m) => !m.onSkyStats);

  return (
    <main className="wrap">
      <section className="hero">
        <p className="muted small"><Link href="/me">My profiles</Link> / Co-op</p>
        <h1>Co-op</h1>
        <div className="segmented">
          {[1, 7, 30].map((n) => (
            <button key={n} className={n === days ? 'on' : ''} onClick={() => setDays(n)}>{n === 1 ? '24h' : `${n}d`}</button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Members</h2>
        <ul className="members">
          {active.map((m) => (
            <li key={m.uuid}>
              <img src={avatarUrl(m.uuid, 32)} alt="" width={32} height={32} className="avatar" />
              <div className="member-name">
                <span>
                  {m.username ?? 'Loading…'}
                  {m.isYou && <span className="badge">You</span>}
                  {m.online && <span className="badge accent">Online</span>}
                </span>
                <span className="muted small">{!m.onSkyStats ? 'Not on SkyStats' : m.sharing ? 'Shares coins' : 'Keeps coins private'}</span>
              </div>
              <div className="member-stats">
                <div>
                  <span className="label">Gained</span>
                  <span className={`value ${(m.gain ?? 0) >= 0 ? 'pos' : 'neg'}`}>{m.gain === null ? '—' : `${m.gain >= 0 ? '+' : ''}${coins(m.gain)}`}</span>
                </div>
                <div>
                  <span className="label">Share</span>
                  <span className="value">{m.share === null ? '—' : `${Math.round(m.share * 100)}%`}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {d.members.some((m) => m.share !== null) && (
          <div className="share-bar" aria-label="Share of co-op gains">
            {active.filter((m) => m.share).map((m, i) => (
              <span key={m.uuid} className={`seg s${i % 5}`} style={{ width: `${m.share! * 100}%` }} title={`${m.username}: ${Math.round(m.share! * 100)}%`} />
            ))}
          </div>
        )}
        {left.length > 0 && (
          <p className="muted small">Left the co-op: {left.map((m) => m.username ?? 'unknown').join(', ')}</p>
        )}
      </section>

      <div className="grid two">
        <section className="card">
          <h2>Shared bank</h2>
          {d.ledger.length === 0 ? (
            <p className="muted small">No deposits or withdrawals seen from members who share their coins.</p>
          ) : (
            <ul className="list">
              {d.ledger.map((l, i) => (
                <li key={i}>
                  {name(l.uuid)} {l.amount >= 0 ? 'deposited' : 'withdrew'}
                  <span className={`num right ${l.amount >= 0 ? 'pos' : 'neg'}`}>{coins(Math.abs(l.amount))}</span>
                  <span className="muted small">{dateFmt.format(new Date(l.at))}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small">Worked out from members&rsquo; own coin snapshots, so it can miss moves made without the mod running.</p>
        </section>
        <section className="card">
          <h2>Activity</h2>
          {d.feed.length === 0 ? (
            <p className="muted small">Nothing yet. Members choose whether their activity is shown.</p>
          ) : (
            <ul className="list">
              {d.feed.map((f, i) => (
                <li key={i}>
                  {name(f.uuid)} played {f.minutes}m{f.coins !== null ? `, ${f.coins >= 0 ? '+' : ''}${coins(f.coins)}` : ''}
                  <span className="muted small right">{dateFmt.format(new Date(f.startedAt))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {notOn.length > 0 && (
        <section className="card">
          <h2>Invite your co-op</h2>
          <p className="muted small">{notOn.map((m) => m.username).join(', ')} {notOn.length === 1 ? 'isn’t' : 'aren’t'} on SkyStats yet. Share this link with them:</p>
          <div className="command">
            <code>{d.inviteUrl}</code>
            <button onClick={() => void navigator.clipboard.writeText(d.inviteUrl).then(() => setCopied(true))}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </section>
      )}
    </main>
  );
}
