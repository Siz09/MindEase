#!/bin/bash

# CI installation helper script
# Sets CYPRESS_INSTALL_BINARY=0 to skip binary download during npm install
# Usage: ./scripts/ci-install.sh [npm-command]
# Example: ./scripts/ci-install.sh ci
# Example: ./scripts/ci-install.sh install

set -e

export CYPRESS_INSTALL_BINARY=0

NPM_COMMAND="${1:-ci}"

echo "🔧 Setting CYPRESS_INSTALL_BINARY=0 to skip Cypress binary download"
echo "📦 Running: npm ${NPM_COMMAND}"

npm "${NPM_COMMAND}"

echo "✅ Installation complete"
echo "   To install Cypress binary later, run: npx cypress install"
