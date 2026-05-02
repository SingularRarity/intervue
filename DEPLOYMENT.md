# Deployment Guide - InterviewAI Platform

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Cloud Deployment](#cloud-deployment)
5. [Production Checklist](#production-checklist)
6. [Monitoring & Logging](#monitoring--logging)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Docker Engine 24.0+
- Docker Compose 2.20+
- Git 2.40+
- Node.js 20+ (for frontend development)
- Rust 1.75+ (for backend development)

### Required Accounts
- **Sarvam AI**: https://dashboard.sarvam.ai/ (for voice API)
- **Anthropic Claude**: https://console.anthropic.com/ (for AI brain)
- **Cloud Provider**: AWS/GCP/Azure account (for deployment)

---

## Local Development Setup

### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd ai-interview-platform

# Copy environment files
cp backend/.env.example backend/.env
```

### Step 2: Start Infrastructure
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
docker-compose exec postgres pg_isready -U postgres
```

### Step 3: Setup Backend
```bash
cd backend

# Install dependencies
cargo build

# Run database migrations
# (Migrations run automatically on first start)

# Start backend server
cargo run
```
Backend will be available at `http://localhost:8080`

### Step 4: Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be available at `http://localhost:3000`

### Step 5: Verify Setup
```bash
# Health check
curl http://localhost:8080/health

# Should return:
# {"status":"healthy","version":"0.1.0","timestamp":"2026-05-02T..."}
```

---

## Docker Deployment

### Full Stack Deployment
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      APP_ENV: production
      RUST_LOG: info
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app_network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    depends_on:
      - backend
    networks:
      - app_network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - app_network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  app_network:
    driver: bridge
```

---

## Cloud Deployment

### AWS Deployment (ECS + RDS + ElastiCache)

#### 1. Infrastructure Setup
```bash
# Install AWS CLI and configure
aws configure

# Create ECR repositories
aws ecr create-repository --repository-name interviewai-backend
aws ecr create-repository --repository-name interviewai-frontend

# Build and push images
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker build -t interviewai-backend ./backend
docker tag interviewai-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/interviewai-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/interviewai-backend:latest

docker build -t interviewai-frontend ./frontend
docker tag interviewai-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/interviewai-frontend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/interviewai-frontend:latest
```

#### 2. RDS PostgreSQL
```bash
# Create RDS instance
aws rds create-db-instance   --db-instance-identifier interviewai-db   --db-instance-class db.t3.micro   --engine postgres   --master-username admin   --master-user-password <strong-password>   --allocated-storage 20   --vpc-security-group-ids <sg-id>   --db-name ai_interview
```

#### 3. ElastiCache Redis
```bash
aws elasticache create-cache-cluster   --cache-cluster-id interviewai-redis   --engine redis   --cache-node-type cache.t3.micro   --num-cache-nodes 1
```

#### 4. ECS Service
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name interviewai-cluster

# Create task definitions and services
# (Use AWS Console or Terraform for complete setup)
```

### Google Cloud Platform (Cloud Run + Cloud SQL + Memorystore)

```bash
# Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com

# Create Cloud SQL instance
gcloud sql instances create interviewai-db   --database-version=POSTGRES_16   --tier=db-f1-micro   --region=asia-south1   --storage-size=20GB

# Create Redis instance
gcloud redis instances create interviewai-redis   --tier=basic   --size=1   --region=asia-south1   --redis-version=redis_7_0

# Deploy backend to Cloud Run
gcloud run deploy interviewai-backend   --source ./backend   --region=asia-south1   --allow-unauthenticated   --set-env-vars="DATABASE_URL=...,JWT_SECRET=...,REDIS_URL=..."

# Deploy frontend to Cloud Run
gcloud run deploy interviewai-frontend   --source ./frontend   --region=asia-south1   --allow-unauthenticated
```

### Railway (Easiest for Startups)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL and Redis plugins
railway add --database postgres
railway add --database redis

# Deploy backend
railway up --service backend

# Deploy frontend
railway up --service frontend

# Add custom domain
railway domain
```

---

## Production Checklist

### Security
- [ ] Change default JWT_SECRET to 256-bit random string
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS for production domain only
- [ ] Set up rate limiting (100 req/min per IP)
- [ ] Enable PostgreSQL SSL connections
- [ ] Rotate API keys regularly
- [ ] Enable audit logging
- [ ] Set up WAF (Cloudflare/AWS WAF)

### Performance
- [ ] Enable PostgreSQL connection pooling (PgBouncer)
- [ ] Configure Redis for session caching
- [ ] Set up CDN for static assets
- [ ] Enable Gzip compression
- [ ] Configure database indexes
- [ ] Set up read replicas if needed

### Monitoring
- [ ] Set up application logging (structured JSON)
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring (UptimeRobot/Pingdom)
- [ ] Configure alerts for:
  - CPU > 80%
  - Memory > 85%
  - Database connections > 80%
  - Error rate > 1%
  - API response time > 2s

### Backup
- [ ] Automated PostgreSQL backups (daily)
- [ ] Point-in-time recovery enabled
- [ ] Test restore procedure monthly
- [ ] Backup retention: 30 days

### Scaling
- [ ] Horizontal scaling configured (3+ backend instances)
- [ ] Load balancer configured
- [ ] Auto-scaling rules set
- [ ] Database read replicas for analytics queries

---

## Monitoring & Logging

### Structured Logging (Backend)
```rust
// In Rust backend, use tracing with JSON format
tracing_subscriber::fmt()
    .json()
    .with_env_filter("info")
    .init();
```

### Metrics to Track
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | < 200ms | > 1s |
| WebSocket Connections | < 10,000 | > 8,000 |
| Database Query Time | < 50ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| CPU Usage | < 60% | > 80% |
| Memory Usage | < 70% | > 85% |

### Health Check Endpoint
```bash
curl https://your-domain.com/health

# Expected response:
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2026-05-02T12:00:00Z",
  "database": "connected",
  "redis": "connected"
}
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Verify connection string format
# postgres://USER:PASSWORD@HOST:PORT/DATABASE
```

#### 2. WebSocket Connection Fails
```bash
# Check if WebSocket upgrade is allowed
# Nginx config must include:
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";

# Verify port is open
nc -zv localhost 8080
```

#### 3. Sarvam API Errors
```bash
# Verify API key is set
curl -H "api-subscription-key: YOUR_KEY"   https://api.sarvam.ai/health

# Check rate limits
# Free tier: 100 requests/day
# Pro tier: 10,000 requests/day
```

#### 4. Claude API Errors
```bash
# Verify API key
curl -H "x-api-key: YOUR_KEY"   -H "anthropic-version: 2023-06-01"   https://api.anthropic.com/v1/models

# Check token usage
# Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens
```

#### 5. Frontend Build Fails
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install

# Check for TypeScript errors
npm run build
```

### Performance Tuning

#### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_sessions_tenant_status 
  ON interview_sessions(tenant_id, status);

CREATE INDEX CONCURRENTLY idx_candidates_tenant_email 
  ON candidates(tenant_id, email);

-- Analyze tables
ANALYZE interview_sessions;
ANALYZE candidates;
```

#### Rust Backend Optimization
```toml
# Cargo.toml - Release optimizations
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"
```

---

## Cost Estimates

### Self-Hosted (VPS)
| Component | Provider | Monthly Cost |
|-----------|----------|-------------|
| VPS (4 vCPU, 8GB RAM) | DigitalOcean/AWS Lightsail | ₹2,500-4,000 |
| PostgreSQL | Self-managed | ₹0 (included) |
| Redis | Self-managed | ₹0 (included) |
| Domain + SSL | Cloudflare/Namecheap | ₹500-1,000 |
| **Total** | | **₹3,000-5,000** |

### Managed Cloud
| Component | Provider | Monthly Cost |
|-----------|----------|-------------|
| Backend (2 instances) | AWS ECS/GCP Cloud Run | ₹5,000-8,000 |
| PostgreSQL (RDS/Cloud SQL) | AWS/GCP | ₹3,000-5,000 |
| Redis (ElastiCache/Memorystore) | AWS/GCP | ₹2,000-3,000 |
| Load Balancer | AWS ALB/GCP LB | ₹2,000-3,000 |
| **Total** | | **₹12,000-19,000** |

### Per-Interview API Costs
| Service | Cost per Interview |
|---------|-------------------|
| Sarvam STT (30 min) | ₹3-5 |
| Sarvam TTS (30 min) | ₹3-5 |
| Claude 3.5 (full interview) | ₹8-15 |
| **Total per interview** | **₹14-25** |

---

## Support & Resources

- **Documentation**: https://docs.interviewai.dev
- **API Reference**: https://api.interviewai.dev/docs
- **Discord Community**: https://discord.gg/interviewai
- **Email**: support@interviewai.dev

---

**Last Updated**: May 2026
**Version**: 1.0.0
