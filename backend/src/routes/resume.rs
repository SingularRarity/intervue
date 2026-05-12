use axum::{extract::State, http::StatusCode, response::Json};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;

use crate::{models::AuthClaims, AppState};
use crate::routes::interview::{extract_text_from_docx, extract_text_from_pdf};

#[derive(Debug, Deserialize)]
pub struct ParseResumeRequest {
    pub resume_text: String,
}

async fn resolve_and_parse(
    state: &AppState,
    tenant_id: uuid::Uuid,
    resume_text: &str,
) -> Result<serde_json::Value, (StatusCode, Json<serde_json::Value>)> {
    let tenant = sqlx::query_as::<_, crate::models::Tenant>(
        "SELECT * FROM tenants WHERE id = $1"
    )
    .bind(tenant_id)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let (use_groq, api_key) = if let Some(k) = tenant.groq_api_key
        .or_else(|| state.config.platform_groq_key.clone())
    {
        (true, k)
    } else if let Some(k) = tenant.claude_api_key
        .or_else(|| state.config.platform_claude_key.clone())
    {
        (false, k)
    } else {
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": "No AI API key configured. Add a Groq key in Settings." }))));
    };

    let parsed = if use_groq {
        state.groq.parse_resume(&api_key, resume_text).await
    } else {
        state.claude.parse_resume(&api_key, resume_text).await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(json!({ "parsed": parsed }))
}

pub async fn parse_resume(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<ParseResumeRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let result = resolve_and_parse(&state, claims.sub, &req.resume_text).await?;
    Ok(Json(result))
}

pub async fn parse_resume_file(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    mut multipart: axum::extract::Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut filename = String::new();
    let mut file_bytes: Vec<u8> = Vec::new();

    while let Some(field) = multipart.next_field().await
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))? {
        if field.name() == Some("file") {
            filename = field.file_name().unwrap_or("file.txt").to_string().to_lowercase();
            file_bytes = field.bytes().await
                .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?
                .to_vec();
            break;
        }
    }

    if file_bytes.is_empty() {
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": "No file uploaded" }))));
    }

    let resume_text: String = if filename.ends_with(".docx") || filename.ends_with(".doc") {
        extract_text_from_docx(&file_bytes)
            .map_err(|e| (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({ "error": format!("Could not read Word document: {}", e) }))))?
    } else if filename.ends_with(".pdf") {
        extract_text_from_pdf(&file_bytes)
            .map_err(|e| (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({ "error": format!("Could not read PDF: {}", e) }))))?
    } else {
        String::from_utf8(file_bytes)
            .map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "File is not valid UTF-8 text" }))))?
    };

    if resume_text.trim().is_empty() {
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": "Could not extract any text from the file" }))));
    }

    let result = resolve_and_parse(&state, claims.sub, &resume_text).await?;
    Ok(Json(result))
}
