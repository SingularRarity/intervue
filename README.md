# InterviewAI - AI-Powered Voice Interview Platform

> A multi-tenant AI interview platform built with **Rust (Axum)** backend and **React** frontend, powered by **Sarvam AI** for voice and **Anthropic Claude** for intelligence.

![Sarvam AI](https://assets.sarvam.ai/tr:f-auto/assets/brand/images/brand-img-09.png)

---

## Market Validation - Gurgaon Target Sectors

### Sector 45, Gurgaon
| Company | Industry | Size | Hiring Pain Point |
|---------|----------|------|-------------------|
| **Zomato** (near Sector 45) | Food Tech | 5000+ | High volume tech hiring, needs screening at scale |
| **PolicyBazaar** | InsurTech | 3000+ | Mass hiring for sales & tech roles |
| **Delhivery** | Logistics Tech | 5000+ | High attrition, constant hiring need |
| **Rivigo** | Logistics | 2000+ | Driver + tech hiring, language barriers |
| **Nearbuy** | E-commerce | 500+ | Lean team, needs efficient screening |
| **Lenskart** (Gurgaon ops) | Retail Tech | 2000+ | Rapid expansion, bulk hiring |
| **Urban Company** | Services Tech | 3000+ | Service partner + tech hiring |
| **Snapdeal** (Gurgaon HQ) | E-commerce | 1500+ | Cost-conscious, needs automation |
| **ShopClues** | E-commerce | 800+ | Lean hiring team |
| **Paytm** (Gurgaon office) | Fintech | 10000+ | Massive scale, needs screening tools |

### Sector 44, Gurgaon
| Company | Industry | Size | Hiring Pain Point |
|---------|----------|------|-------------------|
| **MakeMyTrip** | Travel Tech | 3000+ | Seasonal hiring spikes |
| **Goibibo** | Travel Tech | 1500+ | Same as above |
| **Ixigo** | Travel Tech | 800+ | Lean team, growth phase |
| **Yatra** | Travel Tech | 1200+ | Cost optimization focus |
| **EaseMyTrip** | Travel Tech | 600+ | Small HR team |
| **Oyo Rooms** (Gurgaon) | Hospitality Tech | 5000+ | Massive hiring across tiers |
| **Treebo** | Hospitality | 400+ | Budget constraints |
| **FabHotels** | Hospitality | 350+ | Needs efficient screening |

### Sector 30, Gurgaon
| Company | Industry | Size | Hiring Pain Point |
|---------|----------|------|-------------------|
| **Ola** (Gurgaon tech hub) | Mobility | 8000+ | High volume, multi-language |
| **Uber** (Gurgaon) | Mobility | 5000+ | Same as above |
| **Rapido** | Mobility | 2000+ | Rapid growth, lean HR |
| **Bounce** | Mobility | 800+ | Early stage, cost conscious |
| **Vogo** | Mobility | 600+ | Small team |
| **Dunzo** (Gurgaon) | Quick Commerce | 2500+ | High attrition in delivery |
| **Blinkit** (Gurgaon) | Quick Commerce | 3000+ | Same as above |
| **Zepto** (Gurgaon) | Quick Commerce | 2000+ | Hypergrowth hiring |
| **Swiggy** (Gurgaon ops) | Food Tech | 8000+ | Multi-city, multi-language |
| **BigBasket** (Gurgaon) | E-grocery | 4000+ | Bulk hiring for warehouses |

**Key Insight:** These companies spend ₹50K-₹2L per hire on recruitment. A tool that reduces screening time by 80% and costs ₹5K/month is a no-brainer for startups with lean HR teams.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│  Rust Backend   │────▶│   PostgreSQL    │
│   (Vite + TS)   │     │   (Axum + SQLx) │     │   (Multi-tenant)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │
         │              ┌────────┴────────┐
         │              │                 │
         ▼              ▼                 ▼
   WebSocket      Sarvam AI          Anthropic
   (Real-time)    (Voice STT/TTS)    Claude
                  (10+ Languages)    (Questions/Analysis)
```

---

## Features

### Multi-Tenant Architecture
- Each company is a **tenant** with isolated data
- Companies input their own **Claude API key** and **Sarvam API key**
- Zero API costs for the platform operator
- Complete data privacy between tenants

### AI Voice Interviews
- Natural voice conversation using **Sarvam AI**
- Speech-to-Text in **10+ Indian languages**: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu
- Text-to-Speech with natural Indian voices
- Real-time WebSocket communication

### Intelligent Interviewing
- **Claude 3.5 Sonnet** generates contextual questions
- Resume-aware question generation
- Dynamic follow-up based on candidate responses
- Multi-dimensional scoring: Technical, Communication, Problem-solving, Cultural Fit

### Interview Management
- Create reusable interview templates
- Add candidates with resume parsing
- Schedule or instant-start interviews
- Full transcript storage

### Analytics & Reporting
- Dashboard with key metrics
- Score distribution charts
- Skill assessment breakdowns
- Daily/weekly trend analysis

### Human-in-the-Loop
- Review AI-generated reports
- Override AI recommendations
- Add reviewer notes and ratings
- Collaborative hiring decisions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Rust, Axum, Tokio, SQLx |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI Voice | Sarvam AI API |
| AI Brain | Anthropic Claude 3.5 Sonnet |
| Charts | Recharts |
| State | Zustand |
| Query | TanStack Query |

---

## Quick Start

### Prerequisites
- Docker Desktop (includes Docker Compose v2)
- Node.js 20+ (for local frontend dev without Docker)
- Rust 1.75+ (for local backend dev without Docker)

### One-command startup (recommended)

The quickstart scripts handle environment files, wait for the database, and build all services.
They default to **local dev mode** — use `--prod` / `-Mode prod` for production.

**Linux / macOS (bash):**
```bash
./quickstart.sh           # local dev (default)
./quickstart.sh --prod    # production
```

**Windows (PowerShell):**
```powershell
.\quickstart.ps1          # local dev (default)
.\quickstart.ps1 -Mode prod   # production
```

| Setting | Local (`--local`) | Production (`--prod`) |
|---------|-------------------|-----------------------|
| `APP_ENV` | `development` | `production` |
| `RUST_LOG` | `debug` | _(not set)_ |
| `JWT_SECRET` | dev default | reads `$JWT_SECRET` env var |
| Compose files | `docker-compose.yml` + `docker-compose.local.yml` | `docker-compose.yml` only |
| DB/Redis ports | exposed on localhost | exposed on localhost |

> **Tip:** For production, set `JWT_SECRET` in your shell before running:
> ```bash
> export JWT_SECRET="<your-strong-secret>"
> .\quickstart.ps1 -Mode prod   # PowerShell: $env:JWT_SECRET = "..."
> ```

After startup, services are available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080
- **Health check:** http://localhost:8080/health

### Manual Docker Compose

```bash
# Local dev
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build -d

# Production
docker compose -f docker-compose.yml up --build -d
```

### Native Local Development (no Docker for app services)

Start only the infrastructure in Docker, then run the app natively:

```bash
docker compose up -d postgres redis
```

**Backend:**
```bash
cd backend
cargo run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Configuration

Each tenant must configure their own API keys in **Settings**:

1. **Claude API Key**: Get from [console.anthropic.com](https://console.anthropic.com/)
2. **Sarvam API Key**: Get from [dashboard.sarvam.ai](https://dashboard.sarvam.ai/)

The platform operator pays **zero** AI API costs - each tenant brings their own keys.

---

## Outreach Strategy - Bangalore, Hyderabad, Chennai

### Target Startup Hubs

**Bangalore (Koramangala, HSR, Indiranagar, Whitefield)**
- Early-stage startups (Seed-Series A) with 10-50 employees
- Companies hiring 5-20 people/month
- Focus on: SaaS, Fintech, HealthTech

**Hyderabad (HITEC City, Gachibowli, Madhapur)**
- Product companies and GCCs
- Companies with lean HR teams
- Focus on: EdTech, Enterprise SaaS

**Chennai (OMR, Guindy, Tidel Park)**
- Manufacturing + Tech hybrid companies
- Companies hiring in Tamil/English bilingual
- Focus on: AutoTech, SaaS, B2B platforms

### Pitch Deck Points
1. **"Reduce screening time from 2 hours to 15 minutes per candidate"**
2. **"Conduct interviews in candidate's native language"**
3. **"Pay only for what you use - bring your own API keys"**
4. **"No lock-in, no setup fees, start in 5 minutes"**

### Trial Offer
- **Free 14-day trial** with 50 interviews
- No credit card required
- Full feature access
- Dedicated onboarding support

---

## Database Schema

```sql
-- Core tables
tenants                    -- Multi-tenant isolation
interview_templates        -- Reusable interview configs
candidates                 -- Candidate profiles
interview_sessions         -- Interview instances
interview_messages         -- Transcript storage
session_feedback           -- Human reviews
```

See `backend/migrations/001_initial_schema.sql` for full schema.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@localhost:5432/ai_interview` |
| `JWT_SECRET` | JWT signing secret | Required |
| `PORT` | Server port | `8080` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `SARVAM_BASE_URL` | Sarvam API base URL | `https://api.sarvam.ai` |
| `CLAUDE_BASE_URL` | Claude API base URL | `https://api.anthropic.com` |

---

## Deployment

### Railway / Render (Easy)
1. Push to GitHub
2. Connect to Railway/Render
3. Add PostgreSQL and Redis addons
4. Set environment variables
5. Deploy

### AWS / GCP / Azure
1. Build Docker images
2. Push to container registry
3. Deploy to ECS/GKE/AKS
4. Configure load balancer
5. Set up RDS/Cloud SQL for PostgreSQL

### Self-Hosted (VPS)
```bash
# On your server
git clone <repo>
cd ai-interview-platform
docker-compose up -d
```

---

## License

MIT License - Free for commercial use.

---

## Support

For questions or support, reach out to:
- Email: support@interviewai.dev
- Discord: [Join our community]

Built with Rust, React, Sarvam AI, and Claude for the Indian startup ecosystem.
