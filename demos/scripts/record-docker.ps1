<#
.SYNOPSIS
    Record Intervue demos inside Docker.

.PARAMETER Demo
    Which demo to run: free, individual, startup, or all (default: all)

.PARAMETER SkipAudio
    Skip TTS audio generation (use if already generated)

.PARAMETER SkipSetup
    Skip account creation (use if accounts already exist)

.EXAMPLE
    .\scripts\record-docker.ps1
    .\scripts\record-docker.ps1 -Demo free
    .\scripts\record-docker.ps1 -Demo startup -SkipAudio -SkipSetup
#>

param(
    [string]$Demo = "all",
    [switch]$SkipAudio,
    [switch]$SkipSetup
)

$ErrorActionPreference = "Stop"
$DemosDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Root = Split-Path -Parent $DemosDir

Set-Location $Root

Write-Host ""
Write-Host "=== Intervue Demo Recorder (Docker) ===" -ForegroundColor Cyan
Write-Host ""

# Load demos/.env for credential passthrough
$EnvFile = Join-Path $DemosDir ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
    Write-Host "  Loaded .env" -ForegroundColor Gray
}

# Step 1: Generate audio inside Docker
if (-not $SkipAudio) {
    Write-Host ""
    Write-Host "Step 1/4 - Building recorder container..." -ForegroundColor Yellow
    docker compose -f docker-compose.demo.yml build demo-recorder
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }

    Write-Host ""
    Write-Host "Step 1/4 - Generating TTS audio inside Docker..." -ForegroundColor Yellow
    docker compose -f docker-compose.demo.yml run --rm demo-recorder node scripts/generate-audio.mjs
    if ($LASTEXITCODE -ne 0) { throw "Audio generation failed" }
} else {
    Write-Host "Step 1/4 - Skipping audio generation" -ForegroundColor Gray
}

# Step 2: Setup accounts (runs against localhost API)
if (-not $SkipSetup) {
    Write-Host ""
    Write-Host "Step 2/4 - Setting up demo accounts..." -ForegroundColor Yellow
    Set-Location $DemosDir
    node scripts/setup-accounts.mjs
    Set-Location $Root
} else {
    Write-Host "Step 2/4 - Skipping account setup" -ForegroundColor Gray
}

# Step 3: Ensure image is built (no-op if already built above)
if ($SkipAudio) {
    Write-Host ""
    Write-Host "Step 3/4 - Building recorder container..." -ForegroundColor Yellow
    docker compose -f docker-compose.demo.yml build demo-recorder
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
}

# Step 4: Run the recorder
Write-Host ""
Write-Host "Step 4/4 - Recording demos ($Demo)..." -ForegroundColor Yellow

if ($Demo -eq "free") {
    docker compose -f docker-compose.demo.yml run --rm demo-recorder npx playwright test --project=demo-free
} elseif ($Demo -eq "individual") {
    docker compose -f docker-compose.demo.yml run --rm demo-recorder npx playwright test --project=demo-individual
} elseif ($Demo -eq "startup") {
    docker compose -f docker-compose.demo.yml run --rm demo-recorder npx playwright test --project=demo-startup
} else {
    docker compose -f docker-compose.demo.yml run --rm demo-recorder npx playwright test --project=demo-free --project=demo-individual --project=demo-startup
}

if ($LASTEXITCODE -ne 0) { throw "Playwright recording failed" }

# Collect final files
Write-Host ""
Write-Host "Collecting final videos..." -ForegroundColor Yellow
Set-Location $DemosDir
node scripts/postprocess.mjs $Demo
Set-Location $Root

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "  Final videos: demos/output/final/" -ForegroundColor Green
Write-Host ""
