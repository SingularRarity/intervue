use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect},
};
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    auth::create_token,
    models::{AuthClaims, Tenant},
    AppState,
};

const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v3/userinfo";

/// GET /api/v1/oauth/google — redirect the browser to Google's consent screen.
pub async fn google_auth(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let (client_id, redirect_uri) = match oauth_params(&state) {
        Some(p) => p,
        None => {
            return Redirect::to(&format!(
                "{}/login?error=Google+OAuth+not+configured",
                state.config.frontend_url
            ))
            .into_response()
        }
    };

    let url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope=email+profile&access_type=offline&prompt=select_account",
        GOOGLE_AUTH_URL,
        urlencoding::encode(&client_id),
        urlencoding::encode(&redirect_uri),
    );

    Redirect::to(&url).into_response()
}

#[derive(Debug, Deserialize)]
pub struct OAuthCallbackQuery {
    pub code: Option<String>,
    pub error: Option<String>,
}

/// GET /api/v1/oauth/google/callback — Google redirects here after consent.
pub async fn google_callback(
    State(state): State<Arc<AppState>>,
    Query(query): Query<OAuthCallbackQuery>,
) -> impl IntoResponse {
    let frontend_url = &state.config.frontend_url;

    if let Some(err) = query.error {
        return Redirect::to(&format!(
            "{}/oauth/callback?error={}",
            frontend_url,
            urlencoding::encode(&err)
        ))
        .into_response();
    }

    let code = match query.code {
        Some(c) => c,
        None => {
            return Redirect::to(&format!(
                "{}/oauth/callback?error=No+authorization+code",
                frontend_url
            ))
            .into_response()
        }
    };

    let (client_id, redirect_uri) = match oauth_params(&state) {
        Some(p) => p,
        None => {
            return Redirect::to(&format!(
                "{}/oauth/callback?error=OAuth+not+configured",
                frontend_url
            ))
            .into_response()
        }
    };

    let client_secret = state.config.google_client_secret.clone().unwrap_or_default();

    // Exchange code for access token
    let token_res = match exchange_code(&code, &client_id, &client_secret, &redirect_uri).await {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("OAuth token exchange failed: {e}");
            return Redirect::to(&format!(
                "{}/oauth/callback?error=Token+exchange+failed",
                frontend_url
            ))
            .into_response();
        }
    };

    // Fetch user info from Google
    let user_info = match fetch_user_info(&token_res.access_token).await {
        Ok(u) => u,
        Err(e) => {
            tracing::error!("OAuth userinfo fetch failed: {e}");
            return Redirect::to(&format!(
                "{}/oauth/callback?error=Could+not+fetch+user+info",
                frontend_url
            ))
            .into_response();
        }
    };

    let email = user_info.email;
    let name = user_info
        .name
        .unwrap_or_else(|| email.split('@').next().unwrap_or("User").to_string());

    // Find or create tenant
    let tenant = match find_or_create_tenant(&state, &email, &name).await {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("OAuth tenant upsert failed: {e}");
            return Redirect::to(&format!(
                "{}/oauth/callback?error=Account+setup+failed",
                frontend_url
            ))
            .into_response();
        }
    };

    let claims = AuthClaims {
        sub: tenant.id,
        email: tenant.email.clone(),
        exp: (Utc::now() + chrono::Duration::days(30)).timestamp() as usize,
        iat: Utc::now().timestamp() as usize,
    };

    let jwt = match create_token(&claims, &state.config.jwt_secret) {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("JWT creation failed: {e}");
            return Redirect::to(&format!(
                "{}/oauth/callback?error=Auth+token+failed",
                frontend_url
            ))
            .into_response();
        }
    };

    Redirect::to(&format!(
        "{}/oauth/callback?token={}",
        frontend_url,
        urlencoding::encode(&jwt)
    ))
    .into_response()
}

// --- helpers ---

fn oauth_params(state: &AppState) -> Option<(String, String)> {
    let client_id = state.config.google_client_id.clone()?;
    let redirect_uri = format!("{}/api/v1/oauth/google/callback", backend_base(state));
    Some((client_id, redirect_uri))
}

fn backend_base(state: &AppState) -> String {
    // In Docker / production the backend is on port 8080; dev proxy makes it transparent.
    // We derive the backend base from the request host in an ideal world, but for simplicity
    // we use the env-configured BACKEND_URL or fall back to localhost:8080.
    std::env::var("BACKEND_URL").unwrap_or_else(|_| "http://localhost:8080".to_string())
}

#[derive(Debug, serde::Deserialize)]
struct TokenResponse {
    access_token: String,
}

#[derive(Debug, serde::Deserialize)]
struct UserInfo {
    email: String,
    name: Option<String>,
}

async fn exchange_code(
    code: &str,
    client_id: &str,
    client_secret: &str,
    redirect_uri: &str,
) -> anyhow::Result<TokenResponse> {
    let client = reqwest::Client::new();
    let res = client
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("code", code),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("redirect_uri", redirect_uri),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await?;

    let body: serde_json::Value = res.json().await?;
    let access_token = body["access_token"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("No access_token in response: {body}"))?
        .to_string();

    Ok(TokenResponse { access_token })
}

async fn fetch_user_info(access_token: &str) -> anyhow::Result<UserInfo> {
    let client = reqwest::Client::new();
    let res = client
        .get(GOOGLE_USERINFO_URL)
        .bearer_auth(access_token)
        .send()
        .await?;
    let info: UserInfo = res.json().await?;
    Ok(info)
}

async fn find_or_create_tenant(
    state: &AppState,
    email: &str,
    name: &str,
) -> anyhow::Result<Tenant> {
    // Try existing
    if let Some(tenant) = sqlx::query_as::<_, Tenant>(
        "SELECT * FROM tenants WHERE email = $1 AND is_active = true",
    )
    .bind(email)
    .fetch_optional(state.db.pool())
    .await?
    {
        return Ok(tenant);
    }

    // Create new tenant with empty password hash (OAuth users have no password)
    let tenant_id = Uuid::new_v4();
    let now = Utc::now();
    let tenant = sqlx::query_as::<_, Tenant>(
        r#"
        INSERT INTO tenants (id, company_name, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, '', $4, $5)
        RETURNING *
        "#,
    )
    .bind(tenant_id)
    .bind(name)
    .bind(email)
    .bind(now)
    .bind(now)
    .fetch_one(state.db.pool())
    .await?;

    Ok(tenant)
}
