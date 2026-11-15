-- Run against an isolated database with the Supabase auth schema and initial migration.
begin;
insert into auth.users(id,raw_user_meta_data) values ('00000000-0000-0000-0000-000000000001','{"full_name":"Adulto exemplo"}'),('00000000-0000-0000-0000-000000000002','{"name":"Convidado exemplo"}'),('00000000-0000-0000-0000-000000000003','{}');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select public.create_family('Exemplo') as family_id \gset
insert into public.children(family_id,name,avatar) values (:'family_id','Exemplo','🦊') returning id as child_id \gset
insert into public.behaviours(family_id,name,points,icon) values (:'family_id','Exemplo',75,'⭐') returning id as behaviour_id \gset
select public.save_reward(:'family_id',null,'Passeio',70,array[:'child_id'::uuid]) as reward_id \gset
select public.create_invite(:'family_id') as token \gset
select public.apply_points(:'family_id',:'child_id','behaviour',:'behaviour_id','10000000-0000-0000-0000-000000000001');
select public.apply_points(:'family_id',:'child_id','behaviour',:'behaviour_id','10000000-0000-0000-0000-000000000001');
select public.apply_points(:'family_id',:'child_id','redeem',:'reward_id','10000000-0000-0000-0000-000000000002');
select 1 / case when (select balance from public.children where id=:'child_id')=5 then 1 else 0 end as balance_test;
select 1 / case when (select count(*) from public.entries)=2 then 1 else 0 end as idempotency_test;
select set_config('test.family', :'family_id', true), set_config('test.child', :'child_id', true), set_config('test.behaviour', :'behaviour_id', true);
do $$ begin
 begin update public.children set balance=999; raise exception 'direct balance write accepted'; exception when insufficient_privilege then null; end;
 begin perform public.apply_points(current_setting('test.family')::uuid,current_setting('test.child')::uuid,'behaviour',current_setting('test.behaviour')::uuid,'80000000-0000-0000-0000-000000000001',5); raise exception 'stale value accepted'; exception when raise_exception then if sqlerrm='stale value accepted' then raise; end if; end;
 begin perform public.apply_points(current_setting('test.family')::uuid,current_setting('test.child')::uuid,'behaviour',current_setting('test.behaviour')::uuid,'10000000-0000-0000-0000-000000000002'); raise exception 'mismatched retry accepted'; exception when raise_exception then if sqlerrm='mismatched retry accepted' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select 1 / case when (select count(*) from public.children)=0 then 1 else 0 end as isolation_test;
select set_config('test.invite', :'token', true);
select public.accept_invite(:'token');
select 1 / case when (select count(*) from public.children)=1 then 1 else 0 end as invited_member_test;
select 1 / case when (select count(*) from public.family_member_names(:'family_id') where display_name in ('Adulto exemplo','Convidado exemplo'))=2 then 1 else 0 end as member_names_test;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select 1 / case when (select count(*) from public.children)=0 then 1 else 0 end as unrelated_member_test;
do $$ begin
 begin perform public.apply_points(current_setting('test.family')::uuid,current_setting('test.child')::uuid,'behaviour',current_setting('test.behaviour')::uuid,'90000000-0000-0000-0000-000000000001'); raise exception 'outsider write accepted'; exception when raise_exception then if sqlerrm='outsider write accepted' then raise; end if; end;
end $$;
do $$ begin
  begin perform public.family_member_names(current_setting('test.family')::uuid); raise exception 'outsider names accepted'; exception when raise_exception then if sqlerrm='outsider names accepted' then raise; end if; end;
  begin perform public.accept_invite(current_setting('test.invite', true)); raise exception 'reused invitation accepted'; exception when raise_exception then if sqlerrm='reused invitation accepted' then raise; end if; end;
end $$;
rollback;
