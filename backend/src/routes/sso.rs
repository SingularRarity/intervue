use axum::{extract::State, http::StatusCode, response::Json};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;

use crate::{models::AuthClaims, AppState};

#[derive(Debug, Serialize, Deserialize)]
pub struct SsoConfig {
    pub provider: Option<String>, // google | github | saml
    pub client_id: Option<String>,
    pub client_secret: Option<String>,
    pub saml_metadata_url: Option<String>,
    pub enabled: bool,
}

pub async fn get_sso_config(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let row = sqlx::query!("SELECT sso_config FROM tenants WHERE id = $1", claims.sub)
        .fetch_one(state.db.pool())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    // Strip secrets from response
    let mut config = row.sso_config.unwrap_or(json!({ "enabled": false }));
    if let Some(obj) = config.as_object_mut() {
        obj.remove("client_secret");
    }

    Ok(Json(json!({ "sso_config": config })))
}

pub async fn update_sso_config(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(config): Json<SsoConfig>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query!(
        "UPDATE tenants SET sso_config = $1, updated_at = $2 WHERE id = $3",
        serde_json::to_value(&config).unwrap(),
        Utc::now(),
        claims.sub
    )
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "message": "SSO config updated" })))
}
