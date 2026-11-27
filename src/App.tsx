import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { api } from './lib/api';
import { usePoll } from './lib/usePoll';
import { usePath } from './lib/router';
import { SessionProvider } from './lib/session';
import { HomePage } from './pages/HomePage';
import { LinkPage } from './pages/LinkPage';
import { ProfilesPage } from './pages/ProfilesPage';

export function App() {
  // One status poll shared by the top bar and the home page card
  const status = usePoll(() => api.status(), 60_000);
  const path = usePath();

  let page;
  if (path === '/link') page = <LinkPage />;
  else if (path === '/me') page = <ProfilesPage />;
  else page = <HomePage status={status} />;

  return (
    <SessionProvider>
      <StatusBar status={status.data} error={status.error} />
      <Header />
      {page}
      <footer className="wrap footer">Not affiliated with Hypixel. Status data from status.hypixel.net.</footer>
    </SessionProvider>
  );
}
