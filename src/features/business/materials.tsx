import { useCallback } from 'react';
import { Page } from '@/components/layout';
import { DataState, Resource } from '@/components/resource';
import { Copy } from '@/components/ui';
import { localOwner } from '@/local/seed';
import { useData } from '@/hooks/use-data';
import { ownList, remove, save } from '@/services/store';
import { money } from '@/utils/format';
import { amount, nameField } from './fields';

export default function Materials() {
  const owner = localOwner;
  const query = useCallback(() => ownList('materials', owner), [owner]);
  const state = useData(query);
  return <Page>
    <DataState {...state} retry={state.reload} />
    {state.data && <Resource title="Materiais" singular="material" rows={state.data}
      fields={[nameField, { key: 'unit', label: 'Unidade (novelo, metro, grama)', required: true, max: 30 },
        amount('unit_cost', 'Custo por unidade (R$)', true)]}
      label={(row) => row.name} summary={(row) => <Copy muted>{money(row.unit_cost)} por {row.unit}</Copy>}
      save={(values, row) => save('materials', owner, values, row)}
      remove={(row) => remove('materials', owner, row)} refresh={state.reload} />}
  </Page>;
}
