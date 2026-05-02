use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use validator::Validate;

// ============== TENANT MODELS ==============

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Tenant {
    pub id: Uuid,
    pub company_name: String,
    pub email: String,
    pub password_hash: String,
    pub claude_api_key: Option<String>,
    pub sarvam_api_key: Option<String>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub logo_url: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub company_size: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateTenantRequest {
    #[validate(length(min = 2, max = 100))]
    pub company_name: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8))]
    pub password: String,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub company_size: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateApiKeysRequest {
    pub claude_api_key: Option<String>,
    pub sarvam_api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantResponse {
    pub id: Uuid,
    pub company_name: String,
    pub email: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub logo_url: Option<String>,
    pub website: Option<String>,
    pub industry: Option<String>,
    pub company_size: Option<String>,
    pub has_claude_key: bool,
    pub has_sarvam_key: bool,
}

impl From<Tenant> for TenantResponse {
    fn from(t: Tenant) -> Self {
        Self {
            id: t.id,
            company_name: t.company_name,
            email: t.email,
            is_active: t.is_active,
            created_at: t.created_at,
            logo_url: t.logo_url,
            website: t.website,
            industry: t.industry,
            company_size: t.company_size,
            has_claude_key: t.claude_api_key.is_some(),
            has_sarvam_key: t.sarvam_api_key.is_some(),
        }
    }
}

// ============== INTERVIEW TEMPLATE MODELS ==============

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "interview_type", rename_all = "PascalCase")]
pub enum InterviewType {
    Technical,
    Behavioral,
    Mixed,
    CultureFit,
    Screening,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "difficulty_level", rename_all = "PascalCase")]
pub enum DifficultyLevel {
    Easy,
    Medium,
    Hard,
    Expert,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InterviewTemplate {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub interview_type: InterviewType,
    pub difficulty: DifficultyLevel,
    pub duration_minutes: i32,
    pub language: String, // "en", "hi", "ta", etc.
    pub topics: Vec<String>, // JSON array
    pub custom_questions: Option<serde_json::Value>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateInterviewTemplateRequest {
    #[validate(length(min = 3, max = 200))]
    pub title: String,
    pub description: Option<String>,
    pub interview_type: InterviewType,
    pub difficulty: DifficultyLevel,
    pub duration_minutes: i32,
    pub language: String,
    pub topics: Vec<String>,
    pub custom_questions: Option<Vec<CustomQuestion>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomQuestion {
    pub question: String,
    pub expected_answer_points: Vec<String>,
    pub weight: f32,
}

// ============== CANDIDATE MODELS ==============

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Candidate {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub resume_url: Option<String>,
    pub resume_text: Option<String>,
    pub skills: Vec<String>,
    pub experience_years: Option<f32>,
    pub current_position: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct CreateCandidateRequest {
    #[validate(length(min = 2))]
    pub name: String,
    #[validate(email)]
    pub email: String,
    pub phone: Option<String>,
    pub resume_text: Option<String>,
    pub skills: Vec<String>,
    pub experience_years: Option<f32>,
    pub current_position: Option<String>,
    pub notes: Option<String>,
}

// ============== INTERVIEW SESSION MODELS ==============

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "session_status", rename_all = "PascalCase")]
pub enum SessionStatus {
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct InterviewSession {
    pub id: Uuid,
    pub tenant_id: Uuid,
    pub template_id: Uuid,
    pub candidate_id: Uuid,
    pub status: SessionStatus,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub overall_score: Option<f32>,
    pub recommendation: Option<String>,
    pub transcript: Option<serde_json::Value>,
    pub analysis: Option<serde_json::Value>,
    pub recording_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSessionRequest {
    pub template_id: Uuid,
    pub candidate_id: Uuid,
    pub scheduled_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterviewMessage {
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub audio_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageRole {
    Interviewer,
    Candidate,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterviewResult {
    pub overall_score: f32,
    pub technical_score: f32,
    pub communication_score: f32,
    pub problem_solving_score: f32,
    pub cultural_fit_score: f32,
    pub strengths: Vec<String>,
    pub weaknesses: Vec<String>,
    pub recommendation: String, // "Strong Hire", "Hire", "Maybe", "No Hire"
    pub detailed_feedback: String,
    pub skill_assessments: Vec<SkillAssessment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillAssessment {
    pub skill: String,
    pub score: f32,
    pub evidence: String,
    pub level: String, // "Expert", "Proficient", "Developing", "Beginner"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitFeedbackRequest {
    pub reviewer_notes: String,
    pub human_override: Option<String>, // Override AI recommendation
    pub rating: i32, // 1-5
}

// ============== ANALYTICS MODELS ==============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_interviews: i64,
    pub completed_interviews: i64,
    pub average_score: f64,
    pub candidates_this_month: i64,
    pub interviews_by_status: Vec<StatusCount>,
    pub top_skills: Vec<SkillCount>,
    pub recent_sessions: Vec<SessionSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusCount {
    pub status: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillCount {
    pub skill: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SessionSummary {
    pub id: Uuid,
    pub candidate_name: String,
    pub template_title: String,
    pub status: String,
    pub score: Option<f32>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthClaims {
    pub sub: Uuid, // tenant_id
    pub email: String,
    pub exp: usize,
    pub iat: usize,
}
