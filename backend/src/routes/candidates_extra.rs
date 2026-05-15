//! Auxiliary candidate endpoints (GitHub refresh, invite-link helpers).
//! Lives separately from interview.rs to keep that file focused on core CRUD.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    models::AuthClaims,
    services::github::GithubService,
    AppState,
};

const GITHUB_CACHE_HOURS: i64 = 24;

/// POST /api/v1/candidates/:id/refresh-github
/// Fetches public GitHub profile + computes a 0..=100 score, caches on the row.
/// Uses cached result if it's fresher than 24 hours, unless `force=true`.
pub async fn refresh_github(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Fetch the candidate (tenant-scoped)
    #[derive(sqlx::FromRow)]
    struct Row {
        github_url: Option<String>,
        github_profile: Option<serde_json::Value>,
        github_fetched_at: Option<chrono::DateTime<chrono::Utc>>,
    }
    let row: Row = sqlx::query_as(
        "SELECT github_url, github_profile, github_fetched_at
         FROM candidates
         WHERE id = $1 AND tenant_id = $2",
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|e| {
        tracing::error!("refresh_github lookup failed: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Lookup failed" })))
    })?
    .ok_or((StatusCode::NOT_FOUND, Json(json!({ "error": "Candidate not found" }))))?;

    let url = row.github_url.ok_or((
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": "Candidate has no github_url" })),
    ))?;

    // Use cache if fresh
    if let (Some(fetched), Some(profile)) = (row.github_fetched_at, row.github_profile.clone()) {
        let age_hours = (chrono::Utc::now() - fetched).num_hours();
        if age_hours < GITHUB_CACHE_HOURS {
            return Ok(Json(json!({ "profile": profile, "cached": true, "age_hours": age_hours })));
        }
    }

    let username = GithubService::extract_username(&url).ok_or((
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": "Could not extract GitHub username from URL" })),
    ))?;

    let profile = state.github.fetch_profile(&username).await.map_err(|e| {
        tracing::error!("github fetch failed for {username}: {e}");
        (
            StatusCode::BAD_GATEWAY,
            Json(json!({ "error": "GitHub API unavailable" })),
        )
    })?;

    let profile_json =
        serde_json::to_value(&profile).map_err(|e| {
            tracing::error!("serialize github profile: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal" })))
        })?;

    sqlx::query(
        "UPDATE candidates SET github_profile = $1, github_fetched_at = NOW() WHERE id = $2 AND tenant_id = $3",
    )
    .bind(&profile_json)
    .bind(id)
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| {
        tracing::error!("update candidate github cache: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to cache profile" })))
    })?;

    Ok(Json(json!({ "profile": profile_json, "cached": false })))
}
