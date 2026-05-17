//! Refresh-token endpoints (H4).
//!
//!   POST /api/v1/auth/refresh  { refresh_token }  -> { token, refresh_token }
//!   POST /api/v1/auth/logout   { refresh_token }  -> { ok: true }
//!
//! Refresh tokens are single-use: every successful refresh rotates the token
//! (old one revoked, new one issued). Detecting reuse of a revoked token is a
//! strong signal of theft.

use axum::{extract::State, http::StatusCode, response::Json};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::{generate_refresh_token, hash_refresh_token, issue_access_token, REFRESH_TOKEN_TTL_DAYS},
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Issue a new access token (and rotate the refresh token).
pub async fn refresh(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let hash = hash_refresh_token(&req.refresh_token);

    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        tenant_id: Uuid,
        expires_at: chrono::DateTime<chrono::Utc>,
        revoked: bool,
    }

    let row: Option<Row> = sqlx::query_as(
        "SELECT id, tenant_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1",
    )
    .bind(&hash)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|e| {
        tracing::error!("refresh lookup failed: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
    })?;

    let row = row.ok_or((
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Invalid refresh token" })),
    ))?;

    if row.revoked {
        // Reuse of a revoked token — possible theft. Revoke the whole tenant's tokens.
        tracing::warn!("revoked refresh token reused for tenant {}", row.tenant_id);
        let _ = sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE tenant_id = $1")
            .bind(row.tenant_id)
            .execute(state.db.pool())
            .await;
        return Err((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Token revoked" }))));
    }

    if row.expires_at < chrono::Utc::now() {
        return Err((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Token expired" }))));
    }

    // Tenant must still exist + be active.
    let tenant: Option<(String, bool)> =
        sqlx::query_as("SELECT email, is_active FROM tenants WHERE id = $1")
            .bind(row.tenant_id)
            .fetch_optional(state.db.pool())
            .await
            .map_err(|e| {
                tracing::error!("refresh tenant lookup failed: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
            })?;

    let (email, active) = tenant.ok_or((
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Account not found" })),
    ))?;
    if !active {
        return Err((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Account disabled" }))));
    }

    // Rotate: revoke the used token, mint a new one.
    let (new_plain, new_hash) = generate_refresh_token();
    let new_expiry = chrono::Utc::now() + chrono::Duration::days(REFRESH_TOKEN_TTL_DAYS);

    let mut tx = state.db.pool().begin().await.map_err(|e| {
        tracing::error!("refresh tx begin failed: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
    })?;

    sqlx::query("UPDATE refresh_tokens SET revoked = true, last_used_at = NOW() WHERE id = $1")
        .bind(row.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            tracing::error!("refresh revoke failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
        })?;

    sqlx::query(
        "INSERT INTO refresh_tokens (tenant_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    )
    .bind(row.tenant_id)
    .bind(&new_hash)
    .bind(new_expiry)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        tracing::error!("refresh insert failed: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
    })?;

    tx.commit().await.map_err(|e| {
        tracing::error!("refresh tx commit failed: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
    })?;

    let access = issue_access_token(row.tenant_id, &email, &state.config.jwt_secret)
        .map_err(|e| {
            tracing::error!("access token mint failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
        })?;

    Ok(Json(json!({ "token": access, "refresh_token": new_plain })))
}

/// Revoke a refresh token (logout).
pub async fn logout(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let hash = hash_refresh_token(&req.refresh_token);
    let _ = sqlx::query("UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1")
        .bind(&hash)
        .execute(state.db.pool())
        .await
        .map_err(|e| {
            tracing::error!("logout revoke failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Internal error" })))
        })?;
    Ok(Json(json!({ "ok": true })))
}

/// Helper used by login/register/oauth to mint + persist a refresh token.
pub async fn issue_refresh_token(
    state: &AppState,
    tenant_id: Uuid,
) -> anyhow::Result<String> {
    let (plain, hash) = generate_refresh_token();
    let expiry = chrono::Utc::now() + chrono::Duration::days(REFRESH_TOKEN_TTL_DAYS);
    sqlx::query("INSERT INTO refresh_tokens (tenant_id, token_hash, expires_at) VALUES ($1, $2, $3)")
        .bind(tenant_id)
        .bind(&hash)
        .bind(expiry)
        .execute(state.db.pool())
        .await?;
    Ok(plain)
}
