import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './auth';
import { State } from './domain';
import { singleFlight } from './single-flight';
import { apiOrigin } from './api-url';
import { creationQueue, CreationKind } from './creation-queue';

function client() { if (!supabase) throw new Error('Configura o Supabase antes de iniciar sessão.'); return supabase; }
function check<T>(result: {data: T; error: {message:string}|null}): T { if (result.error) throw new Error(result.error.message); return result.data; }
export async function families() { return check(await client().from('families').select('id,name').order('name')) ?? []; }
export async function members(fid:string):Promise<{user_id:string;display_name:string}[]> { return check(await client().rpc('family_member_names',{fid})) ?? []; }
export async function createFamily(name:string) { return (await createOnce('family',null,{name:name.trim()})).result; }
export async function createInvite(fid:string) { return check(await client().rpc('create_invite',{fid})) as string; }
export async function acceptInvite(token:string) { return check(await client().rpc('accept_invite',{token:token.trim()})) as string; }
export async function revokeInvite(token:string) { check(await client().rpc('revoke_invite',{token})); }
export async function loadFamily(fid:string):Promise<{state:State;adults:{user_id:string;display_name:string}[]}> {
 const db=client();
 const [children,behaviours,rewards,links,entries,adults]=await Promise.all([
  db.from('children').select('id,name,avatar,balance').eq('family_id',fid).order('name'),
  db.from('behaviours').select('id,name,points,icon').eq('family_id',fid).order('name'),
  db.from('rewards').select('id,name,cost').eq('family_id',fid).order('name'),
  db.from('reward_children').select('reward_id,child_id').eq('family_id',fid),
  db.from('entries').select('id,child_id,description,points,actor,created_at,corrects').eq('family_id',fid).order('created_at',{ascending:false}).order('id',{ascending:false}),
  members(fid),
 ]);
 const c=check(children) ?? [], b=check(behaviours) ?? [], r=check(rewards) ?? [], l=check(links) ?? [], e=check(entries) ?? [];
 const names=new Map(adults.map(member=>[member.user_id,member.display_name]));
 return {adults,state:{children:c,behaviours:b,rewards:r.map(x=>({...x,childIds:l.filter(y=>y.reward_id===x.id).map(y=>y.child_id)})),history:e.map(x=>({id:x.id,childId:x.child_id,description:x.description,points:x.points,actor:`${names.get(x.actor) ?? 'Adulto'} · ${x.actor.slice(0,8)}`,date:x.created_at,corrects:x.corrects ?? undefined}))}};
}
export async function saveChild(fid:string,name:string,avatar:string,id?:string) {
 const db=client(); const values={name:name.trim(),avatar};
 if(id) check(await db.from('children').update(values).eq('family_id',fid).eq('id',id).select().single());
 else await createOnce('child',fid,values);
}
export async function saveBehaviour(fid:string,name:string,points:number,icon:string,id?:string) {
 const db=client(); const values={name:name.trim(),points,icon};
 if(id) check(await db.from('behaviours').update(values).eq('family_id',fid).eq('id',id).select().single());
 else await createOnce('behaviour',fid,values);
}
export async function saveReward(fid:string,name:string,cost:number,childIds:string[],id?:string) {
 if(id) check(await client().rpc('save_reward',{fid,rid:id,reward_name:name.trim(),reward_cost:cost,child_ids:childIds}));
 else await createOnce('reward',fid,{name:name.trim(),cost,childIds});
}
const creationKey='reward-pending-creation-v1';
const creations=creationQueue({
 read:()=>SecureStore.getItemAsync(creationKey),
 write:value=>SecureStore.setItemAsync(creationKey,value),
 remove:()=>SecureStore.deleteItemAsync(creationKey),
 user:async()=>{const {data,error}=await client().auth.getSession();if(error||!data.session)throw new Error('Inicia sessão novamente.');return data.session.user.id;},
 newId:()=>Crypto.randomUUID(),
 submit:async command=>await client().rpc('create_once',{kind:command.kind,fid:command.fid,payload:command.payload,request_id:command.requestId}),
});
export const getPendingCreation=creations.pending;
function createOnce(kind:CreationKind,fid:string|null,payload:Record<string,unknown>) { return creations.create({kind,fid,payload}); }
export const retryCreation=creations.retry;
type Command = {familyId:string; childId:string; operation:'behaviour'|'redeem'|'correct'; targetId:string; expectedDelta?:number; requestId:string; userId:string};
const pendingKey='reward-pending-command-v1';
export async function getPending():Promise<Command|null> { const data=await SecureStore.getItemAsync(pendingKey); return data ? JSON.parse(data) as Command : null; }
export const sendCommand = singleFlight(async (input:Omit<Command,'requestId'|'userId'>, retry=false) => {
 const api=apiOrigin(process.env.EXPO_PUBLIC_API_URL);
 const old=await getPending();
 if(old && !retry) throw new Error('Existe uma operação por confirmar. Tenta novamente antes de iniciar outra.');
 const {data,error}=await client().auth.getSession();
 if(error || !data.session) throw new Error('Inicia sessão novamente.');
 const cmd=retry ? old : {...input,requestId:Crypto.randomUUID(),userId:data.session.user.id};
 if(!cmd) throw new Error('Não há operação pendente.');
 if(cmd.userId!==data.session.user.id) throw new Error('Entra com a conta que iniciou a operação pendente.');
 await SecureStore.setItemAsync(pendingKey,JSON.stringify(cmd));
 let response:Response;
 try { response=await fetch(`${api}/api/points`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(cmd)}); }
 catch { throw new Error('Não foi possível confirmar a operação. Liga-te à rede e usa “Tentar operação novamente”.'); }
 if(response.ok) { await SecureStore.deleteItemAsync(pendingKey); return; }
 // Only a validated business rejection proves that this request was not applied.
 if(!retry && (response.status===400 || response.status===422)) await SecureStore.deleteItemAsync(pendingKey);
 if (retry) throw new Error('A operação anterior continua por confirmar. Verifica o histórico e tenta novamente com a mesma conta.');
 throw new Error((response.status===400 || response.status===422)?'Operação recusada. Atualiza os dados e tenta novamente.':'Não foi possível confirmar a operação. Tenta novamente com a mesma sessão.');
});
