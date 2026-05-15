-- 005_candidate_social_links.sql
-- Adds professional-profile fields to candidates so the parser can capture them
-- and the UI can surface them on the candidate card.

ALTER TABLE candidates
    ADD COLUMN IF NOT EXISTS linkedin_url  TEXT,
    ADD COLUMN IF NOT EXISTS github_url    TEXT,
    ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
    ADD COLUMN IF NOT EXISTS project_urls  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- GitHub ranking output cached on the candidate (computed by services::github::fetch_profile).
-- Stored as JSONB so we can evolve the score schema without further migrations.
ALTER TABLE candidates
    ADD COLUMN IF NOT EXISTS github_profile JSONB,
    ADD COLUMN IF NOT EXISTS github_fetched_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_candidates_github_url ON candidates(github_url) WHERE github_url IS NOT NULL;
