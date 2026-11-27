import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { api } from './lib/api';
import { usePoll } from './lib/usePoll';
import { usePath } from './lib/router';
import { SessionProvider } from './lib/session';
import { HomePage } from './pages/HomePage';
import { LinkPage } from './pages/LinkPage';
import { BillingPage } from './pages/BillingPage';
import { PrivacyNotice } from './pages/legal/PrivacyNotice';
import { Terms } from './pages/legal/Terms';
import { PricingPage } from './pages/PricingPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { Link } from './lib/router';

export function App() {
  // One status poll shared by the top bar and the home page card
  const status = usePoll(() => api.status(), 60_000);
  const path = usePath();

  let page;
  if (path === '/link') page = <LinkPage />;
  else if (path === '/me') page = <ProfilesPage />;
  else if (path === '/settings') page = <SettingsPage />;
  else if (path === '/pricing') page = <PricingPage />;
  else if (path === '/billing') page = <BillingPage />;
  else if (path === '/privacy' || path === '/cookies') page = <PrivacyNotice />;
  else if (path === '/terms') page = <Terms />;
  else if (path.startsWith('/p/')) page = <PublicProfilePage name={decodeURIComponent(path.slice(3))} />;
  else page = <HomePage status={status} />;

  return (
    <SessionProvider>
      <StatusBar status={status.data} error={status.error} />
      <Header />
      {page}
      <footer className="wrap footer">
        <nav className="row">
          <Link href="/pricing">Plans</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p>
          Not affiliated with Hypixel. Not an official Minecraft service; not approved by or associated with Mojang or Microsoft. Status
          data from status.hypixel.net.
        </p>
      </footer>
    </SessionProvider>
  );
}
