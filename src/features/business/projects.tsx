import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Page } from '@/components/layout';
import { Photo, PhotoEditor } from '@/components/photos';
import { DataState, Resource } from '@/components/resource';
import { Copy, Heading, Title, styles } from '@/components/ui';
import { isProjectForSale } from '@/domain/checkout';
import { clockLabel, hourlyRate } from '@/domain/work-time';
import { localOwner } from '@/local/seed';
import { orderLabels } from '@/features/orders/status';
import { useData } from '@/hooks/use-data';
import { getWork } from '@/services/work';
import { choices, ownList, remove, save } from '@/services/store';
import type { Material, Project } from '@/types/models';
import { dateLabel, money } from '@/utils/format';
import { amount, date, description, nameField, reference } from './fields';

const labels = { planned: 'Planejado', active: 'Em andamento', paused: 'Pausado', finished: 'Finalizado', cancelled: 'Cancelado' };
const statuses = Object.entries(labels).map(([value, label]) => ({ value, label }));

export default function Projects() {
  const owner = localOwner;
  const query = useCallback(async () => {
    const [projects, customers, orders, materials] = await Promise.all([
      ownList('projects', owner), ownList('customers', owner), ownList('orders', owner), ownList('materials', owner),
    ]);
    return { projects, customers, orders, materials };
  }, [owner]);
  const state = useData(query);
  const data = state.data;
  return <Page>
    <Heading>Projetos</Heading>
    <DataState {...state} retry={state.reload} />
    <Copy muted>Defina o preço da peça e ative as encomendas para exibi-la aos clientes. Mão de obra fixa de {money(hourlyRate)}/h.</Copy>
    {data && <Resource grid openAfterCreate singular="projeto" rows={data.projects}
      fields={(entry) => [
        { ...nameField, label: 'Nome da peça' }, amount('price', 'Preço fixo da peça (R$)'), description,
        { key: 'published', label: 'Aceitar encomendas', type: 'boolean',
          default: String(!entry || (entry.published === undefined && entry.price != null && entry.price > 0)) },
        ...(entry ? [reference('status', 'Situação', statuses, true),
        { ...amount('progress', 'Progresso (%)', true, '0'), places: 0, max: 100 },
        date('start_date', 'Data de início'), date('due_date', 'Previsão de conclusão'),
        amount('cost', 'Custos antes da mão de obra (R$)', true, '0'),
        reference('customer_id', 'Cliente', choices(data.customers)),
        reference('order_id', 'Encomenda', data.orders.map((order) => ({
          value: order.id, label: (order.requester_name || data.customers.find((c) => c.id === order.customer_id)?.name
            || 'Encomenda') + ' · ' + dateLabel(order.created_at) + ' · ' + orderLabels[order.status],
        }))), { key: 'archived', label: 'Arquivado', type: 'boolean' as const }] : [])]}
      label={(row) => row.name} searchText={(row) => row.description}
      filter={{ options: [...statuses, { value: 'archived', label: 'Arquivados' }], value: (row) => row.archived ? 'archived' : row.status }}
      summary={(row) => <>
        <Copy>{labels[row.status]} · {row.progress}%{row.archived ? ' · Arquivado' : ''}</Copy>
        <Copy muted>{row.price == null ? 'Sem preço fixo' : money(row.price)} · {isProjectForSale(row) ? 'Disponível aos clientes' : 'Interno'}</Copy>
        {!!row.photos[0] && <Photo compact path={row.photos[0]} label={row.name} />}
      </>}
      details={(row) => <ProjectDetails row={row} materials={data.materials} reload={state.reload} />}
      save={(values, row) => save('projects', owner, {
        ...(!row ? { status: 'planned', progress: 0, start_date: null, due_date: null,
          customer_id: null, order_id: null, hours: 0, cost: 0, archived: false } : {}),
        ...values, description: values.description ?? '',
      }, row)}
      remove={(row) => remove('projects', owner, row)} refresh={state.reload} />}
  </Page>;
}

function ProjectDetails({ row, materials, reload }: { row: Project; materials: Material[]; reload: () => void }) {
  const owner = row.artisan_id;
  const query = useCallback(() => ownList('project_materials', owner, { project_id: row.id }), [owner, row.id]);
  const state = useData(query);
  const byId = new Map(materials.map((material) => [material.id, material]));
  const time = useData(getWork);
  const total = time.data?.projects.find((project) => project.id === row.id);
  return <>
    {!!row.description && <Copy>{row.description}</Copy>}
    <Copy muted>Previsão {dateLabel(row.due_date)} · Outros custos {money(row.cost)}</Copy>
    {total && <Copy>Tempo registrado {clockLabel(total.milliseconds)} · Mão de obra {money(total.labor)}</Copy>}
    <Link href={{ pathname: '/atelie/crochetar', params: { projeto: row.id } }} style={styles.copy}>Abrir cronômetro</Link>
    <PhotoEditor paths={row.photos}
      update={async (photos) => { await save('projects', owner, { photos }, row); reload(); }} />
    <Title>Materiais utilizados</Title>
    <DataState {...state} retry={state.reload} />
    {state.data && <Resource singular="material ao projeto" rows={state.data}
      fields={[reference('material_id', 'Material cadastrado', choices(materials), true),
        { ...amount('quantity', 'Quantidade', true), places: 3, min: 0.001, max: 9_999_999.999 }]}
      label={(entry) => byId.get(entry.material_id)?.name ?? 'Material'}
      summary={(entry) => <Copy muted>{entry.quantity} {byId.get(entry.material_id)?.unit}</Copy>}
      save={(values, previous) => save('project_materials', owner, { ...values, project_id: row.id }, previous)}
      remove={(entry) => remove('project_materials', owner, entry)} refresh={state.reload} />}
  </>;
}
