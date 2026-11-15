import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupHistory } from './history';
import type { Entry } from './domain';
test('agrupa por data local e mantém a ordem original dos movimentos', () => {
 const item=(id:string,date:string):Entry=>({id,date,childId:'1',description:id,points:1,actor:'Exemplo'});
 const entries=[item('a','2026-06-02T12:00:00Z'),item('b','2026-06-02T13:00:00Z'),item('c','2026-06-01T12:00:00Z')];
 const groups=groupHistory(entries);
 assert.equal(groups.length,2); assert.deepEqual(groups[0].entries.map(e=>e.id),['a','b']);assert.equal(groups[1].entries[0].id,'c');
 assert.deepEqual(entries.map(e=>e.id),['a','b','c']);
});
