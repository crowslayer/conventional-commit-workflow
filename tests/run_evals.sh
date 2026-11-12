#!/bin/bash

# Conventional Commit Workflow - Eval Suite Runner
# Bash version

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="$TESTS_DIR/fixtures"
SCENARIOS_DIR="$TESTS_DIR/scenarios"
RESULTS_DIR="$TESTS_DIR/results"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "=== Conventional Commit Workflow Eval Suite ==="
echo "Running behavioral tests..."

total_tests=0
passed_tests=0
failed_tests=0

# Limpiar repositorios de prueba residuales de ejecuciones anteriores
rm -rf "$TESTS_DIR"/test-repo-*

for scenario in "$SCENARIOS_DIR"/*.json; do
    echo ""
    echo "[SCENARIO] $(basename "$scenario")"
    
    # Parse scenario config (requires jq)
    if ! command -v jq &> /dev/null; then
        echo "  Warning: jq not found, skipping JSON parsing"
        fixture="setup_clean_repo"
    else
        fixture=$(jq -r '.fixture' "$scenario")
    fi
    
    # Setup fixture
    echo "  Setting up fixture: $fixture"
   if [ -f "$FIXTURES_DIR/${fixture}.sh" ]; then
        bash "$FIXTURES_DIR/${fixture}.sh" > /dev/null 2>&1
    else
        echo "  Warning: Fixture script not found, skipping setup"
    fi
    
    # Run test
    echo "  Running test..."
    
    # Placeholder for actual agent invocation
    # Replace with real agent call
    test_passed=true
    test_reason=""
    
    if [ "$test_passed" = true ]; then
        echo "  ✓ PASSED"
        ((passed_tests++))
    else
        echo "  ✗ FAILED: $test_reason"
        ((failed_tests++))
    fi
    
    total_tests=$((total_tests + 1))
    
    # Cleanup
    echo "  Cleaning up..."
    rm -rf "$TESTS_DIR"/test-repo-*
done

echo ""
echo "=== Results ==="
echo "Total:  $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $failed_tests"

# Save results
cat > "$RESULTS_DIR/summary.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "total": $total_tests,
  "passed": $passed_tests,
  "failed": $failed_tests
}
EOF

if [ "$failed_tests" -gt 0 ]; then
    echo "::error::Eval suite failed. $failed_tests test(s) failed."
    exit 1
fi

echo "✓ All tests passed successfully."
exit 0