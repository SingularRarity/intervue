use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::{create_god_admin_token, verify_password, GodAdminClaims, ResolvedClaims},
    models::{GodAdmin, GodAdminLoginRequest, RolePermission, UpdatePermissionRequest, RoutePlanRequirement, PlanTier},
    AppState,
};

fn god_only(claims: &ResolvedClaims) -> Result<(), StatusCode> {
    if claims.is_god_admin {
        Ok(())
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct AdminAuthResponse {
    pub token: String,
    pub admin: GodAdminPublic,
}

#[derive(Serialize)]
pub struct GodAdminPublic {
    pub id: Uuid,
    pub email: String,
    pub full_name: String,
}

pub async fn admin_login(
    State(state): State<Arc<AppState>>,
    Json(body): Json<GodAdminLoginRequest>,
) -> Result<Json<AdminAuthResponse>, StatusCode> {
    let row = sqlx::query_as::<_, GodAdmin>(
        "SELECT * FROM god_admins WHERE email = $1 AND is_active = true"
    )
    .bind(&body.email)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::UNAUTHORIZED)?;

    let ok = verify_password(&body.password, &row.password_hash)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    if !ok {
        return Err(StatusCode::UNAUTHORIZED);
    }

    sqlx::query!("UPDATE god_admins SET last_login_at = NOW() WHERE id = $1", row.id)
        .execute(state.db.pool())
        .await
        .ok();

    let now = Utc::now();
    let claims = GodAdminClaims {
        sub: row.id,
        email: row.email.clone(),
        is_god: true,
        v: 1,
        exp: (now + Duration::hours(12)).timestamp() as usize,
        iat: now.timestamp() as usize,
    };
    let token = create_god_admin_token(&claims, &state.config.jwt_secret)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(AdminAuthResponse {
        token,
        admin: GodAdminPublic { id: row.id, email: row.email, full_name: row.full_name },
    }))
}

