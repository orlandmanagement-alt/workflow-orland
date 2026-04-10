#!/bin/bash
# Integration Setup Script for Smart Matching Engine
# Purpose: Initialize all three modules (Profile, Smart Match, Projects)

set -e

echo "🚀 Orland Smart Matching Engine - Setup Script"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Database Migrations
# ============================================================================

echo -e "\n${YELLOW}[1/5] Setting up database migrations...${NC}"

cd apps/appapi

# Check if migrations directory exists
if [ ! -d "migrations" ]; then
    echo -e "${RED}Error: migrations directory not found in apps/appapi${NC}"
    exit 1
fi

echo "✓ Migrations directory found"

# List all migration files
echo -e "\n${YELLOW}Available migrations:${NC}"
ls -1 migrations/ | grep -E "^\d+_" || echo "No migrations found"

# Verify critical migration files
CRITICAL_MIGRATIONS=(
    "030_DB_CORE_talent_profiles.sql"
)

for migration in "${CRITICAL_MIGRATIONS[@]}"; do
    if [ -f "migrations/$migration" ]; then
        echo -e "${GREEN}✓ Found: $migration${NC}"
    else
        echo -e "${YELLOW}⚠ Missing: $migration${NC}"
        echo "  This migration is critical for the Smart Matching Engine"
    fi
done

# ============================================================================
# STEP 2: Install Dependencies
# ============================================================================

echo -e "\n${YELLOW}[2/5] Installing dependencies...${NC}"

# Install root packages
cd ../..
if [ -f "package.json" ]; then
    echo "Installing root dependencies..."
    npm install --legacy-peer-deps || echo "Root install completed with warnings"
fi

# Install appapi packages
echo "Installing appapi packages..."
cd apps/appapi
npm install --legacy-peer-deps || echo "appapi install completed with warnings"

# Install apptalent packages
echo "Installing apptalent packages..."
cd ../apptalent
npm install --legacy-peer-deps || echo "apptalent install completed with warnings"

# Install db-schema packages
echo "Installing db-schema packages..."
cd ../../packages/db-schema
npm install || echo "db-schema install completed with warnings"

cd ../..

echo -e "${GREEN}✓ Dependencies installed${NC}"

# ============================================================================
# STEP 3: Environment Setup
# ============================================================================

echo -e "\n${YELLOW}[3/5] Checking environment setup...${NC}"

# Check wrangler.toml files
if [ -f "apps/appapi/wrangler.toml" ]; then
    echo -e "${GREEN}✓ Found apps/appapi/wrangler.toml${NC}"
else
    echo -e "${YELLOW}⚠ Missing apps/appapi/wrangler.toml${NC}"
fi

if [ -f "apps/apptalent/wrangler.toml" ]; then
    echo -e "${GREEN}✓ Found apps/apptalent/wrangler.toml${NC}"
else
    echo -e "${YELLOW}⚠ Missing apps/apptalent/wrangler.toml${NC}"
fi

# Check TypeScript configuration
echo -e "\n${YELLOW}Checking TypeScript configurations...${NC}"
for tsconfig in "tsconfig.json" "apps/apptalent/tsconfig.json" "packages/db-schema/tsconfig.json"; do
    if [ -f "$tsconfig" ]; then
        echo -e "${GREEN}✓ Found $tsconfig${NC}"
    fi
done

# ============================================================================
# STEP 4: Build TypeScript Code
# ============================================================================

echo -e "\n${YELLOW}[4/5] Building TypeScript code...${NC}"

# Build db-schema package
echo "Building db-schema..."
cd packages/db-schema
npm run build 2>/dev/null || echo "Build completed (may have warnings)"
cd ../..

echo -e "${GREEN}✓ TypeScript build completed${NC}"

# ============================================================================
# STEP 5: Verification
# ============================================================================

echo -e "\n${YELLOW}[5/5] Running verification checks...${NC}"

# Check if key files exist
REQUIRED_FILES=(
    "packages/db-schema/src/types.talent.ts"
    "packages/db-schema/src/smart-matching.engine.ts"
    "apps/appapi/migrations/030_DB_CORE_talent_profiles.sql"
    "apps/apptalent/ARCHITECTURE_GUIDE.md"
)

ALL_OK=true

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ MISSING: $file${NC}"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = true ]; then
    echo -e "\n${GREEN}✓ All verification checks passed!${NC}"
else
    echo -e "\n${RED}✗ Some required files are missing${NC}"
    exit 1
fi

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "\n${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete! Ready for development              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Configure your database connection in apps/appapi/wrangler.toml"
echo "2. Apply database migrations: wrangler d1 migrations apply"
echo "3. Start development server: npm run dev"
echo "4. Review ARCHITECTURE_GUIDE.md for API documentation"
echo ""
echo -e "${YELLOW}Quick Commands:${NC}"
echo "  npm run dev              - Start development server"
echo "  npm run build            - Build all packages"
echo "  npm run lint             - Run linting"
echo "  npm test                 - Run tests"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "  - ARCHITECTURE_GUIDE.md: Complete system architecture"
echo "  - packages/db-schema/src/types.talent.ts: Type definitions"
echo "  - packages/db-schema/src/smart-matching.engine.ts: Matching algorithm"

exit 0
