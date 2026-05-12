use serde::{Deserialize, Serialize};

#[derive(Clone, Debug)]
pub struct ClaudeService {
    client: reqwest::Client,
    base_url: String,
}

impl ClaudeService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(120))
                .build()
                .expect("Failed to build HTTP client"),
            base_url: std::env::var("CLAUDE_BASE_URL")
                .unwrap_or_else(|_| "https://api.anthropic.com".to_string()),
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
    ) -> anyhow::Result<Vec<crate::services::groq::InterviewQuestion>> {
        let system_prompt = format!(
            r#"You are an expert technical interviewer for a {} position.
Generate {} interview questions in {} language.
The candidate has {} years of experience with skills: {}.
Difficulty level: {}.

For each question, provide:
1. The question text
2. Expected key points in the answer
3. A weight (0.0-1.0) indicating importance
4. The skill being assessed

Return ONLY a JSON array with no markdown formatting."#,
            job_title, interview_type, language, experience_years,
            skills.join(", "), difficulty,
        );

        let user_prompt = if let Some(resume) = resume_text {
            format!("Based on this resume: {}\n\nGenerate 8-12 targeted interview questions.", resume)
        } else {
            "Generate 8-12 targeted interview questions.".to_string()
        };

        let response = self.call_claude(api_key, &system_prompt, &user_prompt).await?;
        let clean = crate::services::groq::strip_markdown(&response);
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
    ) -> anyhow::Result<crate::services::groq::ResponseAnalysis> {
        let system_prompt = r#"You are an expert interview evaluator. Analyze the candidate's response objectively.

Provide a JSON response with:
- score: 0-100
- technical_accuracy: 0-100
- communication_clarity: 0-100
- depth_of_knowledge: 0-100
- key_points_covered: array of strings
- missing_points: array of strings
- follow_up_suggestion: string or null
- summary: brief evaluation summary"#;

        let user_prompt = format!(
            "Context: {}\n\nQuestion: {}\nExpected points:\n- {}\n\nCandidate's answer: {}\n\nAnalyze this response.",
            context, question, expected_points.join("\n- "), candidate_answer,
        );

        let response = self.call_claude(api_key, system_prompt, &user_prompt).await?;
        let clean = crate::services::groq::strip_markdown(&response);
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
        let system_prompt = r#"You are a senior hiring manager. Generate a comprehensive interview evaluation report.

Provide a JSON response with:
- overall_score: 0-100
- technical_score: 0-100
- communication_score: 0-100
- problem_solving_score: 0-100
- cultural_fit_score: 0-100
- strengths: array of strings
- weaknesses: array of strings
- recommendation: one of "Strong Hire", "Hire", "Maybe", "No Hire"
- detailed_feedback: string
- skill_assessments: array of {skill, score, evidence, level}"#;

        let transcript_text = transcript
            .iter()
            .map(|(role, msg)| format!("{}: {}", role, msg))
            .collect::<Vec<_>>()
            .join("\n\n");

        let user_prompt = format!(
            "Interview Template: {}\nCandidate: {}\n\nFull Transcript:\n{}\n\nGenerate a comprehensive evaluation report.",
            template_title, candidate_name, transcript_text,
        );

        let response = self.call_claude(api_key, system_prompt, &user_prompt).await?;
        let clean = crate::services::groq::strip_markdown(&response);
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
        let system_prompt = r#"You are a skilled interviewer. Based on the conversation so far, generate a natural follow-up question.
Keep it conversational and professional. Return only the question text."#;

        let history_text = conversation_history
            .iter()
            .map(|(role, msg)| format!("{}: {}", role, msg))
            .collect::<Vec<_>>()
            .join("\n");

        let user_prompt = format!(
            "Current topic: {}\nCandidate level: {}\n\nConversation:\n{}\n\nGenerate the next interview question.",
            current_topic, candidate_level, history_text,
        );

        self.call_claude(api_key, system_prompt, &user_prompt).await
    }

    pub async fn parse_jd(&self, api_key: &str, jd_text: &str) -> anyhow::Result<crate::services::groq::JdParseResult> {
        let system_prompt = r#"You are an expert HR analyst. Parse the job description and return ONLY valid JSON with these fields:
{
  "title": "job title",
  "summary": "2-3 sentence summary",
  "topics": ["skill1", "skill2"],
  "difficulty": "Easy|Medium|Hard|Expert",
  "interview_type": "Technical|Behavioral|Mixed|CultureFit|Screening",
  "duration_minutes": 30,
  "language": "en"
}"#;

        let response = self.call_claude(api_key, system_prompt, jd_text).await?;
        let clean = crate::services::groq::strip_markdown(&response);
        serde_json::from_str(&clean)
            .map_err(|e| anyhow::anyhow!("Failed to parse JD result: {}. Raw: {}", e, clean))
    }

    async fn call_claude(&self, api_key: &str, system: &str, user_message: &str) -> anyhow::Result<String> {
        let request = ClaudeRequest {
            model: "claude-3-5-sonnet-20241022".to_string(),
            max_tokens: 4096,
            system: Some(system.to_string()),
            messages: vec![Message { role: "user".to_string(), content: user_message.to_string() }],
            temperature: 0.7,
        };

        let response = self.client
            .post(format!("{}/v1/messages", self.base_url))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let err = response.text().await?;
            return Err(anyhow::anyhow!("Claude API error: {}", err));
        }

        let result: ClaudeResponse = response.json().await?;
        Ok(result.content[0].text.clone())
    }
}

#[derive(Debug, Serialize)]
struct ClaudeRequest {
    model: String,
    max_tokens: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    system: Option<String>,
    messages: Vec<Message>,
    temperature: f32,
}

#[derive(Debug, Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
struct ClaudeResponse {
    content: Vec<ContentBlock>,
}

#[derive(Debug, Deserialize)]
struct ContentBlock {
    #[allow(dead_code)]
    #[serde(rename = "type")]
    content_type: String,
    text: String,
}
