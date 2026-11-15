import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyBehaviour, redeemReward, rewardProgress } from './points.mjs';
test('comportamentos acrescentam ou descontam pontos', () => {
  assert.equal(applyBehaviour(50, 'positive', 5), 55);
  assert.equal(applyBehaviour(50, 'negative', 5), 45);
});
test('saldo não desce abaixo de zero: hipótese provisória', () => assert.equal(applyBehaviour(2, 'negative', 5), 0));
test('resgates descontam pontos e exigem saldo suficiente', () => {
  assert.equal(redeemReward(75, 70), 5);
  assert.throws(() => redeemReward(69, 70), /insuficientes/);
});
test('progresso reflete saldo após resgate', () => {
  assert.deepEqual(rewardProgress(5, 70), { percentage: 7, remaining: 65, available: false });
  assert.deepEqual(rewardProgress(75, 70), { percentage: 100, remaining: 0, available: true });
});
test('não aceita pontos nem operações inválidos', () => {
  assert.throws(() => applyBehaviour(10, 'negative', -5));
  assert.throws(() => applyBehaviour(10, 'other', 5));
  assert.throws(() => redeemReward(10, 0));
});
