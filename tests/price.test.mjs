import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePrice, zeroPrice } from '../src/features/calculator/price.ts';
import { decimal, validDate, validEmail } from '../src/utils/format.ts';

test('calcula margem de 30% sobre o preço de venda', () => {
  const price = calculatePrice({ ...zeroPrice, skeins: 2, skeinPrice: 17.5, hours: 3, hourly: 20, energy: 5, marginPercent: 30 });
  assert.equal(price.materials, 35);
  assert.equal(price.labor, 60);
  assert.equal(price.cost, 100);
  assert.equal(price.suggested, 142.86);
  assert.equal(price.profit, 42.86);
});

test('arredonda componentes em centavos e aplica desconto ao valor final', () => {
  const price = calculatePrice({ ...zeroPrice, skeins: 0.5, skeinPrice: 0.03, discount: 0.01 });
  assert.equal(price.materials, 0.02);
  assert.equal(price.finalPrice, 0.01);
  assert.equal(price.profit, -0.01);
});

test('rejeita margem inválida, desconto excessivo e resultados fora do limite', () => {
  for (const marginPercent of [-1, 100, Infinity, NaN]) {
    assert.throws(() => calculatePrice({ ...zeroPrice, marginPercent }));
  }
  assert.throws(() => calculatePrice({ ...zeroPrice, discount: 1 }));
  assert.throws(() => calculatePrice({ ...zeroPrice, otherCosts: 100_000, marginPercent: 99.9999 }));
});

test('valida campos de data, e-mail, decimais e quantidades inteiras', () => {
  assert.equal(decimal(' 124,20 ', 'Valor'), 124.2);
  assert.equal(decimal('3', 'Quantidade', 10, 0), 3);
  for (const value of ['3,2', '-1', '1e2', '11']) {
    assert.throws(() => decimal(value, 'Quantidade', 10, 0));
  }
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2025-02-29'), false);
  assert.equal(validEmail('cliente@exemplo.net'), true);
  assert.equal(validEmail('cliente@exemplo'), false);
});
