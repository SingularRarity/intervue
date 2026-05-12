use axum::{
    extract::Request,
    middleware::{self, Next},
    routing::{delete, get, patch, post, put},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod config;
mod db;
mod models;
mod routes;
mod services;

use auth::{auth_middleware, permission_middleware, RoutePerm};
use config::Config;
use db::Database;
use models::PlanTier;
use services::{ClaudeService, GroqService, InterviewEngine, PermissionService, SarvamService};

#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub config: Config,
    pub sarvam: SarvamService,
    pub claude: ClaudeService, // kept for tenants with Claude keys
    pub groq: GroqService,     // default LLM — free tier at console.groq.com
    pub interview_engine: InterviewEngine,
    pub permissions: Arc<PermissionService>,
}

macro_rules! perm {
    ($module:expr, $action:expr, $plan:expr) => {{
        let p = RoutePerm::new($module, $action, $plan);
        middleware::from_fn(move |mut req: Request, next: Next| async move {
            req.extensions_mut().insert(p);
            next.run(req).await
        })
    }};
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
    let groq = GroqService::new();
    let platform_llm_key = config.platform_groq_key.clone()
        .or_else(|| config.platform_claude_key.clone());
    let interview_engine = InterviewEngine::new(
        db.clone(),
        sarvam.clone(),
        claude.clone(),
        platform_llm_key,
        config.platform_sarvam_key.clone(),
    );
    let permissions = Arc::new(PermissionService::new(db.pool().clone()).await?);

    let state = Arc::new(AppState {
        db,
        config: config.clone(),
        sarvam,
        claude,
        groq,
        interview_engine,
        permissions,
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // ------------------------------------------------------------------
    // Admin sub-router (god admin only — god_only() guards each handler)
    // ------------------------------------------------------------------
    let admin_router = Router::new()
        .route("/auth/login", post(routes::admin::admin_login))
        .route("/auth/me", get(routes::admin::admin_me))
        .route("/tenants", get(routes::admin::list_tenants))
        .route("/tenants/:id/plan", put(routes::admin::set_tenant_plan))
        .route("/tenants/:id/toggle", post(routes::admin::toggle_tenant_active))
        .route("/permissions", get(routes::admin::list_role_permissions))
        .route("/permissions/:id", put(routes::admin::update_role_permission))
        .route("/plan-requirements", get(routes::admin::list_plan_requirements))
        .route("/plan-requirements/:id", put(routes::admin::update_plan_requirement))
        .route("/contacts", get(routes::admin::list_contact_requests))
        .route("/contacts/:id/status", put(routes::admin::update_contact_status))
        .route("/stats", get(routes::admin::platform_stats))
        .with_state(state.clone());

    let app = Router::new()
        // ---- Public ----
        .route("/health", get(routes::health_check))
        .route("/api/v1/tenants", post(routes::tenant::create_tenant))
        .route("/api/v1/tenants/login", post(routes::tenant::login_tenant))
        .route("/api/v1/oauth/google", get(routes::oauth::google_auth))
        .route("/api/v1/oauth/google/callback", get(routes::oauth::google_callback))
        .route("/api/v1/candidate-portal/:token", get(routes::candidate_portal::get_session_by_token))
        .route("/api/v1/billing/plans", get(routes::billing::list_plans))
        .route("/api/v1/team/accept-invite", post(routes::team::accept_invite))

        // ---- Protected: tenant profile ----
        .route("/api/v1/tenants/me", get(routes::tenant::get_current_tenant))
        .route("/api/v1/tenants/keys", put(routes::tenant::update_api_keys))

        // ---- Protected: billing ----
        .route("/api/v1/billing/plan", get(routes::billing::get_plan))
        .route("/api/v1/billing/usage", get(routes::billing::get_usage))
        .route("/api/v1/billing/contact", post(routes::billing::submit_contact))

        // ---- Protected: team ----
        .route("/api/v1/team", get(routes::team::list_team))
        .route("/api/v1/team/invite", post(routes::team::invite_member))
        .route(
            "/api/v1/team/:id/role",
            patch(routes::team::update_role)
                .route_layer(perm!("team", "manage", PlanTier::Free)),
        )
        .route(
            "/api/v1/team/:id",
            delete(routes::team::remove_member)
                .route_layer(perm!("team", "manage", PlanTier::Free)),
        )

        // ---- Protected: interview templates ----
        .route("/api/v1/interviews/parse-jd", post(routes::interview::parse_jd))
        .route(
            "/api/v1/interviews",
            post(routes::interview::create_interview_template)
                .route_layer(perm!("interviews", "create", PlanTier::Free)),
        )
        .route("/api/v1/interviews", get(routes::interview::list_interview_templates))
        .route("/api/v1/interviews/:id", get(routes::interview::get_interview_template))
        .route(
            "/api/v1/interviews/:id",
            put(routes::interview::update_interview_template)
                .route_layer(perm!("interviews", "update", PlanTier::Free)),
        )
        .route(
            "/api/v1/interviews/:id",
            delete(routes::interview::delete_interview_template)
                .route_layer(perm!("interviews", "delete", PlanTier::Free)),
        )

        // ---- Protected: candidates ----
        .route(
            "/api/v1/candidates",
            post(routes::interview::create_candidate)
                .route_layer(perm!("candidates", "create", PlanTier::Free)),
        )
        .route("/api/v1/candidates", get(routes::interview::list_candidates))
        .route("/api/v1/candidates/:id", get(routes::interview::get_candidate))
        .route(
            "/api/v1/candidates/parse-resume",
            post(routes::resume::parse_resume)
                .route_layer(perm!("candidates", "create", PlanTier::Starter)),
        )
        .route("/api/v1/candidates/parse-resume-file", post(routes::resume::parse_resume_file))

        // ---- Protected: sessions ----
        .route(
            "/api/v1/sessions",
            post(routes::interview::create_session)
                .route_layer(perm!("sessions", "create", PlanTier::Free)),
        )
        .route("/api/v1/sessions/:id", get(routes::interview::get_session))
        .route("/api/v1/sessions/:id/results", get(routes::interview::get_session_results))
        .route(
            "/api/v1/sessions/:id/feedback",
            post(routes::interview::submit_feedback)
                .route_layer(perm!("sessions", "feedback", PlanTier::Free)),
        )
        .route("/api/v1/sessions/:id/invite-token", post(routes::candidate_portal::generate_candidate_token))
        .route(
            "/api/v1/sessions/:id/ats-push",
            post(routes::ats::push_to_ats)
                .route_layer(perm!("integrations", "update", PlanTier::Growth)),
        )
        .route(
            "/api/v1/sessions/:id/proctoring",
            get(routes::proctoring::get_proctoring_summary)
                .route_layer(perm!("sessions", "read", PlanTier::Growth)),
        )
        .route("/api/v1/sessions/:id/proctoring/events", post(routes::proctoring::log_proctoring_event))
        .route("/api/v1/sessions/:id/coding", get(routes::coding::get_coding_challenge))
        .route("/api/v1/sessions/:id/coding/submit", post(routes::coding::submit_code))

        // ---- Protected: integrations ----
        .route("/api/v1/integrations/ats", get(routes::ats::get_ats_config))
        .route(
            "/api/v1/integrations/ats",
            put(routes::ats::update_ats_config)
                .route_layer(perm!("integrations", "update", PlanTier::Growth)),
        )
        .route("/api/v1/integrations/sso", get(routes::sso::get_sso_config))
        .route(
            "/api/v1/integrations/sso",
            put(routes::sso::update_sso_config)
                .route_layer(perm!("integrations", "update", PlanTier::Enterprise)),
        )

        // ---- Protected: branding ----
        .route("/api/v1/branding", get(routes::branding::get_branding))
        .route(
            "/api/v1/branding",
            put(routes::branding::update_branding)
                .route_layer(perm!("branding", "update", PlanTier::Starter)),
        )

        // ---- Protected: analytics ----
        .route("/api/v1/analytics/dashboard", get(routes::analytics::dashboard_stats))
        .route(
            "/api/v1/analytics/sessions",
            get(routes::analytics::session_analytics)
                .route_layer(perm!("analytics", "advanced", PlanTier::Growth)),
        )

        // ---- Question bank (public — used during template creation) ----
        .route("/api/v1/questions", get(routes::questions::list_questions))
        .route("/api/v1/questions/categories", get(routes::questions::list_categories))

        // ---- WebSocket ----
        .route("/ws/interview/:session_id", get(routes::ws::interview_websocket))

        // ---- Admin console ----
        .nest("/api/v1/admin", admin_router)

        // Middleware stack (outermost runs first on ingress):
        //   TraceLayer → CorsLayer → auth_middleware → permission_middleware → handler
        .layer(middleware::from_fn_with_state(state.clone(), permission_middleware))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
