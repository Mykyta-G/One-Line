#!/bin/bash

set -e

echo "Building One-Line project..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build core library
echo "Building @one-line/core..."
cd packages/core
npm install
npm run build
cd ../..

# Build CLI
echo "Building CLI..."
cd packages/cli
npm install
npm run build
chmod +x dist/index.js
cd ../..

echo "[SUCCESS] Build completed successfully!"
echo ""
echo "To install CLI globally: cd packages/cli && npm link"
