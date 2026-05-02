use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
    body::Body,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use std::sync::Arc;

use crate::{
    models::AuthClaims,
    AppState,
};

pub fn create_token(claims: &AuthClaims, secret: &str) -> anyhow::Result<String> {
    let token = encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?;
    Ok(token)
}

pub fn verify_token(token: &str, secret: &str) -> anyhow::Result<AuthClaims> {
    let token_data = decode::<AuthClaims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}

pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let path = request.uri().path();

    // Skip auth for public routes
    if path == "/health"
        || (path == "/api/v1/tenants" && request.method() == axum::http::Method::POST)
        || path == "/api/v1/tenants/login"
        || path.starts_with("/api/v1/candidate-portal/")
    {
        return Ok(next.run(request).await);
    }

    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "));

    let token = match auth_header {
        Some(token) => token,
        None => return Err(StatusCode::UNAUTHORIZED),
    };

    let claims = match verify_token(token, &state.config.jwt_secret) {
        Ok(claims) => claims,
        Err(_) => return Err(StatusCode::UNAUTHORIZED),
    };

    // Verify tenant exists and is active
    let tenant = sqlx::query_as::<_, crate::models::Tenant>(
        "SELECT * FROM tenants WHERE id = $1 AND is_active = true"
    )
    .bind(claims.sub)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if tenant.is_none() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    request.extensions_mut().insert(claims);
    Ok(next.run(request).await)
}

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = argon2::password_hash::SaltString::generate(&mut rand::thread_rng());
    let argon2 = argon2::Argon2::default();
    let password_hash = argon2::PasswordHash::generate(argon2, password, &salt)
        .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?
        .to_string();
    Ok(password_hash)
}

pub fn verify_password(password: &str, hash: &str) -> anyhow::Result<bool> {
    let argon2 = argon2::Argon2::default();
    let parsed_hash = argon2::PasswordHash::new(hash)
        .map_err(|e| anyhow::anyhow!("Invalid hash: {}", e))?;
    Ok(argon2::PasswordVerifier::verify_password(&argon2, password, &parsed_hash).is_ok())
}
