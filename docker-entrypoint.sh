#!/bin/sh
set -eu
mkdir -p /data
npx prisma db push --skip-generate --accept-data-loss
SEED_IF_EMPTY=true node server/dist/seed/run.js
exec node server/dist/index.js
