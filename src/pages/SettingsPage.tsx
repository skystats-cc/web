import type { PrivacySettings } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link, navigate } from '../lib/router';
import { useSession } from '../lib/session';

const FIELDS: { key: keyof PrivacySettings; title: string; help: string }[] = [
  { key: 'trackingEnabled', title: 'Record my money history', help: 'The SkyStats mod sends your purse and bank while you play. Turn this off to stop recording.' },
  { key: 'hideBank', title: 'Hide my coins from my co-op', help: 'Co-op members on SkyStats won’t see your purse or personal bank.' },
  { key: 'profilePublic', title: 'Public profile', help: 'Anyone can see a summary of your profiles at your public link and through the Discord bot.' },
  { key: 'showOnLeaderboards', title: 'Show me on leaderboards', help: 'Your name and coin gains can appear on public leaderboards.' },
  { key: 'allowActivityPings', title: 'Let my co-op get activity alerts', help: 'Co-op members can be told when you come online or start grinding.' },
];

export function SettingsPage() {
  const { account, loading, setAccount } = useSession();
  const [s, setS] = useState<PrivacySettings | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) api.me.privacy().then(setS).catch(() => setError("Couldn't load your settings."));
  }, [account?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <main className="wrap narrow" />;
  if (!account) {
    return (
      <main className="wrap narrow">
        <section className="card center">
          <h2>Sign in to change your settings</h2>
          <Link href="/link" className="button">Link Minecraft</Link>
        </section>
      </main>
    );
  }

  async function toggle(key: keyof PrivacySettings) {
    if (!s) return;
    setSaving(key);
    try {
      setS(await api.me.updatePrivacy({ [key]: !s[key] }));
    } catch {
      setError("Couldn't save that change.");
    } finally {
      setSaving(null);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api.me.deleteAccount();
      setAccount(null);
      navigate('/');
    } catch {
      setError("Couldn't delete your account. Try again, or email us if it keeps failing.");
      setDeleting(false);
    }
  }

  return (
    <main className="wrap narrow">
      <h1 className="page-title">Privacy and data</h1>
      <p className="muted">
        Everything that shares your data is off until you turn it on. Read the <Link href="/privacy">privacy notice</Link> to see what we keep and why.
      </p>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <ul className="settings">
          {FIELDS.map((f) => (
            <li key={f.key}>
              <div>
                <strong>{f.title}</strong>
                <p className="muted small">{f.help}</p>
              </div>
              <label className="switch">
                <input type="checkbox" checked={s?.[f.key] ?? false} disabled={!s || saving !== null} onChange={() => void toggle(f.key)} />
                <span className="slider" aria-hidden />
                <span className="sr-only">{f.title}</span>
              </label>
            </li>
          ))}
        </ul>
        {s?.profilePublic && (
          <p className="small">
            Your public link: <Link href={`/p/${account.username}`}>skystats.cc/p/{account.username}</Link>
          </p>
        )}
      </section>

      <section className="card">
        <h2>Download your data</h2>
        <p className="muted small">A JSON file with your account, profiles, money history, sessions, plan and the log of privacy changes. Free on every plan.</p>
        <a className="button" href="/v1/me/export" download>
          Download my data
        </a>
      </section>

      <section className="card danger">
        <h2>Delete my account</h2>
        <p className="muted small">
          This removes your account, money history and co-op data from SkyStats straight away, and cancels any paid plan.
          It can&rsquo;t be undone. Stripe keeps invoices for as long as tax law requires.
        </p>
        <label className="small">
          Type <code>DELETE</code> to confirm
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </label>
        <button className="danger" disabled={confirm !== 'DELETE' || deleting} onClick={() => void deleteAccount()}>
          {deleting ? 'Deleting…' : 'Delete my account'}
        </button>
      </section>
    </main>
  );
}
