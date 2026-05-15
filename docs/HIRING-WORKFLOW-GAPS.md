# Hiring Workflow — Honest Gap List

What's broken, half-built, or missing in the candidate→interview workflow as of `alpha-demo` branch. Findings from reading the code, not speculation.

---

## Critical gaps (blocking real use)

### 1. No way to send the interview link to the candidate
The backend has a token-based candidate portal that's fully wired up. The HR-facing UI never calls it.

- ✅ Backend: `POST /api/v1/sessions/:id/invite-token` generates token, returns `invite_url` — [candidate_portal.rs:63](backend/src/routes/candidate_portal.rs#L63)
- ✅ Backend: public `GET /api/v1/candidate-portal/:token` returns session info without JWT — [candidate_portal.rs:27](backend/src/routes/candidate_portal.rs#L27)
- ✅ Frontend route: `/candidate/:token` → `CandidatePortalPage` — [App.tsx:41](frontend/src/App.tsx#L41)
- ✅ API client: `generateInviteToken(id)` declared — [api.ts:64](frontend/src/lib/api.ts#L64)
- ❌ **Zero UI callsites for `generateInviteToken`** — confirmed by grep
- ❌ **No email service exists anywhere** in the backend (no SMTP/SES/SendGrid/Mailgun integration)
- ❌ Today's "Start Interview" button does `window.open('/interview/${sessionId}', '_blank')` — opens in **HR's own browser**, requiring HR's JWT. A candidate clicking this URL is redirected to `/login`. — [CandidatesPage.tsx:55](frontend/src/pages/CandidatesPage.tsx#L55)

**Effect:** HR must conduct the interview themselves on a screen-share. There is no mechanism to hand off to the candidate.

**Fix (smallest viable):** Add an "Email Candidate" button that calls `generateInviteToken`, then opens a `mailto:` link in Outlook with a pre-filled body containing the URL. Zero email-service dependency.

---

### 2. The candidate portal renders, but there's no "join" flow
[`CandidatePortalPage.tsx`](frontend/src/pages/CandidatePortalPage.tsx) shows session details. What it doesn't have:
- Mic/cam pre-flight check
- Consent screen ("we record audio for interview scoring")
- "I'm ready — start the interview" CTA
- Bridge from portal → actual interview UI

The candidate hitting `/candidate/{token}` sees the session info but cannot start the interview from there.

---

### 3. Resume parser misses social profiles, portfolios, and project links
[`groq.rs::parse_resume`](backend/src/services/groq.rs) and [`claude.rs::parse_resume`](backend/src/services/claude.rs) extract:
- name, email, phone, current_position, experience_years, skills, summary

They do **not** extract:
- LinkedIn URL
- GitHub URL
- Portfolio / personal site URL
- Project URLs mentioned inline in the resume

The `candidates` table has no columns for these either ([001_initial_schema.sql:36-60](backend/migrations/001_initial_schema.sql#L36)). Adding them requires a migration plus updated INSERTs.

---

### 4. No GitHub-based candidate scoring
No code anywhere in the repo fetches from `api.github.com`. The product cannot rank a candidate by repos / stars / commit activity even though the JD-driven workflow strongly suggests this.

---

## Demo-specific issues (not product bugs, but caused confusion)

### 5. Demo videos have no audio
Playwright's `video: 'on'` captures **video track only** — webm has no audio stream. This is a documented Playwright limitation.

- `playNarration()` plays MP3 through page `Audio` API → system speakers → not in recording
- `injectAudioResponse()` pipes audio into fake mic → WebSocket to backend (for STT) → not in recording

**Fix:** post-process with `ffmpeg` to mux the narration MP3 timeline onto the video. Adds an audio track without re-recording.

### 6. Postprocess discards the candidate-side tab
The interview opens a new tab via `window.open` — Playwright records that as `video-1.webm`. My current postprocess picks the larger main-tab video and throws the interview-tab video away. Should stitch them, or output both per demo.

---

## What does work

So the assessment isn't all negative:
- AI interview engine (template seeding, AI questioning, follow-ups, transcript, scoring)
- JD parser auto-fills template fields
- Resume parser auto-fills candidate fields (for the fields it knows about)
- Plan-tier gating across the UI
- Tenant/auth/role-based permissions
- WebSocket-based real-time interview transport
- Proctoring event hooks (`tab_away` / `tab_return`)
- Three working tiers (free / starter / growth) with feature gating

The backbone is solid. The gaps are at the seams: how does a candidate actually get invited, how do they join, and how rich is the candidate profile.

---

## Recommended order to close gaps

1. **Now (1-2 hours):**
   - "Email Candidate" button → mailto: with token URL + candidate-specific body + JD topics + "all the best" line
   - Resume parser extracts LinkedIn / GitHub / portfolio / project URLs
   - Candidate card shows these links with icons
2. **This week (1 day):**
   - GitHub profile fetcher (public API, no auth) — repos, stars, recent activity, computed score
   - Candidate portal: "I'm ready" CTA bridging to actual interview UI
   - ffmpeg mux narration onto demo videos
3. **Next sprint (3-5 days):**
   - Email service (SES or SendGrid) for actual delivery, scheduling, reminders
   - Candidate-side mic/cam preflight + consent
   - Scheduling UI (HR sets time, candidate gets reminder)
