#!/bin/bash

set -e

echo "Packaging CLI for distribution..."

# Build the CLI
cd packages/cli
npm run build

# Create a tarball for npm
echo "Creating npm package..."
npm pack

echo "[SUCCESS] CLI package created!"
echo ""
echo "To install globally from tarball:"
echo "  npm install -g one-line-cli-1.0.0.tgz"
echo ""
echo "To publish to npm:"
echo "  cd packages/cli"
echo "  npm login"
echo "  npm publish"
