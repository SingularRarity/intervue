# Intervue Demo Generator

Produces a ~2-minute elevator-pitch video showcasing Intervue.

**Output:** `output/intervue_demo.mp4`

## Prerequisites

| Tool | Install |
|------|---------|
| Python 3.11+ | python.org |
| ffmpeg | `winget install ffmpeg` (Windows) or `brew install ffmpeg` (Mac) |
| Docker (app running) | `docker compose -f docker-compose.local.yml up -d` |

## Setup

```bash
cd demo

# 1. Create virtualenv
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

# 2. Install deps
pip install -r requirements.txt
playwright install chromium

# 3. Configure
cp .env.example .env
# Edit .env and set SARVAM_API_KEY (get from https://dashboard.sarvam.ai)

# 4. Add your logo
# Copy SingularRarityLabs logo to: demo/assets/logo.png
# (PNG with transparency works best)
```

## Run

```bash
# Full pipeline (seed → TTS → record → compose)
python generate_demo.py

# Skip steps you've already done
python generate_demo.py --skip-seed
python generate_demo.py --skip-seed --skip-tts
python generate_demo.py --skip-seed --skip-tts --skip-record
```

## What it does

| Step | What happens |
|------|-------------|
| Seed | Creates demo tenant + 3 templates + 3 candidates + completed sessions in local DB |
| TTS | Calls Sarvam AI API to generate 4 voices: narrator (meera), AI interviewer (maitreyi), Rahul/male candidate (arvind), Priya/female candidate (pavithra) |
| Record | Opens Chromium, navigates landing → dashboard → templates → interview results → analytics → CTA |
| Compose | FFmpeg: merges audio + video, appends 8-second end card with logo |

## Output structure

```
output/
├── seed_output.json        # Tenant + session IDs
├── audio/                  # Individual TTS clips + master.wav
│   ├── landing_hero_00_narrator.wav
│   ├── ...
│   └── master.wav          # Sequenced master audio
├── video/
│   └── *.webm              # Raw Playwright recording
├── _tmp/                   # FFmpeg intermediate files
└── intervue_demo.mp4       # FINAL OUTPUT ← share this
```

## Voices used

| Voice ID | Sarvam Speaker | Role |
|----------|---------------|------|
| meera | Narrator | Professional narration, all scene descriptions |
| maitreyi | AI Interviewer | Interview questions |
| arvind | Rahul Sharma | Indian male candidate (Backend Engineer) |
| pavithra | Priya Mehta | Indian female candidate (Product Manager) |

## Without Sarvam API key

The script runs in silent-audio fallback mode — the video will record correctly 
but all audio will be silent. Useful for testing the visual recording.

Get a Sarvam key at: https://dashboard.sarvam.ai

## Troubleshooting

**ffmpeg not found:**  
`winget install --id Gyan.FFmpeg -e` then restart terminal

**Playwright browser fails to open:**  
`playwright install chromium --with-deps`

**Login fails during recording:**  
Make sure the app is running: `docker ps` should show `ai-interview-frontend` and `ai-interview-backend`

**Video is too short / scenes cut off:**  
The Playwright recording matches audio timing. If TTS is slow, add `--skip-tts` after first run and re-record with `--skip-seed`.
