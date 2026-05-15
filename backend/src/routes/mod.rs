pub mod tenant;
pub mod interview;
pub mod candidates_extra;
pub mod analytics;
pub mod ws;
pub mod resume;
pub mod team;
pub mod ats;
pub mod sso;
pub mod branding;
pub mod proctoring;
pub mod coding;
pub mod candidate_portal;
pub mod invite;
pub mod oauth;
pub mod billing;
pub mod admin;
pub mod questions;

use axum::{http::StatusCode, response::Json};
use serde_json::json;

pub async fn health_check() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "status": "healthy",
            "version": env!("CARGO_PKG_VERSION"),
            "timestamp": chrono::Utc::now().to_rfc3339(),
        })),
    )
}
