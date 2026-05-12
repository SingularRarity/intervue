<#
.SYNOPSIS
    Record Intervue demos inside Docker.

.DESCRIPTION
    Builds the demo recorder container, optionally generates audio,
    sets up demo accounts, and runs the specified demos.

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
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DemosDir = Join-Path $Root "demos"

Set-Location $Root

Write-Host ""
Write-Host "=== Intervue Demo Recorder (Docker) ===" -ForegroundColor Cyan
Write-Host ""

# Load demos/.env for credential passthrough
$EnvFile = Join-Path $DemosDir ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -contains "=") {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $val = $parts[1].Trim()
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
    Write-Host "  Loaded .env from demos/.env" -ForegroundColor Gray
}

# Step 1: Generate audio on the host (needs internet, uses msedge-tts)
if (-not $SkipAudio) {
    Write-Host ""
    Write-Host "Step 1/4 — Generating TTS audio..." -ForegroundColor Yellow
    Write-Host "  (Run with -SkipAudio to skip if already generated)"
    Set-Location $DemosDir
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing Node deps..."
        npm install
    }
    node scripts/generate-audio.mjs
    Set-Location $Root
} else {
    Write-Host "Step 1/4 — Skipping audio generation (-SkipAudio)" -ForegroundColor Gray
}

# Step 2: Setup accounts (runs against localhost API)
if (-not $SkipSetup) {
    Write-Host ""
    Write-Host "Step 2/4 — Setting up demo accounts..." -ForegroundColor Yellow
    Set-Location $DemosDir
    node scripts/setup-accounts.mjs
    Set-Location $Root
} else {
    Write-Host "Step 2/4 — Skipping account setup (-SkipSetup)" -ForegroundColor Gray
}

# Step 3: Build Docker image
Write-Host ""
Write-Host "Step 3/4 — Building recorder container..." -ForegroundColor Yellow
docker compose -f docker-compose.demo.yml build demo-recorder
if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }

# Step 4: Run the recorder
Write-Host ""
Write-Host "Step 4/4 — Recording demos ($Demo)..." -ForegroundColor Yellow
Write-Host "  Videos will appear in demos/output/recordings/"

$Projects = switch ($Demo) {
    "free"       { "--project=demo-free" }
    "individual" { "--project=demo-individual" }
    "startup"    { "--project=demo-startup" }
    default      { "--project=demo-free", "--project=demo-individual", "--project=demo-startup" }
}

docker compose -f docker-compose.demo.yml run --rm demo-recorder npx playwright test @Projects
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
