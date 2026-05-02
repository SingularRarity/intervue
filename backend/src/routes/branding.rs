use axum::{extract::State, http::StatusCode, response::Json};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;

use crate::{models::AuthClaims, AppState};

#[derive(Debug, Serialize, Deserialize)]
pub struct BrandingConfig {
    pub logo_url: Option<String>,
    pub primary_color: Option<String>, // hex e.g. "#6366f1"
    pub company_display_name: Option<String>,
    pub custom_domain: Option<String>,
    pub support_email: Option<String>,
}

pub async fn get_branding(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let row = sqlx::query_as::<_, (Option<serde_json::Value>,)>(
        "SELECT branding_config FROM tenants WHERE id = $1"
    )
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "branding": row.0.unwrap_or(json!({})) })))
}

pub async fn update_branding(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(config): Json<BrandingConfig>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query(
        "UPDATE tenants SET branding_config = $1, updated_at = $2 WHERE id = $3"
    )
    .bind(serde_json::to_value(&config).unwrap())
    .bind(Utc::now())
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "message": "Branding updated" })))
}
