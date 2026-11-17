import { deliveryWindow, isLeadDays, isProjectForSale, purchaseAmounts, type LeadDays } from '@/domain/checkout';
import { transitions } from '@/features/orders/status';
import { withWorkspace } from '@/local/database';
import { activeAccount, formatPhone, requireAdmin } from '@/local/identity';
import { localOwner, type Workspace } from '@/local/seed';
import type { Order } from '@/types/models';
import { today } from '@/utils/format';
import { editedAt, makeEntity, recordIndex, type Values } from './store';

function emptyOrder(owner: string): Order {
  return { ...makeEntity(owner), status: 'pending', customer_id: null, requester_id: null,
    requester_name: null, requester_email: null, requester_phone: null, due_date: null, desired_date: null,
    total: null, request_notes: null, internal_notes: null };
}

export function saveOrder(owner: string, values: Values, previous?: Order) {
  return withWorkspace((state) => {
    requireAdmin(state.access);
    const index = previous ? recordIndex(state.orders, previous) : -1;
    const current = index >= 0 ? state.orders[index] : emptyOrder(owner);
    const next = { ...current, ...values, updated_at: editedAt(current) } as Order;
    if (current.confirmed_at && (next.due_date !== current.due_date || next.total !== current.total)) {
      throw new Error('O valor e o prazo foram definidos na confirmação do sinal.');
    }
    if (next.customer_id && !state.customers.some((customer) => customer.id === next.customer_id)) {
      throw new Error('O cliente selecionado foi removido.');
    }
    if (next.status !== current.status && !transitions[current.status].includes(next.status)) {
      throw new Error('Esta mudança de situação não é permitida.');
    }
    if (index < 0) state.orders.push(next);
    else state.orders[index] = next;
    if (index < 0 || next.status !== current.status) {
      state.order_status_history.push({ ...makeEntity(owner), order_id: next.id, status: next.status });
    }
  }, true);
}

type Piece = { key: string; id: string; name: string; price: number; type: 'project' | 'product' };

function orderOptions(state: Workspace, admin: boolean): Piece[] {
  const projects: Piece[] = state.projects.filter(isProjectForSale)
    .map((row) => ({ key: 'project:' + row.id, id: row.id, name: row.name, price: row.price!, type: 'project' }));
  const products: Piece[] = admin ? state.products
    .filter((row) => row.published && row.available && row.price != null && row.price > 0)
    .map((row) => ({ key: 'product:' + row.id, id: row.id, name: row.name, price: row.price!, type: 'product' })) : [];
  return [...projects, ...products];
}

export function getOrderOptions() {
  return withWorkspace((state) => {
    const account = activeAccount(state.access);
    if (!account) throw new Error('Entre para consultar as peças.');
    return orderOptions(state, account.role === 'admin');
  });
}

type RequestInput = { piece: string; name: string; email: string | null; phone: string | null;
  quantity: number; color: string | null; leadDays: LeadDays; notes: string | null };
export type DepositQuote = {
  id: string; input: RequestInput; piece: Piece; total: number; deposit: number; balance: number;
};
export type OrderReceipt = { id: string; confirmedAt: string; desired: string; maximum: string };

export function prepareDeposit(input: RequestInput, signedInPhone: string) {
  return withWorkspace((state): DepositQuote => {
    const account = activeAccount(state.access);
    if (account?.phone !== signedInPhone) throw new Error('Sua sessão mudou. Entre novamente.');
    const piece = orderOptions(state, account.role === 'admin').find((item) => item.key === input.piece);
    if (!piece) throw new Error('Esta peça não está mais disponível.');
    if (!isLeadDays(input.leadDays)) throw new Error('Selecione um prazo entre uma e duas semanas.');
    return { id: makeEntity(localOwner).id, input, piece, ...purchaseAmounts(piece.price, input.quantity) };
  });
}

export function confirmDemoDeposit(quote: DepositQuote, signedInPhone: string) {
  return withWorkspace((state): OrderReceipt => {
    const account = activeAccount(state.access);
    if (account?.phone !== signedInPhone) throw new Error('Sua sessão mudou. Entre novamente.');
    const existingOrder = state.orders.find((order) => order.id === quote.id);
    if (existingOrder?.confirmed_at && existingOrder.desired_date && existingOrder.delivery_max &&
      (account.role === 'admin' || existingOrder.requester_id === account.phone)) {
      return { id: existingOrder.id, confirmedAt: existingOrder.confirmed_at, desired: existingOrder.desired_date, maximum: existingOrder.delivery_max };
    }
    if (existingOrder) throw new Error('Este QR de teste não está mais disponível.');

    const input = quote.input;
    const piece = orderOptions(state, account.role === 'admin').find((item) => item.key === quote.piece.key);
    if (!piece || piece.price !== quote.piece.price) throw new Error('A peça ou o preço mudou. Gere um novo QR de teste.');
    const amounts = purchaseAmounts(piece.price, input.quantity);
    if (amounts.deposit !== quote.deposit || amounts.total !== quote.total ||
      !isLeadDays(input.leadDays)) throw new Error('Gere um novo QR de teste.');

    const phone = account.role === 'customer' ? formatPhone(account.phone) : input.phone;
    let customerId: string | null = null;
    if (account.role === 'customer') {
      const existing = state.customers.find((customer) => {
        const digits = customer.phone.replace(/\D/g, '');
        return digits === account.phone || digits === account.phone.slice(2);
      });
      if (existing) customerId = existing.id;
      else {
        const newCustomer = { ...makeEntity(localOwner), name: input.name, phone: formatPhone(account.phone),
          email: input.email, address: null, notes: null };
        state.customers.push(newCustomer);
        customerId = newCustomer.id;
      }
    }

    const now = new Date();
    const confirmedAt = now.toISOString();
    const confirmationDate = today(now);
    const { desired, maximum } = deliveryWindow(confirmationDate, input.leadDays);
    const payment = makeEntity(localOwner);
    const order: Order = { ...emptyOrder(localOwner), id: quote.id, status: 'approved',
      customer_id: customerId, requester_name: input.name, requester_id: account.phone,
      requester_email: input.email, requester_phone: phone, desired_date: desired, due_date: desired,
      delivery_max: maximum, confirmed_at: confirmedAt, deposit_id: payment.id,
      total: amounts.total, request_notes: input.notes };
    state.orders.push(order);
    state.order_items.push({ ...makeEntity(localOwner), order_id: order.id,
      product_id: piece.type === 'product' ? piece.id : null, project_id: piece.type === 'project' ? piece.id : null,
      name: piece.name, quantity: input.quantity, color: input.color });
    state.financial_transactions.push({ ...payment, order_id: order.id, kind: 'income',
      name: 'Sinal de encomenda · Pix de teste', category: 'Encomendas', amount: amounts.deposit,
      transaction_date: confirmationDate });
    state.order_status_history.push({ ...makeEntity(localOwner), order_id: order.id, status: order.status });
    return { id: order.id, confirmedAt, desired, maximum };
  }, true);
}

export function orderName(row: Order, customers: Map<string, string>) {
  return (row.customer_id ? customers.get(row.customer_id) : null) || row.requester_name || 'Encomenda';
}
