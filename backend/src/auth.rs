use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    models::{AuthClaims, TenantRole, PlanTier},
    AppState,
};

// ---------------------------------------------------------------------------
// Token helpers — legacy (v1) and extended (v2) tenant tokens + god admin
// ---------------------------------------------------------------------------

/// Access-token lifetime. Short, so a stolen token has limited value.
/// 2h comfortably covers the longest interview (60 min) plus setup.
pub const ACCESS_TOKEN_TTL_HOURS: i64 = 2;
/// Refresh-token lifetime.
pub const REFRESH_TOKEN_TTL_DAYS: i64 = 30;

pub fn create_token(claims: &AuthClaims, secret: &str) -> anyhow::Result<String> {
    Ok(encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?)
}

/// Build a fresh short-lived access token for a tenant.
pub fn issue_access_token(tenant_id: Uuid, email: &str, secret: &str) -> anyhow::Result<String> {
    let now = chrono::Utc::now();
    let claims = AuthClaims {
        sub: tenant_id,
        email: email.to_string(),
        exp: (now + chrono::Duration::hours(ACCESS_TOKEN_TTL_HOURS)).timestamp() as usize,
        iat: now.timestamp() as usize,
    };
    create_token(&claims, secret)
}

/// Generate a refresh token. Returns (plaintext, sha256_hex_hash).
/// Plaintext goes to the client once; only the hash is stored.
pub fn generate_refresh_token() -> (String, String) {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let plaintext = bytes.iter().map(|b| format!("{b:02x}")).collect::<String>();
    let hash = hash_refresh_token(&plaintext);
    (plaintext, hash)
}

/// SHA-256 hex of a refresh token — used for storage + lookup.
pub fn hash_refresh_token(plaintext: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(plaintext.as_bytes());
    hasher.finalize().iter().map(|b| format!("{b:02x}")).collect()
}

pub fn verify_token(token: &str, secret: &str) -> anyhow::Result<AuthClaims> {
    let data = decode::<AuthClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(data.claims)
}

/// Extended claims issued for new logins (tenant users) — v2 tokens.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantUserClaims {
    pub sub: Uuid,          // tenant_users.id
    pub tenant_id: Uuid,
    pub email: String,
    pub role: TenantRole,
    pub plan: PlanTier,
    pub v: u8,              // = 2
    pub exp: usize,
    pub iat: usize,
}

/// God admin JWT — issued only via /api/v1/admin/auth/login
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GodAdminClaims {
    pub sub: Uuid,          // god_admins.id
    pub email: String,
    pub is_god: bool,       // always true — quick discriminator without enum
    pub v: u8,              // = 1
    pub exp: usize,
    pub iat: usize,
}

pub fn create_tenant_user_token(claims: &TenantUserClaims, secret: &str) -> anyhow::Result<String> {
    Ok(encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?)
}

pub fn verify_tenant_user_token(token: &str, secret: &str) -> anyhow::Result<TenantUserClaims> {
    let data = decode::<TenantUserClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(data.claims)
}

pub fn create_god_admin_token(claims: &GodAdminClaims, secret: &str) -> anyhow::Result<String> {
    Ok(encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?)
}

pub fn verify_god_admin_token(token: &str, secret: &str) -> anyhow::Result<GodAdminClaims> {
    let data = decode::<GodAdminClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(data.claims)
}

// ---------------------------------------------------------------------------
// Resolved claims injected into every authenticated request
// ---------------------------------------------------------------------------

/// Unified claims available to all route handlers via Extension.
/// Synthesised from whichever token format was presented.
#[derive(Debug, Clone)]
pub struct ResolvedClaims {
    pub tenant_id: Uuid,           // meaningful only when is_god_admin = false
    pub user_id: Option<Uuid>,     // tenant_users.id; None for legacy v1 tokens
    pub email: String,
    pub role: TenantRole,
    pub plan: PlanTier,
    pub is_god_admin: bool,
}

impl ResolvedClaims {
    pub fn god(sub: Uuid, email: String) -> Self {
        Self {
            tenant_id: Uuid::nil(),
            user_id: Some(sub),
            email,
            role: TenantRole::TenantAdmin,
            plan: PlanTier::Enterprise,
            is_god_admin: true,
        }
    }
}

// ---------------------------------------------------------------------------
// Route permission metadata — attached per route, checked by middleware
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy)]
pub struct RoutePerm {
    pub module: &'static str,
    pub action: &'static str,
    pub min_plan: PlanTier,
}

impl RoutePerm {
    pub const fn new(module: &'static str, action: &'static str, min_plan: PlanTier) -> Self {
        Self { module, action, min_plan }
    }
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------

static PUBLIC_PATHS: &[&str] = &[
    "/health",
    "/api/v1/tenants/login",
    "/api/v1/oauth/google",
    "/api/v1/oauth/google/callback",
    "/api/v1/admin/auth/login",
    "/api/v1/billing/plans",
    "/api/v1/team/accept-invite",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
];

pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let path = request.uri().path();
    let method = request.method().clone();

