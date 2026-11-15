-- Minimal Auth stand-in for isolated PostgreSQL tests, never a production migration.
do $$ begin
 if not exists(select 1 from pg_catalog.pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_catalog.pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
