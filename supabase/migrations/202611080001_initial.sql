-- Draft: validate with isolated Supabase integration tests before real data.
create schema if not exists private;
revoke all on schema private from public;
create extension if not exists pgcrypto with schema extensions;
create table public.families (id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) between 1 and 100));
create table public.members (family_id uuid not null references public.families on delete cascade, user_id uuid not null references auth.users on delete cascade, primary key(family_id,user_id));
create table public.children (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families, name text not null check(length(trim(name)) between 1 and 100), avatar text not null, balance integer not null default 0, unique(family_id,id));
create table public.behaviours (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families, name text not null check(length(trim(name)) between 1 and 100), points integer not null check(points <> 0 and points between -100000 and 100000), icon text not null, unique(family_id,id));
create table public.rewards (id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families, name text not null check(length(trim(name)) between 1 and 100), cost integer not null check(cost between 1 and 100000), unique(family_id,id));
create table public.reward_children (family_id uuid not null, reward_id uuid not null, child_id uuid not null, primary key(reward_id,child_id), foreign key(family_id,reward_id) references public.rewards(family_id,id) on delete cascade, foreign key(family_id,child_id) references public.children(family_id,id));
create table public.entries (id uuid primary key default gen_random_uuid(), family_id uuid not null, child_id uuid not null, actor uuid not null references auth.users, description text not null, points integer not null check(points <> 0), created_at timestamptz not null default now(), command_id uuid not null, command jsonb not null, corrects uuid references public.entries(id), unique(family_id,command_id), unique(corrects), foreign key(family_id,child_id) references public.children(family_id,id));
create table private.invites (token_hash bytea primary key, family_id uuid not null references public.families, created_by uuid not null references auth.users, expires_at timestamptz not null, used_at timestamptz, revoked_at timestamptz);
alter table private.invites enable row level security;
revoke all on private.invites from public, anon, authenticated;
create function private.is_member(fid uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.members where family_id=fid and user_id=auth.uid()) $$;
revoke all on function private.is_member(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
revoke all on public.families, public.members, public.children, public.behaviours, public.rewards, public.reward_children, public.entries from anon, authenticated;
grant select on public.families, public.members, public.children, public.behaviours, public.rewards, public.reward_children, public.entries to authenticated;
grant insert,update on public.children, public.behaviours, public.rewards to authenticated;
grant insert,delete on public.reward_children to authenticated;
alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.children enable row level security;
alter table public.behaviours enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_children enable row level security;
alter table public.entries enable row level security;
create policy families_read on public.families for select to authenticated using(private.is_member(id));
create policy members_read on public.members for select to authenticated using(private.is_member(family_id));
create policy children_read on public.children for select to authenticated using(private.is_member(family_id));
-- Balance is changed only by the transaction functions below.
revoke insert, update on public.children from authenticated;
grant insert(family_id,name,avatar), update(name,avatar) on public.children to authenticated;
create policy children_insert on public.children for insert to authenticated with check(private.is_member(family_id));
create policy children_update on public.children for update to authenticated using(private.is_member(family_id)) with check(private.is_member(family_id));
create policy behaviours_read on public.behaviours for select to authenticated using(private.is_member(family_id));
create policy behaviours_write on public.behaviours for all to authenticated using(private.is_member(family_id)) with check(private.is_member(family_id));
create policy rewards_read on public.rewards for select to authenticated using(private.is_member(family_id));
create policy rewards_write on public.rewards for all to authenticated using(private.is_member(family_id)) with check(private.is_member(family_id));
create policy reward_children_read on public.reward_children for select to authenticated using(private.is_member(family_id));
create policy reward_children_write on public.reward_children for all to authenticated using(private.is_member(family_id)) with check(private.is_member(family_id));
create policy entries_read on public.entries for select to authenticated using(private.is_member(family_id));
create function public.create_family(family_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare fid uuid; begin
 if auth.uid() is null then raise exception 'Sessão necessária'; end if;
 insert into public.families(name) values(trim(family_name)) returning id into fid;
 insert into public.members values(fid,auth.uid()); return fid;
end $$;
create function public.create_invite(fid uuid) returns text language plpgsql security definer set search_path='' as $$
declare token text; begin
 if not private.is_member(fid) then raise exception 'Sem acesso'; end if;
 token := encode(extensions.gen_random_bytes(32),'hex');
 insert into private.invites values(extensions.digest(token,'sha256'),fid,auth.uid(),now()+interval '24 hours',null,null);
 return token;
end $$;
create function public.accept_invite(token text) returns uuid language plpgsql security definer set search_path='' as $$
declare inv private.invites; begin
 if auth.uid() is null or length(token) <> 64 then raise exception 'Convite inválido'; end if;
 select * into inv from private.invites where token_hash=extensions.digest(token,'sha256') for update;
 if not found or inv.used_at is not null or inv.revoked_at is not null or inv.expires_at <= now() then raise exception 'Convite inválido ou expirado'; end if;
 insert into public.members values(inv.family_id,auth.uid()) on conflict do nothing;
 update private.invites set used_at=now() where token_hash=inv.token_hash;
 return inv.family_id;
end $$;
create function public.revoke_invite(token text) returns void language plpgsql security definer set search_path='' as $$
declare fid uuid; begin
 select family_id into fid from private.invites where token_hash=extensions.digest(token,'sha256');
 if fid is null or not private.is_member(fid) then raise exception 'Sem acesso'; end if;
 update private.invites set revoked_at=now() where token_hash=extensions.digest(token,'sha256') and used_at is null;
end $$;
-- Commands are serialized on each child; the immutable entry snapshots the applied value.
create function public.apply_points(fid uuid, cid uuid, operation text, target uuid, request_id uuid, expected_delta integer default null) returns public.entries language plpgsql security definer set search_path='' as $$
declare c public.children; e public.entries; delta integer; descr text; cmd jsonb; begin
 if not private.is_member(fid) or request_id is null then raise exception 'Sem acesso'; end if;
 cmd:=jsonb_build_object('child',cid,'operation',operation,'target',target,'actor',auth.uid(),'expected_delta',expected_delta);
 -- Serialize retries even if they name different children.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(fid::text || request_id::text,0));
 select * into e from public.entries where family_id=fid and command_id=request_id;
 if found then if e.command <> cmd then raise exception 'Pedido duplicado com dados diferentes'; end if; return e; end if;
 select * into c from public.children where family_id=fid and id=cid for update;
 if not found then raise exception 'Criança não encontrada'; end if;
 if operation='behaviour' then
   select points,name into delta,descr from public.behaviours where family_id=fid and id=target;
 elsif operation='redeem' then
   select -r.cost,'Resgate: ' || r.name into delta,descr from public.rewards r join public.reward_children rc on rc.family_id=r.family_id and rc.reward_id=r.id where r.family_id=fid and r.id=target and rc.child_id=cid;
   if delta is not null and c.balance < -delta then raise exception 'Pontos insuficientes'; end if;
 elsif operation='correct' then
   select -points,'Correção: ' || description into delta,descr from public.entries where family_id=fid and child_id=cid and id=target and corrects is null;
 else raise exception 'Operação inválida'; end if;
 if delta is null then raise exception 'Operação indisponível'; end if;
 if expected_delta is not null and delta <> expected_delta then raise exception 'Valor alterado; atualiza e confirma novamente'; end if;
 insert into public.entries(family_id,child_id,actor,description,points,command_id,command,corrects) values(fid,cid,auth.uid(),descr,delta,request_id,cmd,case when operation='correct' then target else null end) returning * into e;
 update public.children set balance=balance+delta where family_id=fid and id=cid;
 return e;
end $$;
revoke all on function public.create_family(text), public.create_invite(uuid), public.accept_invite(text), public.revoke_invite(text), public.apply_points(uuid,uuid,text,uuid,uuid,integer) from public, anon;
grant execute on function public.create_family(text), public.create_invite(uuid), public.accept_invite(text), public.revoke_invite(text), public.apply_points(uuid,uuid,text,uuid,uuid,integer) to authenticated;
