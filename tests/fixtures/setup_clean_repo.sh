#!/bin/bash

# Setup a clean test repository

# Use TEST_REPO_DIR if set, otherwise use default location
REPO_DIR="${TEST_REPO_DIR:-$(dirname "${BASH_SOURCE[0]}")/../test-repo-clean}"

# Clean up if exists
rm -rf "$REPO_DIR"
mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

# Initialize git repo
git init
git config user.email "test@example.com"
git config user.name "Test User"

# Create initial commit
echo "# Test Repo" > README.md
git add README.md
git commit -m "Initial commit"

# Create some test files
mkdir -p src
echo "console.log('hello');" > src/index.js
echo "module.exports = {};" > src/utils.js

echo "Clean test repository created at: $REPO_DIR"