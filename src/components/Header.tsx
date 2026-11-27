import { avatarUrl } from '../lib/format';
import { Link, usePath } from '../lib/router';
import { useSession } from '../lib/session';

export function Header() {
  const { account, loading } = useSession();
  const path = usePath();
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
        <nav>
          {nav('/', 'Status')}
          {account && nav('/me', 'My profiles')}
        </nav>
        <div className="account">
          {loading ? null : account ? (
            <Link href="/me" className="chip-account" title="Your profiles">
              <img src={avatarUrl(account.uuid, 24)} alt="" width={24} height={24} />
              {account.username}
            </Link>
          ) : (
            <Link href="/link" className="button">
              Link Minecraft
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
