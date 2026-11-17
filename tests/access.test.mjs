import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeAccount, adminPhone, customerPhone, demoPin, initialAccess, normalizePhone, requireAdmin, signIn } from '../src/local/identity.ts';

test('normaliza o telefone com DDD e reutiliza a conta já cadastrada', () => {
  const state = initialAccess();
  assert.equal(normalizePhone('+55 (11) 91234-5678'), normalizePhone('11 91234-5678'));
  assert.throws(() => normalizePhone('sem número'));
  assert.throws(() => normalizePhone('99999'));
  const account = signIn(state, '(11) 91234-5678');
  assert.equal(account.role, 'customer');
  assert.equal(signIn(state, '+55 11 91234-5678'), account);
  assert.equal(Object.keys(state.accounts).length, 3);
  assert.equal(activeAccount(state), account);
});

test('apenas o número de administrador com o PIN de demonstração abre a gestão', () => {
  const state = initialAccess();
  assert.throws(() => requireAdmin(state));
  assert.throws(() => signIn(state, adminPhone));
  assert.throws(() => signIn(state, adminPhone, '0000'));
  assert.throws(() => signIn(state, customerPhone, demoPin));
  assert.equal(signIn(state, customerPhone).role, 'customer');
  assert.throws(() => requireAdmin(state));
  assert.equal(signIn(state, adminPhone, demoPin).role, 'admin');
  assert.doesNotThrow(() => requireAdmin(state));
});
