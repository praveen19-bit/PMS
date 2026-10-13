#!/usr/bin/env bash
# Runs migrations + RLS scenario tests against a throwaway database.
# Usage: PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run_rls_tests.sh
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
db="fastrack_rls_test_$$"
psql -q -c "create database $db"
trap 'psql -q -c "drop database if exists $db" >/dev/null' EXIT
psql -q -d "$db" -v ON_ERROR_STOP=1 -f "$here/supabase_shim.sql"
for f in "$here"/../migrations/*.sql; do
  psql -q -d "$db" -v ON_ERROR_STOP=1 -f "$f" 2>&1 | grep -v NOTICE || true
done
psql -q -d "$db" -v ON_ERROR_STOP=1 -f "$here/rls_test.sql"
