-- Migration 002: Roadmap features

-- Q2: Video interview mode
ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'voice',
    ADD COLUMN IF NOT EXISTS candidate_token TEXT,
    ADD COLUMN IF NOT EXISTS proctoring_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_candidate_token
    ON interview_sessions(candidate_token) WHERE candidate_token IS NOT NULL;

-- Q2/Q4: ATS, SSO, and white-label config per tenant
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS ats_config JSONB,
    ADD COLUMN IF NOT EXISTS sso_config JSONB,
    ADD COLUMN IF NOT EXISTS branding_config JSONB;

-- Q2/Q4: Coding challenge per template
ALTER TABLE interview_templates
    ADD COLUMN IF NOT EXISTS coding_challenge JSONB;

-- Q3: Team collaboration
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'recruiter', -- admin | recruiter | viewer
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, email)
);

-- Q4: Proctoring events
CREATE TABLE IF NOT EXISTS proctoring_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- tab_away | tab_return | face_lost | face_detected
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_proctoring_events_session
    ON proctoring_events(session_id, occurred_at);
