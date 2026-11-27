import type { Account, Pairing } from '@skystats/api-client';
import { SkystatsApiError } from '@skystats/api-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { avatarUrl, mmss } from '../lib/format';
import { Link, navigate } from '../lib/router';
import { useSession } from '../lib/session';

type State =
  | { step: 'loading' }
  | { step: 'waiting'; pairing: Pairing }
  | { step: 'expired' }
  | { step: 'linked'; account: Account }
  | { step: 'error'; message: string };

export function LinkPage() {
  const session = useSession();
  const [state, setState] = useState<State>({ step: 'loading' });
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const discordNotice = DISCORD_RESULTS[new URLSearchParams(window.location.search).get('discord') ?? ''];

  const newCode = useCallback(async () => {
    setState({ step: 'loading' });
    setCopied(false);
    try {
      setState({ step: 'waiting', pairing: await api.pairing.create() });
    } catch (err) {
      setState({
        step: 'error',
        message:
          err instanceof SkystatsApiError && err.status === 429
            ? 'Too many codes requested. Wait a minute and try again.'
            : "Couldn't reach SkyStats. Try again in a moment.",
      });
    }
  }, []);

  // Get a code as soon as the page opens (unless already signed in)
  useEffect(() => {
    if (session.loading || session.account || started.current) return;
    started.current = true;
    void newCode();
  }, [session.loading, session.account, newCode]);

  // Countdown + poll. Keeps polling while the tab is in the background: the player is in game.
  useEffect(() => {
    if (state.step !== 'waiting') return;
    const { pairing } = state;
    const expiresAt = new Date(pairing.expiresAt).getTime();
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      if (Date.now() > expiresAt) return setState({ step: 'expired' });
      try {
        const res = await api.pairing.poll(pairing.id, pairing.secret);
        if (res.status === 'linked' && res.account) {
          session.setAccount(res.account);
          setState({ step: 'linked', account: res.account });
        } else if (res.status === 'expired') {
          setState({ step: 'expired' });
        }
      } catch {
        // transient; next poll retries
      }
    }, pairing.pollIntervalSeconds * 1000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [state, session]);

  // After linking, continue to profiles
  useEffect(() => {
    if (state.step !== 'linked') return;
    const t = setTimeout(() => navigate('/me'), 2000);
    return () => clearTimeout(t);
  }, [state.step]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (!session.loading && session.account && state.step !== 'linked') {
    const a = session.account;
    return (
      <main className="wrap narrow">
        <section className="card center">
          <img className="avatar-lg" src={avatarUrl(a.uuid, 64)} alt="" width={64} height={64} />
          <h2>You're signed in as {a.username}</h2>
          <p className="muted">This browser is already linked to your Minecraft account.</p>
          <div className="row center">
            <Link href="/me" className="button">
              See your profiles
            </Link>
            <button
              className="ghost"
              onClick={async () => {
                await session.logout();
                started.current = false;
              }}
            >
              Link a different account
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="wrap narrow">
      <h1 className="page-title">Link your Minecraft account</h1>
      <p className="lede">
        Run one command in game to sign this browser in as your Minecraft account. No passwords, and your login
        never leaves Minecraft.
      </p>

      {discordNotice && <p className="notice">{discordNotice}</p>}

      <section className="card link-card">
        {state.step === 'loading' && <p className="muted">Getting a code…</p>}

        {state.step === 'error' && (
          <>
            <p className="error">{state.message}</p>
            <button onClick={() => void newCode()}>Try again</button>
          </>
        )}

        {state.step === 'expired' && (
          <div className="center">
            <h2>Code expired</h2>
            <p className="muted">Codes last 10 minutes and work once.</p>
            <button onClick={() => void newCode()}>Get a new code</button>
          </div>
        )}

        {state.step === 'linked' && (
          <div className="center linked">
            <img className="avatar-lg" src={avatarUrl(state.account.uuid, 64)} alt="" width={64} height={64} />
            <h2>Linked as {state.account.username}</h2>
            <p className="muted">Taking you to your profiles…</p>
          </div>
        )}

        {state.step === 'waiting' && (
          <>
            <div className="code" aria-label="Your pairing code">
              {state.pairing.code}
            </div>
            <p className="muted center">
              Expires in {mmss(new Date(state.pairing.expiresAt).getTime() - now)}
            </p>

            <ol className="steps">
              <li>
                <strong>Install the SkyStats mod</strong> (Fabric, Minecraft 26.2+) and launch the game.
              </li>
              <li>
                <strong>Paste this command into chat:</strong>
                <div className="command">
                  <code>{state.pairing.command}</code>
                  <button onClick={() => void copy(state.pairing.command)}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
              </li>
              <li>
                <strong>Click [Confirm]</strong> in the chat message that appears. This page updates by itself.
              </li>
            </ol>

            <p className="waiting">
              <span className="spinner" aria-hidden /> Waiting for the game…
            </p>
            <p className="warn">
              Only run codes you got from this page yourself. Anyone who gets you to run their code can sign in as you.
            </p>
          </>
        )}
      </section>

      <section className="card center">
        <h2>Already linked?</h2>
        <p className="muted small">If you&rsquo;ve connected Discord to your SkyStats account, you can sign in with it instead.</p>
        <a className="button discord" href={api.discord.startUrl('login')}>
          Sign in with Discord
        </a>
      </section>
    </main>
  );
}

const DISCORD_RESULTS: Record<string, string> = {
  not_linked: 'That Discord account isn\u2019t connected to SkyStats yet. Link Minecraft below first, then connect Discord in Privacy settings.',
  cancelled: 'Discord sign-in was cancelled.',
  expired: 'That sign-in link expired. Try again.',
  invalid: 'Sign-in didn\u2019t match this browser. Try again from this page.',
};
