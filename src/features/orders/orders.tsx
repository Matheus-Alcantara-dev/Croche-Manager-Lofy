import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Page } from '@/components/layout';
import { DataState, Resource } from '@/components/resource';
import { Copy, Title, styles } from '@/components/ui';
import { localOwner } from '@/local/seed';
import { amount, date, nameField, notes, reference } from '@/features/business/fields';
import { useData } from '@/hooks/use-data';
import { orderName, saveOrder } from '@/services/orders';
import { choices, ownList, remove, save } from '@/services/store';
import type { Order, Product } from '@/types/models';
import { dateLabel, money, today } from '@/utils/format';
import { orderLabels, transitions } from './status';

const statuses = Object.entries(orderLabels).map(([value, label]) => ({ value, label }));
const paymentFields = [
  { ...nameField, label: 'Descrição do pagamento', default: 'Pagamento de encomenda' },
  { ...amount('amount', 'Valor recebido (R$)', true), min: 0.01 },
  { ...date('transaction_date', 'Data do pagamento'), required: true },
];

export default function Orders() {
  const owner = localOwner;
  const query = useCallback(async () => {
    const [orders, customers, products, projects] = await Promise.all([
      ownList('orders', owner), ownList('customers', owner), ownList('products', owner), ownList('projects', owner),
    ]);
    return { orders, customers, products, projects };
  }, [owner]);
  const state = useData(query);
  const data = state.data;
  const names = new Map(data?.customers.map((row) => [row.id, row.name]));
  return <Page>
    <DataState {...state} retry={state.reload} />
    {data && <Resource title="Encomendas" singular="encomenda" rows={data.orders}
      fields={(entry) => [
        reference('customer_id', 'Cliente cadastrado', choices(data.customers), !entry),
        ...(entry ? [reference('status', 'Situação',
          [entry.status, ...transitions[entry.status]].map((value) => ({ value, label: orderLabels[value] })), true)] : []),
        ...(!entry?.confirmed_at ? [date('due_date', 'Prazo de entrega'), amount('total', 'Valor combinado (R$)')] : []),
        notes('internal_notes', 'Observações internas'),
      ]}
      label={(row) => orderName(row, names)}
      searchText={(row) => [row.requester_email, row.requester_phone, orderLabels[row.status], row.id].join(' ')}
      filter={{ options: statuses, value: (row) => row.status }}
      summary={(row) => <>
        <Copy>{orderLabels[row.status]} · {row.total == null ? 'Valor a combinar' : money(row.total)}</Copy>
        {row.confirmed_at ? <Copy muted>1º pagamento {dateLabel(row.confirmed_at)} · Data máxima {dateLabel(row.delivery_max)}</Copy>
          : <Copy muted>Prazo {dateLabel(row.due_date)} · Entrada {dateLabel(row.created_at)}</Copy>}
      </>}
      details={(row) => <OrderDetails row={row} products={data.products}
        projectNames={data.projects.filter((project) => project.order_id === row.id).map((project) => project.name)} />}
      save={(values, previous) => saveOrder(owner, values, previous)} refresh={state.reload} />}
  </Page>;
}

function OrderDetails({ row, products, projectNames }: { row: Order; products: Product[]; projectNames: string[] }) {
  const owner = row.artisan_id;
  const query = useCallback(async () => {
    const [items, history, payments] = await Promise.all([
      ownList('order_items', owner, { order_id: row.id }),
      ownList('order_status_history', owner, { order_id: row.id }),
      ownList('financial_transactions', owner, { order_id: row.id }),
    ]);
    return { items, history, payments };
  }, [owner, row.id]);
  const state = useData(query);
  const data = state.data;
  const paid = data?.payments.reduce((total, payment) => total + payment.amount, 0) ?? 0;
  const productChoices = choices(products);
  const deposit = data?.payments.find((payment) => payment.id === row.deposit_id);

  return <>
    <Copy muted>Referência {row.id.slice(0, 8).toUpperCase()}</Copy>
    {!!row.requester_name && <Copy>Contato da solicitação · {[row.requester_name, row.requester_email, row.requester_phone].filter(Boolean).join(' · ')}</Copy>}
    {!!row.desired_date && <Copy>Prazo desejado · {dateLabel(row.desired_date)}</Copy>}
    {!!row.confirmed_at && <Copy>1º pagamento {dateLabel(row.confirmed_at)} · Data máxima {dateLabel(row.delivery_max)}</Copy>}
    {!!row.request_notes && <Copy>Observações do cliente · {row.request_notes}</Copy>}
    {!!row.internal_notes && <Copy>Observações internas · {row.internal_notes}</Copy>}
    <Copy>Projetos vinculados · {projectNames.join(', ') || 'Nenhum'}</Copy>
    <Link href="/atelie/projetos" style={styles.copy}>Gerenciar vínculos em Projetos</Link>
    <DataState {...state} retry={state.reload} />
    {data && <>
      <Title>Itens da encomenda</Title>
      {row.deposit_id ? data.items.map((item) => <Copy key={item.id}>{item.name} · {item.quantity} unidade(s){item.color ? ' · ' + item.color : ''}</Copy>)
        : <Resource singular="item" rows={data.items}
        fields={[reference('product_id', 'Produto do catálogo', productChoices),
          { ...nameField, label: 'Nome do item (opcional se houver produto)', required: false },
          { ...amount('quantity', 'Quantidade', true, '1'), places: 0, min: 1, max: 1000 },
          { key: 'color', label: 'Cor', max: 120 }]}
        label={(entry) => entry.name}
        summary={(entry) => <Copy muted>{entry.quantity} unidade(s){entry.color ? ' · ' + entry.color : ''}</Copy>}
        save={(values, previous) => {
          const label = values.name || products.find((product) => product.id === values.product_id)?.name;
          if (!label) throw new Error('Selecione um produto ou descreva o item.');
          return save('order_items', owner, { ...values, name: label, order_id: row.id }, previous);
        }} remove={(entry) => remove('order_items', owner, entry)} refresh={state.reload} />}
      <Title>Pagamentos</Title>
      <Copy>Total recebido {money(paid)}{row.total === null ? '' : ' · Saldo ' + money(Math.max(0, row.total - paid))}</Copy>
      {deposit && <Copy>{deposit.name} · {money(deposit.amount)} · {dateLabel(deposit.transaction_date)}</Copy>}
      <Resource singular="pagamento" rows={data.payments.filter((entry) => entry.id !== row.deposit_id)}
        fields={paymentFields.map((field) => field.key === 'transaction_date' ? { ...field, default: today() } : field)}
        label={(entry) => entry.name}
        summary={(entry) => <Copy muted>{money(entry.amount)} · {dateLabel(entry.transaction_date)}</Copy>}
        save={(values, previous) => save('financial_transactions', owner,
          { ...values, order_id: row.id, kind: 'income', category: 'Encomendas' }, previous)}
        remove={(entry) => remove('financial_transactions', owner, entry)} refresh={state.reload} />
      <Title>Histórico de situação</Title>
      {data.history.map((event) => <Copy key={event.id}>{dateLabel(event.created_at)} · {orderLabels[event.status]}</Copy>)}
    </>}
  </>;
}
