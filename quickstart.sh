#!/bin/bash
# InterviewAI Quick Start Script
# Usage: ./quickstart.sh [--local|--prod]
#   --local  Start with local dev settings (default)
#   --prod   Start with production settings

set -e

MODE="local"
for arg in "$@"; do
  case $arg in
    --prod) MODE="prod" ;;
    --local) MODE="local" ;;
  esac
done

echo "InterviewAI - Quick Start"
echo "========================="
echo "Mode: $MODE"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Please install Docker first."
    exit 1
fi

# Support both 'docker compose' (v2) and 'docker-compose' (v1)
if docker compose version &> /dev/null 2>&1; then
    DC="docker compose"
elif command -v docker-compose &> /dev/null; then
    DC="docker-compose"
else
    echo "ERROR: Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "OK: Docker and Docker Compose found ($DC)"
echo ""

# Build compose file args
if [ "$MODE" = "local" ]; then
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.local.yml"
    echo "Using local development configuration."
    echo "  - APP_ENV=development"
    echo "  - RUST_LOG=debug"
    echo "  - JWT_SECRET uses insecure dev default"
else
    COMPOSE_FILES="-f docker-compose.yml"
    echo "Using production configuration."

    if [ -z "$JWT_SECRET" ]; then
        echo ""
        echo "WARNING: JWT_SECRET is not set. Using insecure default."
        echo "  Set it with: export JWT_SECRET=<your-secret>"
        echo ""
    fi
fi

echo ""

# Copy backend .env if missing
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env from example..."
    cp backend/.env.example backend/.env

    if [ "$MODE" = "local" ]; then
        # local: point at docker-hosted postgres/redis
        sed -i.bak \
            -e 's|DATABASE_URL=.*|DATABASE_URL=postgres://postgres:postgres@localhost:5432/ai_interview|' \
            -e 's|REDIS_URL=.*|REDIS_URL=redis://localhost:6379|' \
            -e 's|APP_ENV=.*|APP_ENV=development|' \
            backend/.env && rm -f backend/.env.bak
    else
        echo "WARNING: Edit backend/.env before deploying to production."
    fi
fi

# Copy frontend .env if missing
if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env from example..."
    cp frontend/.env.example frontend/.env
fi

# Start infrastructure first and wait for it
echo "Starting PostgreSQL and Redis..."
$DC $COMPOSE_FILES up -d postgres redis

echo "Waiting for PostgreSQL to be ready..."
until $DC $COMPOSE_FILES exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "  PostgreSQL not ready yet, retrying..."
    sleep 2
done
echo "OK: PostgreSQL is ready"
echo ""

# Build and start all services
echo "Building and starting all services..."
$DC $COMPOSE_FILES up --build -d

echo ""
echo "InterviewAI is starting up!"
echo ""
echo "Services:"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8080"
echo "  Health check: http://localhost:8080/health"
if [ "$MODE" = "local" ]; then
echo ""
echo "Local dev extras:"
echo "  PostgreSQL: localhost:5432  (postgres/postgres)"
echo "  Redis:      localhost:6379"
fi
echo ""
echo "Next steps:"
echo "  1. Visit http://localhost:3000"
echo "  2. Register your company"
echo "  3. Add your Sarvam AI and Claude API keys in Settings"
echo "  4. Create your first interview template"
echo "  5. Add a candidate and start interviewing!"
echo ""
echo "Useful commands:"
echo "  Logs:  $DC $COMPOSE_FILES logs -f"
echo "  Stop:  $DC $COMPOSE_FILES down"
if [ "$MODE" = "prod" ]; then
echo "  Stop (remove volumes): $DC $COMPOSE_FILES down -v"
fi
