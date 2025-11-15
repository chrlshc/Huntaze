#!/bin/bash

# Script to stop the test server

echo "🛑 Stopping test server..."

if [ -f .test-server.pid ]; then
  PID=$(cat .test-server.pid)
  if ps -p $PID > /dev/null 2>&1; then
    echo "Killing server process $PID..."
    kill $PID
    sleep 2
    
    # Force kill if still running
    if ps -p $PID > /dev/null 2>&1; then
      echo "Force killing server process $PID..."
      kill -9 $PID
    fi
    
    echo "✅ Server stopped"
  else
    echo "⚠️  Server process $PID not found"
  fi
  rm .test-server.pid
else
  echo "⚠️  No .test-server.pid file found"
  
  # Try to find and kill any running Next.js dev server
  pkill -f "next dev" && echo "✅ Killed Next.js dev server" || echo "⚠️  No Next.js dev server found"
fi
