import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { api } from './lib/api';
import { usePoll } from './lib/usePoll';
import { usePath } from './lib/router';
import { SessionProvider } from './lib/session';
import { HomePage } from './pages/HomePage';
import { Link } from './lib/router';
import { lazy, Suspense } from 'react';
import { CommandPalette } from './components/CommandPalette';
import { PageSkeleton } from './components/Skeleton';
import { FlagsProvider } from './lib/flags';
import { PrefsProvider } from './lib/prefs';

// Pages load on demand (code splitting); the home page is in the main bundle
const LinkPage = lazy(() => import('./pages/LinkPage').then((m) => ({ default: m.LinkPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage })));
const BazaarPage = lazy(() => import('./pages/bazaar/BazaarPage').then((m) => ({ default: m.BazaarPage })));
const ItemPage = lazy(() => import('./pages/bazaar/ItemPage').then((m) => ({ default: m.ItemPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then((m) => ({ default: m.BillingPage })));
const LeaderboardsPage = lazy(() => import('./pages/LeaderboardsPage').then((m) => ({ default: m.LeaderboardsPage })));
const WrappedPage = lazy(() => import('./pages/WrappedPage').then((m) => ({ default: m.WrappedPage })));
const CoopPage = lazy(() => import('./pages/CoopPage').then((m) => ({ default: m.CoopPage })));
const CustomMethodPage = lazy(() => import('./pages/methods/CustomMethodPage').then((m) => ({ default: m.CustomMethodPage })));
const MethodPage = lazy(() => import('./pages/methods/MethodPage').then((m) => ({ default: m.MethodPage })));
const MethodsPage = lazy(() => import('./pages/methods/MethodsPage').then((m) => ({ default: m.MethodsPage })));
const PrivacyNotice = lazy(() => import('./pages/legal/PrivacyNotice').then((m) => ({ default: m.PrivacyNotice })));
const Terms = lazy(() => import('./pages/legal/Terms').then((m) => ({ default: m.Terms })));
const PricingPage = lazy(() => import('./pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const ProfilesPage = lazy(() => import('./pages/ProfilesPage').then((m) => ({ default: m.ProfilesPage })));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage').then((m) => ({ default: m.PublicProfilePage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const DevelopersPage = lazy(() => import('./pages/DevelopersPage').then((m) => ({ default: m.DevelopersPage })));

export function App() {
  // One status poll shared by the top bar and the home page card
  const status = usePoll(() => api.status(), 60_000);
  const path = usePath();

  let page;
  if (path === '/link') page = <LinkPage />;
  else if (path === '/me') page = <ProfilesPage />;
  else if (path === '/settings') page = <SettingsPage />;
  else if (path === '/alerts') page = <AlertsPage />;
  else if (path.startsWith('/coop/')) page = <CoopPage profileId={decodeURIComponent(path.slice(6))} />;
  else if (path === '/leaderboards') page = <LeaderboardsPage />;
  else if (path === '/wrapped') page = <WrappedPage />;
  else if (path === '/bazaar') page = <BazaarPage />;
  else if (path.startsWith('/bazaar/')) page = <ItemPage id={decodeURIComponent(path.slice(8)).toUpperCase()} />;
  else if (path === '/methods') page = <MethodsPage />;
  else if (path === '/methods/new') page = <CustomMethodPage />;
  else if (path.startsWith('/methods/edit/')) page = <CustomMethodPage id={decodeURIComponent(path.slice(14))} />;
  else if (path.startsWith('/methods/')) page = <MethodPage id={decodeURIComponent(path.slice(9))} />;
  else if (path === '/pricing') page = <PricingPage />;
  else if (path === '/billing') page = <BillingPage />;
  else if (path === '/privacy' || path === '/cookies') page = <PrivacyNotice />;
  else if (path === '/terms') page = <Terms />;
  else if (path === '/developers') page = <DevelopersPage />;
  else if (path.startsWith('/p/')) page = <PublicProfilePage name={decodeURIComponent(path.slice(3))} />;
  else page = <HomePage status={status} />;

  return (
    <PrefsProvider>
    <SessionProvider>
    <FlagsProvider>
      <a className="skip-link" href="#content">Skip to content</a>
      <StatusBar status={status.data} error={status.error} />
      <Header />
      <CommandPalette />
      <div id="content">
        <Suspense fallback={<PageSkeleton />}>{page}</Suspense>
      </div>
      <footer className="wrap footer">
        <nav className="row">
          <Link href="/pricing">Plans</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/developers">Developers</Link>
        </nav>
        <p>
          Not affiliated with Hypixel. Not an official Minecraft service; not approved by or associated with Mojang or Microsoft. Status
          data from status.hypixel.net.
        </p>
      </footer>
    </FlagsProvider>
    </SessionProvider>
    </PrefsProvider>
  );
}
