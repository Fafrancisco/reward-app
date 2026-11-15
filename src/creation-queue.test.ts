import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creationQueue } from './creation-queue';

test('recupera uma criação aceite cuja resposta de rede se perdeu', async () => {
 let stored:string|null=null, commits=0, user='adulto-1', loseReply=true;
 const saved=new Map<string,string>();
 const queue=creationQueue({read:async()=>stored,write:async value=>{stored=value;},remove:async()=>{stored=null;},user:async()=>user,newId:()=> 'pedido-1',submit:async command=>{
  if(!saved.has(command.requestId)){saved.set(command.requestId,'crianca-1');commits++;}
  if(loseReply){loseReply=false;throw new Error('offline');}
  return {data:saved.get(command.requestId),error:null};
 }});
 await assert.rejects(queue.create({kind:'child',fid:'familia',payload:{name:'Exemplo'}}),/offline/);
 assert.equal((await queue.pending())?.requestId,'pedido-1');
 user='adulto-2';await assert.rejects(queue.retry(),/conta que iniciou/);user='adulto-1';
 await assert.rejects(queue.create({kind:'child',fid:'familia',payload:{name:'Diferente'}}),/criação pendente/);
 assert.equal((await queue.retry()).result,'crianca-1');assert.equal(commits,1);assert.equal(await queue.pending(),null);
});

test('rejeição definitiva de uma criação nova liberta o pedido', async () => {
 let stored:string|null=null;
 const queue=creationQueue({read:async()=>stored,write:async value=>{stored=value;},remove:async()=>{stored=null;},user:async()=> 'adulto',newId:()=> 'pedido',submit:async()=>({data:null,error:{code:'23514'}})});
 await assert.rejects(queue.create({kind:'family',fid:null,payload:{name:''}}));
 assert.equal(await queue.pending(),null);
});
