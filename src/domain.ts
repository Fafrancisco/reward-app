export type Child = { id: string; name: string; avatar: string; balance: number };
export type Behaviour = { id: string; name: string; points: number; icon: string };
export type Reward = { id: string; name: string; cost: number; childIds: string[] };
export type Entry = { id: string; childId: string; description: string; points: number; actor: string; date: string; corrects?: string };
export type State = { children: Child[]; behaviours: Behaviour[]; rewards: Reward[]; history: Entry[] };
const integer = (n: number) => Number.isSafeInteger(n);
export function changeBalance(balance: number, points: number): number {
  if (!integer(balance) || !integer(points) || !integer(balance + points) || points === 0) throw new Error('Valor de pontos inválido.');
  return balance + points;
}
export function redeem(balance: number, cost: number): number {
  if (!integer(balance) || !integer(cost) || cost <= 0) throw new Error('Custo inválido.');
  if (balance < cost) throw new Error('Pontos insuficientes.');
  return balance - cost;
}
export function progress(balance: number, cost: number): number { return Math.max(0, Math.min(100, Math.floor(balance / cost * 100))); }
export function suggestedReward(state: State, child: Child): Reward | undefined {
  return state.rewards.filter(r => r.childIds.includes(child.id)).slice().sort((a,b) => Math.max(0,a.cost-child.balance)-Math.max(0,b.cost-child.balance) || a.cost-b.cost)[0];
}
export function record(state: State, childId: string, description: string, points: number): State {
  if (!state.children.some(c => c.id === childId)) throw new Error('Criança não encontrada.');
  return { ...state, children: state.children.map(c => c.id === childId ? { ...c, balance: changeBalance(c.balance, points) } : c), history: [{ id: `${Date.now()}-${Math.random()}`, childId, description, points, actor: 'Adulto de demonstração', date: new Date().toISOString() }, ...state.history] };
}
export function correctEntry(state: State, entryId: string): State {
  const entry = state.history.find(e => e.id === entryId);
  if (!entry || entry.id === 'initial' || entry.corrects || state.history.some(e => e.corrects === entryId)) throw new Error('Este registo não pode ser corrigido novamente.');
  const next = record(state, entry.childId, `Correção: ${entry.description}`, -entry.points);
  next.history[0].corrects = entryId;
  return next;
}
export function redeemFor(state: State, childId: string, rewardId: string): State {
  const child = state.children.find(c => c.id === childId), reward = state.rewards.find(r => r.id === rewardId && r.childIds.includes(childId));
  if (!child || !reward) throw new Error('Recompensa indisponível.');
  redeem(child.balance, reward.cost);
  return record(state, childId, `Resgate: ${reward.name}`, -reward.cost);
}
export const demo: State = {
 children: [{id:'1',name:'Criança exemplo',avatar:'🦊',balance:75}],
 behaviours: [{id:'1',name:'Leu durante 20 minutos',points:5,icon:'📚'},{id:'2',name:'Arrumou o quarto',points:10,icon:'🛏️'},{id:'3',name:'Não cumpriu a tarefa',points:-3,icon:'🌱'}],
 rewards: [{id:'1',name:'Passeio em família',cost:70,childIds:['1']}],
 history: [{id:'initial',childId:'1',description:'Saldo inicial de demonstração',points:75,actor:'Adulto de demonstração',date:'2026-01-01T12:00:00Z'}]
};
