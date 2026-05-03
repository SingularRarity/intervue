use axum::{
    routing::{delete, get, post, put},
    Router,
    middleware,
};
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::net::SocketAddr;
use std::sync::Arc;

mod config;
mod db;
mod models;
mod auth;
mod routes;
mod services;

use config::Config;
use db::Database;
use services::{SarvamService, ClaudeService, InterviewEngine};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: Config,
    pub sarvam: SarvamService,
    pub claude: ClaudeService,
    pub interview_engine: InterviewEngine,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ai_interview_platform=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    dotenvy::dotenv().ok();
    let config = Config::from_env()?;

    let db = Database::new(&config.database_url).await?;
    db.run_migrations().await?;

    let sarvam = SarvamService::new();
    let claude = ClaudeService::new();
    let interview_engine = InterviewEngine::new(db.clone(), sarvam.clone(), claude.clone());

    let state = Arc::new(AppState {
        db,
        config: config.clone(),
        sarvam,
        claude,
        interview_engine,
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Health
        .route("/health", get(routes::health_check))
        // Public: tenant auth
        .route("/api/v1/tenants", post(routes::tenant::create_tenant))
        .route("/api/v1/tenants/login", post(routes::tenant::login_tenant))
        // Public: Google OAuth
        .route("/api/v1/oauth/google", get(routes::oauth::google_auth))
        .route("/api/v1/oauth/google/callback", get(routes::oauth::google_callback))
        // Public: candidate portal (token-based, no JWT)
        .route("/api/v1/candidate-portal/:token", get(routes::candidate_portal::get_session_by_token))
        // Protected: tenant
        .route("/api/v1/tenants/me", get(routes::tenant::get_current_tenant))
        .route("/api/v1/tenants/keys", put(routes::tenant::update_api_keys))
        // Protected: interview templates
        .route("/api/v1/interviews", post(routes::interview::create_interview_template))
        .route("/api/v1/interviews", get(routes::interview::list_interview_templates))
        .route("/api/v1/interviews/:id", get(routes::interview::get_interview_template))
        .route("/api/v1/interviews/:id", put(routes::interview::update_interview_template))
        .route("/api/v1/interviews/:id", delete(routes::interview::delete_interview_template))
        // Protected: candidates
        .route("/api/v1/candidates", post(routes::interview::create_candidate))
        .route("/api/v1/candidates", get(routes::interview::list_candidates))
        .route("/api/v1/candidates/:id", get(routes::interview::get_candidate))
        .route("/api/v1/candidates/parse-resume", post(routes::resume::parse_resume))
        // Protected: sessions
        .route("/api/v1/sessions", post(routes::interview::create_session))
        .route("/api/v1/sessions/:id", get(routes::interview::get_session))
        .route("/api/v1/sessions/:id/results", get(routes::interview::get_session_results))
        .route("/api/v1/sessions/:id/feedback", post(routes::interview::submit_feedback))
        .route("/api/v1/sessions/:id/invite-token", post(routes::candidate_portal::generate_candidate_token))
        .route("/api/v1/sessions/:id/ats-push", post(routes::ats::push_to_ats))
        .route("/api/v1/sessions/:id/proctoring", get(routes::proctoring::get_proctoring_summary))
        .route("/api/v1/sessions/:id/proctoring/events", post(routes::proctoring::log_proctoring_event))
        .route("/api/v1/sessions/:id/coding", get(routes::coding::get_coding_challenge))
        .route("/api/v1/sessions/:id/coding/submit", post(routes::coding::submit_code))
        // Protected: team
        .route("/api/v1/team", get(routes::team::list_team))
        .route("/api/v1/team/invite", post(routes::team::invite_member))
        .route("/api/v1/team/:id", delete(routes::team::remove_member))
        // Protected: integrations
        .route("/api/v1/integrations/ats", get(routes::ats::get_ats_config))
        .route("/api/v1/integrations/ats", put(routes::ats::update_ats_config))
        .route("/api/v1/integrations/sso", get(routes::sso::get_sso_config))
        .route("/api/v1/integrations/sso", put(routes::sso::update_sso_config))
        // Protected: branding
        .route("/api/v1/branding", get(routes::branding::get_branding))
        .route("/api/v1/branding", put(routes::branding::update_branding))
        // Protected: analytics
        .route("/api/v1/analytics/dashboard", get(routes::analytics::dashboard_stats))
        .route("/api/v1/analytics/sessions", get(routes::analytics::session_analytics))
        // WebSocket
        .route("/ws/interview/:session_id", get(routes::ws::interview_websocket))
        .layer(middleware::from_fn_with_state(state.clone(), auth::auth_middleware))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
