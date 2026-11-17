import { randomUUID } from 'expo-crypto';
import { isProjectForSale } from '@/domain/checkout';
import { withWorkspace } from '@/local/database';
import { activeAccount, brandName, requireAdmin } from '@/local/identity';
import { localOwner, type Workspace } from '@/local/seed';
import type { Entity, Product, Tables } from '@/types/models';

type Table = keyof Tables;
type Filter = Record<string, string | number | boolean>;
export type Values = Record<string, string | number | boolean | null | string[] | Record<string, number>>;
export type Choice = { value: string; label: string };

function list<T extends Table>(table: T, filter: Filter) {
  return withWorkspace((state) => {
    requireAdmin(state.access);
    const rows = state[table] as Tables[T][];
    return rows.filter((entry) => Object.entries(filter).every(([key, value]) => entry[key as keyof Tables[T]] === value))
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  });
}

export function ownList<T extends Table>(table: T, owner: string, filter: Filter = {}) {
  return list(table, { ...filter, artisan_id: owner });
}

export function makeEntity(owner: string): Entity {
  const now = new Date().toISOString();
  return { id: randomUUID(), artisan_id: owner, created_at: now, updated_at: now };
}

export function editedAt(previous: Entity) {
  return new Date(Math.max(Date.now(), Date.parse(previous.updated_at) + 1)).toISOString();
}

export function recordIndex<T extends Entity>(entries: T[], previous: T) {
  const index = entries.findIndex((row) => row.id === previous.id && row.updated_at === previous.updated_at);
  if (index < 0) throw new Error('Este registro mudou. Recarregue a lista e tente novamente.');
  return index;
}

type Writable = Exclude<Table, 'orders' | 'order_status_history'>;
const linkTables: Record<string, Table> = {
  category_id: 'product_categories', customer_id: 'customers', order_id: 'orders',
  product_id: 'products', project_id: 'projects', material_id: 'materials',
};

function validate(state: Workspace, row: Entity, table: Table) {
  const data = row as unknown as Values;
  for (const [key, target] of Object.entries(linkTables)) {
    const value = data[key];
    if (value && !state[target].some((entry) => entry.id === value)) {
      throw new Error('Um dos registros vinculados foi removido.');
    }
  }
  if (table === 'projects' && data.published === true && !(typeof data.price === 'number' && data.price > 0)) {
    throw new Error('Informe um preço fixo maior que zero para aceitar encomendas.');
  }
  if (table === 'order_items' && state.orders.some((order) => order.id === data.order_id && order.deposit_id)) {
    throw new Error('A peça e a quantidade foram confirmadas com o sinal.');
  }
  if (table === 'projects' && data.start_date && data.due_date && String(data.start_date) > String(data.due_date)) {
    throw new Error('A data de conclusão deve ser igual ou posterior à data de início.');
  }
  if (table === 'product_categories' && state.product_categories.some((entry) =>
    entry.id !== row.id && entry.name.toLowerCase() === String(data.name).toLowerCase())) {
    throw new Error('Já existe uma categoria com esse nome.');
  }
  if (table === 'project_materials' && state.project_materials.some((entry) =>
    entry.id !== row.id && entry.project_id === data.project_id && entry.material_id === data.material_id)) {
    throw new Error('Esse material já está vinculado ao projeto.');
  }
}

export function save<T extends Writable>(table: T, owner: string, values: Values, previous?: Tables[T]) {
  return withWorkspace((state) => {
    requireAdmin(state.access);
    const rows = state[table] as Tables[T][];
    const index = previous ? recordIndex(rows, previous) : -1;
    const current = index >= 0 ? rows[index] : undefined;
    const metadata = current ? { ...current, updated_at: editedAt(current) } : makeEntity(owner);
    const defaults = table === 'projects' || table === 'products' ? { photos: [] } : table === 'financial_transactions' ? { order_id: null } : {};
    const row = { ...defaults, ...metadata, ...values } as unknown as Tables[T];
    if (table === 'financial_transactions' && state.orders.some((order) => order.deposit_id === row.id)) {
      throw new Error('O sinal confirmado permanece no histórico da encomenda.');
    }
    if (table === 'projects' && state.work?.active?.projectId === row.id) {
      const project = row as Tables['projects'];
      if (project.archived || project.status !== 'active') throw new Error('Pause o cronômetro antes de mudar a situação do projeto.');
    }
    validate(state, row, table);
    if (index < 0) rows.push(row);
    else rows[index] = row;
    return row;
  }, true);
}

