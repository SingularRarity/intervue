use axum::{
    extract::{State, Json},
    http::StatusCode,
};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

use validator::Validate;

use crate::{
    AppState,
    auth::{hash_password, verify_password},
    models::*,
};

pub async fn create_tenant(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreateTenantRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Validate request
    if let Err(errors) = req.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": format!("Validation failed: {:?}", errors) })),
        ));
    }

    // Check if email exists
    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM tenants WHERE email = $1")
        .bind(&req.email)
        .fetch_one(state.db.pool())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    if existing > 0 {
        return Err((
            StatusCode::CONFLICT,
            Json(json!({ "error": "Email already registered" })),
        ));
    }

    let password_hash = hash_password(&req.password)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let tenant_id = Uuid::new_v4();
    let tenant = sqlx::query_as::<_, Tenant>(
        r#"
        INSERT INTO tenants (id, company_name, email, password_hash, website, industry, company_size, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(tenant_id)
    .bind(&req.company_name)
    .bind(&req.email)
    .bind(&password_hash)
    .bind(&req.website)
    .bind(&req.industry)
    .bind(&req.company_size)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let token = crate::auth::issue_access_token(tenant.id, &tenant.email, &state.config.jwt_secret)
        .map_err(|e| {
            tracing::error!("register token mint failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Registration failed" })))
        })?;

    let refresh_token = crate::routes::auth_tokens::issue_refresh_token(&state, tenant.id)
        .await
        .map_err(|e| {
            tracing::error!("register refresh-token issue failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Registration failed" })))
        })?;

    Ok(Json(json!({
        "token": token,
        "refresh_token": refresh_token,
        "tenant": TenantResponse::from(tenant),
    })))
}

pub async fn login_tenant(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let tenant = sqlx::query_as::<_, Tenant>("SELECT * FROM tenants WHERE email = $1 AND is_active = true")
        .bind(&req.email)
        .fetch_optional(state.db.pool())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?
        .ok_or((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Invalid credentials" }))))?;

    let valid = verify_password(&req.password, &tenant.password_hash)
        .map_err(|_| (StatusCode::UNAUTHORIZED, Json(json!({ "error": "Invalid credentials" }))))?;

    if !valid {
        return Err((StatusCode::UNAUTHORIZED, Json(json!({ "error": "Invalid credentials" }))));
    }

    let token = crate::auth::issue_access_token(tenant.id, &tenant.email, &state.config.jwt_secret)
        .map_err(|e| {
            tracing::error!("login token mint failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Login failed" })))
        })?;

    let refresh_token = crate::routes::auth_tokens::issue_refresh_token(&state, tenant.id)
        .await
        .map_err(|e| {
            tracing::error!("login refresh-token issue failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Login failed" })))
        })?;

    Ok(Json(json!({
        "token": token,
        "refresh_token": refresh_token,
        "tenant": TenantResponse::from(tenant),
    })))
}

pub async fn get_current_tenant(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<TenantResponse>, (StatusCode, Json<serde_json::Value>)> {
    let tenant = sqlx::query_as::<_, Tenant>("SELECT * FROM tenants WHERE id = $1")
        .bind(claims.sub)
        .fetch_one(state.db.pool())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(TenantResponse::from(tenant)))
}

pub async fn update_api_keys(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<UpdateApiKeysRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query(
        "UPDATE tenants SET claude_api_key = $1, sarvam_api_key = $2, groq_api_key = $3, updated_at = $4 WHERE id = $5"
    )
    .bind(&req.claude_api_key)
    .bind(&req.sarvam_api_key)
    .bind(&req.groq_api_key)
    .bind(Utc::now())
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "message": "API keys updated successfully" })))
}
