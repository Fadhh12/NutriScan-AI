#!/usr/bin/env bash
# Applies one migration file to the local Postgres and reloads PostgREST's
# schema cache. PostgREST caches the schema on startup and does NOT notice
# new tables/columns until told to reload -- skipping this step produces a
# confusing "Could not find the table 'public.x' in the schema cache" error
# even though the table exists.
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./apply-migration.sh <path-to-migration.sql>"
  exit 1
fi

docker exec -i nutriscan-supabase-db-1 psql -U postgres -d postgres < "$1"
docker exec -i nutriscan-supabase-db-1 psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"
echo "Applied $1 and reloaded PostgREST schema cache."
