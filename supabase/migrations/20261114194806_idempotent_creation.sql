-- A request id is tied to its author and full payload; retries return the original id.
-- Private data stays outside the exposed schema. This does not change point transactions.
create table private.creation_requests (
 actor uuid not null references auth.users(id),
 request_id uuid not null,
 command jsonb not null,
 result_id uuid not null,
 primary key(actor, request_id)
);
alter table private.creation_requests enable row level security;
revoke all on private.creation_requests from public, anon, authenticated;

create function public.create_once(kind text, fid uuid, payload jsonb, request_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid := auth.uid(); prior private.creation_requests; command_value jsonb; result uuid; child_ids uuid[];
begin
 if actor_id is null or request_id is null or payload is null or pg_catalog.jsonb_typeof(payload) <> 'object' then raise exception 'Pedido inválido'; end if;
 if kind is null or kind not in ('family','child','behaviour','reward') then raise exception 'Operação inválida'; end if;
 if kind='family' then
   if fid is not null then raise exception 'Pedido inválido'; end if;
 elsif fid is null or not private.is_member(fid) then raise exception 'Sem acesso'; end if;
 command_value := pg_catalog.jsonb_build_object('kind',kind,'family',fid,'payload',payload);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor_id::text || request_id::text,0));
 select * into prior from private.creation_requests where actor=actor_id and creation_requests.request_id=create_once.request_id;
 if found then
   if prior.command <> command_value then raise exception 'Pedido duplicado com dados diferentes'; end if;
   return prior.result_id;
 end if;
 if kind='family' then
   result := public.create_family(payload->>'name');
 elsif kind='child' then
   insert into public.children(family_id,name,avatar) values(fid,pg_catalog.btrim(payload->>'name'),payload->>'avatar') returning id into result;
 elsif kind='behaviour' then
   insert into public.behaviours(family_id,name,points,icon) values(fid,pg_catalog.btrim(payload->>'name'),(payload->>'points')::integer,payload->>'icon') returning id into result;
 else
   if pg_catalog.jsonb_typeof(payload->'childIds') <> 'array' then raise exception 'Crianças inválidas'; end if;
   select pg_catalog.array_agg(value::uuid) into child_ids from pg_catalog.jsonb_array_elements_text(payload->'childIds');
   result := public.save_reward(fid,null,payload->>'name',(payload->>'cost')::integer,child_ids);
 end if;
 insert into private.creation_requests(actor,request_id,command,result_id) values(actor_id,request_id,command_value,result);
 return result;
end $$;
revoke all on function public.create_once(text,uuid,jsonb,uuid) from public, anon;
grant execute on function public.create_once(text,uuid,jsonb,uuid) to authenticated;
