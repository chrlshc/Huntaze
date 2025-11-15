#!/bin/bash

# Script to start the dev server for integration tests

echo "🚀 Starting dev server for integration tests..."

# Check if server is already running
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ Server already running on http://localhost:3000"
  exit 0
fi

# Start the dev server in the background
echo "📦 Starting Next.js dev server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to be ready..."

# Wait for server to be ready (max 60 seconds)
for i in {1..60}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Server is ready on http://localhost:3000 (PID: $SERVER_PID)"
    echo $SERVER_PID > .test-server.pid
    exit 0
  fi
  sleep 1
  echo -n "."
done

echo ""
echo "❌ Server failed to start within 60 seconds"
kill $SERVER_PID 2>/dev/null
exit 1
