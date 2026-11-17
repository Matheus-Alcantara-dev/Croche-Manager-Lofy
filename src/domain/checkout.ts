import type { Project } from '@/types/models';

export function isProjectForSale(project: Project) {
  return !project.archived && project.status !== 'cancelled' && project.published !== false
    && project.price != null && project.price > 0;
}

const leadDays = [7, 8, 9, 10, 11, 12, 13, 14] as const;
export type LeadDays = (typeof leadDays)[number];
export const leadTimeChoices = leadDays.map((days) => ({
  value: String(days),
  label: days === 7 ? '1 semana (7 dias)' : days === 14 ? '2 semanas (14 dias)' : days + ' dias',
}));

export function isLeadDays(value: number): value is LeadDays {
  return Number.isInteger(value) && value >= 7 && value <= 14;
}

export function purchaseAmounts(price: number, quantity: number) {
  const unit = Math.round(price * 100);
  const total = unit * quantity;
  if (!Number.isFinite(price) || unit < 1 || !Number.isInteger(quantity) ||
    quantity < 1 || quantity > 100 || !Number.isSafeInteger(total)) {
    throw new Error('Confira o preço e a quantidade da peça.');
  }
  const deposit = Math.ceil(total / 2);
  return { total: total / 100, deposit: deposit / 100, balance: (total - deposit) / 100 };
}

function addDays(date: string, days: number) {
  const timestamp = new Date(date + 'T00:00:00Z');
  timestamp.setUTCDate(timestamp.getUTCDate() + days);
  return timestamp.toISOString().slice(0, 10);
}

export function deliveryWindow(confirmedDate: string, desiredDays: LeadDays) {
  return {
    earliest: addDays(confirmedDate, 7),
    desired: addDays(confirmedDate, desiredDays),
    maximum: addDays(confirmedDate, 14),
  };
}

export function pixDemoCode(id: string, amount: number) {
  return 'LOFYS|PIX-TESTE|SEM-VALOR-REAL|' + id + '|' + amount.toFixed(2);
}