pub async fn admin_me(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<GodAdminPublic>, StatusCode> {
    god_only(&claims)?;
    let id = claims.user_id.ok_or(StatusCode::UNAUTHORIZED)?;
    let row = sqlx::query_as::<_, GodAdmin>("SELECT * FROM god_admins WHERE id = $1")
        .bind(id)
        .fetch_one(state.db.pool())
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;
    Ok(Json(GodAdminPublic { id: row.id, email: row.email, full_name: row.full_name }))
}

// ---------------------------------------------------------------------------
// Tenant management
// ---------------------------------------------------------------------------

#[derive(Serialize, sqlx::FromRow)]
pub struct TenantOverview {
    pub id: Uuid,
    pub company_name: String,
    pub email: String,
    pub is_active: bool,
    pub plan_tier: Option<String>,
    pub sub_status: Option<String>,
    pub trial_ends_at: Option<chrono::DateTime<Utc>>,
    pub interview_count: Option<i64>,
    pub candidate_count: Option<i64>,
    pub created_at: chrono::DateTime<Utc>,
}

pub async fn list_tenants(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<Vec<TenantOverview>>, StatusCode> {
    god_only(&claims)?;

    let rows = sqlx::query_as::<_, TenantOverview>(
        r#"SELECT
            t.id, t.company_name, t.email, t.is_active,
            ts.plan_tier::TEXT as plan_tier,
            ts.status::TEXT as sub_status,
            ts.trial_ends_at,
            (SELECT COUNT(*) FROM interview_sessions s WHERE s.tenant_id = t.id) as interview_count,
            (SELECT COUNT(*) FROM candidates c WHERE c.tenant_id = t.id) as candidate_count,
            t.created_at
           FROM tenants t
           LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
           ORDER BY t.created_at DESC"#,
    )
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

#[derive(Deserialize)]
pub struct SetPlanRequest {
    pub plan: String,
}

pub async fn set_tenant_plan(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(tenant_id): Path<Uuid>,
    Json(body): Json<SetPlanRequest>,
) -> Result<StatusCode, StatusCode> {
    god_only(&claims)?;

    let plan: PlanTier = match body.plan.as_str() {
        "starter"    => PlanTier::Starter,
        "growth"     => PlanTier::Growth,
        "enterprise" => PlanTier::Enterprise,
        _            => PlanTier::Free,
    };

    sqlx::query!(
        "UPDATE tenant_subscriptions SET plan_tier = $1, status = 'active', updated_at = NOW() WHERE tenant_id = $2",
        plan as PlanTier,
        tenant_id,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Log
    let admin_id = claims.user_id;
    sqlx::query!(
        "INSERT INTO admin_audit_log (god_admin_id, action, target_type, target_id, payload) VALUES ($1, 'set_plan', 'tenant', $2, $3)",
        admin_id,
        tenant_id,
        serde_json::json!({ "plan": body.plan }),
    )
    .execute(state.db.pool())
    .await
    .ok();

    Ok(StatusCode::NO_CONTENT)
}

pub async fn toggle_tenant_active(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(tenant_id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    god_only(&claims)?;

    sqlx::query!(
        "UPDATE tenants SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1",
        tenant_id
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// Role permissions (DB-driven, editable from admin console)
// ---------------------------------------------------------------------------

pub async fn list_role_permissions(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<Vec<RolePermission>>, StatusCode> {
    god_only(&claims)?;

    let rows = sqlx::query_as::<_, RolePermission>(
        "SELECT id, module, action, role, allowed FROM role_permissions ORDER BY module, action, role"
    )
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

pub async fn update_role_permission(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(perm_id): Path<Uuid>,
    Json(body): Json<UpdatePermissionRequest>,
) -> Result<StatusCode, StatusCode> {
    god_only(&claims)?;

    sqlx::query!(
        "UPDATE role_permissions SET allowed = $1, updated_by = $2, updated_at = NOW() WHERE id = $3",
        body.allowed,
        claims.user_id,
        perm_id,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Reload the in-memory cache
    state.permissions.reload().await.ok();

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// Plan requirements (per route)
// ---------------------------------------------------------------------------

pub async fn list_plan_requirements(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<Vec<RoutePlanRequirement>>, StatusCode> {
    god_only(&claims)?;

    let rows = sqlx::query_as::<_, RoutePlanRequirement>(
        "SELECT id, module, action, min_plan FROM route_plan_requirements ORDER BY module, action"
    )
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

#[derive(Deserialize)]
pub struct UpdatePlanReqRequest {
    pub min_plan: String,
}

pub async fn update_plan_requirement(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(req_id): Path<Uuid>,
    Json(body): Json<UpdatePlanReqRequest>,
) -> Result<StatusCode, StatusCode> {
    god_only(&claims)?;

    let plan: PlanTier = match body.min_plan.as_str() {
        "starter"    => PlanTier::Starter,
        "growth"     => PlanTier::Growth,
        "enterprise" => PlanTier::Enterprise,
        _            => PlanTier::Free,
    };

    sqlx::query!(
        "UPDATE route_plan_requirements SET min_plan = $1, updated_by = $2, updated_at = NOW() WHERE id = $3",
        plan as PlanTier,
        claims.user_id,
        req_id,
    )
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// Contact requests
// ---------------------------------------------------------------------------

#[derive(Serialize, sqlx::FromRow)]
pub struct ContactRequestRow {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub company: Option<String>,
    pub request_type: String,
    pub plan_interested: Option<String>,
    pub message: String,
    pub status: String,
    pub created_at: chrono::DateTime<Utc>,
    pub tenant_company: Option<String>,
}

pub async fn list_contact_requests(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<Vec<ContactRequestRow>>, StatusCode> {
    god_only(&claims)?;

    let rows = sqlx::query_as::<_, ContactRequestRow>(
        r#"SELECT cr.id, cr.name, cr.email, cr.company,
            cr.request_type::TEXT, cr.plan_interested::TEXT,
            cr.message, cr.status::TEXT, cr.created_at,
            t.company_name as tenant_company
           FROM contact_requests cr
           LEFT JOIN tenants t ON t.id = cr.tenant_id
           ORDER BY cr.created_at DESC"#
    )
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}

#[derive(Deserialize)]
pub struct UpdateContactStatusRequest {
    pub status: String,
}

pub async fn update_contact_status(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Path(contact_id): Path<Uuid>,
    Json(body): Json<UpdateContactStatusRequest>,
) -> Result<StatusCode, StatusCode> {
    god_only(&claims)?;

    let status = match body.status.as_str() {
        "contacted"  => "contacted",
        "converted"  => "converted",
        "rejected"   => "rejected",
        _            => "new",
    };

    sqlx::query(
        "UPDATE contact_requests SET status = $1::contact_status, handled_by = $2, handled_at = NOW() WHERE id = $3",
    )
    .bind(status)
    .bind(claims.user_id)
    .bind(contact_id)
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::NO_CONTENT)
}

// ---------------------------------------------------------------------------
// Platform stats (god admin dashboard)
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct PlatformStats {
    pub total_tenants: i64,
    pub active_tenants: i64,
    pub total_interviews: i64,
    pub total_candidates: i64,
    pub new_contacts: i64,
    pub tenants_by_plan: Vec<PlanCount>,
}

#[derive(Serialize, sqlx::FromRow)]
pub struct PlanCount {
    pub plan: Option<String>,
    pub count: Option<i64>,
}

pub async fn platform_stats(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<PlatformStats>, StatusCode> {
    god_only(&claims)?;

    let total_tenants = sqlx::query_scalar!("SELECT COUNT(*) FROM tenants")
        .fetch_one(state.db.pool()).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?.unwrap_or(0);

    let active_tenants = sqlx::query_scalar!("SELECT COUNT(*) FROM tenants WHERE is_active = true")
        .fetch_one(state.db.pool()).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?.unwrap_or(0);

    let total_interviews = sqlx::query_scalar!("SELECT COUNT(*) FROM interview_sessions")
        .fetch_one(state.db.pool()).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?.unwrap_or(0);

    let total_candidates = sqlx::query_scalar!("SELECT COUNT(*) FROM candidates")
        .fetch_one(state.db.pool()).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?.unwrap_or(0);

    let new_contacts = sqlx::query_scalar!("SELECT COUNT(*) FROM contact_requests WHERE status = 'new'")
        .fetch_one(state.db.pool()).await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?.unwrap_or(0);

    let tenants_by_plan = sqlx::query_as::<_, PlanCount>(
        "SELECT plan_tier::TEXT as plan, COUNT(*) as count FROM tenant_subscriptions GROUP BY plan_tier ORDER BY count DESC"
    )
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(PlatformStats {
        total_tenants,
        active_tenants,
        total_interviews,
        total_candidates,
        new_contacts,
        tenants_by_plan,
    }))
}
