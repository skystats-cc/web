import type { HypixelStatus } from '@skystats/api-client';
import { PingCard } from '../components/PingCard';
import { StatusCard } from '../components/StatusCard';
import { Link } from '../lib/router';
import { useSession } from '../lib/session';

interface Props {
  status: { data: HypixelStatus | null; error: Error | null; loading: boolean; refresh: () => Promise<void> };
}

export function HomePage({ status }: Props) {
  const { account } = useSession();
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>SkyBlock money tracking, done properly.</h1>
          <p className="lede">
            Co-op tracking, money-making method metrics and full bazaar history. We're building it now.
          </p>
          {!account && (
            <p>
              <Link href="/link" className="button big">
                Link your Minecraft account
              </Link>
            </p>
          )}
        </div>
      </section>
      <main className="wrap grid">
        <StatusCard {...status} />
        <PingCard />
      </main>
    </>
  );
}
