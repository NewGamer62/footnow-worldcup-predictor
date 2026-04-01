#!/bin/bash

set -e
cd "$(dirname "$0")"

BRANCH="jrcandev"
PROJECT="sae-footnow-grp8"

echo "=== FOOTNOW Deploy - $(date) ==="

# 1. Mettre à jour le code
echo "🔄 Mise à jour du code..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd

# 2. Reconstruire et lancer Docker
echo "🏗️  Rebuild Docker..."
docker compose -f docker-compose.jrcandev.yml down
docker compose -f docker-compose.jrcandev.yml build --no-cache
docker compose -f docker-compose.jrcandev.yml up -d

# 3. Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL (30s)..."
sleep 30

# 4. Créer les tables avec Prisma
echo "📊 Création des tables..."
docker compose -f docker-compose.jrcandev.yml exec -T api npx prisma db push

# 5. Importer les données (seed)
echo "🌱 Import des données..."
docker compose -f docker-compose.jrcandev.yml exec -T api npx prisma db seed

# 6. Créer les fonctions SQL
echo "🔧 Création des fonctions PL/pgSQL..."
docker compose -f docker-compose.jrcandev.yml exec -T api psql "$DATABASE_URL" -f /db/functions.sql
docker compose -f docker-compose.jrcandev.yml exec -T api psql "$DATABASE_URL" -f /db/triggers.sql

# 7. Calculer les prédictions
echo "📈 Calcul des prédictions..."
docker compose -f docker-compose.jrcandev.yml exec -T api psql "$DATABASE_URL" -c "SELECT calculer_toutes_predictions();"

# 8. Vérifier
echo "✅ Vérification..."
sleep 5
if curl -f http://localhost:3070/api/health > /dev/null 2>&1; then
  PREDICTIONS=$(docker compose -f docker-compose.jrcandev.yml exec -T db psql -U sae_user -d sae_db -t -c "SELECT COUNT(*) FROM prediction;" | tr -d ' ')
  echo "🎉 API OK ! $PREDICTIONS prédictions chargées."
else
  echo "⚠️ API non disponible. Logs :"
  docker compose -f docker-compose.jrcandev.yml logs api --tail=30
fi

echo "Site: https://${PROJECT}.jrcan.dev"
echo "=== Déploiement terminé à $(date) ==="