import type { OrderStatus } from '@/types/models';

export const orderLabels: Record<OrderStatus, string> = {
  received: 'Solicitação recebida', pending: 'Aguardando aprovação', approved: 'Aprovada',
  production: 'Em produção', ready: 'Pronta', delivered: 'Entregue', cancelled: 'Cancelada',
};

export const transitions: Record<OrderStatus, OrderStatus[]> = {
  received: ['pending', 'approved', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['production', 'cancelled'],
  production: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [], cancelled: [],
};
