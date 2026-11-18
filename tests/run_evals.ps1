# Conventional Commit Workflow - Eval Suite Runner
# Uses the real test harness

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
$harnessDir = Join-Path $scriptDir "harness"

Write-Host "=== Conventional Commit Workflow Eval Suite ===" -ForegroundColor Cyan
Write-Host "Using real test harness..." -ForegroundColor Yellow

# Check if harness is built
if (-not (Test-Path (Join-Path $harnessDir "dist"))) {
    Write-Host "Building test harness..." -ForegroundColor Gray
    Push-Location $harnessDir
    pnpm install
    pnpm run build
    Pop-Location
}

# Determine backend
$backend = $env:LLM_BACKEND
if (-not $backend) {
    $backend = "mock"
}
Write-Host "Backend: $backend" -ForegroundColor Gray

# Run the harness
Push-Location $harnessDir
node dist/index.js run --backend $backend --verbose
$exitCode = $LASTEXITCODE
Pop-Location

exit $exitCode