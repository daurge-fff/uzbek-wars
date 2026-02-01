#!/bin/bash

###############################################################################
# Uzbek Wars Container Rebuild Script
#
# Performs a complete rebuild of Docker containers from scratch.
# Clears all caches to ensure clean build state.
#
# Usage: ./rebuild.sh
###############################################################################

set -e  # Exit on error

echo "========================================="
echo "Uzbek Wars - Container Rebuild Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop all running containers
echo -e "${YELLOW}[1/6] Stopping all containers...${NC}"
docker-compose down --remove-orphans || true
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Step 2: Remove old images
echo -e "${YELLOW}[2/6] Removing old images...${NC}"
docker-compose rm -f || true
docker rmi uzbek-wars-backend uzbek-wars-frontend uzbek-wars-proxy 2>/dev/null || true
echo -e "${GREEN}✓ Old images removed${NC}"
echo ""

# Step 3: Clean Docker system
echo -e "${YELLOW}[3/6] Cleaning Docker system...${NC}"
docker system prune -f
echo -e "${GREEN}✓ Docker system cleaned${NC}"
echo ""

# Step 4: Clean aaPanel caches (if present)
echo -e "${YELLOW}[4/6] Checking for aaPanel caches...${NC}"
if [ -d "/www/server/panel/plugin/docker/cache" ]; then
    echo "Found aaPanel cache directory, cleaning..."
    rm -rf /www/server/panel/plugin/docker/cache/* 2>/dev/null || true
    echo -e "${GREEN}✓ aaPanel caches cleaned${NC}"
else
    echo "No aaPanel installation detected, skipping..."
fi
echo ""

# Step 5: Rebuild images
echo -e "${YELLOW}[5/6] Building new images...${NC}"
docker-compose build --no-cache --pull
echo -e "${GREEN}✓ Images built successfully${NC}"
echo ""

# Step 6: Start containers
echo -e "${YELLOW}[6/6] Starting containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 5

# Check container status
echo ""
echo "========================================="
echo "Container Status:"
echo "========================================="
docker-compose ps
echo ""

# Show logs
echo "========================================="
echo "Recent Logs:"
echo "========================================="
docker-compose logs --tail=20
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Rebuild completed successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Application is running on http://localhost:3060"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop containers: docker-compose down"
echo "  - Restart: docker-compose restart"
echo ""
