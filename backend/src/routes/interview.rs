use axum::{
    extract::{State, Path, Json},
    http::StatusCode,
};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

use validator::Validate;

use serde::Deserialize;

use crate::{
    AppState,
    models::*,
};

// ============== INTERVIEW TEMPLATES ==============

pub async fn create_interview_template(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<CreateInterviewTemplateRequest>,
) -> Result<Json<InterviewTemplate>, (StatusCode, Json<serde_json::Value>)> {
    if let Err(errors) = req.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": format!("Validation failed: {:?}", errors) })),
        ));
    }

    let custom_questions = req.custom_questions.map(|q| serde_json::to_value(q).unwrap_or_default());

    let template = sqlx::query_as::<_, InterviewTemplate>(
        r#"
        INSERT INTO interview_templates 
        (id, tenant_id, title, description, interview_type, difficulty, duration_minutes, language, topics, custom_questions, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12)
        RETURNING *
        "#
    )
    .bind(Uuid::new_v4())
    .bind(claims.sub)
    .bind(&req.title)
    .bind(&req.description)
    .bind(req.interview_type)
    .bind(req.difficulty)
    .bind(req.duration_minutes)
    .bind(&req.language)
    .bind(&req.topics)
    .bind(custom_questions)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(template))
}

pub async fn list_interview_templates(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<Vec<InterviewTemplate>>, (StatusCode, Json<serde_json::Value>)> {
    let templates = sqlx::query_as::<_, InterviewTemplate>(
        "SELECT * FROM interview_templates WHERE tenant_id = $1 ORDER BY created_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(templates))
}

pub async fn get_interview_template(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
) -> Result<Json<InterviewTemplate>, (StatusCode, Json<serde_json::Value>)> {
    let template = sqlx::query_as::<_, InterviewTemplate>(
        "SELECT * FROM interview_templates WHERE id = $1 AND tenant_id = $2"
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, Json(json!({ "error": "Template not found" }))),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))),
    })?;

    Ok(Json(template))
}

pub async fn update_interview_template(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
    Json(req): Json<CreateInterviewTemplateRequest>,
) -> Result<Json<InterviewTemplate>, (StatusCode, Json<serde_json::Value>)> {
    let custom_questions = req.custom_questions.map(|q| serde_json::to_value(q).unwrap_or_default());

    let template = sqlx::query_as::<_, InterviewTemplate>(
        r#"
        UPDATE interview_templates 
        SET title = $1, description = $2, interview_type = $3, difficulty = $4, 
            duration_minutes = $5, language = $6, topics = $7, custom_questions = $8, updated_at = $9
        WHERE id = $10 AND tenant_id = $11
        RETURNING *
        "#
    )
    .bind(&req.title)
    .bind(&req.description)
    .bind(req.interview_type)
    .bind(req.difficulty)
    .bind(req.duration_minutes)
    .bind(&req.language)
    .bind(&req.topics)
    .bind(custom_questions)
    .bind(Utc::now())
    .bind(id)
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, Json(json!({ "error": "Template not found" }))),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))),
    })?;

    Ok(Json(template))
}

pub async fn delete_interview_template(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<serde_json::Value>)> {
    let result = sqlx::query(
        "DELETE FROM interview_templates WHERE id = $1 AND tenant_id = $2"
    )
    .bind(id)
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, Json(json!({ "error": "Template not found" }))));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ============== CANDIDATES ==============

pub async fn create_candidate(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<CreateCandidateRequest>,
) -> Result<Json<Candidate>, (StatusCode, Json<serde_json::Value>)> {
    if let Err(errors) = req.validate() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": format!("Validation failed: {:?}", errors) })),
        ));
    }

    let candidate = sqlx::query_as::<_, Candidate>(
        r#"
        INSERT INTO candidates 
        (id, tenant_id, name, email, phone, resume_text, skills, experience_years, current_position, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
        "#
    )
    .bind(Uuid::new_v4())
    .bind(claims.sub)
    .bind(&req.name)
    .bind(&req.email)
    .bind(&req.phone)
    .bind(&req.resume_text)
    .bind(&req.skills)
    .bind(req.experience_years)
    .bind(&req.current_position)
    .bind(&req.notes)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(candidate))
}

pub async fn list_candidates(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<Vec<Candidate>>, (StatusCode, Json<serde_json::Value>)> {
    let candidates = sqlx::query_as::<_, Candidate>(
        "SELECT * FROM candidates WHERE tenant_id = $1 ORDER BY created_at DESC"
    )
    .bind(claims.sub)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(candidates))
}

pub async fn get_candidate(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
) -> Result<Json<Candidate>, (StatusCode, Json<serde_json::Value>)> {
    let candidate = sqlx::query_as::<_, Candidate>(
        "SELECT * FROM candidates WHERE id = $1 AND tenant_id = $2"
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, Json(json!({ "error": "Candidate not found" }))),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))),
    })?;

    Ok(Json(candidate))
}

// ============== SESSIONS ==============

