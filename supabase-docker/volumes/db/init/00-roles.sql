-- Minimal PostgREST/Storage roles for local self-hosted Supabase (NutriScan AI dev only).
-- Backend only ever uses service_role (bypassrls) — anon/authenticated exist just so
-- PostgREST can start (it requires PGRST_DB_ANON_ROLE to reference a real role).

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

\getenv pg_password POSTGRES_PASSWORD
create role authenticator noinherit login password :'pg_password';
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
