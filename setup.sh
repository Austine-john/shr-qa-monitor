#!/bin/bash
set -e

echo "=== SHR QA Monitor - Setup ==="

echo "[1/3] Installing root dependencies..."
npm install

echo "[2/3] Installing backend dependencies..."
cd backend && npm install && cd ..

echo "[3/3] Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "Setup complete. Run ./start.sh to launch both services."
