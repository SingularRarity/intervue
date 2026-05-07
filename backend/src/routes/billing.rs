use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    Extension,
};
use serde::Serialize;
use std::sync::Arc;
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::ResolvedClaims,
    models::{ContactRequest, PlanTier},
    AppState,
};

// ---------------------------------------------------------------------------
// Plan info
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct PlanInfoResponse {
    pub plan_tier: String,
    pub status: String,
    pub trial_ends_at: chrono::DateTime<chrono::Utc>,
    pub features: serde_json::Value,
    pub limits: PlanLimits,
}

#[derive(Serialize)]
pub struct PlanLimits {
    pub max_seats: i32,
    pub max_interviews_per_month: i32,
    pub max_candidates: i32,
}

pub async fn get_plan(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<PlanInfoResponse>, StatusCode> {
    let row = sqlx::query!(
        r#"SELECT ts.plan_tier::TEXT as plan_tier, ts.status::TEXT as status,
                  ts.trial_ends_at,
                  sp.features, sp.max_seats, sp.max_interviews_per_month, sp.max_candidates
           FROM tenant_subscriptions ts
           JOIN subscription_plans sp ON sp.tier = ts.plan_tier
           WHERE ts.tenant_id = $1"#,
        claims.tenant_id,
    )
    .fetch_optional(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(PlanInfoResponse {
        plan_tier: row.plan_tier.unwrap_or_else(|| "free".into()),
        status: row.status.unwrap_or_else(|| "unknown".into()),
        trial_ends_at: row.trial_ends_at,
        features: row.features,
        limits: PlanLimits {
            max_seats: row.max_seats,
            max_interviews_per_month: row.max_interviews_per_month,
            max_candidates: row.max_candidates,
        },
    }))
}

// ---------------------------------------------------------------------------
// Usage meters
// ---------------------------------------------------------------------------

#[derive(Serialize)]
pub struct UsageResponse {
    pub interviews_this_month: i64,
    pub total_candidates: i64,
    pub active_seats: i64,
    pub plan_tier: String,
    pub limits: PlanLimits,
}

pub async fn get_usage(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
) -> Result<Json<UsageResponse>, StatusCode> {
    let interviews_this_month = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM interview_sessions WHERE tenant_id = $1 AND created_at >= date_trunc('month', NOW())",
        claims.tenant_id,
    )
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    let total_candidates = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM candidates WHERE tenant_id = $1",
        claims.tenant_id,
    )
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    let active_seats = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM tenant_users WHERE tenant_id = $1 AND is_active = true",
        claims.tenant_id,
    )
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
    .unwrap_or(0);

    let limits = sqlx::query!(
        r#"SELECT sp.max_seats, sp.max_interviews_per_month, sp.max_candidates,
                  ts.plan_tier::TEXT as plan_tier
           FROM tenant_subscriptions ts
           JOIN subscription_plans sp ON sp.tier = ts.plan_tier
           WHERE ts.tenant_id = $1"#,
        claims.tenant_id,
    )
    .fetch_optional(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let (plan_tier, max_seats, max_interviews, max_candidates) = limits
        .map(|r| (r.plan_tier.unwrap_or_else(|| "free".into()), r.max_seats, r.max_interviews_per_month, r.max_candidates))
        .unwrap_or_else(|| ("free".into(), 1, 5, 10));

    Ok(Json(UsageResponse {
        interviews_this_month,
        total_candidates,
        active_seats,
        plan_tier,
        limits: PlanLimits {
            max_seats,
            max_interviews_per_month: max_interviews,
            max_candidates,
        },
    }))
}

// ---------------------------------------------------------------------------
// Contact / upgrade request
// ---------------------------------------------------------------------------

pub async fn submit_contact(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<ResolvedClaims>,
    Json(body): Json<ContactRequest>,
) -> Result<StatusCode, StatusCode> {
    body.validate().map_err(|_| StatusCode::UNPROCESSABLE_ENTITY)?;

    let plan_interested = match claims.plan {
        PlanTier::Free    => Some("starter"),
        PlanTier::Starter => Some("growth"),
        _                 => None,
    };

    sqlx::query(
        r#"INSERT INTO contact_requests (id, tenant_id, name, email, company, request_type, plan_interested, message)
           VALUES ($1, $2, $3, $4, $5, $6::contact_type, $7::plan_tier, $8)"#,
    )
    .bind(Uuid::new_v4())
    .bind(claims.tenant_id)
    .bind(&body.name)
    .bind(&body.email)
    .bind(body.company.as_deref())
    .bind(body.request_type.as_str())
    .bind(plan_interested)
    .bind(&body.message)
    .execute(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(StatusCode::CREATED)
}

// ---------------------------------------------------------------------------
// All plans list (for upgrade modal)
// ---------------------------------------------------------------------------

#[derive(Serialize, sqlx::FromRow)]
pub struct PlanRow {
    pub display_name: String,
    pub monthly_price_inr: i32,
    pub max_seats: i32,
    pub max_interviews_per_month: i32,
    pub max_candidates: i32,
    pub features: serde_json::Value,
}

pub async fn list_plans(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<PlanRow>>, StatusCode> {
    let rows = sqlx::query_as::<_, PlanRow>(
        "SELECT display_name, monthly_price_inr, max_seats, max_interviews_per_month, max_candidates, features FROM subscription_plans ORDER BY rank ASC"
    )
    .fetch_all(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}
