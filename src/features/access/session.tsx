import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { withWorkspace } from '@/local/database';
import { activeAccount, initialAccess, signIn, type LocalAccount } from '@/local/identity';

type Session = {
  account: LocalAccount | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, pin?: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Context = createContext<Session | null>(null);
export function LocalSession({ children }: PropsWithChildren) {
  const [state, setState] = useState<Pick<Session, 'account' | 'loading' | 'error'>>({
    account: null, loading: true, error: null,
  });

  useEffect(() => {
    let current = true;
    void withWorkspace((workspace) => activeAccount(workspace.access)).then((account) => {
      if (current) setState({ account, loading: false, error: null });
    }, () => {
      if (current) setState({ account: null, loading: false, error: 'Não foi possível abrir o banco local. Reabra o app para tentar novamente.' });
    });
    return () => { current = false; };
  }, []);

  async function login(phone: string, pin?: string) {
    const account = await withWorkspace((workspace) => signIn(workspace.access ??= initialAccess(), phone, pin), true);
    setState({ account, loading: false, error: null });
  }

  async function logout() {
    await withWorkspace((workspace) => {
      if (workspace.access) workspace.access.activePhone = null;
    }, true);
    setState({ account: null, loading: false, error: null });
  }

  return <Context.Provider value={{ ...state, login, logout }}>{children}</Context.Provider>;
}

export function useLocalSession() {
  const session = useContext(Context);
  if (!session) throw new Error('Sessão local indisponível.');
  return session;
}
