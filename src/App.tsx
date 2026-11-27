import { PingCard } from './components/PingCard';
import { StatusBar } from './components/StatusBar';
import { StatusCard } from './components/StatusCard';
import { api } from './lib/api';
import { usePoll } from './lib/usePoll';

export function App() {
  // One status poll shared by the top bar and the card
  const status = usePoll(() => api.status(), 60_000);

  return (
    <>
      <StatusBar status={status.data} error={status.error} />
      <header className="hero">
        <div className="wrap">
          <div className="brand">
            <img src="/favicon.svg" alt="" width={36} height={36} />
            <span>SkyStats<span className="dim">.cc</span></span>
          </div>
          <h1>SkyBlock money tracking, done properly.</h1>
          <p className="lede">
            Co-op tracking, money-making method metrics and full bazaar history. We're building it now.
          </p>
        </div>
      </header>
      <main className="wrap grid">
        <StatusCard {...status} />
        <PingCard />
      </main>
      <footer className="wrap footer">
        Not affiliated with Hypixel. Status data from status.hypixel.net.
      </footer>
    </>
  );
}
