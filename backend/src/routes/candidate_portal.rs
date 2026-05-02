use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, sqlx::FromRow)]
struct SessionPortalRow {
    id: Uuid,
    status: String,
    scheduled_at: Option<chrono::DateTime<chrono::Utc>>,
    session_type: Option<String>,
    candidate_name: String,
    template_title: String,
    duration_minutes: i32,
    language: String,
    company_name: String,
    branding_config: Option<serde_json::Value>,
}

/// Public endpoint — no JWT required. Candidate accesses via emailed token link.
pub async fn get_session_by_token(
    State(state): State<Arc<AppState>>,
    Path(token): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let row = sqlx::query_as::<_, SessionPortalRow>(
        "SELECT s.id, s.status::text as status, s.scheduled_at, s.session_type,
                c.name as candidate_name,
                it.title as template_title, it.duration_minutes, it.language,
                t.company_name, t.branding_config
         FROM interview_sessions s
         JOIN candidates c ON c.id = s.candidate_id
         JOIN interview_templates it ON it.id = s.template_id
         JOIN tenants t ON t.id = s.tenant_id
         WHERE s.candidate_token = $1"
    )
    .bind(&token)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?
    .ok_or((StatusCode::NOT_FOUND, Json(json!({ "error": "Invalid or expired link" }))))?;

    Ok(Json(json!({
        "session_id": row.id,
        "status": row.status,
        "session_type": row.session_type,
        "scheduled_at": row.scheduled_at,
        "candidate_name": row.candidate_name,
        "template_title": row.template_title,
        "duration_minutes": row.duration_minutes,
        "language": row.language,
        "company_name": row.company_name,
        "branding": row.branding_config.unwrap_or(json!({})),
    })))
}

/// Generate (or regenerate) a candidate invite token for a session.
pub async fn generate_candidate_token(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<crate::models::AuthClaims>,
    Path(session_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let token = Uuid::new_v4().to_string().replace('-', "");

    sqlx::query(
        "UPDATE interview_sessions SET candidate_token = $1 WHERE id = $2 AND tenant_id = $3"
    )
    .bind(&token)
    .bind(session_id)
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({
        "token": token,
        "invite_url": format!("/candidate/{}", token),
    })))
}
