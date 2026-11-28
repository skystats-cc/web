import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { t } from '../lib/i18n';
import { NewsDrawer } from './NewsDrawer';
import { avatarUrl } from '../lib/format';
import { Link, usePath } from '../lib/router';
import { useSession } from '../lib/session';

export function Header() {
  const { account, loading } = useSession();
  const path = usePath();
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [path]);
  const nav = (href: string, label: string) => (
    <Link href={href} className={`navlink ${path === href ? 'active' : ''}`}>
      {label}
    </Link>
  );

  return (
    <header className="topnav">
      <div className="wrap topnav-inner">
        <Link href="/" className="brand">
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>
            SkyStats<span className="dim">.cc</span>
          </span>
        </Link>
        <button className="ghost menu-toggle" aria-expanded={menu} aria-controls="main-nav" onClick={() => setMenu((m) => !m)}>
          <span aria-hidden>☰</span>
          <span className="sr-only">Menu</span>
        </button>
        <nav id="main-nav" className={menu ? 'open' : ''}>
          {nav('/', t('nav.status'))}
          {nav('/bazaar', t('nav.bazaar'))}
          {nav('/methods', t('nav.methods'))}
          {nav('/leaderboards', t('nav.leaderboards'))}
          {account && nav('/me', t('nav.profiles'))}
          {account && nav('/alerts', t('nav.alerts'))}
          {nav('/pricing', t('nav.plans'))}
          {nav('/settings', t('nav.settings'))}
        </nav>
        <div className="account row">
          <button
            className="ghost tiny palette-hint"
            title="Search (Ctrl K)"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          >
            Search <kbd>{t('palette.hint')}</kbd>
          </button>
          <NewsDrawer />
          {loading ? null : account ? (
            <Link href="/me" className="chip-account" title="Your profiles">
              <img src={avatarUrl(account.uuid, 24)} alt="" width={24} height={24} />
              {account.username}
            </Link>
          ) : (
            <span className="row">
              <a className="button ghost" href={api.discord.startUrl('login')}>
                Sign in with Discord
              </a>
              <Link href="/link" className="button">
                Link Minecraft
              </Link>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
