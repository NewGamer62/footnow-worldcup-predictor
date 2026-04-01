#!/bin/bash

set -e
cd "$(dirname "$0")"

BRANCH="jrcandev"

echo "=== Deploy script started at $(date) ==="

# Check if this is a Git repository
if [ ! -d .git ]; then
  echo "This directory is not a Git repository."
  exit 1
fi

# Always reset to remote version (ignore local changes)
echo "=== Resetting to remote version ==="
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd

echo "=== Rebuilding stack ==="
docker compose -f docker-compose.jrcandev.yml down
docker compose -f docker-compose.jrcandev.yml build --no-cache
docker compose -f docker-compose.jrcandev.yml up -d

echo "Deployment completed at $(date)"