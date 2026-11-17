import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Page, type IconName } from '@/components/layout';
import { Photo } from '@/components/photos';
import { DataState } from '@/components/resource';
import { Button, Card, Copy, Heading, Notice, Row, Title, fonts, styles } from '@/components/ui';
import { useData } from '@/hooks/use-data';
import { localPhoto } from '@/local/photos';
import { publishedCatalog, publishedProduct } from '@/services/store';
import { colors } from '@/theme';
import type { Product } from '@/types/models';
import { money } from '@/utils/format';

const shortcuts: { label: string; href: Href; icon: IconName; tint: string }[] = [
  { label: 'Projetos', href: '/atelie/projetos', icon: 'layers-outline', tint: '#F2E3D4' },
  { label: 'Catálogo', href: '/catalogo', icon: 'bag-handle-outline', tint: '#F5E9DC' },
  { label: 'Encomendas', href: '/atelie/encomendas', icon: 'receipt-outline', tint: '#E8EBE0' },
  { label: 'Calculadora', href: '/atelie/precos', icon: 'calculator-outline', tint: '#F1E6E8' },
];

const normalize = (text: string) => text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
const priceLabel = (product: Product) => product.price == null ? 'Sob consulta' : money(product.price);
const matches = (product: Product, text: string) =>
  normalize(product.name + ' ' + product.description).includes(normalize(text.trim()));

function Search({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return <View style={s.search}>
    <Ionicons name="search-outline" size={21} color={colors.muted} />
    <TextInput accessibilityLabel="Buscar peças" placeholder="Qual peça você procura?" placeholderTextColor={colors.muted}
      value={value} onChangeText={onChange} style={s.searchInput} />
    {!!value && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={10} onPress={() => onChange('')}>
      <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
    </Pressable>}
  </View>;
}

function Grid({ products, categories }: { products: Product[]; categories: { id: string; name: string }[] }) {
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 4 : width >= 690 ? 3 : 2;
  const tileWidth = (Math.min(width, 1120) - 32 - (columns - 1) * 12) / columns;
  const categoryNames = new Map(categories.map(({ id, name }) => [id, name]));
  return <View style={s.grid}>
    {products.map((product) => {
      const source = product.photos[0] && localPhoto(product.photos[0]);
      return <Link key={product.id} href={{ pathname: '/produto/[id]', params: { id: product.id } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={product.name} style={{ ...s.tile, width: tileWidth }}>
          {source ? <Image source={source} style={s.photo} contentFit="cover" contentPosition="center" />
            : <View style={[s.photo, s.noPhoto]}><Ionicons name="bag-handle-outline" size={34} color={colors.muted} /></View>}
          <View style={s.tileText}>
            {!!product.category_id && <Text style={s.category}>{categoryNames.get(product.category_id)}</Text>}
            <Text style={s.productName}>{product.name}</Text>
            <Text style={s.price}>{priceLabel(product)}</Text>
          </View>
        </Pressable>
      </Link>;
    })}
  </View>;
}

export function Home() {
  const [search, setSearch] = useState('');
  const state = useData(publishedCatalog);
  const browsing = search.trim().length > 0;
  const products = state.data?.products.filter((product) => browsing ? matches(product, search) : product.featured).slice(0, 8) ?? [];
  return <Page>
    <View style={s.intro}>
      <Text accessibilityRole="header" style={s.welcome}>Ateliê de crochê</Text>
    </View>
    <Search value={search} onChange={setSearch} />
    <View style={s.shortcuts}>
      {shortcuts.map(({ label, href, icon, tint }) => <Link href={href} key={label} asChild>
        <Pressable accessibilityRole="link" style={s.shortcut}>
          <View style={[s.icon, { backgroundColor: tint }]}><Ionicons name={icon} size={23} color={colors.accent} /></View>
          <Text style={s.shortcutText}>{label}</Text>
        </Pressable>
      </Link>)}
    </View>
    <View style={s.section}>
      <Title>{browsing ? 'Resultados da busca' : 'Peças em destaque'}</Title>
      <Link href="/catalogo" style={s.viewAll}>Ver catálogo <Ionicons name="chevron-forward" size={14} /></Link>
    </View>
    <DataState {...state} retry={state.reload} />
    {state.data && <>
      <Grid products={products} categories={state.data.categories} />
      {!products.length && <Copy muted>{browsing ? 'Nenhuma peça encontrada.' : 'Marque um produto como destaque para mostrá-lo aqui.'}</Copy>}
    </>}
  </Page>;
}

export function Catalog() {
  const state = useData(publishedCatalog);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const products = state.data?.products.filter((product) =>
    (!category || product.category_id === category) && matches(product, search)) ?? [];
  return <Page>
    <Heading>Catálogo</Heading>
    <Row>
      <Button label="Solicitar encomenda" onPress={() => router.push('/encomendar')} />
      <Button label="Gerenciar peças" secondary onPress={() => router.push('/atelie/catalogo')} />
    </Row>
    <Search value={search} onChange={setSearch} />
    <DataState {...state} retry={state.reload} />
    {state.data && <>
      <Row>
        {[{ id: '', name: 'Todas' }, ...state.data.categories].map((item) =>
          <Button key={item.id} label={item.name} secondary={category !== item.id} onPress={() => setCategory(item.id)} />)}
      </Row>
      <Grid products={products} categories={state.data.categories} />
      {!products.length && <Copy muted>Nenhuma peça encontrada.</Copy>}
    </>}
  </Page>;
}

export function ProductPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const query = useCallback(() => typeof id === 'string' ? publishedProduct(id) : Promise.resolve(null), [id]);
  const state = useData(query);
  const product = state.data;
  return <Page narrow>
    <Link href="/catalogo" style={s.viewAll}><Ionicons name="arrow-back" size={16} /> Catálogo</Link>
    <DataState {...state} retry={state.reload} />
    {product === null && <Notice>Peça indisponível nesta vitrine.</Notice>}
    {product && <>
      <Heading>{product.name}</Heading>
      <Card>
        <Title>{priceLabel(product)}</Title>
        <Copy>{product.description}</Copy>
        {product.available && <Button label="Solicitar esta peça" onPress={() =>
          router.push({ pathname: '/encomendar', params: { produto: product.id } })} />}
      </Card>
      {product.photos.map((path) => <Photo key={path} path={path} label={product.name} />)}
    </>}
  </Page>;
}

const s = StyleSheet.create({
  intro: { gap: 4 },
  welcome: { fontFamily: fonts.title, fontSize: 42, lineHeight: 46, color: colors.ink },
  search: { minHeight: 49, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
    borderColor: colors.border, borderWidth: 1, borderRadius: 14, backgroundColor: colors.surface },
  searchInput: { flex: 1, height: 46, color: colors.ink, fontSize: 16, fontFamily: fonts.body },
  shortcuts: { flexDirection: 'row', gap: 7 },
  shortcut: { flex: 1, minHeight: 75, borderRadius: 14, borderColor: colors.border, borderWidth: 1,
    backgroundColor: colors.surface, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 5 },
  icon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  shortcutText: { fontFamily: fonts.strong, fontSize: 11, color: colors.ink, textAlign: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  viewAll: { ...styles.copy, color: colors.accent, fontFamily: fonts.strong, paddingVertical: 8, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { overflow: 'hidden', borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.cream },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  tileText: { padding: 10, gap: 3 },
  category: { fontFamily: fonts.body, color: colors.muted, fontSize: 12 },
  productName: { fontFamily: fonts.strong, color: colors.ink, fontSize: 15 },
  price: { fontFamily: fonts.strong, color: colors.accent, fontSize: 14 },
});
