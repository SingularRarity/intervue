# Intervue Demo Recordings

Three browser-automated demo videos for the Intervue platform. Each shows a real end-to-end interview workflow with visible cursor, narration audio, and simulated candidate voice responses.

| Demo | Plan | Candidate | Role |
|------|------|-----------|------|
| 01-free-user | Free | Priya Sharma | Junior Frontend Developer |
| 02-individual | Individual | Arjun Mehta | Senior Full-Stack Engineer |
| 03-startup | Startup | Sanjay Krishnan | Principal Architect (14 yrs) |

## Prerequisites

- Node.js 18+
- The platform running locally (frontend on `http://localhost:3001`, backend on `http://localhost:8080`)
- `ffmpeg` in PATH (for post-processing, optional)

## Quick Start

```bash
cd demos
npm install
npx playwright install chromium

# 1. Generate all TTS audio (one-time, ~5 min)
npm run generate:audio

# 2. Create demo accounts in the platform
npm run setup:accounts

# 3. Record all three demos
npm run demo:all

# 4. Collect final video files
npm run postprocess:all
```

Final videos are in `output/final/`.

## Step-by-Step

### 1. Generate Audio

```bash
npm run generate:audio
```

Produces:
- `assets/audio/narration/free/*.mp3` — voiceover for the Free demo
- `assets/audio/narration/individual/*.mp3` — voiceover for the Individual demo
- `assets/audio/narration/startup/*.mp3` — voiceover for the Startup demo
- `assets/audio/responses/free/response-{1-3}.mp3` — Priya's answers
- `assets/audio/responses/individual/response-{1-4}.mp3` — Arjun's answers
- `assets/audio/responses/startup/response-{1-5}.mp3` — Sanjay's answers

Uses Microsoft Edge TTS (free, no API key). Voices:
- Narration: `en-US-AndrewNeural`
- Priya (free): `en-IN-NeerjaNeural`
- Arjun (individual): `en-IN-PrabhatNeural`
- Sanjay (startup): `en-US-AndrewNeural` (slower rate for gravitas)

### 2. Setup Accounts

```bash
npm run setup:accounts
```

Creates three tenant accounts using credentials from `.env`. Skips existing accounts.

### 3. Record Demos

Run individually:
```bash
npm run demo:free        # 01-free-user.spec.ts
npm run demo:individual  # 02-individual.spec.ts
npm run demo:startup     # 03-startup.spec.ts
```

Or all at once (sequential):
```bash
npm run demo:all
```

Videos are saved by Playwright to `output/recordings/`.

### 4. Post-process

```bash
npm run postprocess:all
```

Copies the recordings to `output/final/` with clean names.

## Environment

Copy `.env.example` to `.env` and configure:

```
PLATFORM_URL=http://localhost:3001
API_URL=http://localhost:8080

DEMO_FREE_EMAIL=demo-free@intervue.app
DEMO_FREE_PASS=Intervue@Demo1

DEMO_INDIVIDUAL_EMAIL=demo-individual@intervue.app
DEMO_INDIVIDUAL_PASS=Intervue@Demo2

DEMO_STARTUP_EMAIL=demo-startup@intervue.app
DEMO_STARTUP_PASS=Intervue@Demo3

SARVAM_API_KEY=<your-sarvam-key>
```

## Assets

| File | Purpose |
|------|---------|
| `assets/jds/01-junior-frontend.txt` | JD for Priya's screening |
| `assets/jds/02-fullstack-engineer.txt` | JD for Arjun's technical round |
| `assets/jds/03-principal-architect.txt` | JD for Sanjay's architecture interview |
| `assets/resumes/01-priya-sharma.txt` | Priya's resume |
| `assets/resumes/02-arjun-mehta.txt` | Arjun's resume |
| `assets/resumes/03-sanjay-krishnan.txt` | Sanjay's resume |
| `assets/responses/*.json` | Interview Q&A data |
| `assets/audio/` | Generated TTS files (gitignored) |

## Troubleshooting

**Audio not playing in recording:**
Make sure Chromium is launched with `--autoplay-policy=no-user-gesture-required` (already set in `playwright.config.ts`).

**Interview page not found:**
The selectors in the spec files use broad `has-text` and attribute matchers. If the platform uses custom routing, check that the navigation selectors in `tests/*.spec.ts` match your actual UI.

**TTS generation fails:**
`msedge-tts` requires internet access. It calls the Microsoft Edge speech API.

**Audio files already exist:**
The generate script skips existing files. Delete `assets/audio/` and re-run to regenerate.
