import { Redirect } from 'expo-router';
import SignIn from '@/features/access/sign-in';
import { useLocalSession } from '@/features/access/session';
import { Home } from '@/features/catalog/public-catalog';

export default function Index() {
  const { account } = useLocalSession();
  if (account?.role === 'customer') return <Redirect href="/projetos" />;
  return account?.role === 'admin' ? <Home /> : <SignIn />;
}
