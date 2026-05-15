use anyhow::Result;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub sarvam_base_url: String,
    pub claude_base_url: String,
    pub redis_url: String,
    pub app_env: String,
    pub google_client_id: Option<String>,
    pub google_client_secret: Option<String>,
    pub frontend_url: String,
    pub platform_claude_key: Option<String>,
    pub platform_sarvam_key: Option<String>,
    pub platform_groq_key: Option<String>,
    pub llm_provider: String, // "groq" | "claude" — defaults to groq
    pub cors_allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let app_env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());

        // CORS_ALLOWED_ORIGINS — comma-separated. In dev, default to common local hosts.
        // In production, missing/empty means "no origins" — must be set explicitly.
        let cors_allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")
            .ok()
            .map(|s| s.split(',').map(|o| o.trim().to_string()).filter(|o| !o.is_empty()).collect::<Vec<_>>())
            .unwrap_or_else(|| {
                if app_env == "development" {
                    vec![
                        "http://localhost:3001".to_string(),
                        "http://localhost:5173".to_string(),
                        "http://host.docker.internal:3001".to_string(),
                    ]
                } else {
                    Vec::new()
                }
            });

        Ok(Self {
            database_url: std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://postgres:postgres@localhost/ai_interview".to_string()),
            jwt_secret: std::env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-super-secret-jwt-key-change-in-production".to_string()),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()?,
            sarvam_base_url: std::env::var("SARVAM_BASE_URL")
                .unwrap_or_else(|_| "https://api.sarvam.ai".to_string()),
            claude_base_url: std::env::var("CLAUDE_BASE_URL")
                .unwrap_or_else(|_| "https://api.anthropic.com".to_string()),
            redis_url: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            app_env,
            google_client_id: std::env::var("GOOGLE_CLIENT_ID").ok(),
            google_client_secret: std::env::var("GOOGLE_CLIENT_SECRET").ok(),
            frontend_url: std::env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
            platform_claude_key: std::env::var("PLATFORM_CLAUDE_KEY").ok(),
            platform_sarvam_key: std::env::var("PLATFORM_SARVAM_KEY").ok(),
            platform_groq_key: std::env::var("PLATFORM_GROQ_KEY").ok(),
            llm_provider: std::env::var("LLM_PROVIDER").unwrap_or_else(|_| "groq".to_string()),
            cors_allowed_origins,
        })
    }
}
