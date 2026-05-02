use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::{models::AuthClaims, AppState};

#[derive(Debug, Deserialize)]
pub struct CodeSubmission {
    pub language: String,
    pub code: String,
}

pub async fn get_coding_challenge(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(session_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let row = sqlx::query!(
        "SELECT it.coding_challenge FROM interview_sessions s
         JOIN interview_templates it ON it.id = s.template_id
         WHERE s.id = $1 AND s.tenant_id = $2",
        session_id,
        claims.sub
    )
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))))?;

    Ok(Json(json!({ "challenge": row.coding_challenge })))
}

pub async fn submit_code(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<CodeSubmission>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Verify session belongs to tenant
    let session = sqlx::query!(
        "SELECT analysis FROM interview_sessions WHERE id = $1 AND tenant_id = $2",
        session_id,
        claims.sub
    )
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))))?;

    // Merge code submission into session analysis
    let mut analysis = session.analysis.unwrap_or(json!({}));
    if let Some(obj) = analysis.as_object_mut() {
        obj.insert(
            "coding_submission".to_string(),
            json!({
                "language": req.language,
                "code": req.code,
                "submitted_at": Utc::now().to_rfc3339(),
            }),
        );
    }

    sqlx::query!(
        "UPDATE interview_sessions SET analysis = $1, updated_at = $2 WHERE id = $3",
        analysis,
        Utc::now(),
        session_id
    )
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "message": "Code submitted successfully" })))
}
