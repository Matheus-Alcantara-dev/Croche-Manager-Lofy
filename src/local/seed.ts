import type { ActiveWork, WorkSession } from '@/domain/work-time';
import type { Entity, Tables } from '@/types/models';
import type { LocalAccess } from './identity';

export type Workspace = { [Table in keyof Tables]: Tables[Table][] } & {
  access?: LocalAccess;
  work?: { active: ActiveWork | null; sessions: WorkSession[] };
};
export const localOwner = 'lofy-local';
const sampleDate = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

const art = [
  { id: 'caramelo', name: 'Bolsa Caramelo', category: 'tote', price: 149, description: 'Bolsa espaçosa com alças longas e pontos em tom caramelo.' },
  { id: 'girassol', name: 'Bolsa Girassol', category: 'ombro', price: 119, description: 'Bolsa amarela com detalhe de girassol em crochê.' },
  { id: 'lavanda', name: 'Mini Bolsa Lavanda', category: 'mini', price: 89, description: 'Modelo compacto em lilás, com alça de mão e alça longa.' },
  { id: 'azul', name: 'Bolsa Azul Sereno', category: 'ombro', price: 129, description: 'Bolsa de ombro em azul acinzentado, com textura aberta.' },
  { id: 'areia', name: 'Bolsa Trama Areia', category: 'ombro', price: 115, description: 'Bolsa leve de trama vazada em tom natural.' },
  { id: 'lilas', name: 'Tote Jardim Lilás', category: 'tote', price: 139, description: 'Tote em lilás com alças longas e detalhe de trama no corpo.' },
];

function sample(id: string): Entity {
  return { id, artisan_id: localOwner, created_at: sampleDate + 'T12:00:00Z', updated_at: sampleDate + 'T12:00:00Z' };
}

export function examples(): Workspace {
  return {
    product_categories: [{ ...sample('tote'), name: 'Totes' }, { ...sample('ombro'), name: 'Bolsas de ombro' },
      { ...sample('mini'), name: 'Mini bolsas' }],
    products: art.map(({ id, name, price, description, category }, index) => ({
      ...sample(id), name, description, price, category_id: category, photos: ['exemplo:' + id],
      published: true, featured: index < 4, available: true,
    })),
    projects: art.slice(0, 3).map(({ id, name, description, price }, index) => ({
      ...sample('projeto-' + id), name, description, price, photos: ['exemplo:' + id], archived: false,
      status: index === 2 ? 'planned' : 'active', progress: [65, 35, 0][index],
      customer_id: index === 0 ? 'cliente-ana' : null, order_id: index === 0 ? 'pedido-ana' : null,
      start_date: sampleDate, due_date: nextWeek, hours: index === 0 ? 4 : 0, cost: price / 2,
    })),
    customers: [{ ...sample('cliente-ana'), name: 'Ana Martins', phone: '(00) 00000-0000', email: 'ana@example.com', address: null, notes: 'Cliente fictícia para demonstração.' }],
    materials: [{ ...sample('fio'), name: 'Fio de malha', unit: 'novelo', unit_cost: 29.9 }],
    project_materials: [{ ...sample('material-caramelo'), project_id: 'projeto-caramelo', material_id: 'fio', quantity: 2 }],
    orders: [{ ...sample('pedido-ana'), customer_id: 'cliente-ana', requester_id: null, requester_name: null,
      requester_email: null, requester_phone: null, status: 'production', due_date: nextWeek,
      desired_date: null, total: 149, request_notes: null, internal_notes: 'Preparar embalagem para presente.' }],
    order_items: [{ ...sample('item-ana'), order_id: 'pedido-ana', product_id: 'caramelo', name: 'Bolsa Caramelo', quantity: 1, color: 'Caramelo' }],
    order_status_history: [{ ...sample('historico-ana'), order_id: 'pedido-ana', status: 'production' }],
    financial_transactions: [
      { ...sample('entrada'), order_id: 'pedido-ana', kind: 'income', name: 'Entrada da Bolsa Caramelo', category: 'Encomendas', amount: 70, transaction_date: sampleDate },
      { ...sample('compra-fio'), order_id: null, kind: 'expense', name: 'Compra de fio de malha', category: 'Materiais', amount: 29.9, transaction_date: sampleDate },
    ],
    price_calculations: [],
  };
}
