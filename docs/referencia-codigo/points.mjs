/** Regras puras do saldo de pontos. */
function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} tem de ser um número inteiro positivo.`);
}
export function applyBehaviour(balance, direction, points) {
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('Saldo inválido.');
  positiveInteger(points, 'Pontos');
  if (direction === 'positive') return balance + points;
  if (direction === 'negative') return Math.max(0, balance - points);
  throw new Error('Tipo de comportamento inválido.');
}
export function redeemReward(balance, cost) {
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('Saldo inválido.');
  positiveInteger(cost, 'Custo');
  if (balance < cost) throw new Error('Pontos insuficientes.');
  return balance - cost;
}
export function rewardProgress(balance, cost) {
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('Saldo inválido.');
  positiveInteger(cost, 'Custo');
  return { percentage: Math.min(100, Math.floor(balance / cost * 100)), remaining: Math.max(0, cost - balance), available: balance >= cost };
}
