# Sarvam AI Integration Guide

## Overview
Sarvam AI provides India's most advanced voice AI capabilities:
- Speech-to-Text (STT) in 10+ Indian languages
- Text-to-Speech (TTS) with natural Indian voices
- Translation between Indian languages
- Speaker diarization and voice cloning

## API Endpoints Used

### 1. Speech-to-Text (STT)
```bash
POST https://api.sarvam.ai/speech-to-text
Headers:
  api-subscription-key: YOUR_API_KEY
  Content-Type: multipart/form-data

Body:
  file: <audio_file>
  language_code: "hi-IN" | "ta-IN" | "te-IN" | "en-IN" | ...
  model: "saarika:v2" (latest)
```

**Response:**
```json
{
  "transcript": "मैं React में 3 साल का experience रखता हूँ",
  "confidence": 0.95,
  "word_timestamps": [...]
}
```

### 2. Text-to-Speech (TTS)
```bash
POST https://api.sarvam.ai/text-to-speech
Headers:
  api-subscription-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "inputs": ["Hello, I'm your AI interviewer today."],
  "target_language_code": "en-IN",
  "speaker": "meera",
  "pitch": 0.0,
  "pace": 1.0,
  "loudness": 1.0,
  "speech_sample_rate": 22050,
  "enable_preprocessing": true,
  "model": "bulbul:v1"
}
```

**Available Speakers:**
- `meera` - Professional female (English, Hindi)
- `arvind` - Professional male (English, Hindi)
- `pavithra` - Tamil female
- `mahesh` - Telugu male
- `amala` - Malayalam female
- `amartya` - Bengali male

**Response:**
```json
{
  "audios": ["base64_encoded_audio..."],
  "word_durations": [[0.5, 0.3, 0.4, ...]],
  "word_timestamps": [[0.0, 0.5, 0.8, ...]]
}
```

### 3. Translation
```bash
POST https://api.sarvam.ai/translate
Headers:
  api-subscription-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "input": "Hello, how are you?",
  "source_language_code": "en-IN",
  "target_language_code": "hi-IN",
  "speaker_gender": "Female",
  "mode": "formal",
  "model": "mayura:v1",
  "enable_preprocessing": true
}
```

## Language Support Matrix

| Language | Code | STT | TTS | Translation |
|----------|------|-----|-----|-------------|
| English (Indian) | en-IN | ✅ | ✅ | ✅ |
| Hindi | hi-IN | ✅ | ✅ | ✅ |
| Tamil | ta-IN | ✅ | ✅ | ✅ |
| Telugu | te-IN | ✅ | ✅ | ✅ |
| Bengali | bn-IN | ✅ | ✅ | ✅ |
| Marathi | mr-IN | ✅ | ✅ | ✅ |
| Gujarati | gu-IN | ✅ | ✅ | ✅ |
| Kannada | kn-IN | ✅ | ✅ | ✅ |
| Malayalam | ml-IN | ✅ | ✅ | ✅ |
| Punjabi | pa-IN | ✅ | ✅ | ✅ |
| Urdu | ur-IN | ✅ | ✅ | ✅ |

## Pricing (as of 2026)

| Service | Free Tier | Pro Tier | Enterprise |
|---------|-----------|----------|------------|
| STT | 100 req/day | 10,000 req/day | Unlimited |
| TTS | 100 req/day | 10,000 req/day | Unlimited |
| Translation | 100 req/day | 10,000 req/day | Unlimited |
| Cost | Free | ₹2,999/month | Custom |

## Integration Flow in InterviewAI

```
1. Candidate speaks → Browser records audio (WebRTC)
2. Audio sent via WebSocket to Rust backend
3. Backend sends audio to Sarvam STT API
4. Sarvam returns transcribed text
5. Text sent to Claude for analysis
6. Claude generates response
7. Response sent to Sarvam TTS API
8. Sarvam returns audio
9. Audio streamed back to candidate via WebSocket
```

## Error Handling

### Common Error Codes
| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Invalid API key | Check key in Settings |
| 429 | Rate limit exceeded | Upgrade plan or retry |
| 413 | Audio file too large | Split into chunks (< 25MB) |
| 415 | Unsupported audio format | Convert to WAV/MP3 |
| 500 | Server error | Retry with exponential backoff |

### Retry Strategy
```rust
// In Rust backend
let retry_policy = ExponentialBackoff::from_millis(100)
    .max_delay(Duration::from_secs(10))
    .take(3);

// Retry failed requests automatically
```

## Best Practices

1. **Audio Format**: Use WAV, 16kHz, mono for best STT accuracy
2. **Chunk Size**: Send audio in 5-10 second chunks for real-time feel
3. **Language Detection**: Always specify language_code explicitly
4. **Caching**: Cache TTS responses for common phrases (greetings, instructions)
5. **Fallback**: If TTS fails, show text transcript to candidate

## Testing

```bash
# Test STT
curl -X POST https://api.sarvam.ai/speech-to-text   -H "api-subscription-key: YOUR_KEY"   -F "file=@test_audio.wav"   -F "language_code=hi-IN"

# Test TTS
curl -X POST https://api.sarvam.ai/text-to-speech   -H "api-subscription-key: YOUR_KEY"   -H "Content-Type: application/json"   -d '{
    "inputs": ["नमस्ते, आपका स्वागत है"],
    "target_language_code": "hi-IN",
    "speaker": "meera"
  }'
```

## Resources
- **Dashboard**: https://dashboard.sarvam.ai/
- **Docs**: https://docs.sarvam.ai/
- **Community**: https://community.sarvam.ai/
- **Support**: support@sarvam.ai
