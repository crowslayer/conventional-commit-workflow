#!/bin/bash

# Setup a repository in a dangerous state (merge in progress)

REPO_DIR="$(dirname "${BASH_SOURCE[0]}")/../test-repo-dangerous"

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

# Create a branch with conflicting changes
git checkout -b feature-branch
echo "feature change" > file.txt
git add file.txt
git commit -m "Feature commit"

# Go back to main and create conflicting change
git checkout main
echo "main change" > file.txt
git add file.txt
git commit -m "Main commit"

# Attempt merge (will conflict)
git merge feature-branch || true

echo "Dangerous state repository created at: $REPO_DIR"
echo "Repository is in merge conflict state"