#!/usr/bin/env bash
# One-shot bring-up for the local Supabase-compatible stack (Postgres + PostgREST +
# Storage API + nginx gateway) used by NutriScan AI backend in development.
# Run this after `docker compose down -v` (fresh volumes) or on first setup.
set -euo pipefail
cd "$(dirname "$0")"

docker compose up -d

echo "Waiting for storage-api to create its schema..."
for i in $(seq 1 30); do
  if docker exec nutriscan-supabase-db-1 psql -U postgres -d postgres -tAc \
    "select 1 from information_schema.schemata where schema_name = 'storage'" | grep -q 1; then
    break
  fi
  sleep 1
done

docker exec -i nutriscan-supabase-db-1 psql -U postgres -d postgres <<'SQL'
grant usage on schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to service_role;
grant all on all sequences in schema storage to service_role;
alter default privileges in schema storage grant all on tables to service_role;
alter default privileges in schema storage grant all on sequences to service_role;
SQL

SERVICE_KEY=$(grep SERVICE_ROLE_KEY .env | cut -d= -f2)
curl -s -X POST "http://localhost:55321/storage/v1/bucket" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id":"scan-photos","name":"scan-photos","public":true}'

echo ""
echo "Done. Point backend/.env to:"
echo "  SUPABASE_URL=http://localhost:55321"
echo "  SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY"
