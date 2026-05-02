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

#[derive(Debug, Serialize, Deserialize)]
pub struct AtsConfig {
    pub greenhouse_webhook: Option<String>,
    pub lever_webhook: Option<String>,
}

pub async fn get_ats_config(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let row = sqlx::query_as::<_, (Option<serde_json::Value>,)>(
        "SELECT ats_config FROM tenants WHERE id = $1"
    )
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "ats_config": row.0.unwrap_or(json!({})) })))
}

pub async fn update_ats_config(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(config): Json<AtsConfig>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query(
        "UPDATE tenants SET ats_config = $1, updated_at = $2 WHERE id = $3"
    )
    .bind(serde_json::to_value(&config).unwrap())
    .bind(Utc::now())
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "message": "ATS config updated" })))
}

#[derive(Debug, sqlx::FromRow)]
struct AtsPushRow {
    ats_config: Option<serde_json::Value>,
    analysis: Option<serde_json::Value>,
    overall_score: Option<f32>,
    recommendation: Option<String>,
    candidate_name: String,
    candidate_email: String,
}

pub async fn push_to_ats(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(session_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Fetch tenant ATS config and session results
    let row = sqlx::query_as::<_, AtsPushRow>(
        "SELECT t.ats_config, s.analysis, s.overall_score, s.recommendation, \
                c.name as candidate_name, c.email as candidate_email
         FROM tenants t
         JOIN interview_sessions s ON s.tenant_id = t.id
         JOIN candidates c ON c.id = s.candidate_id
         WHERE t.id = $1 AND s.id = $2"
    )
    .bind(claims.sub)
    .bind(session_id)
    .fetch_one(state.db.pool())
    .await
    .map_err(|_| (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))))?;

    let config: AtsConfig = row
        .ats_config
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or(AtsConfig { greenhouse_webhook: None, lever_webhook: None });

    let payload = json!({
        "session_id": session_id,
        "candidate_name": row.candidate_name,
        "candidate_email": row.candidate_email,
        "overall_score": row.overall_score,
        "recommendation": row.recommendation,
        "analysis": row.analysis,
        "pushed_at": Utc::now().to_rfc3339(),
    });

    let client = reqwest::Client::new();
    let mut pushed_to: Vec<&str> = vec![];

    if let Some(ref url) = config.greenhouse_webhook {
        let _ = client.post(url).json(&payload).send().await;
        pushed_to.push("greenhouse");
    }
    if let Some(ref url) = config.lever_webhook {
        let _ = client.post(url).json(&payload).send().await;
        pushed_to.push("lever");
    }

    if pushed_to.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "No ATS webhooks configured" })),
        ));
    }

    Ok(Json(json!({ "message": "Pushed to ATS", "pushed_to": pushed_to })))
}
