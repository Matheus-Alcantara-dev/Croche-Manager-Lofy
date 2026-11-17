import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Page, artisanLinks } from '@/components/layout';
import { DataState } from '@/components/resource';
import { Card, Copy, Heading, Title, fonts, styles } from '@/components/ui';
import { orderLabels } from '@/features/orders/status';
import { useData } from '@/hooks/use-data';
import { colors } from '@/theme';
import { getOverview } from '@/services/store';
import { dateLabel, money } from '@/utils/format';

export default function Dashboard() {
  const state = useData(getOverview);
  const data = state.data;
  const figures = data && [
    ['Encomendas', data.orders], ['Aguardando aprovação', data.pending],
    ['Em produção', data.production], ['Entregues', data.delivered],
    ['Projetos ativos', data.projects], ['Receitas', money(data.income)],
    ['Despesas', money(data.expense)], ['Lucro estimado', money(data.income - data.expense)],
  ];

  return <Page>
    <Heading>Meu ateliê</Heading>
    <View style={styles.row}>
      {artisanLinks.slice(1).map(({ href, label, icon }) => <Link key={label} href={href} asChild>
        <Pressable accessibilityRole="link" style={{
          flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 13,
          borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface,
        }}>
          <Ionicons name={icon} size={22} color={colors.accent} />
          <Text style={{ fontFamily: fonts.strong, color: colors.ink }}>{label}</Text>
        </Pressable>
      </Link>)}
    </View>
    <Title>Visão geral</Title>
    <DataState {...state} retry={state.reload} />
    {data && <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {figures?.map(([label, value]) => <View key={label} style={{ minWidth: 144, flexBasis: 218, flexGrow: 1 }}>
          <Card><Copy muted>{label}</Copy><Title>{value}</Title></Card>
        </View>)}
      </View>
      <Card>
        <Title>Próximas entregas</Title>
        {data.deadlines.map((order) => <Copy key={order.id}>
          {dateLabel(order.due_date)} · {order.requester_name || 'Encomenda'} · {orderLabels[order.status]}
        </Copy>)}
        {!data.deadlines.length && <Copy muted>Nenhuma entrega com prazo definido.</Copy>}
        <Link href="/atelie/encomendas" style={styles.copy}>Ver encomendas</Link>
      </Card>
    </>}

  </Page>;
}
