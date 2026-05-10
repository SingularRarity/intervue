use serde_json::json;
use uuid::Uuid;
use chrono::Utc;

use crate::{
    db::Database,
    models::*,
    services::{SarvamService, ClaudeService},
};

#[derive(Clone, Debug)]
pub struct InterviewEngine {
    db: Database,
    sarvam: SarvamService,
    claude: ClaudeService,
    platform_claude_key: Option<String>,
    platform_sarvam_key: Option<String>,
}

impl InterviewEngine {
    pub fn new(
        db: Database,
        sarvam: SarvamService,
        claude: ClaudeService,
        platform_claude_key: Option<String>,
        platform_sarvam_key: Option<String>,
    ) -> Self {
        Self { db, sarvam, claude, platform_claude_key, platform_sarvam_key }
    }

    fn resolve_claude_key(&self, tenant_key: Option<String>) -> anyhow::Result<String> {
        tenant_key
            .or_else(|| self.platform_claude_key.clone())
            .ok_or_else(|| anyhow::anyhow!("No AI API key configured. Please add your API key in Settings or contact support."))
    }

    fn resolve_sarvam_key(&self, tenant_key: Option<String>) -> anyhow::Result<String> {
        tenant_key
            .or_else(|| self.platform_sarvam_key.clone())
            .ok_or_else(|| anyhow::anyhow!("No speech API key configured. Please add your API key in Settings or contact support."))
    }

    /// Process audio chunk from candidate during interview
    pub async fn process_audio_chunk(
        &self,
        session_id: Uuid,
        audio_data: &serde_json::Value,
    ) -> anyhow::Result<serde_json::Value> {
        // Get session and tenant info
        let session = self.get_session_with_tenant(session_id).await?;
        let tenant = self.get_tenant(session.tenant_id).await?;

        let sarvam_key = self.resolve_sarvam_key(tenant.sarvam_api_key)?;
        let claude_key = self.resolve_claude_key(tenant.claude_api_key)?;

        // Extract audio bytes from base64
        let audio_base64 = audio_data.get("audio")
            .and_then(|v| v.as_str())
            .ok_or_else(|| anyhow::anyhow!("Missing audio data"))?;
        let audio_bytes = base64::decode(audio_base64)?;

        // Get language from template
        let template = self.get_template(session.template_id).await?;
        let language_code = Self::map_language_code(&template.language);

        // 1. Convert speech to text via Sarvam
        let candidate_text = self.sarvam.speech_to_text(&sarvam_key, audio_bytes, language_code).await?;

        // Store candidate message
        self.add_message(session_id, "candidate", &candidate_text, None).await?;

        // 2. Get conversation history for context
        let history = self.get_conversation_history(session_id).await?;

        // 3. Generate interviewer response via Claude
        let interviewer_response = if history.len() <= 2 {
            // First question - generate from template
            self.generate_first_question(&claude_key, &template, &session).await?
        } else {
            // Follow-up based on conversation
            self.generate_follow_up(&claude_key, &history, &template).await?
        };

        // Store interviewer message
        self.add_message(session_id, "interviewer", &interviewer_response, None).await?;

        // 4. Convert response to speech via Sarvam
        let audio_response = self.sarvam.text_to_speech(
            &sarvam_key,
            &interviewer_response,
            language_code,
            Some("meera"),
        ).await?;

        let audio_base64_response = base64::encode(&audio_response);

        Ok(json!({
            "type": "interviewer_message",
            "text": interviewer_response,
            "audio": format!("data:audio/wav;base64,{}", audio_base64_response),
            "candidate_transcript": candidate_text,
        }))
    }

    /// Process text message (fallback when audio is not available)
    pub async fn process_text_message(
        &self,
        session_id: Uuid,
        text: &str,
    ) -> anyhow::Result<serde_json::Value> {
        let session = self.get_session_with_tenant(session_id).await?;
        let tenant = self.get_tenant(session.tenant_id).await?;

        let claude_key = self.resolve_claude_key(tenant.claude_api_key)?;

        // Store candidate message
        self.add_message(session_id, "candidate", text, None).await?;

        // Get conversation history
        let history = self.get_conversation_history(session_id).await?;
        let template = self.get_template(session.template_id).await?;

        // Generate response
        let interviewer_response = if history.len() <= 2 {
            self.generate_first_question(&claude_key, &template, &session).await?
        } else {
            self.generate_follow_up(&claude_key, &history, &template).await?
        };

        self.add_message(session_id, "interviewer", &interviewer_response, None).await?;

        Ok(json!({
            "type": "interviewer_message",
            "text": interviewer_response,
            "candidate_transcript": text,
        }))
    }

