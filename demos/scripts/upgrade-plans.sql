-- Upgrade demo accounts to proper plan tiers.
-- Run with: docker compose exec -T postgres psql -U postgres -d ai_interview < demos/scripts/upgrade-plans.sql

INSERT INTO tenant_subscriptions (tenant_id, plan_tier, status)
SELECT id, 'free'::plan_tier, 'active'::sub_status
FROM tenants WHERE email = 'demo-free@intervue.app'
ON CONFLICT (tenant_id) DO UPDATE SET plan_tier = EXCLUDED.plan_tier, status = EXCLUDED.status;

INSERT INTO tenant_subscriptions (tenant_id, plan_tier, status)
SELECT id, 'starter'::plan_tier, 'active'::sub_status
FROM tenants WHERE email = 'demo-individual@intervue.app'
ON CONFLICT (tenant_id) DO UPDATE SET plan_tier = EXCLUDED.plan_tier, status = EXCLUDED.status;

INSERT INTO tenant_subscriptions (tenant_id, plan_tier, status)
SELECT id, 'growth'::plan_tier, 'active'::sub_status
FROM tenants WHERE email = 'demo-startup@intervue.app'
ON CONFLICT (tenant_id) DO UPDATE SET plan_tier = EXCLUDED.plan_tier, status = EXCLUDED.status;

SELECT t.email, s.plan_tier, s.status
FROM tenants t
JOIN tenant_subscriptions s ON s.tenant_id = t.id
WHERE t.email LIKE 'demo-%'
ORDER BY t.email;