pub async fn create_session(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Json(req): Json<CreateSessionRequest>,
) -> Result<Json<InterviewSession>, (StatusCode, Json<serde_json::Value>)> {
    let session = sqlx::query_as::<_, InterviewSession>(
        r#"
        INSERT INTO interview_sessions 
        (id, tenant_id, template_id, candidate_id, status, scheduled_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'Scheduled', $5, $6, $7)
        RETURNING *
        "#
    )
    .bind(Uuid::new_v4())
    .bind(claims.sub)
    .bind(req.template_id)
    .bind(req.candidate_id)
    .bind(req.scheduled_at)
    .bind(Utc::now())
    .bind(Utc::now())
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(session))
}

pub async fn get_session(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
) -> Result<Json<InterviewSession>, (StatusCode, Json<serde_json::Value>)> {
    let session = sqlx::query_as::<_, InterviewSession>(
        "SELECT * FROM interview_sessions WHERE id = $1 AND tenant_id = $2"
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))),
    })?;

    Ok(Json(session))
}

pub async fn get_session_results(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let session = sqlx::query_as::<_, InterviewSession>(
        r#"
        SELECT s.*, c.name as candidate_name, t.title as template_title
        FROM interview_sessions s
        JOIN candidates c ON s.candidate_id = c.id
        JOIN interview_templates t ON s.template_id = t.id
        WHERE s.id = $1 AND s.tenant_id = $2
        "#
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))),
    })?;

    let analysis: Option<InterviewResult> = session.analysis.as_ref()
        .and_then(|a| serde_json::from_value(a.clone()).ok());

    Ok(Json(json!({
        "session": session,
        "analysis": analysis,
    })))
}

pub async fn submit_feedback(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(id): Path<Uuid>,
    Json(req): Json<SubmitFeedbackRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    sqlx::query(
        "UPDATE interview_sessions SET recommendation = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4"
    )
    .bind(&req.human_override)
    .bind(Utc::now())
    .bind(id)
    .bind(claims.sub)
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    // Store human feedback separately
    sqlx::query(
        r#"
        INSERT INTO session_feedback (id, session_id, reviewer_notes, human_override, rating, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#
    )
    .bind(Uuid::new_v4())
    .bind(id)
    .bind(&req.reviewer_notes)
    .bind(&req.human_override)
    .bind(req.rating)
    .bind(Utc::now())
    .execute(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({ "message": "Feedback submitted successfully" })))
}

// ---- Text extractors ----

fn extract_text_from_docx(bytes: &[u8]) -> anyhow::Result<String> {
    use std::io::Read;
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;
    let mut xml_file = archive.by_name("word/document.xml")?;
    let mut xml = String::new();
    xml_file.read_to_string(&mut xml)?;
    // Pull text out of <w:t> tags
    let mut text = String::new();
    let mut in_wt = false;
    let mut tag_buf = String::new();
    for ch in xml.chars() {
        match ch {
            '<' => { tag_buf.clear(); tag_buf.push(ch); in_wt = false; }
            '>' => {
                tag_buf.push(ch);
                let tag = tag_buf.trim_start_matches('<').trim_end_matches('>').trim();
                if tag == "w:t" || tag.starts_with("w:t ") { in_wt = true; }
                tag_buf.clear();
            }
            _ if !tag_buf.is_empty() => { tag_buf.push(ch); }
            _ if in_wt => { text.push(ch); }
            ' ' | '\n' | '\r' => { if !text.ends_with(' ') { text.push(' '); } }
            _ => {}
        }
    }
    Ok(text.trim().to_string())
}

fn extract_text_from_pdf(bytes: &[u8]) -> anyhow::Result<String> {
    let doc = lopdf::Document::load_from(bytes)?;
    let pages = doc.get_pages();
    let page_nums: Vec<u32> = pages.keys().copied().collect();
    let mut text = String::new();
    for page_num in page_nums {
        if let Ok(page_text) = doc.extract_text(&[page_num]) {
            text.push_str(&page_text);
            text.push('\n');
        }
    }
    Ok(text.trim().to_string())
}

// ---- parse-jd handler (multipart) ----

pub async fn parse_jd(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    mut multipart: axum::extract::Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    // Collect the file field
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

    // Extract text based on extension
    let jd_text: String = if filename.ends_with(".docx") || filename.ends_with(".doc") {
        extract_text_from_docx(&file_bytes)
            .map_err(|e| (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({ "error": format!("Could not read Word document: {}", e) }))))?
    } else if filename.ends_with(".pdf") {
        extract_text_from_pdf(&file_bytes)
            .map_err(|e| (StatusCode::UNPROCESSABLE_ENTITY, Json(json!({ "error": format!("Could not read PDF: {}", e) }))))?
    } else {
        // .txt or anything else — treat as UTF-8 text
        String::from_utf8(file_bytes)
            .map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "File is not valid UTF-8 text" }))))?
    };

    if jd_text.trim().is_empty() {
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": "Could not extract any text from the file" }))));
    }

    // Resolve Claude key: tenant key → platform key
    let tenant = sqlx::query_as::<_, Tenant>("SELECT * FROM tenants WHERE id = $1")
        .bind(claims.sub)
        .fetch_one(state.db.pool())
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    // Key resolution: tenant's Groq key → platform Groq key → tenant's Claude key → platform Claude key
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

    let result = if use_groq {
        state.groq.parse_jd(&api_key, &jd_text).await
    } else {
        state.claude.parse_jd(&api_key, &jd_text).await
    }.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(serde_json::to_value(&result).unwrap_or_default()))
}
