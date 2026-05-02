use axum::{extract::State, http::StatusCode, response::Json};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::Arc;

use crate::{models::AuthClaims, AppState};

#[derive(Debug, Deserialize)]
pub struct ParseResumeRequest {
    pub resume_text: String,
}

#[derive(Debug, Serialize)]
pub struct ParsedResume {
    pub name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub current_role: Option<String>,
    pub experience_years: Option<f32>,
    pub skills: Vec<String>,
    pub summary: Option<String>,
}

pub async fn parse_resume(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<ParseResumeRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let tenant = sqlx::query!(
        "SELECT claude_api_key FROM tenants WHERE id = $1",
        claims.sub
    )
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let api_key = tenant.claude_api_key.ok_or((
        StatusCode::BAD_REQUEST,
        Json(json!({ "error": "Claude API key not configured" })),
    ))?;

    let prompt = format!(
        "Extract structured candidate information from the following resume text. \
        Return a JSON object with these fields: \
        name (string), email (string), phone (string), current_role (string), \
        experience_years (number), skills (array of strings), summary (string). \
        Use null for missing fields. Resume:\n\n{}",
        req.resume_text
    );

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&json!({
            "model": "claude-3-5-sonnet-20241022",
            "max_tokens": 1024,
            "messages": [{ "role": "user", "content": prompt }]
        }))
        .send()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, Json(json!({ "error": e.to_string() }))))?;

    let body: serde_json::Value = response
        .json()
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, Json(json!({ "error": e.to_string() }))))?;

    let content = body["content"][0]["text"]
        .as_str()
        .unwrap_or("{}")
        .to_string();

    // Extract JSON from Claude's response (it may be wrapped in markdown code fences)
    let json_str = content
        .trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    let parsed: serde_json::Value = serde_json::from_str(json_str)
        .unwrap_or_else(|_| json!({ "skills": [], "summary": content }));

    Ok(Json(json!({ "parsed": parsed })))
}
