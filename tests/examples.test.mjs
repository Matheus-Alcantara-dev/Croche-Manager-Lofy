import assert from 'node:assert/strict';
import { test } from 'node:test';
import { examples } from '../src/local/seed.ts';

test('as peças e os projetos iniciais referenciam exemplos válidos', () => {
  const data = examples();
  assert.equal(data.products.length, 6);
  assert.equal(data.projects.length, 3);
  assert.equal(data.products.filter((item) => item.featured).length, 4);
  for (const product of data.products) {
    assert.ok(data.product_categories.some((category) => category.id === product.category_id));
    assert.deepEqual(product.photos, ['exemplo:' + product.id]);
  }
  for (const project of data.projects) {
    assert.ok(data.products.some((product) => product.photos[0] === project.photos[0]));
  }
  for (const item of data.order_items) {
    assert.ok(data.orders.some((order) => order.id === item.order_id));
  }
});

test('cada inicialização gera uma cópia independente', () => {
  const first = examples();
  first.products.pop();
  first.projects[0].photos.push('teste');
  const restart = examples();
  assert.equal(restart.products.length, 6);
  assert.equal(restart.projects[0].photos.length, 1);
});
