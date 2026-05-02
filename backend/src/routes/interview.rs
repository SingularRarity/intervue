use axum::{
    extract::{State, Path, Json},
    http::StatusCode,
};
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

use validator::Validate;

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
