import { useCallback } from 'react';
import { Page } from '@/components/layout';
import { DataState, Resource } from '@/components/resource';
import { Copy, Title } from '@/components/ui';
import { localOwner } from '@/local/seed';
import { orderLabels } from '@/features/orders/status';
import { useData } from '@/hooks/use-data';
import { ownList, save } from '@/services/store';
import type { Customer } from '@/types/models';
import { dateLabel } from '@/utils/format';
import { nameField, notes } from './fields';

export default function Customers() {
  const owner = localOwner;
  const query = useCallback(() => ownList('customers', owner), [owner]);
  const state = useData(query);
  return <Page>
    <DataState {...state} retry={state.reload} />
    {state.data && <Resource title="Clientes" singular="cliente" rows={state.data}
      fields={[nameField, { key: 'phone', label: 'Telefone', required: true, max: 40 },
        { key: 'email', label: 'E-mail', type: 'email', max: 254 },
        { key: 'address', label: 'Endereço', max: 500 }, notes()]}
      label={(row) => row.name} searchText={(row) => [row.phone, row.email].join(' ')}
      summary={(row) => <Copy muted>{[row.phone, row.email].filter(Boolean).join(' · ')}</Copy>}
      details={(row) => <CustomerDetails row={row} />}
      save={(values, row) => save('customers', owner, values, row)} refresh={state.reload} />}
  </Page>;
}

function CustomerDetails({ row }: { row: Customer }) {
  const query = useCallback(() => ownList('orders', row.artisan_id, { customer_id: row.id }), [row.artisan_id, row.id]);
  const state = useData(query);
  return <>
    {!!row.address && <Copy>{row.address}</Copy>}
    {!!row.notes && <Copy>{row.notes}</Copy>}
    <Title>Histórico de encomendas</Title>
    <DataState {...state} retry={state.reload} />
    {state.data?.map((order) => <Copy key={order.id}>{dateLabel(order.created_at)} · {orderLabels[order.status]}</Copy>)}
    {state.data?.length === 0 && <Copy muted>Nenhuma encomenda vinculada.</Copy>}
  </>;
}
