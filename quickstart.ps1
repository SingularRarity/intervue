#Requires -Version 5.1
# InterviewAI Quick Start Script for PowerShell
# Usage: .\quickstart.ps1 [-Mode local|prod]
#   local  Start with local dev settings (default)
#   prod   Start with production settings
param(
    [ValidateSet("local", "prod")]
    [string]$Mode = "local"
)

$ErrorActionPreference = "Stop"

Write-Host "InterviewAI - Quick Start"
Write-Host "========================="
Write-Host "Mode: $Mode"
Write-Host ""

# ── Prerequisites ──────────────────────────────────────────────────────────────
Write-Host "Checking prerequisites..."

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker not found. Please install Docker Desktop first."
    exit 1
}

# Prefer 'docker compose' (v2), fall back to 'docker-compose' (v1)
$DC = $null
$dcArgs = @()

$dcV2Test = docker compose version 2>&1
if ($LASTEXITCODE -eq 0) {
    $DC = "docker"
    $dcArgs = @("compose")
} elseif (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $DC = "docker-compose"
    $dcArgs = @()
} else {
    Write-Error "Docker Compose not found. Please install Docker Desktop (includes Compose v2)."
    exit 1
}

$dcLabel = if ($dcArgs.Count -gt 0) { "$DC $($dcArgs -join ' ')" } else { $DC }
Write-Host "OK: Docker and Docker Compose found ($dcLabel)"
Write-Host ""

# ── Compose file selection ─────────────────────────────────────────────────────
if ($Mode -eq "local") {
    $composeFiles = @("-f", "docker-compose.yml", "-f", "docker-compose.local.yml")
    Write-Host "Using local development configuration."
    Write-Host "  - APP_ENV=development"
    Write-Host "  - RUST_LOG=debug"
    Write-Host "  - JWT_SECRET uses insecure dev default"
} else {
    $composeFiles = @("-f", "docker-compose.yml")
    Write-Host "Using production configuration."

    if (-not $env:JWT_SECRET) {
        Write-Host ""
        Write-Warning "JWT_SECRET is not set. Using insecure default."
        Write-Host "  Set it with: `$env:JWT_SECRET = '<your-secret>'"
        Write-Host ""
    }
}

Write-Host ""

# Helper: invoke docker (compose) with the right prefix + file args
function Invoke-DC {
    param([string[]]$ExtraArgs)
    $allArgs = $dcArgs + $composeFiles + $ExtraArgs
    & $DC @allArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $DC $($allArgs -join ' ')"
    }
}

# ── Environment files ──────────────────────────────────────────────────────────
if (-not (Test-Path "backend\.env")) {
    Write-Host "Creating backend\.env from example..."
    Copy-Item "backend\.env.example" "backend\.env"

    if ($Mode -eq "local") {
        # Patch .env for local docker networking
        $env_content = Get-Content "backend\.env" -Raw
        $env_content = $env_content -replace "(?m)^DATABASE_URL=.*", "DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_interview"
        $env_content = $env_content -replace "(?m)^REDIS_URL=.*",    "REDIS_URL=redis://localhost:6379"
        $env_content = $env_content -replace "(?m)^APP_ENV=.*",      "APP_ENV=development"
        Set-Content "backend\.env" $env_content -Encoding utf8
    } else {
        Write-Warning "Edit backend\.env before deploying to production."
    }
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "Creating frontend\.env from example..."
    Copy-Item "frontend\.env.example" "frontend\.env"
}

# ── Start infrastructure ───────────────────────────────────────────────────────
Write-Host "Starting PostgreSQL and Redis..."
Invoke-DC @("up", "-d", "postgres", "redis")

Write-Host "Waiting for PostgreSQL to be ready..."
$maxWait = 60
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $ready = & $DC @($dcArgs + $composeFiles + @("exec", "-T", "postgres", "pg_isready", "-U", "postgres")) 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Write-Host "  PostgreSQL not ready yet, retrying..."
    Start-Sleep -Seconds 2
    $elapsed += 2
}

if ($elapsed -ge $maxWait) {
    Write-Error "Timed out waiting for PostgreSQL."
    exit 1
}

Write-Host "OK: PostgreSQL is ready"
Write-Host ""

# ── Build and start all services ───────────────────────────────────────────────
Write-Host "Building and starting all services..."
Invoke-DC @("up", "--build", "-d")

Write-Host ""
Write-Host "InterviewAI is starting up!"
Write-Host ""
Write-Host "Services:"
Write-Host "  Frontend:     http://localhost:3000"
Write-Host "  Backend API:  http://localhost:8080"
Write-Host "  Health check: http://localhost:8080/health"

if ($Mode -eq "local") {
    Write-Host ""
    Write-Host "Local dev extras:"
    Write-Host "  PostgreSQL: localhost:5432  (postgres/postgres)"
    Write-Host "  Redis:      localhost:6379"
}

Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Visit http://localhost:3000"
Write-Host "  2. Register your company"
Write-Host "  3. Add your Sarvam AI and Claude API keys in Settings"
Write-Host "  4. Create your first interview template"
Write-Host "  5. Add a candidate and start interviewing!"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  Logs: $dcLabel $($composeFiles -join ' ') logs -f"
Write-Host "  Stop: $dcLabel $($composeFiles -join ' ') down"
if ($Mode -eq "prod") {
    Write-Host "  Stop (remove volumes): $dcLabel $($composeFiles -join ' ') down -v"
}
