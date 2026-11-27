import type { Achievement } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from '../lib/router';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export function AchievementsCard() {
  const [list, setList] = useState<Achievement[]>([]);
  useEffect(() => {
    api.social.achievements().then((r) => setList(r.achievements)).catch(() => {});
  }, []);
  return (
    <section className="card">
      <div className="card-head">
        <h2>Achievements</h2>
        <Link href="/wrapped" className="small">Your year →</Link>
      </div>
      <ul className="badges">
        {list.map((a) => (
          <li key={a.key} className={a.earnedAt ? 'got' : ''} title={a.description}>
            <strong>{a.name}</strong>
            <span className="muted small">{a.earnedAt ? dateFmt.format(new Date(a.earnedAt)) : a.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FeedCard() {
  const [items, setItems] = useState<{ username: string | null; name: string; earnedAt: string }[]>([]);
  const [following, setFollowing] = useState(0);
  useEffect(() => {
    api.social.feed().then((r) => setItems(r.items)).catch(() => {});
    api.social.following().then((r) => setFollowing(r.following.length)).catch(() => {});
  }, []);
  return (
    <section className="card">
      <h2>Following</h2>
      {following === 0 ? (
        <p className="muted small">Follow public profiles to see their achievements here. Find players on the <Link href="/leaderboards">leaderboards</Link>.</p>
      ) : items.length === 0 ? (
        <p className="muted small">Nothing new from the {following} players you follow.</p>
      ) : (
        <ul className="list">
          {items.map((i, n) => (
            <li key={n}>
              <Link href={`/p/${i.username}`}>{i.username}</Link>&nbsp;unlocked <strong>&nbsp;{i.name}</strong>
              <span className="muted small right">{dateFmt.format(new Date(i.earnedAt))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
