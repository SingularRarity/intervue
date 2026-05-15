# Platform-Wide Gap List

Consolidated findings from a four-area audit (auth/security, frontend↔backend coverage, data model, ops). All findings are code-cited. Use this as the prioritization input for the next sprints.

**Verdict in one line:** the platform is suitable for **demo and design partner trials**. It is **not production-ready** for paying customers handling real candidates. The interview engine is solid; the seams around it (invite delivery, security posture, persistence, ops) are not.

---

## CRITICAL — fix before any external launch

### C1. WebSocket interview endpoint has no auth or tenant check
[`backend/src/routes/ws.rs:11-30`](backend/src/routes/ws.rs#L11) accepts `/ws/interview/:session_id` from anyone. The handler updates session state with no JWT verification and no `tenant_id` filter. **A candidate (or attacker) who knows or guesses a session UUID can connect to and hijack any in-flight interview** across any tenant.

### C2. Candidate portal endpoint is token-only, no tenant scoping
[`backend/src/routes/candidate_portal.rs:31-46`](backend/src/routes/candidate_portal.rs#L31) looks up sessions by `candidate_token` alone. A leaked or guessed token exposes that session regardless of tenant. Combined with C1, a stolen token leads to a full interview takeover.

### C3. Tenant API keys (Claude / Groq / Sarvam) stored as plaintext
[`backend/src/models.rs:15-17`](backend/src/models.rs#L15) and migrations 001/004. The API response correctly masks them ([`models.rs:64-66`](backend/src/models.rs#L64)) but anyone with DB read access has every customer's third-party keys in clear. No KMS, no application-level encryption.

### C4. Backend leaks raw error strings to clients
Every `sqlx` error is returned to clients via `e.to_string()` (e.g., [`interview.rs:57`](backend/src/routes/interview.rs#L57), [`ws.rs:71`](backend/src/routes/ws.rs#L71)). This is how we discovered the `experience_years` column-type bug — the message went to the browser. Discloses schema, types, and stack details.

### C5. OAuth missing the `state` parameter (CSRF)
[`backend/src/routes/oauth.rs:37-42`](backend/src/routes/oauth.rs#L37) builds the Google auth URL without `state`. The callback ([`oauth.rs:94`](backend/src/routes/oauth.rs#L94)) has no validation to match. CSRF is possible against the OAuth login flow.

### C6. No password reset flow
[`frontend/src/pages/ResetPasswordPage.tsx:13-20`](frontend/src/pages/ResetPasswordPage.tsx#L13) just directs users to email support. Backend has zero password-reset endpoints. Locked-out users have no path back in.

### C7. No rate limiting on auth or invite endpoints
`/api/v1/tenants/login`, `/api/v1/admin/auth/login`, `/api/v1/team/accept-invite` are wide open. Brute force on login is feasible. Team invite token (32 hex chars) is high-entropy but has **no expiry** ([`team.rs:70`](backend/src/routes/team.rs#L70)) and no per-IP throttle.

### C8. CORS allows `Any` origin
[`backend/src/main.rs:88-90`](backend/src/main.rs#L88) — `allow_origin(Any)`, `allow_methods(Any)`, `allow_headers(Any)`. With cookies-or-bearer auth this is risky. Lock down to known origins per environment.

### C9. Zero tests
No `#[test]` in backend, no `*.test.ts` / `*.spec.ts` in frontend. CI runs `cargo build` and `vite build` only. Demo Playwright specs in [`demos/tests/`](demos/tests/) don't exercise the API. **First regression in a customer-visible flow ships unnoticed.**

### C10. Uploaded files are never persisted
Resume PDFs/DOCX ([`backend/src/routes/resume.rs:58-98`](backend/src/routes/resume.rs#L58)) are parsed in memory and discarded. Audio chunks streamed over WebSocket ([`ws.rs:52-75`](backend/src/routes/ws.rs#L52)) are sent to STT and lost. **There is no way to play back an interview, audit a transcription dispute, or reprocess a resume.** No S3/GCS/blob storage anywhere.

---

## HIGH — required for real hiring workflow

### H1. No way to send the interview link to the candidate (covered in `HIRING-WORKFLOW-GAPS.md`)
`generateInviteToken` API exists, the candidate-portal page renders, but **no UI calls the endpoint**. No email service is integrated. HR has no path to hand off to the candidate.

### H2. Candidate portal page has no "join" CTA
[`frontend/src/pages/CandidatePortalPage.tsx`](frontend/src/pages/CandidatePortalPage.tsx) shows session details but doesn't bridge to the actual interview UI. No mic/cam pre-check, no consent step, no "I'm ready" button.

### H3. Resume parser misses social/portfolio/project links
[`backend/src/services/groq.rs::parse_resume`](backend/src/services/groq.rs) and Claude parser extract only `name/email/phone/current_position/experience_years/skills/summary`. **No LinkedIn, no GitHub, no portfolio, no project URLs.** `candidates` table has no columns for them either ([migration 001:36-60](backend/migrations/001_initial_schema.sql#L36)).

### H4. JWT lives 30 days with no revocation or refresh
[`tenant.rs:71`](backend/src/routes/tenant.rs#L71), [`admin.rs:73`](backend/src/routes/admin.rs#L73). No logout endpoint clears server state, no blacklist, no refresh tokens despite Redis being a dependency. A stolen token is good for a month.

### H5. WebSocket pinned to single backend process
[`ws.rs:11-109`](backend/src/routes/ws.rs#L11) holds socket + conversation state in memory. No Redis pub/sub. A backend restart or load-balancer rebalance kills in-flight interviews. Cannot scale horizontally with confidence.

### H6. External APIs (Groq/Claude/Sarvam) have timeouts but no retry, no circuit breaker
If Sarvam STT times out mid-interview, candidate sees a WS error ([`ws.rs:71-73`](backend/src/routes/ws.rs#L71)) and the interview stalls. No fallback model, no exponential backoff, no rate-limit-header awareness.

### H7. Input validation only on three models
`CreateTenantRequest` ([`models.rs:28-38`](backend/src/models.rs#L28)) and `CreateInterviewTemplateRequest` ([`models.rs:127-137`](backend/src/models.rs#L127)) use `validator`. **The other 15+ JSON-body endpoints have no validation** — login, key updates, invites, feedback, ATS/SSO config, branding, etc.

### H8. Health endpoint is shallow
[`routes/mod.rs:21-30`](backend/src/routes/mod.rs#L21) returns `{status:"healthy"}` unconditionally. Doesn't ping DB or Redis. Liveness can return OK while the database is unreachable.

### H9. JWT_SECRET has an unsafe default
[`backend/src/config.rs:27`](backend/src/config.rs#L27) defaults to `"your-super-secret-jwt-key-change-in-production"` if the env var is missing. Should fail-fast in non-dev environments.

### H10. Demo recording captures no audio
Playwright's `video: 'on'` does not include an audio track. `playNarration()` plays through page Audio (system speakers, not in recording) and `injectAudioResponse()` goes to the fake mic (off-recording). Demos look like silent movies. Needs ffmpeg post-mux.

---

## MEDIUM — rough edges that erode trust

### M1. Half-built / dead UI elements
- [`CandidatesPage.tsx:149`](frontend/src/pages/CandidatesPage.tsx#L149) — delete button has a `// delete logic` comment and no handler
- [`Dashboard.tsx:193-200`](frontend/src/pages/Dashboard.tsx#L193) — Filter and Export buttons are decorative (no `onClick`)
- [`CodeAssessmentPage.tsx:51`](frontend/src/pages/CodeAssessmentPage.tsx#L51) — empty `catch` swallows submit errors silently
- [`OnboardingPage.tsx`](frontend/src/pages/OnboardingPage.tsx) — multi-step form never sends to server, only writes a localStorage flag
- [`CandidatePortalPage.tsx:30`](frontend/src/pages/CandidatePortalPage.tsx#L30) — raw `fetch` bypasses the axios interceptor

### M2. Schema bugs
- `experience_years NUMERIC(4,1)` ↔ Rust `Option<f32>` ([migration 001:50](backend/migrations/001_initial_schema.sql#L50), [models.rs:158](backend/src/models.rs#L158)) — **already crashed in demos**, worked around in test
- `overall_score NUMERIC(5,2)` ↔ Rust `Option<f32>` ([001:67](backend/migrations/001_initial_schema.sql#L67), [models.rs:201](backend/src/models.rs#L201)) — same precision-loss / crash risk
- `interview_sessions.template_id` and `candidate_id` ([001:61-62](backend/migrations/001_initial_schema.sql#L61)) have no `ON DELETE` clause — orphans on delete

### M3. Dead tables
- `team_members` (migration 002:23-31) — zero references in any route, superseded by `tenant_users` (003)
- `interview_messages` (001:77-84) — never queried; transcripts live in `interview_sessions.transcript` JSONB

### M4. Missing indexes on hot paths
- `interview_sessions(template_id)` — used in template list joins
- `interview_sessions(overall_score)` — analytics filters/sorts by score
- `candidates(email)` — no index even for tenant-scoped lookups
- `tenant_users(email)` for invite lookups

### M5. Admin routes rely on handler-level auth, not router guards
[`admin.rs:18-23`](backend/src/routes/admin.rs#L18) — `god_only()` is checked inside each handler. A missing `Extension<ResolvedClaims>` setup at the router level would silently bypass auth. Should be a layer middleware.

### M6. CORS, secrets, env defaults exposed in `docker-compose.yml`
[`docker-compose.yml:34`](docker-compose.yml#L34) — `JWT_SECRET: ${JWT_SECRET:-change-me-in-production}`. Default values committed to the repo.

### M7. Observability is sparse
TraceLayer is configured but only ~6 `tracing::` calls in the backend. No structured JSON logs, no request IDs, no audit log for tenant-level actions (admin audit log exists, tenant audit log does not).

### M8. Frontend build bakes API URL at compile time
[`api.ts:5`](frontend/src/lib/api.ts#L5) — `import.meta.env.VITE_API_URL`. Can't redeploy the same image to a different domain. Need a runtime config endpoint or entrypoint substitution.

### M9. Postprocess discards the candidate-tab demo recording
The interview tab is recorded as `video-1.webm`. Current postprocess picks the larger file (main tab) and throws the interview tab away. Should output both or stitch.

---

## LOW — quality, polish, future-proofing

### L1. Audit timestamps missing on some tables
`subscription_plans`, `interview_messages`, `session_feedback`, `proctoring_events` all have `created_at` but no `updated_at`.

### L2. No GitHub-based candidate scoring
Roadmapped, no code yet. Public GitHub API is unauthenticated for the basics — feasible in a day.

### L3. Soft-delete inconsistency
No `deleted_at` columns anywhere. Everything is hard delete with cascade. No "archive candidate" affordance.

### L4. No backup/restore drill
RDS has 7-day retention in prod, but there's no documented restore procedure and no monthly test.

### L5. No queue for async work
Resume parsing, JD parsing, scoring — all happen inline on the request thread. No worker pool, no job table, no DLQ.

---

## Recommended priority for the next two weeks

**Week 1 — close the security and reliability holes everyone notices first:**
- C1 + C2 (WebSocket + portal auth) — 1 day. JWT verify on WS connect; add tenant_id check to portal lookup.
- C4 (error sanitization) — half a day. Wrap sqlx errors, log details server-side, return generic messages to clients.
- C7 + C8 (rate limit + CORS lock-down) — half a day with `tower-governor` + a CORS allowlist by env.
- H1 (invite button + mailto:) — half a day. **Closes the actual hiring workflow.**
- H3 (resume → LinkedIn/GitHub/portfolio/projects) — half a day. Prompt update + migration + UI surface.
- H10 (demo audio mux) — half a day with ffmpeg.

**Week 2 — make the platform pilotable:**
- C9 (introduce tests — at least 5 backend integration tests against postgres, 3 frontend smoke tests) — 1.5 days.
- C10 (S3 storage for resumes and session recordings) — 1 day. Even a single bucket per env.
- H2 (candidate portal join flow) — 1 day. Mic/cam check + consent + "start" CTA.
- H6 (LLM retries + timeouts + a basic circuit-breaker) — 1 day.
- H7 (validation on all JSON bodies via `validator`) — half a day, mostly mechanical.

After those, the platform crosses from "demo" to "design-partner pilot".
