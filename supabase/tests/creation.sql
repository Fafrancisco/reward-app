begin;
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000011'),('00000000-0000-0000-0000-000000000012');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
select public.create_once('family',null,'{"name":"Família exemplo"}', '11000000-0000-0000-0000-000000000001') as fid \gset
select public.create_once('family',null,'{"name":"Família exemplo"}', '11000000-0000-0000-0000-000000000001') as repeated_fid \gset
select 1 / case when :'fid' = :'repeated_fid' then 1 else 0 end as same_family;
select public.create_once('child',:'fid','{"name":"Criança exemplo","avatar":"fox"}','11000000-0000-0000-0000-000000000002') as child_id \gset
select public.create_once('child',:'fid','{"name":"Criança exemplo","avatar":"fox"}','11000000-0000-0000-0000-000000000002') as repeated_child \gset
select 1 / case when :'child_id'=:'repeated_child' and (select count(*) from public.children)=1 then 1 else 0 end as same_child;
select public.create_once('behaviour',:'fid','{"name":"Ler","points":5,"icon":"book"}','11000000-0000-0000-0000-000000000003') as behaviour_id \gset
select jsonb_build_object('name','Passeio','cost',70,'childIds',jsonb_build_array(:'child_id')) as reward_payload \gset
select public.create_once('reward',:'fid',:'reward_payload'::jsonb,'11000000-0000-0000-0000-000000000004') as reward_id \gset
select public.create_once('reward',:'fid',:'reward_payload'::jsonb,'11000000-0000-0000-0000-000000000004') as repeated_reward \gset
select 1 / case when :'reward_id'=:'repeated_reward' and (select count(*) from public.rewards)=1 then 1 else 0 end as same_reward;
select public.create_once('family',null,'{"name":"Outra família"}','11000000-0000-0000-0000-000000000006') as other_fid \gset
select public.create_once('child',:'other_fid','{"name":"Outra criança","avatar":"fox"}','11000000-0000-0000-0000-000000000007') as other_child \gset
select set_config('test.other_child',:'other_child',true);
select set_config('test.fid',:'fid',true);
do $$ begin
 begin perform public.create_once('reward',current_setting('test.fid')::uuid,jsonb_build_object('name','Inválida','cost',10,'childIds',jsonb_build_array(current_setting('test.other_child'))),'11000000-0000-0000-0000-000000000008'); raise exception 'cross-family reward accepted'; exception when raise_exception then if sqlerrm='cross-family reward accepted' then raise; end if; end;
 begin perform public.create_once('child',current_setting('test.fid')::uuid,'{"name":"Diferente","avatar":"fox"}','11000000-0000-0000-0000-000000000002'); raise exception 'mismatched payload accepted'; exception when raise_exception then if sqlerrm='mismatched payload accepted' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
do $$ begin
 begin perform public.create_once('child',current_setting('test.fid')::uuid,'{"name":"Exemplo","avatar":"fox"}','11000000-0000-0000-0000-000000000005'); raise exception 'outsider accepted'; exception when raise_exception then if sqlerrm='outsider accepted' then raise; end if; end;
end $$;
rollback;
