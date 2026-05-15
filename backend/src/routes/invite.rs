//! Draft an interview-invite email for a candidate.
//!
//! Returns `{ to, subject, body, invite_url }`. The frontend constructs a
//! `mailto:` URL and opens the HR's default mail client (Outlook, Gmail, etc.).

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde::Deserialize;
use serde_json::json;
use std::sync::Arc;
use uuid::Uuid;

use crate::{models::AuthClaims, AppState};

#[derive(Debug, Deserialize)]
pub struct DraftInviteRequest {
    /// Overrides FRONTEND_URL when building invite_url. Useful from the demo recorder.
    pub frontend_url: Option<String>,
}

/// POST /api/v1/sessions/:id/draft-invite
pub async fn draft_invite_email(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Path(session_id): Path<Uuid>,
    Json(req): Json<DraftInviteRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    #[derive(sqlx::FromRow)]
    struct Row {
        candidate_token: Option<String>,
        candidate_name: String,
        candidate_email: String,
        current_position: Option<String>,
        template_title: String,
        duration_minutes: i32,
        template_topics: Option<Vec<String>>,
        company_name: String,
    }
    let row: Row = sqlx::query_as(
        r#"
        SELECT s.candidate_token,
               c.name              AS candidate_name,
               c.email             AS candidate_email,
               c.current_position,
               it.title            AS template_title,
               it.duration_minutes,
               it.topics           AS template_topics,
               t.company_name
        FROM interview_sessions s
        JOIN candidates c           ON c.id = s.candidate_id
        JOIN interview_templates it ON it.id = s.template_id
        JOIN tenants t              ON t.id = s.tenant_id
        WHERE s.id = $1 AND s.tenant_id = $2
        "#,
    )
    .bind(session_id)
    .bind(claims.sub)
    .fetch_optional(state.db.pool())
    .await
    .map_err(|e| {
        tracing::error!("draft_invite lookup failed: {e}");
        (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Lookup failed" })))
    })?
    .ok_or((StatusCode::NOT_FOUND, Json(json!({ "error": "Session not found" }))))?;

    // Ensure a candidate_token exists.
    let token = match row.candidate_token {
        Some(t) => t,
        None => {
            let t = Uuid::new_v4().simple().to_string();
            sqlx::query("UPDATE interview_sessions SET candidate_token = $1 WHERE id = $2")
                .bind(&t)
                .bind(session_id)
                .execute(state.db.pool())
                .await
                .map_err(|e| {
                    tracing::error!("invite token write failed: {e}");
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Failed to issue token" })))
                })?;
            t
        }
    };

    let frontend_url = req
        .frontend_url
        .unwrap_or_else(|| state.config.frontend_url.clone());
    let invite_url = format!("{}/candidate/{}", frontend_url.trim_end_matches('/'), token);

    let topics: Vec<String> = row.template_topics.unwrap_or_default();
    let role = row
        .current_position
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| row.template_title.clone());
    let first_name = row
        .candidate_name
        .split_whitespace()
        .next()
        .unwrap_or(&row.candidate_name)
        .to_string();

    // Personalized closing line via LLM (best-effort)
    let blessing = generate_blessing(&state, &first_name, &role, &row.company_name)
        .await
        .unwrap_or_else(|| format!(
            "Take a deep breath, {first_name} — we're rooting for you. Show us what you love about building."
        ));

    let topics_block = if topics.is_empty() {
        String::new()
    } else {
        let bullets: Vec<String> = topics.iter().take(5).map(|t| format!("  • {t}")).collect();
        format!(
            "\n\nA few areas worth a quick refresh before we chat:\n{}",
            bullets.join("\n")
        )
    };

    let subject = format!(
        "Interview at {} — {}, here's everything you need",
        row.company_name, first_name
    );

    let body = format!(
        r#"Hi {first_name},

Thanks so much for putting your name in for the {role} role at {company} — we're really looking forward to meeting you.

We've set up your interview through Intervue, an AI interviewer that runs the conversation. No calendars to coordinate, no Zoom link to hunt down. Open this when you're ready and have about {duration} minutes:

  {invite_url}

You can speak your answers (mic) or type them. The AI listens, follows up where it makes sense, and keeps things conversational.{topics}

Quick pre-flight: a quiet room, decent mic, and the link above is all you need.

{blessing}

Warmly,
The team at {company}
"#,
        first_name = first_name,
        role = role,
        company = row.company_name,
        duration = row.duration_minutes,
        invite_url = invite_url,
        topics = topics_block,
        blessing = blessing,
    );

    Ok(Json(json!({
        "to": row.candidate_email,
        "subject": subject,
        "body": body,
        "invite_url": invite_url,
    })))
}

async fn generate_blessing(
    state: &AppState,
    first_name: &str,
    role: &str,
    company: &str,
) -> Option<String> {
    // Use the platform Groq key — this is a tiny one-shot completion (~30 tokens).
    let key = state.config.platform_groq_key.clone()?;
    let system = "You are a warm, sincere HR person at a real company writing ONE line to a candidate. \
                  Write a single closing line (12-22 words) wishing them well for their interview. \
                  Make it specific to their role, not generic corporate-speak. No exclamation marks. \
                  No emojis. No quotation marks. Plain text. Just the one line.";
    let user = format!(
        "Candidate first name: {first_name}\nRole: {role}\nCompany: {company}\n\nWrite the line."
    );
    match state.groq.complete_public(&key, system, &user).await {
        Ok(text) => Some(text.trim().trim_matches('"').to_string()),
        Err(e) => {
            tracing::warn!("blessing LLM call failed: {e}");
            None
        }
    }
}
