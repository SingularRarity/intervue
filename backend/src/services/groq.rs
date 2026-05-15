use serde::{Deserialize, Serialize};

/// Groq Cloud LLM service — uses the OpenAI-compatible API.
/// Default model: llama-3.3-70b-versatile (fast, free tier available).
/// Get a free API key at console.groq.com
#[derive(Clone, Debug)]
pub struct GroqService {
    client: reqwest::Client,
    model: String,
}

impl GroqService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(120))
                .build()
                .expect("Failed to build HTTP client"),
            model: std::env::var("GROQ_MODEL")
                .unwrap_or_else(|_| "llama-3.3-70b-versatile".to_string()),
        }
    }

    pub async fn generate_interview_questions(
        &self,
        api_key: &str,
        job_title: &str,
        skills: &[String],
        experience_years: f32,
        interview_type: &str,
        difficulty: &str,
        language: &str,
        resume_text: Option<&str>,
    ) -> anyhow::Result<Vec<InterviewQuestion>> {
        let system = format!(
            r#"You are an expert technical interviewer for a {} position.
Generate {} interview questions in {} language.
The candidate has {} years of experience with skills: {}.
Difficulty level: {}.

For each question provide:
1. The question text
2. Expected key points in the answer
3. A weight (0.0-1.0) indicating importance
4. The skill being assessed

Return ONLY a valid JSON array, no markdown, no code fences."#,
            job_title, interview_type, language, experience_years,
            skills.join(", "), difficulty,
        );

        let user = if let Some(resume) = resume_text {
            format!("Based on this resume:\n{}\n\nGenerate 8-12 targeted interview questions.", resume)
        } else {
            "Generate 8-12 targeted interview questions.".to_string()
        };

        let raw = self.complete(api_key, &system, &user).await?;
        let clean = strip_markdown(&raw);
        serde_json::from_str(&clean)
            .map_err(|e| anyhow::anyhow!("Failed to parse questions: {}. Raw: {}", e, clean))
    }

    pub async fn analyze_response(
        &self,
        api_key: &str,
        question: &str,
        expected_points: &[String],
        candidate_answer: &str,
        context: &str,
    ) -> anyhow::Result<ResponseAnalysis> {
        let system = r#"You are an expert interview evaluator. Analyze the candidate's response objectively.

Return ONLY a valid JSON object with:
- score: 0-100
- technical_accuracy: 0-100
- communication_clarity: 0-100
- depth_of_knowledge: 0-100
- key_points_covered: array of strings
- missing_points: array of strings
- follow_up_suggestion: string or null
- summary: brief evaluation summary"#;

        let user = format!(
            "Context: {}\n\nQuestion: {}\nExpected points:\n- {}\n\nCandidate answer: {}\n\nAnalyze this response.",
            context, question, expected_points.join("\n- "), candidate_answer,
        );

        let raw = self.complete(api_key, system, &user).await?;
        let clean = strip_markdown(&raw);
        serde_json::from_str(&clean)
            .map_err(|e| anyhow::anyhow!("Failed to parse analysis: {}. Raw: {}", e, clean))
    }

    pub async fn generate_final_report(
        &self,
        api_key: &str,
        transcript: &[(String, String)],
        template_title: &str,
        candidate_name: &str,
    ) -> anyhow::Result<crate::models::InterviewResult> {
        let system = r#"You are a senior hiring manager. Generate a comprehensive interview evaluation report.

Return ONLY a valid JSON object with:
- overall_score: 0-100
- technical_score: 0-100
- communication_score: 0-100
- problem_solving_score: 0-100
- cultural_fit_score: 0-100
- strengths: array of strings
- weaknesses: array of strings
- recommendation: one of "Strong Hire", "Hire", "Maybe", "No Hire"
- detailed_feedback: string (2-3 paragraphs)
- skill_assessments: array of {skill, score, evidence, level}"#;

        let transcript_text = transcript
            .iter()
            .map(|(role, msg)| format!("{}: {}", role, msg))
            .collect::<Vec<_>>()
            .join("\n\n");

        let user = format!(
            "Interview: {}\nCandidate: {}\n\nTranscript:\n{}\n\nGenerate evaluation report.",
            template_title, candidate_name, transcript_text,
        );

        let raw = self.complete(api_key, system, &user).await?;
        let clean = strip_markdown(&raw);
        serde_json::from_str(&clean)
            .map_err(|e| anyhow::anyhow!("Failed to parse report: {}. Raw: {}", e, clean))
    }

    pub async fn generate_follow_up(
        &self,
        api_key: &str,
        conversation_history: &[(String, String)],
        current_topic: &str,
        candidate_level: &str,
    ) -> anyhow::Result<String> {
        let system = "You are a skilled interviewer. Generate a natural follow-up question based on the conversation. Return only the question text, nothing else.";

        let history = conversation_history
            .iter()
            .map(|(role, msg)| format!("{}: {}", role, msg))
            .collect::<Vec<_>>()
            .join("\n");

        let user = format!(
            "Topic: {}\nLevel: {}\n\nConversation:\n{}\n\nNext question:",
            current_topic, candidate_level, history,
        );

        self.complete(api_key, system, &user).await
    }

    pub async fn parse_jd(&self, api_key: &str, jd_text: &str) -> anyhow::Result<JdParseResult> {
        let system = r#"You are an expert HR analyst. Parse the job description and return ONLY a valid JSON object with exactly these fields:
{
  "title": "exact job title",
  "summary": "2-3 sentence interviewer-facing summary",
  "topics": ["skill1", "skill2", "skill3"],
  "difficulty": "Easy|Medium|Hard|Expert",
  "interview_type": "Technical|Behavioral|Mixed|CultureFit|Screening",
  "duration_minutes": 30,
  "language": "en"
}

Rules:
- topics: 3-8 specific skills (e.g. "React", "SQL", not "communication")
- difficulty: junior=Easy, mid=Medium, senior=Hard, staff/principal=Expert
- duration_minutes: 20 screening, 30 standard, 45 senior, 60 expert
- No markdown, no code fences, just the JSON object."#;

        let raw = self.complete(api_key, system, jd_text).await?;
        let clean = strip_markdown(&raw);
        serde_json::from_str(&clean)
            .map_err(|e| anyhow::anyhow!("Failed to parse JD result: {}. Raw: {}", e, clean))
    }

    pub async fn parse_resume(&self, api_key: &str, resume_text: &str) -> anyhow::Result<serde_json::Value> {
        let system = r#"You are an expert recruiter. Parse the resume and return ONLY a valid JSON object with exactly these fields:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "current_position": "current or most recent job title",
  "experience_years": 3.5,
  "skills": ["skill1", "skill2"],
  "summary": "2-3 sentence professional summary",
  "linkedin_url": "https://linkedin.com/in/username",
  "github_url": "https://github.com/username",
  "portfolio_url": "personal site URL",
  "project_urls": ["https://example.com/project1", "https://github.com/u/repo"]
}

