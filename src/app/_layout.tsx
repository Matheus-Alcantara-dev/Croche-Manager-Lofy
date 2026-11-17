import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Loading } from '@/components/ui';
import { LocalSession, useLocalSession } from '@/features/access/session';
import { colors } from '@/theme';

function Navigation() {
  const { account, loading } = useLocalSession();
  if (loading) return <Loading />;

  return <>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!!account}>
        <Stack.Screen name="(signed-in)" />
      </Stack.Protected>
      <Stack.Protected guard={account?.role === 'admin'}>
        <Stack.Screen name="(artisan)" />
      </Stack.Protected>
    </Stack>
  </>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ DMSans_400Regular, DMSans_600SemiBold, InstrumentSerif_400Regular });
  if (!loaded && !error) return <Loading />;
  return <LocalSession><Navigation /></LocalSession>;
}
