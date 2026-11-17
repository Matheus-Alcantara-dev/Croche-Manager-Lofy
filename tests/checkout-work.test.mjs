import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deliveryWindow, isProjectForSale, pixDemoCode, purchaseAmounts } from '../src/domain/checkout.ts';
import { clockLabel, elapsedMs, workCost, workTotals } from '../src/domain/work-time.ts';
import { examples } from '../src/local/seed.ts';

test('sinal corresponde à metade do total, com arredondamento em centavos', () => {
  assert.deepEqual(purchaseAmounts(149, 2), { total: 298, deposit: 149, balance: 149 });
  assert.deepEqual(purchaseAmounts(19.99, 1), { total: 19.99, deposit: 10, balance: 9.99 });
  assert.throws(() => purchaseAmounts(0, 1));
  assert.throws(() => purchaseAmounts(1, 1.5));
  assert.equal(pixDemoCode('teste', 74.5), 'LOFYS|PIX-TESTE|SEM-VALOR-REAL|teste|74.50');
});

test('prazos são contados em dias corridos a partir do sinal', () => {
  assert.deepEqual(deliveryWindow('2026-12-27', 7),
    { earliest: '2027-01-03', desired: '2027-01-03', maximum: '2027-01-10' });
  assert.equal(deliveryWindow('2024-02-25', 14).desired, '2024-03-10');
});

test('visão do cliente lista somente projetos encomendáveis com preço fixo', () => {
  const [project] = examples().projects;
  assert.equal(isProjectForSale(project), true);
  assert.equal(isProjectForSale({ ...project, price: null }), false);
  assert.equal(isProjectForSale({ ...project, published: false }), false);
  assert.equal(isProjectForSale({ ...project, archived: true }), false);
  assert.equal(isProjectForSale({ ...project, status: 'cancelled' }), false);
});

test('sessões acumulam tempo e mão de obra pelo valor fixo de R$ 20/h', () => {
  const sessions = [{ projectId: 'A', startedAt: 2000, endedAt: 182000 }, { projectId: 'B', startedAt: 0, endedAt: 180000 }];
  assert.deepEqual(workTotals(0.5, sessions, 'A'), { milliseconds: 1980000, periods: 1, labor: 11 });
  assert.equal(clockLabel(1980000), '00:33:00');
  assert.equal(workCost(3600000), 20);
  assert.equal(elapsedMs(500, 0), 0);
});
