# Changelog

All notable changes to InterviewAI are documented here.

---

## [Unreleased] — Build & Infrastructure Fixes (2026-05-03)

### Fixed
- **Rust image** bumped from 1.75 → 1.88 to satisfy `edition2024` dependencies (`cpufeatures`, `home`, `time`)
- **Docker frontend** switched from `npm ci` to `npm install` (no lock file in repo)
- **Docker backend** migrations folder now copied into builder stage so `sqlx::migrate!()` compiles
- **TypeScript** `noUnusedLocals` / `noUnusedParameters` relaxed; `vite-env.d.ts` added for `ImportMeta.env`
- **`SessionResultsPage`** literal newline in `.split('...')` replaced with `\n\n` escape
- **Rust — 29 compile errors** resolved:
  - `SessionSummary` missing `#[derive(sqlx::FromRow)]`
  - `argon2` password verify called with `&str` instead of `&[u8]`
  - `validator::Validate` trait not in scope in route files
  - `sqlx::query!` macros replaced with runtime queries in 8 new route files (no DB at compile time)
  - Unused imports removed across services and websocket handler
- **`current_role`** renamed to `current_position` in migration SQL and all Rust/query code (reserved PostgreSQL keyword)

---

## [Unreleased] — Q4 2026 Features

### Added

#### White-label / Custom Branding
- Tenants can configure logo URL, primary color, display name, custom domain, and support email via `PUT /api/v1/branding`
- Branding config is returned in the candidate portal so the invite page reflects the company's look

#### Enterprise SSO
- Tenants can configure Google Workspace, GitHub OAuth, or SAML 2.0 identity providers
- SSO config stored per-tenant; client secrets are stripped from GET responses
- New **Integrations** page in the dashboard with provider selection UI

#### Proctoring / Anti-cheat
- Session-level `proctoring_enabled` flag on `interview_sessions`
- Browser events tracked during interviews: `tab_away`, `tab_return`, `face_lost`, `face_detected`
- `GET /api/v1/sessions/:id/proctoring` returns risk level (low / medium / high) and full event log
- Video interview page automatically logs tab-switch events

#### Coding Assessment Integration
- Interview templates support an optional `coding_challenge` JSON field (title, description, examples, constraints, starter code per language)
- `GET /api/v1/sessions/:id/coding` returns the challenge for a session
- `POST /api/v1/sessions/:id/coding/submit` stores the candidate's code submission in the session analysis
- Dedicated **Code Assessment** page with multi-language code editor and problem description panel

---

## [0.3.0] — Q3 2026 Features

### Added

#### AI Resume Parsing
- `POST /api/v1/candidates/parse-resume` accepts raw resume text and uses Claude to extract: name, email, phone, current role, years of experience, skills, and summary
- Returns structured JSON for pre-filling the candidate creation form

#### Automated Scheduling
- `interview_sessions.scheduled_at` column added (was already modelled; now surfaced via invite tokens)
- `POST /api/v1/sessions/:id/invite-token` generates a unique candidate invite token and stores it on the session

#### Team Collaboration
- New `team_members` table with roles: `admin`, `recruiter`, `viewer`
- `GET /api/v1/team` — list team members
- `POST /api/v1/team/invite` — invite member by email and role (upserts on conflict)
- `DELETE /api/v1/team/:id` — remove member
- New **Team** page in dashboard sidebar

#### Mobile Candidate Portal
- Public `GET /api/v1/candidate-portal/:token` endpoint — no JWT required
- Returns session info (company, role, duration, language) and applies tenant branding
- `/candidate/:token` frontend route renders a mobile-friendly pre-interview page with instructions and a "Start Interview" button
- Works for both voice and video session types

---

## [0.2.0] — Q2 2026 Roadmap Completion

### Added

#### Video Interview Mode
- `interview_sessions.session_type` column (`voice` | `video`, default `voice`)
- New **Video Interview** page with dual-panel camera UI (AI interviewer + candidate feed)
- Browser MediaDevices API for camera/microphone access
- Video/audio toggle controls and end-session button
- Tab-switch warning banner shown to candidate during video sessions
- Routes `/video-interview/:sessionId`

#### ATS Integrations (Greenhouse & Lever)
- `tenants.ats_config` JSONB column stores webhook URLs per tenant
- `GET /api/v1/integrations/ats` — retrieve ATS config
- `PUT /api/v1/integrations/ats` — set Greenhouse and/or Lever webhook URLs
- `POST /api/v1/sessions/:id/ats-push` — push completed session results (score, recommendation, analysis) to all configured ATS webhooks
- ATS config UI in the **Integrations** page

---

## [0.1.0] — Q2 2026 Core Release

### Added

#### Core Voice Interview Engine
- Real-time voice interview via WebSocket (`/ws/interview/:session_id`)
- Sarvam AI for Speech-to-Text and Text-to-Speech in 10+ Indian languages
- Claude 3.5 Sonnet for contextual question generation and follow-ups
- Multi-dimensional scoring: technical, communication, problem-solving, cultural fit

#### Multi-tenant Architecture
- Tenants (companies) are fully isolated — separate data, separate API keys
- Each tenant brings their own Claude and Sarvam API keys (zero platform API cost)
- JWT authentication with 30-day token expiry

#### Interview Management
- Reusable interview templates with type, difficulty, language, and custom questions
- Candidate profiles with resume text, skills, and experience
- Interview sessions with status tracking (Scheduled → InProgress → Completed)
- Human-in-the-loop feedback and AI recommendation override

#### Analytics Dashboard
- Total interviews, average score, completion rate, candidates this month
- Score distribution, top skills breakdown
- Session analytics with date range filtering

#### Developer Experience
- `quickstart.sh` and `quickstart.ps1` for one-command local startup
- `docker-compose.yml` + `docker-compose.local.yml` for local/production differentiation
- PostgreSQL migrations via SQLx
