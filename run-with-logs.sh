#!/bin/bash
# Run both frontend and backend with error logging

# Install concurrently if not already installed
if ! npm list -g concurrently > /dev/null 2>&1; then
  echo "Installing concurrently..."
  npm install -g concurrently
fi

# Create log directory if it doesn't exist
mkdir -p logs

# Run both services and log output
concurrently \
  "npm run dev 2>&1 | tee logs/frontend.log" \
  "npm start 2>&1 | tee logs/backend.log"