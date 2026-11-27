import type { DiscordLink, LinkedAccount, SessionInfo } from '@skystats/api-client';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { avatarUrl } from '../lib/format';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';
import { ago } from '../lib/status';

const DISCORD_RESULTS: Record<string, { text: string; tone: 'notice' | 'warn' }> = {
  linked: { text: 'Discord connected.', tone: 'notice' },
  cancelled: { text: 'Connecting Discord was cancelled.', tone: 'warn' },
  alt_needs_plan: {
    text: 'That Discord account is already connected to another Minecraft account. Connecting more than one needs Pro or Max.',
    tone: 'warn',
  },
};

export function DiscordSection() {
  const [d, setD] = useState<DiscordLink | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [busy, setBusy] = useState(false);
  const result = DISCORD_RESULTS[new URLSearchParams(window.location.search).get('discord') ?? ''];

  async function load() {
    setD(await api.discord.status());
    setAccounts((await api.discord.accounts()).accounts);
  }
  useEffect(() => {
    void load().catch(() => {});
  }, []);

  async function unlink() {
    setBusy(true);
    await api.discord.unlink().catch(() => {});
    await load().catch(() => {});
    setBusy(false);
  }

  async function switchTo(uuid: string) {
    setBusy(true);
    await api.discord.switchTo(uuid);
    window.location.href = '/me'; // fresh page load picks up the new session cookie
  }

  if (!d?.enabled) return null;
  return (
    <section className="card">
      <h2>Discord</h2>
      {result && <p className={result.tone}>{result.text}</p>}
      {d.linked ? (
        <>
          <p className="small">
            Connected as <strong>{d.discordUsername}</strong>. You can sign in with Discord and use the SkyStats bot as yourself.
          </p>
          <button className="ghost" disabled={busy} onClick={() => void unlink()}>
            Disconnect Discord
          </button>
        </>
      ) : (
        <>
          <p className="muted small">
            Connect Discord to sign in with it and use the bot. We only get your Discord ID and username, never your email or servers.
          </p>
          <a className="button discord" href={api.discord.startUrl('link')}>
            Connect Discord
          </a>
        </>
      )}

      {accounts.length > 1 && (
        <>
          <h3>Your Minecraft accounts</h3>
          <ul className="list">
            {accounts.map((a) => (
              <li key={a.uuid}>
                <img src={avatarUrl(a.uuid, 24)} alt="" width={24} height={24} className="avatar" />
                {a.username ?? a.uuid}
                {a.current ? (
                  <span className="badge right">Signed in</span>
                ) : (
                  <button className="ghost right" disabled={busy} onClick={() => void switchTo(a.uuid)}>
                    Switch
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function deviceName(s: SessionInfo) {
  if (s.kind === 'mod') return 'SkyStats mod';
  const ua = s.userAgent ?? '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '';
  return os ? `${browser} on ${os}` : browser;
}

export function SessionsSection() {
  const { setAccount } = useSession();
  const [list, setList] = useState<SessionInfo[] | null>(null);

  const load = () => api.me.sessions().then((r) => setList(r.sessions)).catch(() => setList([]));
  useEffect(() => {
    void load();
  }, []);

  async function revoke(s: SessionInfo) {
    await api.me.revokeSession(s.id).catch(() => {});
    if (s.current) return setAccount(null);
    void load();
  }

  return (
    <section className="card">
      <h2>Signed-in devices</h2>
      <ul className="list">
        {list?.map((s) => (
          <li key={s.id}>
            <span>
              {deviceName(s)}
              {s.current && <span className="badge">This browser</span>}
              <span className="muted small"> · {s.lastUsedAt ? `active ${ago(s.lastUsedAt)}` : `signed in ${ago(s.createdAt)}`}</span>
            </span>
            <button className="ghost right" onClick={() => void revoke(s)}>
              Sign out
            </button>
          </li>
        ))}
      </ul>
      {list && list.length > 1 && (
        <button className="ghost" style={{ marginTop: 12 }} onClick={() => void api.me.revokeOtherSessions().then(load)}>
          Sign out everywhere else
        </button>
      )}
      <p className="muted small">
        Signing out the mod means running <code>/skystats link</code> again in game. <Link href="/privacy">How we use this</Link>.
      </p>
    </section>
  );
}
