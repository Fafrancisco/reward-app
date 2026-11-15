import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changeBalance, demo, progress, record, redeem, redeemFor } from './domain';
test('um resgate de 70 em 75 deixa 5 e atualiza o histórico e progresso', () => {
 const state = redeemFor(demo, '1', '1');
 assert.equal(state.children[0].balance, 5); assert.equal(state.history[0].points, -70); assert.equal(progress(5,70),7);
});
test('rejeita resgates sem saldo e para criança não associada', () => {
 assert.throws(()=>redeem(69,70)); assert.throws(()=>redeemFor(demo,'1','inexistente'));
});
test('comportamentos descontam o valor integral, incluindo abaixo de zero', () => {
 assert.equal(changeBalance(2,-5),-3); assert.equal(record(demo,'1','Exemplo',-3).children[0].balance,72);
 assert.throws(()=>changeBalance(0,0)); assert.throws(()=>changeBalance(0,1.5));
});

test('uma correção só pode ser aplicada uma vez', async () => {
 const { correctEntry } = await import('./domain');
 const state = record(demo, '1', 'Exemplo', -3);
 const corrected = correctEntry(state, state.history[0].id);
 assert.equal(corrected.children[0].balance,75);
 assert.throws(()=>correctEntry(corrected,state.history[0].id));
});

test('a sugestão pertence à criança e usa o saldo disponível após resgate', async () => {
 const { suggestedReward } = await import('./domain');
 const initial = { ...demo, rewards: [...demo.rewards, {id:'other',name:'Outro',cost:20,childIds:['outra']} , {id:'next',name:'Livro',cost:30,childIds:['1']}] };
 assert.equal(suggestedReward(initial,initial.children[0])?.id,'next');
 const after = redeemFor(initial,'1','1');
 assert.equal(after.children[0].balance,5);
 assert.equal(suggestedReward(after,after.children[0])?.id,'next');
 assert.equal(progress(after.children[0].balance,70),7);
});
