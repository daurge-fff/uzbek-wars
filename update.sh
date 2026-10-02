#!/bin/bash

###############################################################################
# Uzbek Wars - Fast update
#
# Rebuilds using the Docker layer cache (no --no-cache, no --pull, no prune),
# which is dramatically faster than rebuild.sh. Use this after `git pull` for
# normal updates. Use rebuild.sh only when you need a guaranteed clean build.
#
# Usage:
#   ./update.sh            # rebuild whatever changed
#   ./update.sh frontend   # rebuild only the frontend
#   ./update.sh backend    # rebuild only the backend
###############################################################################

set -e

SERVICES="${1:-}"

echo "Uzbek Wars - fast update (cached build)"
echo ""

if [ -n "$SERVICES" ]; then
  docker compose build $SERVICES
else
  docker compose build
fi

docker compose up -d --remove-orphans
docker compose ps

echo ""
echo "Done. Logs: docker compose logs -f"
