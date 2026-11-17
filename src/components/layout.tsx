import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link, usePathname, type Href } from 'expo-router';
import type { ComponentProps, PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSession } from '@/features/access/session';
import { useAction } from '@/hooks/use-data';
import { brandName } from '@/local/identity';
import { colors } from '@/theme';
import { fonts, Notice } from './ui';

export const logo = require('../../assets/images/lofy-logo.jpg');
export type IconName = ComponentProps<typeof Ionicons>['name'];
type NavigationLink = { label: string; href: Href; icon: IconName };

export const artisanLinks: NavigationLink[] = [
  { label: 'Visão geral', href: '/atelie', icon: 'grid-outline' },
  { label: 'Encomendas', href: '/atelie/encomendas', icon: 'receipt-outline' },
  { label: 'Projetos', href: '/atelie/projetos', icon: 'layers-outline' },
  { label: 'Crochetar', href: '/atelie/crochetar', icon: 'timer-outline' },
  { label: 'Clientes', href: '/atelie/clientes', icon: 'people-outline' },
  { label: 'Gerenciar catálogo', href: '/atelie/catalogo', icon: 'pricetags-outline' },
  { label: 'Materiais', href: '/atelie/materiais', icon: 'cube-outline' },
  { label: 'Calculadora', href: '/atelie/precos', icon: 'calculator-outline' },
  { label: 'Financeiro', href: '/atelie/financeiro', icon: 'wallet-outline' },
];

const navigation: NavigationLink[] = [
  { label: 'Início', href: '/', icon: 'home-outline' },
  { label: 'Projetos', href: '/atelie/projetos', icon: 'layers-outline' },
  { label: 'Crochetar', href: '/atelie/crochetar', icon: 'timer-outline' },
  { label: 'Catálogo', href: '/catalogo', icon: 'bag-handle-outline' },
  { label: 'Encomendas', href: '/atelie/encomendas', icon: 'receipt-outline' },
];

const customerNavigation: NavigationLink[] = [
  { label: 'Projetos', href: '/projetos', icon: 'layers-outline' },
  { label: 'Encomendar', href: '/encomendar', icon: 'bag-handle-outline' },
];

function Nav({ bottom, items }: { bottom: boolean; items: NavigationLink[] }) {
  const path = usePathname();
  return <View style={bottom ? styles.bottom : styles.desktopNav}>
    {items.map(({ href, label, icon }) => {
      const selected = path === href || (href === '/catalogo' && path.startsWith('/produto/'))
        || (href === '/atelie/encomendas' && path === '/encomendar');
      return <Link href={href} key={label} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={label} accessibilityState={{ selected }}
          style={StyleSheet.flatten([styles.navItem, bottom && styles.bottomItem,
            bottom && href === '/atelie/crochetar' && styles.timerShortcut,
            selected && (bottom ? styles.selectedMobile : styles.selectedDesktop)])}>
          {bottom && <Ionicons name={icon} color={selected ? colors.accent : colors.muted} size={21} />}
          <Text style={[styles.navText, bottom && styles.bottomText, selected && bottom && { color: colors.accent }]}>{label}</Text>
        </Pressable>
      </Link>;
    })}
  </View>;
}

export function Page({ children, narrow = false }: PropsWithChildren<{ narrow?: boolean }>) {
  const { width } = useWindowDimensions();
  const mobile = width < 960;
  const { account, logout } = useLocalSession();
  const action = useAction();
  const admin = account?.role === 'admin';
  const items = admin ? navigation : customerNavigation;
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Link href={account?.role === 'customer' ? '/projetos' : '/'} asChild>
            <Pressable accessibilityLabel={brandName + ', início'} accessibilityRole="link" style={styles.brand}>
              <Image source={logo} style={styles.logo} contentFit="contain" />
            </Pressable>
          </Link>
          {account && !mobile && <Nav bottom={false} items={items} />}
          {account && <View style={styles.actions}>
            {admin && <Link href="/atelie" asChild>
              <Pressable accessibilityLabel="Meu ateliê" accessibilityRole="link" style={styles.atelier}>
                <Ionicons name="apps-outline" color={colors.accentText} size={19} />
                {!mobile && <Text style={styles.navText}>Meu ateliê</Text>}
              </Pressable>
            </Link>}
            <Pressable accessibilityLabel="Sair" accessibilityRole="button" style={styles.atelier}
              onPress={() => void action.run(logout)} disabled={action.busy}>
              <Ionicons name="log-out-outline" color={colors.accentText} size={20} />
              <Text style={styles.navText}>Sair</Text>
            </Pressable>
          </View>}
        </View>
      </View>
      <ScrollView style={styles.main} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.content, narrow && { maxWidth: 680 }]}>
          {!!action.error && <Notice error>{action.error}</Notice>}
          {children}
        </View>
      </ScrollView>
      {account && mobile && <Nav bottom items={items} />}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.accent },
  body: { flex: 1 },
  header: { backgroundColor: colors.accent, alignItems: 'center' },
  headerInner: { width: '100%', maxWidth: 1160, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 62, height: 62, borderRadius: 31 },
  actions: { flexDirection: 'row', gap: 8 },
  atelier: { paddingHorizontal: 10, minWidth: 44, minHeight: 44, borderRadius: 12, backgroundColor: '#795844',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  desktopNav: { flexDirection: 'row', gap: 5 },
  navItem: { borderRadius: 12, minHeight: 44, paddingHorizontal: 13, justifyContent: 'center', alignItems: 'center' },
  selectedDesktop: { backgroundColor: '#795844' },
  navText: { color: colors.accentText, fontFamily: fonts.strong, fontSize: 13 },
  bottom: { flexDirection: 'row', backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 5,
    borderTopWidth: 1, borderColor: colors.border },
  bottomItem: { flex: 1, paddingHorizontal: 2, gap: 3, minHeight: 52 },
  bottomText: { color: colors.muted, fontSize: 11 },
  timerShortcut: { backgroundColor: colors.sage },
  selectedMobile: { backgroundColor: colors.cream },
  main: { backgroundColor: colors.canvas },
  scroll: { alignItems: 'center' },
  content: { width: '100%', maxWidth: 1120, paddingHorizontal: 16, paddingTop: 19, paddingBottom: 30, gap: 18 },
});
