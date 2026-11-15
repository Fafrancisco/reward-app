import { test } from 'node:test';
import assert from 'node:assert/strict';
import { singleFlight } from './single-flight';

test('rejeita submissões simultâneas antes de criar uma segunda operação', async () => {
 let calls=0;
 let finish!:()=>void;
 const gate=new Promise<void>(resolve=>{finish=resolve;});
 const submit=singleFlight(async()=>{calls++; await gate; return 'guardado';});
 const first=submit();
 await assert.rejects(submit(), /operação em curso/);
 assert.equal(calls,1);
 finish();
 assert.equal(await first,'guardado');
 assert.equal(await submit(),'guardado');
});
test('permite nova tentativa depois de uma falha', async () => {
 let calls=0;
 const submit=singleFlight(async()=>{if(++calls===1) throw new Error('offline'); return calls;});
 await assert.rejects(submit(), /offline/);
 assert.equal(await submit(),2);
});
