import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import { useSession } from './session';

const Ctx = createContext<Record<string, boolean>>({});

/** Feature flags from the server, refetched when the signed-in account changes */
export function FlagsProvider({ children }: { children: ReactNode }) {
  const { account } = useSession();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  useEffect(() => {
    api.platform.flags().then((r) => setFlags(r.flags)).catch(() => setFlags({}));
  }, [account?.uuid]);
  return <Ctx.Provider value={flags}>{children}</Ctx.Provider>;
}

/** Off until the server says otherwise */
export const useFlag = (key: string) => useContext(Ctx)[key] === true;
