use axum::{extract::Query, http::StatusCode, response::Json};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

static BANK: Lazy<Vec<Question>> = Lazy::new(|| {
    serde_json::from_str(include_str!("../question_bank.json"))
        .expect("question_bank.json must be valid JSON")
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Question {
    pub question: String,
    pub category: String,
    pub difficulty: String,
    pub source_type: String,
    pub keywords: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct QuestionFilter {
    pub category: Option<String>,
    pub difficulty: Option<String>,
    pub source_type: Option<String>,
    pub q: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

fn default_limit() -> usize {
    20
}

pub async fn list_questions(
    Query(filter): Query<QuestionFilter>,
) -> (StatusCode, Json<serde_json::Value>) {
    let results: Vec<&Question> = BANK
        .iter()
        .filter(|q| {
            if let Some(cat) = &filter.category {
                if !cat.is_empty() && !q.category.to_lowercase().contains(&cat.to_lowercase()) {
                    return false;
                }
            }
            if let Some(diff) = &filter.difficulty {
                if !diff.is_empty() && !q.difficulty.eq_ignore_ascii_case(diff) {
                    return false;
                }
            }
            if let Some(st) = &filter.source_type {
                if !st.is_empty() && !q.source_type.to_lowercase().contains(&st.to_lowercase()) {
                    return false;
                }
            }
            if let Some(query) = &filter.q {
                if !query.is_empty() {
                    let q_lower = query.to_lowercase();
                    if !q.question.to_lowercase().contains(&q_lower)
                        && !q.category.to_lowercase().contains(&q_lower)
                        && !q.keywords.iter().any(|k| k.to_lowercase().contains(&q_lower))
                    {
                        return false;
                    }
                }
            }
            true
        })
        .take(filter.limit)
        .collect();

    (
        StatusCode::OK,
        Json(serde_json::json!({
            "questions": results,
            "total": results.len(),
        })),
    )
}

pub async fn list_categories() -> (StatusCode, Json<serde_json::Value>) {
    let mut categories: Vec<String> = BANK
        .iter()
        .map(|q| q.category.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    categories.sort();

    (
        StatusCode::OK,
        Json(serde_json::json!({ "categories": categories })),
    )
}
