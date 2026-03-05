#!/bin/bash
# =============================================================================
# deploy.sh — EC2 Deployment Script for Hackathon Tracker Frontend
#
# Run this on your EC2 instance after SSH-ing in:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================

set -e  # Exit immediately on any error

echo ""
echo "============================================="
echo "  Hackathon Tracker — EC2 Frontend Deploy"
echo "============================================="
echo ""

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Step 1: Pull latest code ─────────────────────────────────────────────────
echo "[1/5] Pulling latest code from Git..."
git pull origin master
echo "  ✅ Code updated."

# ─── Step 2: Install all dependencies ─────────────────────────────────────────
echo ""
echo "[2/5] Installing dependencies..."
npm ci
echo "  ✅ Dependencies installed."

# ─── Step 3: Build the production bundle ──────────────────────────────────────
echo ""
echo "[3/5] Building the Vite production bundle..."
# Make sure .env is updated on EC2 before running this step!
# VITE_API_BASE_URL should point to the backend EC2 IP or domain.
npm run build
echo "  ✅ Production built successfully in /dist."

# ─── Step 4: Install PM2 locally/globally if missing ─────────────────────────
echo ""
echo "[4/5] Checking PM2 static server support..."
if ! command -v pm2 &> /dev/null; then
    echo "  PM2 not found. Installing globally..."
    npm install -g pm2
    echo "  ✅ PM2 installed."
else
    echo "  ✅ PM2 already installed: $(pm2 --version)"
fi

# ─── Step 5: Start/Reload frontend via PM2 ──────────────────────────────────
echo ""
echo "[5/5] Starting / reloading frontend with PM2..."
if pm2 list | grep -q "frontend-app"; then
    echo "  Existing frontend process found — reloading (zero downtime)..."
    pm2 reload ecosystem.config.js
else
    echo "  No existing frontend process — starting fresh..."
    pm2 start ecosystem.config.js
fi

# Save PM2 process list
pm2 save

echo ""
echo "============================================="
echo "  ✅ Frontend Deploy complete!"
echo "     Served locally on port 5173"
echo "============================================="
echo ""
