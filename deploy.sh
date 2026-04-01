#!/bin/bash

set -e
cd "$(dirname "$0")"

BRANCH="jrcandev"

echo "=== FOOTNOW Deploy v2.0 - $(date) ==="

# Check Git repo
if [ ! -d .git ]; then
  echo "❌ Not a Git repo"
  exit 1
fi

echo "🔄 Git reset to origin/$BRANCH"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd

echo "🔨 Rebuild Docker"
docker compose -f docker-compose.jrcandev.yml down
docker compose -f docker-compose.jrcandev.yml build --no-cache
docker compose -f docker-compose.jrcandev.yml up -d

echo "⏳ Wait DB healthy (30s)"
sleep 30

echo "📊 Database setup..."
docker compose -f docker-compose.jrcandev.yml exec db psql -U sae_user -d sae_db -f /db/schema.sql     > /dev/null 2>&1 || true
docker compose -f docker-compose.jrcandev.yml exec db psql -U sae_user -d sae_db -f /db/functions.sql > /dev/null 2>&1 || true
docker compose -f docker-compose.jrcandev.yml exec db psql -U sae_user -d sae_db -f /db/triggers.sql  > /dev/null 2>&1 || true

echo "🌱 Prisma migrate + seed"
docker compose -f docker-compose.jrcandev.yml exec api npx prisma db push     > /dev/null 2>&1 || true
docker compose -f docker-compose.jrcandev.yml exec api npx prisma generate   > /dev/null 2>&1 || true
docker compose -f docker-compose.jrcandev.yml exec api npx prisma db seed    > /dev/null 2>&1 || true

echo "🎯 Calculer prédictions"
docker compose -f docker-compose.jrcandev.yml exec api curl -X POST http://localhost:3070/api/predictions/calcul-tous > /dev/null 2>&1 || true

echo "✅ Health check"
sleep 5
if curl -f http://localhost:3070/api/health > /dev/null 2>&1; then
  echo "🎉 API HEALTHY ! Site prêt !"
else
  echo "⚠️ API health check failed - vérifiez logs:"
  docker compose -f docker-compose.jrcandev.yml logs api
fi

echo "🚀 Deploy terminé: $(date)"
echo "Site: https://${BRANCH}.jrcan.dev"
