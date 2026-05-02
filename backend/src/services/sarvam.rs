use serde::{Deserialize, Serialize};

#[derive(Clone, Debug)]
pub struct SarvamService {
    client: reqwest::Client,
    base_url: String,
}

impl SarvamService {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(60))
                .build()
                .expect("Failed to build HTTP client"),
            base_url: std::env::var("SARVAM_BASE_URL")
                .unwrap_or_else(|_| "https://api.sarvam.ai".to_string()),
        }
    }

    /// Convert speech to text using Sarvam AI
    pub async fn speech_to_text(
        &self,
        api_key: &str,
        audio_data: Vec<u8>,
        language_code: &str,
    ) -> anyhow::Result<String> {
        let url = format!("{}/speech-to-text", self.base_url);

        let form = reqwest::multipart::Form::new()
            .part("file", reqwest::multipart::Part::bytes(audio_data)
                .file_name("audio.wav")
                .mime_str("audio/wav")?)
            .text("language_code", language_code.to_string());

        let response = self.client
            .post(&url)
            .header("api-subscription-key", api_key)
            .multipart(form)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Sarvam STT error: {}", error_text));
        }

        let result: SarvamSttResponse = response.json().await?;
        Ok(result.transcript)
    }

    /// Convert text to speech using Sarvam AI
    pub async fn text_to_speech(
        &self,
        api_key: &str,
        text: &str,
        language_code: &str,
        voice_id: Option<&str>,
    ) -> anyhow::Result<Vec<u8>> {
        let url = format!("{}/text-to-speech", self.base_url);

        let request = SarvamTtsRequest {
            inputs: vec![text.to_string()],
            target_language_code: language_code.to_string(),
            speaker: voice_id.unwrap_or("meera").to_string(),
            pitch: 0.0,
            pace: 1.0,
            loudness: 1.0,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: "bulbul:v1".to_string(),
        };

        let response = self.client
            .post(&url)
            .header("api-subscription-key", api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Sarvam TTS error: {}", error_text));
        }

        let result: SarvamTtsResponse = response.json().await?;
        // Decode base64 audio
        let audio_bytes = base64::decode(&result.audios[0])?;
        Ok(audio_bytes)
    }

    /// Translate text using Sarvam AI
    pub async fn translate(
        &self,
        api_key: &str,
        text: &str,
        source_lang: &str,
        target_lang: &str,
    ) -> anyhow::Result<String> {
        let url = format!("{}/translate", self.base_url);

        let request = SarvamTranslateRequest {
            input: text.to_string(),
            source_language_code: source_lang.to_string(),
            target_language_code: target_lang.to_string(),
            speaker_gender: "Female".to_string(),
            mode: "formal".to_string(),
            model: "mayura:v1".to_string(),
            enable_preprocessing: true,
            output_script: "roman".to_string(),
            numerals_format: "international".to_string(),
        };

        let response = self.client
            .post(&url)
            .header("api-subscription-key", api_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            return Err(anyhow::anyhow!("Sarvam translate error: {}", error_text));
        }

        let result: SarvamTranslateResponse = response.json().await?;
        Ok(result.translated_text)
    }
}

#[derive(Debug, Serialize)]
struct SarvamTtsRequest {
    inputs: Vec<String>,
    target_language_code: String,
    speaker: String,
    pitch: f32,
    pace: f32,
    loudness: f32,
    speech_sample_rate: i32,
    enable_preprocessing: bool,
    model: String,
}

#[derive(Debug, Deserialize)]
struct SarvamTtsResponse {
    audios: Vec<String>,
    word_durations: Option<Vec<Vec<f32>>>,
    word_timestamps: Option<Vec<Vec<f32>>>,
}

#[derive(Debug, Deserialize)]
struct SarvamSttResponse {
    transcript: String,
    #[serde(default)]
    confidence: Option<f32>,
}

#[derive(Debug, Serialize)]
struct SarvamTranslateRequest {
    input: String,
    source_language_code: String,
    target_language_code: String,
    speaker_gender: String,
    mode: String,
    model: String,
    enable_preprocessing: bool,
    output_script: String,
    numerals_format: String,
}

#[derive(Debug, Deserialize)]
struct SarvamTranslateResponse {
    translated_text: String,
    #[serde(default)]
    pronunciation: Option<String>,
}
