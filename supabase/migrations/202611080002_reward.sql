-- Keep reward definition and child assignments atomic, including when editing.
create function public.save_reward(fid uuid, rid uuid, reward_name text, reward_cost integer, child_ids uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; begin
 if not private.is_member(fid) then raise exception 'Sem acesso'; end if;
 if reward_name is null or length(trim(reward_name)) not between 1 and 100 or reward_cost is null or reward_cost not between 1 and 100000 or child_ids is null or cardinality(child_ids)=0 or cardinality(child_ids)>100 then raise exception 'Recompensa inválida'; end if;
 if exists(select 1 from unnest(child_ids) c(id) where c.id is null or not exists(select 1 from public.children where family_id=fid and id=c.id)) then raise exception 'Criança inválida'; end if;
 if rid is null then
   insert into public.rewards(family_id,name,cost) values(fid,trim(reward_name),reward_cost) returning id into result;
 else
   update public.rewards set name=trim(reward_name),cost=reward_cost where family_id=fid and id=rid returning id into result;
   if result is null then raise exception 'Recompensa não encontrada'; end if;
   delete from public.reward_children where family_id=fid and reward_id=result;
 end if;
 insert into public.reward_children(family_id,reward_id,child_id) select fid,result,id from unnest(child_ids) c(id) group by id;
 return result;
end $$;
revoke all on function public.save_reward(uuid,uuid,text,integer,uuid[]) from public, anon;
grant execute on function public.save_reward(uuid,uuid,text,integer,uuid[]) to authenticated;
-- Only the atomic function changes reward definitions/assignments.
revoke insert, update, delete on public.rewards, public.reward_children from authenticated;
