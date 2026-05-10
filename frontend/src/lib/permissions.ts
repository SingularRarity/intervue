import type { TenantRole, PlanTier } from './store'

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  enterprise: 3,
}

// Mirrors backend default_allow() in services/permissions.rs
const ROLE_PERMISSIONS: Record<TenantRole, Set<string>> = {
  tenant_admin: new Set(['*']), // admin can do everything
  manager: new Set([
    'interviews:read', 'interviews:create', 'interviews:update',
    'candidates:read', 'candidates:create', 'candidates:update', 'candidates:delete',
    'sessions:read', 'sessions:create', 'sessions:feedback',
    'analytics:read', 'analytics:advanced',
    'team:read', 'team:manage',
    'billing:contact',
    'branding:read',
  ]),
  interviewer: new Set([
    'interviews:read',
    'candidates:read', 'candidates:create',
    'sessions:read', 'sessions:create', 'sessions:feedback',
    'branding:read',
  ]),
  viewer: new Set([
    'interviews:read',
    'candidates:read',
    'sessions:read',
    'analytics:read',
    'branding:read',
  ]),
}

const PLAN_REQUIREMENTS: Record<string, PlanTier> = {
  'candidates:parse-resume': 'starter',
  'branding:update': 'starter',
  'analytics:advanced': 'growth',
  'integrations:update': 'growth',
  'sessions:proctoring': 'growth',
  'integrations:sso': 'enterprise',
}

export function canDo(role: TenantRole, plan: PlanTier, module: string, action: string): boolean {
  const key = `${module}:${action}`

  // Plan gate
  const required = PLAN_REQUIREMENTS[key]
  if (required && PLAN_RANK[plan] < PLAN_RANK[required]) return false

  // Role gate
  const perms = ROLE_PERMISSIONS[role]
  if (!perms) return false
  return perms.has('*') || perms.has(key)
}

export function meetsplan(plan: PlanTier, required: PlanTier): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[required]
}

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

// Startup+ plans can/should provide their own API keys (BYOK). Free/Individual use platform keys.
export function canUseByok(plan: PlanTier): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK['starter']
}

export const ROLE_LABELS: Record<TenantRole, string> = {
  tenant_admin: 'Admin',
  manager: 'Manager',
  interviewer: 'Interviewer',
  viewer: 'Viewer',
}
