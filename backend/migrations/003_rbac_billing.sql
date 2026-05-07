-- RBAC, billing, god admin, tenant users, contact requests

DO $$ BEGIN CREATE TYPE tenant_role AS ENUM ('tenant_admin', 'manager', 'interviewer', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'growth', 'enterprise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sub_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contact_type AS ENUM ('upgrade', 'enterprise_demo', 'general'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE contact_status AS ENUM ('new', 'contacted', 'converted', 'rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ GOD ADMINS ============
CREATE TABLE IF NOT EXISTS god_admins (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ TENANT USERS ============
CREATE TABLE IF NOT EXISTS tenant_users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email            VARCHAR(255) NOT NULL,
    password_hash    VARCHAR(255),
    full_name        VARCHAR(120),
    role             tenant_role NOT NULL DEFAULT 'viewer',
    is_active        BOOLEAN NOT NULL DEFAULT true,
    invited_by       UUID REFERENCES tenant_users(id),
    invite_token     VARCHAR(128) UNIQUE,
    invite_expires_at TIMESTAMPTZ,
    accepted_at      TIMESTAMPTZ,
    last_login_at    TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_token  ON tenant_users(invite_token) WHERE invite_token IS NOT NULL;

-- ============ SUBSCRIPTION PLANS ============
CREATE TABLE IF NOT EXISTS subscription_plans (
    tier                      plan_tier PRIMARY KEY,
    display_name              VARCHAR(60) NOT NULL,
    monthly_price_inr         INTEGER NOT NULL DEFAULT 0,
    max_seats                 INTEGER NOT NULL DEFAULT 1,   -- -1 = unlimited
    max_interviews_per_month  INTEGER NOT NULL DEFAULT 5,   -- -1 = unlimited
    max_candidates            INTEGER NOT NULL DEFAULT 50,  -- -1 = unlimited
    features                  JSONB NOT NULL DEFAULT '{}',
    rank                      SMALLINT NOT NULL DEFAULT 0,  -- for >= comparisons
    is_active                 BOOLEAN NOT NULL DEFAULT true,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ TENANT SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    plan_tier            plan_tier NOT NULL REFERENCES subscription_plans(tier),
    status               sub_status NOT NULL DEFAULT 'trialing',
    trial_ends_at        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 days',
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenant_subs_tenant ON tenant_subscriptions(tenant_id);

-- ============ ROLE PERMISSIONS (DB-driven, editable via god-admin console) ============
CREATE TABLE IF NOT EXISTS role_permissions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module     VARCHAR(60) NOT NULL,
    action     VARCHAR(40) NOT NULL,
    role       tenant_role NOT NULL,
    allowed    BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES god_admins(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (module, action, role)
);
CREATE INDEX IF NOT EXISTS idx_role_perms_lookup ON role_permissions(module, action);

-- Route-level plan requirements (editable via god-admin console)
CREATE TABLE IF NOT EXISTS route_plan_requirements (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module     VARCHAR(60) NOT NULL,
    action     VARCHAR(40) NOT NULL,
    min_plan   plan_tier NOT NULL DEFAULT 'free',
    updated_by UUID REFERENCES god_admins(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (module, action)
);

-- ============ CONTACT / UPGRADE REQUESTS ============
CREATE TABLE IF NOT EXISTS contact_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES tenant_users(id) ON DELETE SET NULL,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    company         VARCHAR(120),
    request_type    contact_type NOT NULL DEFAULT 'general',
    plan_interested plan_tier,
    message         TEXT NOT NULL,
    status          contact_status NOT NULL DEFAULT 'new',
    handled_by      UUID REFERENCES god_admins(id),
    handled_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_requests(status, created_at DESC);

-- ============ ADMIN AUDIT LOG ============
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    god_admin_id UUID REFERENCES god_admins(id),
    action       VARCHAR(80) NOT NULL,
    target_type  VARCHAR(40),
    target_id    UUID,
    payload      JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(god_admin_id, created_at DESC);

-- ============ SEED PLANS ============
INSERT INTO subscription_plans (tier, display_name, monthly_price_inr, max_seats, max_interviews_per_month, max_candidates, features, rank) VALUES
  ('free',       'Free',         0,      2,   10,    50,
   '{"ats":false,"sso":false,"branding":false,"proctoring":false,"coding":false,"analytics_advanced":false}', 0),
  ('starter',    'Starter',      4900,   5,   100,   500,
   '{"ats":false,"sso":false,"branding":true,"proctoring":true,"coding":true,"analytics_advanced":false}', 1),
  ('growth',     'Growth',       19900,  20,  1000,  5000,
   '{"ats":true,"sso":false,"branding":true,"proctoring":true,"coding":true,"analytics_advanced":true}', 2),
  ('enterprise', 'Enterprise',   99900,  -1,  -1,    -1,
   '{"ats":true,"sso":true,"branding":true,"proctoring":true,"coding":true,"analytics_advanced":true}', 3)
ON CONFLICT (tier) DO NOTHING;

-- ============ SEED DEFAULT ROLE PERMISSIONS ============
-- tenant_admin gets everything
INSERT INTO role_permissions (module, action, role, allowed) VALUES
  ('interviews',    'read',   'tenant_admin', true),
  ('interviews',    'create', 'tenant_admin', true),
  ('interviews',    'update', 'tenant_admin', true),
  ('interviews',    'delete', 'tenant_admin', true),
  ('candidates',    'read',   'tenant_admin', true),
  ('candidates',    'create', 'tenant_admin', true),
  ('candidates',    'update', 'tenant_admin', true),
  ('candidates',    'delete', 'tenant_admin', true),
  ('sessions',      'read',   'tenant_admin', true),
  ('sessions',      'create', 'tenant_admin', true),
  ('sessions',      'feedback','tenant_admin', true),
  ('sessions',      'delete', 'tenant_admin', true),
  ('analytics',     'read',   'tenant_admin', true),
  ('analytics',     'advanced','tenant_admin', true),
  ('team',          'read',   'tenant_admin', true),
  ('team',          'invite', 'tenant_admin', true),
  ('team',          'remove', 'tenant_admin', true),
  ('team',          'role',   'tenant_admin', true),
  ('integrations',  'read',   'tenant_admin', true),
  ('integrations',  'update', 'tenant_admin', true),
  ('branding',      'read',   'tenant_admin', true),
  ('branding',      'update', 'tenant_admin', true),
  ('billing',       'read',   'tenant_admin', true),
  ('billing',       'contact','tenant_admin', true),
  ('settings',      'read',   'tenant_admin', true),
  ('settings',      'update', 'tenant_admin', true),
-- manager
  ('interviews',    'read',   'manager', true),
  ('interviews',    'create', 'manager', true),
  ('interviews',    'update', 'manager', true),
  ('interviews',    'delete', 'manager', false),
  ('candidates',    'read',   'manager', true),
  ('candidates',    'create', 'manager', true),
  ('candidates',    'update', 'manager', true),
  ('candidates',    'delete', 'manager', true),
  ('sessions',      'read',   'manager', true),
  ('sessions',      'create', 'manager', true),
  ('sessions',      'feedback','manager', true),
  ('sessions',      'delete', 'manager', false),
  ('analytics',     'read',   'manager', true),
  ('analytics',     'advanced','manager', true),
  ('team',          'read',   'manager', true),
  ('team',          'invite', 'manager', false),
  ('billing',       'contact','manager', true),
-- interviewer
  ('interviews',    'read',   'interviewer', true),
  ('interviews',    'create', 'interviewer', false),
  ('candidates',    'read',   'interviewer', true),
  ('candidates',    'create', 'interviewer', true),
  ('sessions',      'read',   'interviewer', true),
  ('sessions',      'create', 'interviewer', true),
  ('sessions',      'feedback','interviewer', true),
  ('analytics',     'read',   'interviewer', false),
-- viewer
  ('interviews',    'read',   'viewer', true),
  ('candidates',    'read',   'viewer', true),
  ('sessions',      'read',   'viewer', true),
  ('analytics',     'read',   'viewer', true)
ON CONFLICT (module, action, role) DO NOTHING;

-- ============ SEED DEFAULT PLAN REQUIREMENTS ============
INSERT INTO route_plan_requirements (module, action, min_plan) VALUES
  ('analytics',    'advanced',  'growth'),
  ('integrations', 'update',    'growth'),
  ('branding',     'update',    'starter'),
  ('sessions',     'proctoring','starter'),
  ('sessions',     'coding',    'starter'),
  ('integrations', 'sso',       'enterprise'),
  ('team',         'invite',    'starter')
ON CONFLICT (module, action) DO NOTHING;

-- ============ BACKFILL EXISTING DATA ============
-- Every existing tenant gets a free trial subscription
INSERT INTO tenant_subscriptions (tenant_id, plan_tier, status)
  SELECT id, 'free', 'trialing' FROM tenants
  ON CONFLICT (tenant_id) DO NOTHING;

-- Every existing tenant owner becomes a tenant_admin user
INSERT INTO tenant_users (tenant_id, email, password_hash, full_name, role, accepted_at)
  SELECT id, email, password_hash, company_name, 'tenant_admin', NOW()
  FROM tenants
  ON CONFLICT (tenant_id, email) DO NOTHING;