    // Public routes — no token required
    // /ws/* handles its own auth (browsers can't set Authorization headers on WS upgrades —
    // ws.rs verifies a JWT or candidate_token from the query string).
    if PUBLIC_PATHS.contains(&path)
        || (path == "/api/v1/tenants" && method == axum::http::Method::POST)
        || path.starts_with("/api/v1/candidate-portal/")
        || path.starts_with("/ws/")
    {
        return Ok(next.run(request).await);
    }

    let raw_token = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let secret = &state.config.jwt_secret;

    // 1. Try god admin token first (fast path: is_god field present)
    if let Ok(god) = verify_god_admin_token(raw_token, secret) {
        if god.is_god {
            let resolved = ResolvedClaims::god(god.sub, god.email.clone());
            request.extensions_mut().insert(resolved);
            // Also inject legacy AuthClaims (nil tenant) for backward compat
            request.extensions_mut().insert(AuthClaims {
                sub: Uuid::nil(),
                email: god.email,
                exp: god.exp,
                iat: god.iat,
            });
            return Ok(next.run(request).await);
        }
    }

    // 2. Try v2 tenant user token
    if let Ok(tu) = verify_tenant_user_token(raw_token, secret) {
        let tenant = sqlx::query!("SELECT is_active FROM tenants WHERE id = $1", tu.tenant_id)
            .fetch_optional(state.db.pool())
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        if tenant.and_then(|t| t.is_active).unwrap_or(false) {
            let resolved = ResolvedClaims {
                tenant_id: tu.tenant_id,
                user_id: Some(tu.sub),
                email: tu.email.clone(),
                role: tu.role,
                plan: tu.plan,
                is_god_admin: false,
            };
            request.extensions_mut().insert(resolved);
            request.extensions_mut().insert(AuthClaims {
                sub: tu.tenant_id,
                email: tu.email,
                exp: tu.exp,
                iat: tu.iat,
            });
            return Ok(next.run(request).await);
        }
        return Err(StatusCode::UNAUTHORIZED);
    }

    // 3. Legacy v1 token (tenant_id as sub)
    if let Ok(legacy) = verify_token(raw_token, secret) {
        let row = sqlx::query!(
            r#"SELECT t.is_active, COALESCE(ts.plan_tier::TEXT, 'free') as plan
               FROM tenants t
               LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
               WHERE t.id = $1"#,
            legacy.sub
        )
        .fetch_optional(state.db.pool())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        if let Some(row) = row {
            if row.is_active.unwrap_or(false) {
                let plan = match row.plan.as_deref() {
                    Some("starter")    => PlanTier::Starter,
                    Some("growth")     => PlanTier::Growth,
                    Some("enterprise") => PlanTier::Enterprise,
                    _                  => PlanTier::Free,
                };
                let resolved = ResolvedClaims {
                    tenant_id: legacy.sub,
                    user_id: None,
                    email: legacy.email.clone(),
                    role: TenantRole::TenantAdmin,
                    plan,
                    is_god_admin: false,
                };
                request.extensions_mut().insert(resolved);
                request.extensions_mut().insert(legacy);
                return Ok(next.run(request).await);
            }
        }
    }

    Err(StatusCode::UNAUTHORIZED)
}

// ---------------------------------------------------------------------------
// Permission middleware (runs after auth_middleware)
// ---------------------------------------------------------------------------

pub async fn permission_middleware(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let perm = request.extensions().get::<RoutePerm>().copied();
    let claims = request.extensions().get::<ResolvedClaims>().cloned();

    let (perm, claims) = match (perm, claims) {
        (Some(p), Some(c)) => (p, c),
        _ => return Ok(next.run(request).await), // no permission declared or not authenticated
    };

    if claims.is_god_admin {
        return Ok(next.run(request).await);
    }

    // Plan check
    let plan_rank = claims.plan as i32;
    let required_rank = perm.min_plan as i32;
    if plan_rank < required_rank {
        return Err(StatusCode::PAYMENT_REQUIRED);
    }

    // Role check — query DB cache in AppState
    let allowed = state.permissions
        .is_allowed(claims.role, perm.module, perm.action)
        .await;

    if allowed {
        Ok(next.run(request).await)
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

// ---------------------------------------------------------------------------
// Password utilities
// ---------------------------------------------------------------------------

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = argon2::password_hash::SaltString::generate(&mut rand::thread_rng());
    let argon2 = argon2::Argon2::default();
    let hash = argon2::PasswordHash::generate(argon2, password, &salt)
        .map_err(|e| anyhow::anyhow!("hash error: {}", e))?
        .to_string();
    Ok(hash)
}

pub fn verify_password(password: &str, hash: &str) -> anyhow::Result<bool> {
    let argon2 = argon2::Argon2::default();
    let parsed = argon2::PasswordHash::new(hash)
        .map_err(|e| anyhow::anyhow!("invalid hash: {}", e))?;
    Ok(argon2::PasswordVerifier::verify_password(&argon2, password.as_bytes(), &parsed).is_ok())
}
