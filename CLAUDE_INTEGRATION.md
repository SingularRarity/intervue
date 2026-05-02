# Anthropic Claude Integration Guide

## Overview
Claude 3.5 Sonnet powers the intelligent interviewing engine:
- Resume-aware question generation
- Contextual follow-up questions
- Multi-dimensional candidate evaluation
- Natural conversation flow

## API Endpoints Used

### 1. Messages API (Primary)
```bash
POST https://api.anthropic.com/v1/messages
Headers:
  x-api-key: YOUR_API_KEY
  anthropic-version: 2023-06-01
  Content-Type: application/json

Body:
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "system": "You are an expert technical interviewer...",
  "messages": [
    {
      "role": "user",
      "content": "Generate interview questions for a React developer..."
    }
  ],
  "temperature": 0.7
}
```

**Response:**
```json
{
  "id": "msg_01Xxxxxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "[{"question":"...","expected_answer_points":[...],"weight":0.8,"skill":"React"}]"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "usage": {
    "input_tokens": 500,
    "output_tokens": 800
  }
}
```

## Prompt Engineering

### System Prompts Used

#### Question Generation
```
You are an expert technical interviewer for a {role} position.
Generate {type} interview questions in {language} language.
The candidate has {years} years of experience with skills: {skills}.
Difficulty level: {difficulty}.

For each question, provide:
1. The question text
2. Expected key points in the answer
3. A weight (0.0-1.0) indicating importance
4. The skill being assessed

Return ONLY a JSON array with no markdown formatting.
```

#### Response Analysis
```
You are an expert interview evaluator. Analyze the candidate's response objectively.

Provide a JSON response with:
- score: 0-100
- technical_accuracy: 0-100
- communication_clarity: 0-100
- depth_of_knowledge: 0-100
- key_points_covered: array of strings
- missing_points: array of strings
- follow_up_suggestion: string (next question or null if sufficient)
- summary: brief evaluation summary
```

#### Final Report
```
You are a senior hiring manager. Generate a comprehensive interview evaluation report.

Provide a JSON response with:
- overall_score: 0-100
- technical_score: 0-100
- communication_score: 0-100
- problem_solving_score: 0-100
- cultural_fit_score: 0-100
- strengths: array of strings
- weaknesses: array of strings
- recommendation: one of "Strong Hire", "Hire", "Maybe", "No Hire"
- detailed_feedback: string (2-3 paragraphs)
- skill_assessments: array of {skill, score, evidence, level}
```

## Token Usage & Costs

### Claude 3.5 Sonnet Pricing (2026)
| Usage | Price |
|-------|-------|
| Input tokens | $3 / 1M tokens |
| Output tokens | $15 / 1M tokens |

### Typical Interview Costs
| Operation | Input Tokens | Output Tokens | Cost |
|-----------|-------------|---------------|------|
| Question Generation | 500 | 800 | ~$0.014 |
| Response Analysis | 1,000 | 500 | ~$0.010 |
| Final Report | 3,000 | 2,000 | ~$0.039 |
| **Full Interview (10 Q&A)** | ~15,000 | ~10,000 | **~$0.195** |

### Cost Optimization
1. **Cache common prompts**: Greetings, instructions
2. **Use shorter contexts**: Only send last 3 Q&A pairs
3. **Batch requests**: Combine multiple analyses
4. **Temperature tuning**: Use 0.3 for consistent scoring, 0.7 for questions

## Error Handling

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| 401 | Invalid API key | Verify in Settings |
| 429 | Rate limit (40 req/min) | Implement retry with backoff |
| 529 | Overloaded | Retry after 1-5 seconds |
| context_length_exceeded | Prompt too long | Truncate resume/transcript |

### Retry Logic (Rust)
```rust
use tokio::time::{sleep, Duration};

async fn call_claude_with_retry(
    client: &reqwest::Client,
    request: &ClaudeRequest,
    max_retries: u32,
) -> Result<ClaudeResponse, Error> {
    let mut retries = 0;
    loop {
        match client.post("https://api.anthropic.com/v1/messages")
            .json(request)
            .send().await {
            Ok(res) if res.status().is_success() => return Ok(res.json().await?),
            Ok(res) if res.status() == 429 => {
                retries += 1;
                if retries > max_retries {
                    return Err(Error::RateLimited);
                }
                sleep(Duration::from_secs(2u64.pow(retries))).await;
            }
            _ => {
                retries += 1;
                if retries > max_retries {
                    return Err(Error::MaxRetriesExceeded);
                }
                sleep(Duration::from_secs(1)).await;
            }
        }
    }
}
```

## Testing

```bash
# Test with curl
curl https://api.anthropic.com/v1/messages   -H "x-api-key: YOUR_KEY"   -H "anthropic-version: 2023-06-01"   -H "content-type: application/json"   -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Say hello"}
    ]
  }'
```

## Resources
- **Console**: https://console.anthropic.com/
- **Docs**: https://docs.anthropic.com/
- **Community**: https://community.anthropic.com/
- **Support**: support@anthropic.com
