#!/bin/bash
# =============================================================================
# deploy.sh — EC2 Deployment Script for Hackathon Tracker Backend
#
# Run this on your EC2 instance after SSH-ing in:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================================

set -e  # Exit immediately on any error

echo ""
echo "============================================="
echo "  Hackathon Tracker — EC2 Backend Deploy"
echo "============================================="
echo ""

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$APP_DIR/logs"

# ─── Step 1: Pull latest code ─────────────────────────────────────────────────
echo "[1/6] Pulling latest code from Git..."
git pull origin main
echo "  ✅ Code updated."

# ─── Step 2: Install production-only dependencies ─────────────────────────────
echo ""
echo "[2/6] Installing production dependencies (npm build)..."
npm ci --omit=dev
echo "  ✅ Dependencies installed (dev packages excluded)."

# ─── Step 3: Create logs directory ────────────────────────────────────────────
echo ""
echo "[3/6] Ensuring logs directory exists..."
mkdir -p "$LOG_DIR"
echo "  ✅ Logs directory: $LOG_DIR"

# ─── Step 4: Run health check ─────────────────────────────────────────────────
echo ""
echo "[4/6] Running health check..."
node scripts/healthCheck.js
echo "  ✅ Health check passed."

# ─── Step 5: Install PM2 globally if missing ──────────────────────────────────
echo ""
echo "[5/6] Checking PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "  PM2 not found. Installing globally..."
    npm install -g pm2
    echo "  ✅ PM2 installed."
else
    echo "  ✅ PM2 already installed: $(pm2 --version)"
fi

# ─── Step 6: Start/Reload backend via PM2 ────────────────────────────────────
echo ""
echo "[6/6] Starting / reloading backend with PM2..."
if pm2 list | grep -q "hackathon-backend"; then
    echo "  Existing process found — reloading (zero downtime)..."
    pm2 reload ecosystem.config.js --env production
else
    echo "  No existing process — starting fresh..."
    pm2 start ecosystem.config.js --env production
fi

# Save PM2 process list so it survives reboots
pm2 save

echo ""
echo "============================================="
echo "  ✅ Deploy complete!"
echo "     Backend running on port ${PORT:-5000}"
echo "     Logs: pm2 logs hackathon-backend"
echo "     Status: pm2 status"
echo "============================================="
echo ""

# ─── Optional: Setup PM2 to auto-start on system boot ─────────────────────────
echo "TIP: To make the server survive EC2 reboots, run once:"
echo "     pm2 startup"
echo "     (then run the command it prints)"
echo ""
