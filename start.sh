#!/bin/bash
set -e

echo "=== SHR QA Monitor - Starting ==="
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo "Webhook:  POST http://localhost:3001/api/v1/callback"
echo ""

npx concurrently \
  -n "backend,frontend" \
  -c "blue,green" \
  "cd backend && npm start" \
  "cd frontend && npm run dev"
