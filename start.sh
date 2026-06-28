#!/bin/bash
set -e

echo "=== SHR QA Monitor ==="

# Auto-install deps if missing
if [ ! -d "backend/node_modules" ]; then
  echo "[setup] Installing backend dependencies..."
  npm install --prefix backend
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "[setup] Installing frontend dependencies..."
  npm install --prefix frontend
fi

echo ""
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo "  Webhook:  POST http://localhost:3001/api/v1/callback"
echo ""

npx --yes concurrently \
  -n "backend,frontend" \
  -c "blue,green" \
  "npm start --prefix backend" \
  "npm run dev --prefix frontend"
