#!/bin/bash

set -e

echo "Packaging VS Code extension..."

# Build the extension
cd packages/vscode
npm run build

# Package with vsce
echo "Creating VSIX package..."
npx vsce package

echo "[SUCCESS] VS Code extension package created!"
echo ""
echo "To install the extension:"
echo "  code --install-extension packages/vscode/one-line-vscode-1.0.0.vsix"
echo ""
echo "To publish to marketplace:"
echo "  cd packages/vscode"
echo "  npx vsce login <publisher>"
echo "  npx vsce publish"
