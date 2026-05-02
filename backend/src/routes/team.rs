use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::{models::AuthClaims, AppState};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct TeamMember {
    pub id: Uuid,
    pub email: String,
    pub role: String,
    pub invited_at: chrono::DateTime<Utc>,
    pub accepted_at: Option<chrono::DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct InviteRequest {
    pub email: String,
    pub role: String, // admin | recruiter | viewer
}

pub async fn list_team(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let members = sqlx::query_as::<_, TeamMember>(
        "SELECT id, email, role, invited_at, accepted_at \
         FROM team_members WHERE tenant_id = $1 ORDER BY invited_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "members": members })))
}

pub async fn invite_member(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<InviteRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let valid_roles = ["admin", "recruiter", "viewer"];
    if !valid_roles.contains(&req.role.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "role must be admin, recruiter, or viewer" })),
        ));
    }

    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO team_members (id, tenant_id, email, role, invited_at) \
         VALUES ($1, $2, $3, $4, $5) \
         ON CONFLICT (tenant_id, email) DO UPDATE SET role = $4"
    )
    .bind(id)
    .bind(claims.sub)
    .bind(&req.email)
    .bind(&req.role)
    .bind(Utc::now())
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({
        "message": "Team member invited",
        "id": id,
        "email": req.email,
        "role": req.role,
    })))
}

pub async fn remove_member(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(member_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let rows = sqlx::query(
        "DELETE FROM team_members WHERE id = $1 AND tenant_id = $2"
    )
    .bind(member_id)
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    if rows.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(json!({ "error": "Member not found" }))));
    }

    Ok(Json(json!({ "message": "Team member removed" })))
}
