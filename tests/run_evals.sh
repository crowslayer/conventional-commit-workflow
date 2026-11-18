#!/bin/bash

# Conventional Commit Workflow - Eval Suite Runner
# Uses the real test harness

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_DIR="$SCRIPT_DIR/harness"

echo "=== Conventional Commit Workflow Eval Suite ==="
echo "Using real test harness..."

# Check if harness is built
if [ ! -d "$HARNESS_DIR/dist" ]; then
  echo "Building test harness..."
  cd "$HARNESS_DIR"
  pnpm install
  pnpm run build
  cd "$SCRIPT_DIR"
fi

# Determine backend
BACKEND="${LLM_BACKEND:-mock}"
echo "Backend: $BACKEND"

# Run the harness
cd "$HARNESS_DIR"
node dist/index.js run --backend "$BACKEND" --verbose

# Exit code is propagated from the harness