Rules:
- Use null for any missing string fields (project_urls defaults to empty array [])
- experience_years: numeric only (e.g. 3.5)
- skills: specific technologies and tools only
- linkedin_url / github_url / portfolio_url: full https:// URLs. If resume writes "linkedin.com/in/foo" without scheme, prefix with https://.
- portfolio_url is the candidate's personal site only — NOT LinkedIn, NOT GitHub.
- project_urls: every distinct URL in the resume body that points to a deployed project, live demo, or repo (excluding the linkedin/github/portfolio ones already captured above).
- No markdown, no code fences, just the JSON object."#;

        let raw = self.complete(api_key, system, resume_text).await?;
        let clean = strip_markdown(&raw);
        serde_json::from_str(&clean)
            .map_err(|e| anyhow::anyhow!("Failed to parse resume result: {}. Raw: {}", e, clean))
    }

    /// Public wrapper for one-shot LLM completions used outside this file
    /// (e.g. routes::invite for personalized email closing lines).
    pub async fn complete_public(&self, api_key: &str, system: &str, user: &str) -> anyhow::Result<String> {
        self.complete(api_key, system, user).await
    }

    async fn complete(&self, api_key: &str, system: &str, user: &str) -> anyhow::Result<String> {
        let request = ChatRequest {
            model: self.model.clone(),
            messages: vec![
                ChatMessage { role: "system".to_string(), content: system.to_string() },
                ChatMessage { role: "user".to_string(), content: user.to_string() },
            ],
            max_tokens: 4096,
            temperature: 0.7,
        };

        let response = self.client
            .post("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let err = response.text().await?;
            return Err(anyhow::anyhow!("Groq API error: {}", err));
        }

        let result: ChatResponse = response.json().await?;
        Ok(result.choices[0].message.content.clone())
    }
}

pub fn strip_markdown(s: &str) -> String {
    s.trim()
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim()
        .to_string()
}

#[derive(Debug, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    max_tokens: i32,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ChatMessage,
}

// ---- Shared output types (used by both GroqService and ClaudeService) ----

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterviewQuestion {
    pub question: String,
    pub expected_answer_points: Vec<String>,
    pub weight: f32,
    pub skill: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JdParseResult {
    pub title: String,
    pub summary: String,
    pub topics: Vec<String>,
    pub difficulty: String,
    pub interview_type: String,
    pub duration_minutes: i32,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseAnalysis {
    pub score: f32,
    pub technical_accuracy: f32,
    pub communication_clarity: f32,
    pub depth_of_knowledge: f32,
    pub key_points_covered: Vec<String>,
    pub missing_points: Vec<String>,
    pub follow_up_suggestion: Option<String>,
    pub summary: String,
}
