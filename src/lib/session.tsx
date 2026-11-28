import type { Account } from '@skystats/api-client';
import { SkystatsApiError } from '@skystats/api-client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

interface Session {
  account: Account | null;
  loading: boolean;
  setAccount: (a: Account | null) => void;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}

// Swap the session cookie for a fresh one once a day, so a copied cookie stops working
function rotateDaily() {
  let last = 0;
  try {
    last = Number(window.localStorage.getItem('ss:rotatedAt') ?? 0);
  } catch {
    return;
  }
  if (Date.now() - last < 86_400_000) return;
  api.platform
    .rotateSession()
    .then(() => {
      try {
        window.localStorage.setItem('ss:rotatedAt', String(Date.now()));
      } catch {
        /* ignore */
      }
    })
    .catch(() => {});
}

const SessionContext = createContext<Session | null>(null);

// The session itself is an HttpOnly cookie the page can't read; we just ask the API who we are.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setAccount(await api.me.get());
      rotateDaily();
    } catch (err) {
      if (err instanceof SkystatsApiError && err.status === 401) setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.auth.logout().catch(() => {});
    setAccount(null);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <SessionContext.Provider value={{ account, loading, setAccount, reload, logout }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
}
