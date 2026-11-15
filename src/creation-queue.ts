import { singleFlight } from './single-flight';
export type CreationKind = 'family'|'child'|'behaviour'|'reward';
export type CreationInput = { kind:CreationKind; fid:string|null; payload:Record<string,unknown> };
export type Creation = CreationInput & { requestId:string; userId:string };
type Result = { data:unknown; error:{code?:string}|null };
type Dependencies = {
 read:()=>Promise<string|null>; write:(value:string)=>Promise<void>; remove:()=>Promise<void>;
 user:()=>Promise<string>; newId:()=>string; submit:(command:Creation)=>Promise<Result>;
};
export function creationQueue(deps:Dependencies) {
 async function pending():Promise<Creation|null> { const raw=await deps.read();return raw?JSON.parse(raw) as Creation:null; }
 const send = singleFlight(async (request:CreationInput|null) => {
  const userId=await deps.user(), existing=await pending();
  if(existing && existing.userId!==userId)throw new Error('Entra com a conta que iniciou a criação pendente.');
  if(existing && request && (existing.kind!==request.kind || existing.fid!==request.fid || JSON.stringify(existing.payload)!==JSON.stringify(request.payload))) throw new Error('Confirma primeiro a criação pendente.');
  const command:Creation|null=existing ?? (request ? {...request,requestId:deps.newId(),userId} : null);
  if(!command)throw new Error('Não há criação pendente.');
  await deps.write(JSON.stringify(command));
  const result=await deps.submit(command);
  if(result.error){
   // An explicit rejection of a new transaction is final; an older uncertain request remains pending.
   if(!existing && ['P0001','23514','23502','22P02','22003'].includes(result.error.code??'')) await deps.remove();
   throw new Error('Não foi possível confirmar a criação. Atualiza os dados e tenta confirmar a operação pendente.');
  }
  if(typeof result.data!=='string')throw new Error('Não foi possível confirmar a criação.');
  await deps.remove();
  return {kind:command.kind,fid:command.fid,result:result.data};
 });
 return {pending, create:(request:CreationInput)=>send(request), retry:()=>send(null)};
}
