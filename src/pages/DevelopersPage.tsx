import { SkystatsApiError, type ApiKey, type Webhook } from '@skystats/api-client';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** API keys and webhooks (Max), plus a short API guide. Keys are shown once and stored hashed. */
export function DevelopersPage() {
  const { account, loading } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [secret, setSecret] = useState<{ label: string; value: string } | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  async function load() {
    const [k, w] = await Promise.all([api.platform.apiKeys(), api.platform.webhooks()]);
    setKeys(k.keys);
    setHooks(w.webhooks);
  }
  useEffect(() => {
    if (account) void load().catch(() => setError('Couldn’t load your keys.'));
  }, [account?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fail = (e: unknown) => {
    if (e instanceof SkystatsApiError && e.status === 403) setLocked(e.message);
    else setError(e instanceof SkystatsApiError ? e.message : 'Something went wrong.');
  };
  async function addKey(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    try {
      const k = await api.platform.createApiKey(name.trim());
      setSecret({ label: `API key “${k.name}”`, value: k.key });
      setName('');
      await load();
    } catch (e) {
      fail(e);
    }
  }
  async function addHook(ev: FormEvent) {
    ev.preventDefault();
    setError(null);
    try {
      const w = await api.platform.createWebhook(url.trim());
      setSecret({ label: `Signing secret for ${w.url}`, value: w.secret });
      setUrl('');
      await load();
    } catch (e) {
      fail(e);
    }
  }

  if (loading) return <main className="wrap narrow" />;
  if (!account)
    return (
      <main className="wrap narrow">
        <section className="card center">
          <h2>Sign in to manage API keys</h2>
          <Link href="/link" className="button">Link Minecraft</Link>
        </section>
      </main>
    );

  return (
    <main className="wrap narrow">
      <h1 className="page-title">Developers</h1>
      <p className="muted">
        Read your own SkyStats data and public market data from scripts and tools. Keys are read-only and need Max.
      </p>
      {locked && (
        <p className="muted small locked">
          {locked}. <Link href="/pricing">Compare plans</Link>.
        </p>
      )}
      {error && <p className="error">{error}</p>}
      {secret && (
        <section className="card notice" role="status">
          <h2>{secret.label}</h2>
          <p className="small">Copy it now. We only keep a hash, so it can&rsquo;t be shown again.</p>
          <code className="secret">{secret.value}</code>
          <div className="row">
            <button className="ghost" onClick={() => void navigator.clipboard?.writeText(secret.value)}>Copy</button>
            <button className="ghost" onClick={() => setSecret(null)}>Done</button>
          </div>
        </section>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <h2>API keys</h2>
        <ul className="list">
          {keys.map((k) => (
            <li key={k.id}>
              <span>
                <strong>{k.name}</strong> <code>{k.prefix}…</code>
                <span className="muted small"> · made {dateFmt.format(new Date(k.createdAt))}{k.lastUsedAt ? `, last used ${dateFmt.format(new Date(k.lastUsedAt))}` : ', never used'}</span>
              </span>
              <button className="ghost right" onClick={() => void api.platform.revokeApiKey(k.id).then(load).catch(fail)}>Revoke</button>
            </li>
          ))}
          {keys.length === 0 && <li className="muted">No keys yet.</li>}
        </ul>
        <form className="row" onSubmit={(e) => void addKey(e)}>
          <label className="grow">
            <span className="sr-only">Key name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. my spreadsheet" maxLength={40} />
          </label>
          <button type="submit" disabled={!name.trim()}>Create key</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Alert webhooks</h2>
        <p className="muted small">Your alerts are also POSTed here as JSON. Only https addresses on the public internet work.</p>
        <ul className="list">
          {hooks.map((w) => (
            <li key={w.id}>
              <span>
                <code>{w.url}</code>
                <span className="muted small">
                  {' '}· {w.active ? 'on' : 'switched off after repeated failures'}
                  {w.lastStatus !== null ? `, last reply ${w.lastStatus}` : ''}
                </span>
              </span>
              <span className="row right">
                <button className="ghost" onClick={() => void api.platform.testWebhook(w.id).catch(fail)}>Test</button>
                <button className="ghost" onClick={() => void api.platform.deleteWebhook(w.id).then(load).catch(fail)}>Delete</button>
              </span>
            </li>
          ))}
          {hooks.length === 0 && <li className="muted">No webhooks yet.</li>}
        </ul>
        <form className="row" onSubmit={(e) => void addHook(e)}>
          <label className="grow">
            <span className="sr-only">Webhook URL</span>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/skystats" maxLength={500} />
          </label>
          <button type="submit" disabled={!url.trim()}>Add webhook</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2>Quick start</h2>
        <pre className="code">{`curl -H "x-api-key: ssk_…" https://skystats.cc/v1/me/money?profileId=…&range=30d
curl https://skystats.cc/v1/bazaar/ENCHANTED_DIAMOND          # public, no key needed
curl -N https://skystats.cc/v1/bazaar/stream                  # live prices (Server-Sent Events)`}</pre>
        <ul className="small">
          <li>Keys can read, never change, your account. Each key has its own rate limit; responses carry ETags, so send <code>If-None-Match</code>.</li>
          <li>Webhook deliveries carry <code>skystats-signature: t=&lt;unix&gt;,v1=&lt;hex&gt;</code>: HMAC-SHA256 of <code>t.body</code> with your secret.</li>
          <li>Every response has an <code>x-request-id</code>. Quote it if you report a problem.</li>
          <li>Data comes from the SkyStats mod and the public Hypixel API. Follow the Hypixel API rules if you build on it.</li>
        </ul>
      </section>
    </main>
  );
}
