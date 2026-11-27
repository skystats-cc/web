import type { PublicPlayer } from '@skystats/api-client';
import { SkystatsApiError } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { LineChart } from '../components/LineChart';
import { api } from '../lib/api';
import { avatarUrl, coins, GAME_MODES } from '../lib/format';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });

export function PublicProfilePage({ name }: { name: string }) {
  const [p, setP] = useState<PublicPlayer | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setP(null);
    setMissing(false);
    api.players
      .get(name)
      .then(setP)
      .catch((err) => setMissing(err instanceof SkystatsApiError && err.status === 404));
  }, [name]);

  if (missing) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          <h2>No public profile for {name}</h2>
          <p className="muted">Profiles are private unless the player chooses to share theirs.</p>
        </section>
      </main>
    );
  }
  if (!p) return <main className="wrap narrow" />;

  return (
    <main className="wrap">
      <section className="me-head">
        <img className="avatar-lg" src={avatarUrl(p.uuid, 64)} alt="" width={64} height={64} />
        <div className="me-info">
          <h1>{p.username}</h1>
          <p className="muted">{p.usesMod ? 'Uses the SkyStats mod' : 'On SkyStats'}</p>
        </div>
      </section>
      <div className="profiles">
        {p.profiles.map((pr) => (
          <section key={pr.id} className={`card profile ${pr.selected ? 'selected' : ''}`}>
            <div className="card-head">
              <h2>
                {pr.name ?? 'Profile'}
                {GAME_MODES[pr.gameMode] && <span className="badge">{GAME_MODES[pr.gameMode]}</span>}
              </h2>
              <div className="bank">
                <span className="label">SB level</span>
                <span className="value">{pr.skyblockLevel ?? '—'}</span>
              </div>
            </div>
            {pr.total !== null && (
              <>
                <div className="value">{coins(pr.total)} coins</div>
                <LineChart
                  height={140}
                  points={pr.week.filter((w) => w.total !== null).map((w) => ({ t: new Date(w.day).getTime(), v: w.total as number }))}
                  formatValue={coins}
                  formatTime={(t) => dateFmt.format(t)}
                  label={`${p.username}'s coins over the last week`}
                />
              </>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
