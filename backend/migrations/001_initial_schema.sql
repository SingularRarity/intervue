-- Create enum types
CREATE TYPE interview_type AS ENUM ('Technical', 'Behavioral', 'Mixed', 'CultureFit', 'Screening');
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard', 'Expert');
CREATE TYPE session_status AS ENUM ('Scheduled', 'InProgress', 'Completed', 'Cancelled', 'Failed');

-- Tenants table (multi-tenant)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    claude_api_key TEXT,
    sarvam_api_key TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    logo_url TEXT,
    website TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50)
);

-- Interview templates
CREATE TABLE interview_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    interview_type interview_type NOT NULL DEFAULT 'Mixed',
    difficulty difficulty_level NOT NULL DEFAULT 'Medium',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    topics TEXT[] DEFAULT '{}',
    custom_questions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url TEXT,
    resume_text TEXT,
    skills TEXT[] DEFAULT '{}',
    experience_years NUMERIC(4,1),
    current_position VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview sessions
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES interview_templates(id),
    candidate_id UUID NOT NULL REFERENCES candidates(id),
    status session_status NOT NULL DEFAULT 'Scheduled',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    overall_score NUMERIC(5,2),
    recommendation VARCHAR(50),
    transcript JSONB,
    analysis JSONB,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interview messages (for transcript)
CREATE TABLE interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session feedback (human review)
CREATE TABLE session_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    reviewer_notes TEXT,
    human_override VARCHAR(50),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_tenant ON interview_templates(tenant_id);
CREATE INDEX idx_candidates_tenant ON candidates(tenant_id);
CREATE INDEX idx_sessions_tenant ON interview_sessions(tenant_id);
CREATE INDEX idx_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_messages_session ON interview_messages(session_id);
CREATE INDEX idx_feedback_session ON session_feedback(session_id);