    /// Finalize interview and generate comprehensive report
    pub async fn finalize_interview(
        &self,
        session_id: Uuid,
    ) -> anyhow::Result<serde_json::Value> {
        let session = self.get_session_with_tenant(session_id).await?;
        let tenant = self.get_tenant(session.tenant_id).await?;
        let claude_key = self.resolve_claude_key(tenant.claude_api_key)?;

        let template = self.get_template(session.template_id).await?;
        let candidate = self.get_candidate(session.candidate_id).await?;
        let history = self.get_conversation_history(session_id).await?;

        // Generate final report via Claude
        let report = self.claude.generate_final_report(
            &claude_key,
            &history,
            &template.title,
            &candidate.name,
        ).await?;

        // Update session with results
        sqlx::query(
            r#"
            UPDATE interview_sessions 
            SET status = 'Completed', 
                completed_at = $1,
                overall_score = $2,
                recommendation = $3,
                analysis = $4,
                transcript = $5,
                updated_at = $6
            WHERE id = $7
            "#
        )
        .bind(Utc::now())
        .bind(report.overall_score)
        .bind(&report.recommendation)
        .bind(serde_json::to_value(&report)?)
        .bind(serde_json::to_value(&history)?)
        .bind(Utc::now())
        .bind(session_id)
        .execute(self.db.pool())
        .await?;

        Ok(json!({
            "type": "interview_complete",
            "report": report,
            "session_id": session_id.to_string(),
        }))
    }

    // Helper methods

    async fn get_session_with_tenant(&self, session_id: Uuid) -> anyhow::Result<InterviewSession> {
        let session = sqlx::query_as::<_, InterviewSession>(
            "SELECT * FROM interview_sessions WHERE id = $1"
        )
        .bind(session_id)
        .fetch_one(self.db.pool())
        .await?;
        Ok(session)
    }

    async fn get_tenant(&self, tenant_id: Uuid) -> anyhow::Result<Tenant> {
        let tenant = sqlx::query_as::<_, Tenant>(
            "SELECT * FROM tenants WHERE id = $1"
        )
        .bind(tenant_id)
        .fetch_one(self.db.pool())
        .await?;
        Ok(tenant)
    }

    async fn get_template(&self, template_id: Uuid) -> anyhow::Result<InterviewTemplate> {
        let template = sqlx::query_as::<_, InterviewTemplate>(
            "SELECT * FROM interview_templates WHERE id = $1"
        )
        .bind(template_id)
        .fetch_one(self.db.pool())
        .await?;
        Ok(template)
    }

    async fn get_candidate(&self, candidate_id: Uuid) -> anyhow::Result<Candidate> {
        let candidate = sqlx::query_as::<_, Candidate>(
            "SELECT * FROM candidates WHERE id = $1"
        )
        .bind(candidate_id)
        .fetch_one(self.db.pool())
        .await?;
        Ok(candidate)
    }

    async fn get_conversation_history(&self, session_id: Uuid) -> anyhow::Result<Vec<(String, String)>> {
        let messages: Vec<(String, String)> = sqlx::query_as(
            "SELECT role, content FROM interview_messages WHERE session_id = $1 ORDER BY created_at ASC"
        )
        .bind(session_id)
        .fetch_all(self.db.pool())
        .await?;
        Ok(messages)
    }

    async fn add_message(
        &self,
        session_id: Uuid,
        role: &str,
        content: &str,
        audio_url: Option<&str>,
    ) -> anyhow::Result<()> {
        sqlx::query(
            "INSERT INTO interview_messages (id, session_id, role, content, audio_url, created_at) VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(Uuid::new_v4())
        .bind(session_id)
        .bind(role)
        .bind(content)
        .bind(audio_url)
        .bind(Utc::now())
        .execute(self.db.pool())
        .await?;
        Ok(())
    }

    async fn generate_first_question(
        &self,
        claude_key: &str,
        template: &InterviewTemplate,
        session: &InterviewSession,
    ) -> anyhow::Result<String> {
        let candidate = self.get_candidate(session.candidate_id).await?;

        let questions = self.claude.generate_interview_questions(
            claude_key,
            &template.title,
            &candidate.skills,
            candidate.experience_years.unwrap_or(0.0),
            &format!("{:?}", template.interview_type),
            &format!("{:?}", template.difficulty),
            &template.language,
            candidate.resume_text.as_deref(),
        ).await?;

        // Store questions for reference
        sqlx::query(
            "UPDATE interview_sessions SET custom_questions = $1 WHERE id = $2"
        )
        .bind(serde_json::to_value(&questions)?)
        .bind(session.id)
        .execute(self.db.pool())
        .await?;

        // Return first question with a warm introduction
        let intro = format!(
            "Hello {}! I'm your AI interviewer today for the {} position. Let's begin. {}",
            candidate.name,
            template.title,
            questions[0].question
        );

        Ok(intro)
    }

    async fn generate_follow_up(
        &self,
        claude_key: &str,
        history: &[(String, String)],
        template: &InterviewTemplate,
    ) -> anyhow::Result<String> {
        let level = format!("{:?}", template.difficulty);
        let topic = template.topics.first().map(|s| s.as_str()).unwrap_or("general");

        self.claude.generate_follow_up(
            claude_key,
            history,
            topic,
            &level,
        ).await
    }

    fn map_language_code(lang: &str) -> &str {
        match lang {
            "en" => "en-IN",
            "hi" => "hi-IN",
            "ta" => "ta-IN",
            "te" => "te-IN",
            "bn" => "bn-IN",
            "mr" => "mr-IN",
            "gu" => "gu-IN",
            "kn" => "kn-IN",
            "ml" => "ml-IN",
            "pa" => "pa-IN",
            "ur" => "ur-IN",
            _ => "en-IN",
        }
    }
}
