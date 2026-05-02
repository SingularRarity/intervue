use axum::{
    extract::{State, Query},
    http::StatusCode,
    response::Json,
};
use serde_json::json;
use std::sync::Arc;
use chrono::{Utc, Duration};

use crate::{
    AppState,
    models::*,
};

#[derive(serde::Deserialize)]
pub struct DateRangeQuery {
    pub from: Option<String>,
    pub to: Option<String>,
}

pub async fn dashboard_stats(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
) -> Result<Json<DashboardStats>, (StatusCode, Json<serde_json::Value>)> {
    let tenant_id = claims.sub;

    let total_interviews = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM interview_sessions WHERE tenant_id = $1"
    )
    .bind(tenant_id)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let completed_interviews = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM interview_sessions WHERE tenant_id = $1 AND status = 'Completed'"
    )
    .bind(tenant_id)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let average_score: Option<f64> = sqlx::query_scalar(
        "SELECT AVG(overall_score) FROM interview_sessions WHERE tenant_id = $1 AND status = 'Completed' AND overall_score IS NOT NULL"
    )
    .bind(tenant_id)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let month_start = Utc::now() - Duration::days(30);
    let candidates_this_month = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM candidates WHERE tenant_id = $1 AND created_at >= $2"
    )
    .bind(tenant_id)
    .bind(month_start)
    .fetch_one(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let interviews_by_status = sqlx::query_as::<_, (String, i64)>(
        "SELECT status::text, COUNT(*) FROM interview_sessions WHERE tenant_id = $1 GROUP BY status"
    )
    .bind(tenant_id)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?
    .into_iter()
    .map(|(status, count)| StatusCount { status, count })
    .collect();

    let top_skills = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT skill, COUNT(*) as count 
        FROM candidates, UNNEST(skills) as skill 
        WHERE tenant_id = $1 
        GROUP BY skill 
        ORDER BY count DESC 
        LIMIT 10
        "#
    )
    .bind(tenant_id)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?
    .into_iter()
    .map(|(skill, count)| SkillCount { skill, count })
    .collect();

    let recent_sessions = sqlx::query_as::<_, SessionSummary>(
        r#"
        SELECT s.id, c.name as candidate_name, t.title as template_title, 
               s.status::text as status, s.overall_score, s.created_at
        FROM interview_sessions s
        JOIN candidates c ON s.candidate_id = c.id
        JOIN interview_templates t ON s.template_id = t.id
        WHERE s.tenant_id = $1
        ORDER BY s.created_at DESC
        LIMIT 10
        "#
    )
    .bind(tenant_id)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(DashboardStats {
        total_interviews,
        completed_interviews,
        average_score: average_score.unwrap_or(0.0),
        candidates_this_month,
        interviews_by_status,
        top_skills,
        recent_sessions,
    }))
}

pub async fn session_analytics(
    State(state): State<Arc<AppState>>,
    claims: axum::Extension<AuthClaims>,
    Query(params): Query<DateRangeQuery>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let tenant_id = claims.sub;

    let from_date = params.from
        .and_then(|d| chrono::DateTime::parse_from_rfc3339(&d).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now() - Duration::days(30));

    let to_date = params.to
        .and_then(|d| chrono::DateTime::parse_from_rfc3339(&d).ok())
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or_else(|| Utc::now());

    let daily_stats = sqlx::query_as::<_, (chrono::NaiveDate, i64, Option<f64>)>(
        r#"
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            AVG(overall_score) as avg_score
        FROM interview_sessions
        WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
        GROUP BY DATE(created_at)
        ORDER BY date
        "#
    )
    .bind(tenant_id)
    .bind(from_date)
    .bind(to_date)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    let score_distribution = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT 
            CASE 
                WHEN overall_score >= 90 THEN '90-100'
                WHEN overall_score >= 80 THEN '80-89'
                WHEN overall_score >= 70 THEN '70-79'
                WHEN overall_score >= 60 THEN '60-69'
                WHEN overall_score >= 50 THEN '50-59'
                ELSE 'Below 50'
            END as range,
            COUNT(*) as count
        FROM interview_sessions
        WHERE tenant_id = $1 AND status = 'Completed' AND created_at BETWEEN $2 AND $3
        GROUP BY range
        ORDER BY range
        "#
    )
    .bind(tenant_id)
    .bind(from_date)
    .bind(to_date)
    .fetch_all(state.db.pool())
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))))?;

    Ok(Json(json!({
        "daily_stats": daily_stats,
        "score_distribution": score_distribution,
        "from": from_date,
        "to": to_date,
    })))
}
