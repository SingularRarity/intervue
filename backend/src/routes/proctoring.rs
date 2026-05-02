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
pub struct LogEventRequest {
    pub event_type: String, // tab_away | tab_return | face_lost | face_detected
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, sqlx::FromRow)]
struct ProctoringEvent {
    event_type: String,
    occurred_at: chrono::DateTime<Utc>,
    metadata: Option<serde_json::Value>,
}

pub async fn get_proctoring_summary(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(session_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Verify session belongs to tenant
    sqlx::query(
        "SELECT id FROM interview_sessions WHERE id = $1 AND tenant_id = $2"
    )
    .bind(session_id)
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))))?;

    let events = sqlx::query_as::<_, ProctoringEvent>(
        "SELECT event_type, occurred_at, metadata \
         FROM proctoring_events WHERE session_id = $1 ORDER BY occurred_at"
    )
    .bind(session_id)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let tab_away_count = events.iter().filter(|e| e.event_type == "tab_away").count();
    let face_lost_count = events.iter().filter(|e| e.event_type == "face_lost").count();

    let events_json: Vec<_> = events
        .iter()
        .map(|e| json!({ "type": e.event_type, "at": e.occurred_at, "meta": e.metadata }))
        .collect();

    Ok(Json(json!({
        "session_id": session_id,
        "tab_away_count": tab_away_count,
        "face_lost_count": face_lost_count,
        "risk_level": if tab_away_count + face_lost_count > 5 { "high" }
                      else if tab_away_count + face_lost_count > 2 { "medium" }
                      else { "low" },
        "events": events_json,
    })))
}

pub async fn log_proctoring_event(
    State(state): State<Arc<AppState>>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<LogEventRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let valid_types = ["tab_away", "tab_return", "face_lost", "face_detected"];
    if !valid_types.contains(&req.event_type.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid event_type" })),
        ));
    }

    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO proctoring_events (id, session_id, event_type, occurred_at, metadata) \
         VALUES ($1, $2, $3, $4, $5)"
    )
    .bind(id)
    .bind(session_id)
    .bind(&req.event_type)
    .bind(Utc::now())
    .bind(req.metadata)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "logged": true, "id": id })))
}
