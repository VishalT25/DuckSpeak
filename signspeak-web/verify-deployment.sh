#!/bin/bash

echo "🔍 DuckSpeak Deployment Verification Script"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo "✅ npm is installed"

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
fi

echo "✅ Dependencies installed"

# Check for required files
echo ""
echo "📁 Checking required files..."

files=(
    "vercel.json"
    ".env.example"
    "api/token.ts"
    "src/hooks/useLiveKit.ts"
    "src/pages/VideoCall.tsx"
    "VERCEL_QUICK_DEPLOY.md"
    "VERCEL_DEPLOYMENT.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file ${RED}(missing)${NC}"
    fi
done

# Check if Daily.co is removed
echo ""
echo "🗑️  Checking Daily.co removal..."

if grep -r "@daily-co/daily-js" package.json &> /dev/null; then
    echo -e "${RED}❌ Daily.co still in package.json${NC}"
else
    echo -e "${GREEN}✅ Daily.co removed from dependencies${NC}"
fi

if [ -f "src/hooks/useWebRTC.ts" ]; then
    echo -e "${YELLOW}⚠️  Old useWebRTC.ts file still exists${NC}"
else
    echo -e "${GREEN}✅ Old Daily.co hook removed${NC}"
fi

# Check LiveKit dependencies
echo ""
echo "📦 Checking LiveKit dependencies..."

if grep -q "livekit-client" package.json; then
    echo -e "${GREEN}✅ livekit-client installed${NC}"
else
    echo -e "${RED}❌ livekit-client missing${NC}"
fi

if grep -q "@livekit/components-react" package.json; then
    echo -e "${GREEN}✅ @livekit/components-react installed${NC}"
else
    echo -e "${RED}❌ @livekit/components-react missing${NC}"
fi

if grep -q "livekit-server-sdk" package.json; then
    echo -e "${GREEN}✅ livekit-server-sdk installed${NC}"
else
    echo -e "${RED}❌ livekit-server-sdk missing${NC}"
fi

# Check environment setup
echo ""
echo "⚙️  Checking environment configuration..."

if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅ .env.example exists${NC}"
    
    if grep -q "VITE_LIVEKIT_URL" .env.example; then
        echo -e "${GREEN}✅ VITE_LIVEKIT_URL in .env.example${NC}"
    else
        echo -e "${RED}❌ VITE_LIVEKIT_URL missing in .env.example${NC}"
    fi
    
    if grep -q "LIVEKIT_API_KEY" .env.example; then
        echo -e "${GREEN}✅ LIVEKIT_API_KEY in .env.example${NC}"
    else
        echo -e "${RED}❌ LIVEKIT_API_KEY missing in .env.example${NC}"
    fi
else
    echo -e "${RED}❌ .env.example missing${NC}"
fi

# Check .gitignore
echo ""
echo "🔒 Checking .gitignore..."

if [ -f ".gitignore" ]; then
    if grep -q ".vercel" .gitignore; then
        echo -e "${GREEN}✅ .vercel in .gitignore${NC}"
    else
        echo -e "${YELLOW}⚠️  .vercel not in .gitignore${NC}"
    fi
    
    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✅ .env files in .gitignore${NC}"
    else
        echo -e "${RED}❌ .env not in .gitignore${NC}"
    fi
else
    echo -e "${RED}❌ .gitignore missing${NC}"
fi

# Test build
echo ""
echo "🏗️  Testing production build..."

if npm run build &> /dev/null; then
    echo -e "${GREEN}✅ Production build successful${NC}"
else
    echo -e "${RED}❌ Production build failed${NC}"
    echo -e "${YELLOW}   Run 'npm run build' to see errors${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo "📊 Verification Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Your DuckSpeak app is ready for Vercel deployment!${NC}"
echo ""
echo "Next steps:"
echo "1. Get LiveKit credentials from https://cloud.livekit.io"
echo "2. Push code to GitHub"
echo "3. Follow VERCEL_QUICK_DEPLOY.md (5 minutes)"
echo ""
echo "Documentation:"
echo "  - Quick Deploy: VERCEL_QUICK_DEPLOY.md"
echo "  - Full Guide: VERCEL_DEPLOYMENT.md"
echo "  - Complete Setup: COMPLETE_SETUP_GUIDE.md"
echo ""