export function remove<T extends Writable>(table: T, _owner: string, previous: Tables[T]) {
  return withWorkspace((state) => {
    requireAdmin(state.access);
    const rows = state[table] as Tables[T][];
    if (table === 'financial_transactions' && state.orders.some((order) => order.deposit_id === previous.id)) {
      throw new Error('O sinal confirmado permanece no histórico da encomenda.');
    }
    if (table === 'order_items' && state.orders.some((order) => order.id === (previous as Tables['order_items']).order_id && order.deposit_id)) {
      throw new Error('A peça e a quantidade foram confirmadas com o sinal.');
    }
    if (table === 'projects' && state.work?.active?.projectId === previous.id) {
      throw new Error('Pause o cronômetro antes de excluir este projeto.');
    }
    rows.splice(recordIndex(rows, previous), 1);
    if (table === 'projects' && state.work) {
      state.work.sessions = state.work.sessions.filter((session) => session.projectId !== previous.id);
    }
    for (const entries of Object.values(state)) {
      if (!Array.isArray(entries)) continue;
      for (let index = entries.length - 1; index >= 0; index--) {
        const row = entries[index];
        for (const [key, target] of Object.entries(linkTables)) {
          const data = row as unknown as Values;
          if (target !== table || data[key] !== previous.id) continue;
          if ('material_id' in row && 'project_id' in row) entries.splice(index, 1);
          else {
            data[key] = null;
            row.updated_at = editedAt(row);
          }
        }
      }
    }
  }, true);
}

const shop = { id: localOwner, name: brandName };
export function publishedCatalog() {
  return withWorkspace((state) => {
    if (!activeAccount(state.access)) throw new Error('Entre para consultar as peças.');
    const products = state.products.filter((item) => item.published);
    const used = new Set(products.map((product) => product.category_id));
    return { shop, products, categories: state.product_categories.filter((category) => used.has(category.id)) };
  });
}

export function publishedProduct(id: string): Promise<Product | null> {
  return withWorkspace((state) => {
    requireAdmin(state.access);
    return state.products.find((entry) => entry.id === id && entry.published) ?? null;
  });
}

export function choices<T extends { id: string; name: string }>(rows: T[]): Choice[] {
  return rows.map((row) => ({ value: row.id, label: row.name }));
}

export function listProjectShowcase() {
  return withWorkspace((state) => {
    if (!activeAccount(state.access)) throw new Error('Entre para consultar os projetos.');
    return state.projects.filter(isProjectForSale)
      .map(({ id, name, description, photos, price }) => ({ id, name, description, photo: photos[0], price: price! }));
  });
}

export function getOverview() {
  return withWorkspace((state) => {
    requireAdmin(state.access);
    return {
      orders: state.orders.length,
      pending: state.orders.filter(({ status }) => status === 'received' || status === 'pending').length,
      production: state.orders.filter(({ status }) => status === 'production').length,
      delivered: state.orders.filter(({ status }) => status === 'delivered').length,
      income: state.financial_transactions.filter(({ kind }) => kind === 'income').reduce((sum, row) => sum + row.amount, 0),
      expense: state.financial_transactions.filter(({ kind }) => kind === 'expense').reduce((sum, row) => sum + row.amount, 0),
      projects: state.projects.filter((row) => !row.archived && row.status === 'active').length,
      deadlines: state.orders.filter((row) => row.due_date && !['delivered', 'cancelled'].includes(row.status))
        .sort((a, b) => a.due_date!.localeCompare(b.due_date!)).slice(0, 10),
    };
  });
}
