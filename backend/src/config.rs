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
}

impl Config {
    pub fn from_env() -> Result<Self> {
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
            app_env: std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string()),
            google_client_id: std::env::var("GOOGLE_CLIENT_ID").ok(),
            google_client_secret: std::env::var("GOOGLE_CLIENT_SECRET").ok(),
            frontend_url: std::env::var("FRONTEND_URL")
                .unwrap_or_else(|_| "http://localhost:5173".to_string()),
            platform_claude_key: std::env::var("PLATFORM_CLAUDE_KEY").ok(),
            platform_sarvam_key: std::env::var("PLATFORM_SARVAM_KEY").ok(),
        })
    }
}
