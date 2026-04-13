#!/bin/sh
set -eu

DB_PATH="${SQLITE_DB_PATH:-/app/data/dev.db}"
DB_DIR="$(dirname "$DB_PATH")"
SEED_MODE="${RUN_DB_SEED:-auto}"

mkdir -p "$DB_DIR"

DB_ALREADY_EXISTS=0
if [ -f "$DB_PATH" ]; then
  DB_ALREADY_EXISTS=1
fi

echo "[entrypoint] Prisma db push"
npm run db:push

if [ "$SEED_MODE" = "true" ]; then
  echo "[entrypoint] RUN_DB_SEED=true -> seeding"
  npm run db:seed
elif [ "$SEED_MODE" = "auto" ] && [ "$DB_ALREADY_EXISTS" -eq 0 ]; then
  echo "[entrypoint] New database detected -> seeding"
  npm run db:seed
else
  echo "[entrypoint] Skip seed (RUN_DB_SEED=$SEED_MODE, existing_db=$DB_ALREADY_EXISTS)"
fi

exec "$@"
