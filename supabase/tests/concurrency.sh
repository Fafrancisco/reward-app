#!/usr/bin/env bash
set -euo pipefail
# Only use against a disposable PostgreSQL database with the migrations applied.
: "${DATABASE_URL:?Define DATABASE_URL for a disposable test database}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001');
insert into public.families(id,name) values ('20000000-0000-0000-0000-000000000001','Teste');
insert into public.members values ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001');
insert into public.children(id,family_id,name,avatar,balance) values ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Exemplo','x',75);
insert into public.rewards(id,family_id,name,cost) values ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Passeio',70);
insert into public.reward_children values ('20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
SQL
run_command() {
 psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "set role authenticated; select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false); select public.apply_points('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','redeem','40000000-0000-0000-0000-000000000001','$1');" >/dev/null 2>&1
}
run_command 50000000-0000-0000-0000-000000000001 & a=$!
run_command 50000000-0000-0000-0000-000000000002 & b=$!
status_a=0; wait "$a" || status_a=$?
status_b=0; wait "$b" || status_b=$?
if ! { [ "$status_a" -eq 0 ] && [ "$status_b" -ne 0 ]; } && ! { [ "$status_b" -eq 0 ] && [ "$status_a" -ne 0 ]; }; then echo 'Expected exactly one successful redemption' >&2; exit 1; fi
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
 if (select balance from public.children where id='30000000-0000-0000-0000-000000000001') <> 5 then raise exception 'Wrong balance'; end if;
 if (select count(*) from public.entries where family_id='20000000-0000-0000-0000-000000000001') <> 1 then raise exception 'Wrong entry count'; end if;
end $$;
SQL
echo 'Concurrent redemption test passed.'
run_creation() {
 psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "set role authenticated; select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',false); select public.create_once('child','20000000-0000-0000-0000-000000000001','{\"name\":\"Concorrente\",\"avatar\":\"fox\"}','60000000-0000-0000-0000-000000000001');" >/dev/null 2>&1
}
run_creation & a=$!
run_creation & b=$!
wait "$a"
wait "$b"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL'
do $$ begin
 if (select count(*) from public.children where family_id='20000000-0000-0000-0000-000000000001' and name='Concorrente') <> 1 then raise exception 'Duplicate concurrent creation'; end if;
end $$;
SQL
echo 'Concurrent creation test passed.'
