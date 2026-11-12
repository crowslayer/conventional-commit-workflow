#!/bin/bash

# Setup a monorepo test repository

REPO_DIR="$(dirname "${BASH_SOURCE[0]}")/../test-repo-monorepo"

# Clean up if exists
rm -rf "$REPO_DIR"
mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

# Initialize git repo
git init
git config user.email "test@example.com"
git config user.name "Test User"

# Create monorepo structure
mkdir -p packages/api/src
mkdir -p packages/web/src
mkdir -p packages/shared/src

# Create package.json files
cat > package.json <<EOF
{
  "name": "monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
EOF

cat > packages/api/package.json <<EOF
{
  "name": "@monorepo/api",
  "version": "1.0.0"
}
EOF

cat > packages/web/package.json <<EOF
{
  "name": "@monorepo/web",
  "version": "1.0.0"
}
EOF

# Create source files
echo "export const api = () => 'api';" > packages/api/src/index.js
echo "export const web = () => 'web';" > packages/web/src/index.js
echo "export const shared = () => 'shared';" > packages/shared/src/index.js

# Initial commit
git add .
git commit -m "Initial monorepo setup"

echo "Monorepo test repository created at: $REPO_DIR"