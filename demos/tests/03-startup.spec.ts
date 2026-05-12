/**
 * Demo 03 — Startup Plan
 * Candidate: Sanjay Krishnan (Principal Architect, 14 years)
 * Company: NovaStar Systems
 * Duration target: ≤90s reel + extended cut (5 architecture questions)
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'
import {
  injectCursor,
  showScene,
  showCaption,
  hideCaption,
  slowClick,
  slowType,
  pause,
  login,
  uploadFile,
  setupMicrophoneInjection,
  injectAudioResponse,
  playNarration,
} from '../src/helpers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMOS_ROOT = path.join(__dirname, '..')
const AUDIO = path.join(DEMOS_ROOT, 'assets', 'audio')
const NARRATION = path.join(AUDIO, 'narration', 'startup')
const RESPONSES = path.join(AUDIO, 'responses', 'startup')
const JD_PATH = path.join(DEMOS_ROOT, 'assets', 'jds', '03-principal-architect.txt')
const RESUME_PATH = path.join(DEMOS_ROOT, 'assets', 'resumes', '03-sanjay-krishnan.txt')

dotenv.config({ path: path.join(DEMOS_ROOT, '.env') })

const EMAIL = process.env.DEMO_STARTUP_EMAIL!
const PASS = process.env.DEMO_STARTUP_PASS!

test('Startup Plan — Sanjay Krishnan architecture interview', async ({ page, context }) => {
  await setupMicrophoneInjection(context)

  // ── SCENE: INTRO ──────────────────────────────────────────────
  await page.goto('about:blank')
  await injectCursor(page)
  const introDur = await playNarration(page, path.join(NARRATION, 'intro.mp3'))
  await showScene(page, 'Intervue — Startup Plan')
  await showCaption(page, 'Sanjay Krishnan. Principal Architect. 14 years. IIT Madras.')
  await pause(page, introDur)
  await hideCaption(page)

  // ── LOGIN ──────────────────────────────────────────────────────
  await login(page, EMAIL, PASS)
  await injectCursor(page)
  await pause(page, 800)

  // ── SCENE: CREATE TEMPLATE ─────────────────────────────────────
  await showScene(page, 'Step 1 — Expert-Level Architecture Template')
  const tmplDur = await playNarration(page, path.join(NARRATION, 'template_create.mp3'))
  await showCaption(page, 'Expert difficulty. 60 minutes. Five deep architecture questions.')

  await slowClick(page, 'a[href*="templates"], nav a:has-text("Templates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("New Template"), button:has-text("Create Template"), button:has-text("+")')
  await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 8000 })
  await pause(page, 500)

  await slowType(page, 'input[name="title"], input[placeholder*="title"], input[placeholder*="name"]', 'Principal Architect — System Design & Leadership')
  await pause(page, 400)

  // Set interview type to Technical
  const typeSelect = page.locator('select[name="interview_type"], select[id*="type"]').first()
  if (await typeSelect.isVisible().catch(() => false)) {
    await typeSelect.selectOption({ label: 'Technical' })
    await pause(page, 300)
  }

  // Set difficulty to Expert
  const diffSelect = page.locator('select[name="difficulty"], select[id*="difficulty"]').first()
  if (await diffSelect.isVisible().catch(() => false)) {
    await diffSelect.selectOption({ value: 'Expert', label: 'Expert' })
    await pause(page, 300)
  }

  // Set duration to 60 min
  const durSelect = page.locator('select[name="duration"], select[id*="duration"]').first()
  if (await durSelect.isVisible().catch(() => false)) {
    await durSelect.selectOption({ value: '60', label: '60 minutes' })
    await pause(page, 300)
  }

  await pause(page, tmplDur > 0 ? Math.max(0, tmplDur - 6000) : 1000)
  await hideCaption(page)

  // ── SCENE: JD UPLOAD ──────────────────────────────────────────
  await showScene(page, 'Step 2 — Upload Job Description')
  const jdDur = await playNarration(page, path.join(NARRATION, 'jd_upload.mp3'))
  await showCaption(page, 'Distributed systems, Kubernetes, Kafka at scale — Intervue parses every requirement.')

  await uploadFile(page, 'input[type="file"]', JD_PATH)
  await pause(page, 4000) // dense JD takes longer

  await page.waitForFunction(
    () => {
      const inputs = document.querySelectorAll('input, textarea, select')
      return Array.from(inputs).some((el) => (el as HTMLInputElement).value.length > 3)
    },
    { timeout: 20000 }
  ).catch(() => {})

  await pause(page, jdDur > 0 ? Math.max(0, jdDur - 6000) : 1500)
  await hideCaption(page)

  await slowClick(page, 'button[type="submit"], button:has-text("Save"), button:has-text("Create")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  // ── SCENE: ADD CANDIDATE ───────────────────────────────────────
  await showScene(page, 'Step 3 — Load Sanjay\'s Profile')
  const candDur = await playNarration(page, path.join(NARRATION, 'candidate_add.mp3'))
  await showCaption(page, '14 years of architecture decisions in a two-page document. Intervue reads all of it.')

  await slowClick(page, 'a[href*="candidates"], nav a:has-text("Candidates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Add Candidate"), button:has-text("New Candidate"), button:has-text("+")')
  await page.waitForSelector('[role="dialog"], .modal', { timeout: 8000 })
  await pause(page, 500)

  await uploadFile(page, 'input[type="file"]', RESUME_PATH)
  await pause(page, 4000)

  await page.waitForFunction(
    () => {
      const nameInput = document.querySelector('input[name="name"], input[placeholder*="name"]') as HTMLInputElement
      return nameInput && nameInput.value.length > 2
    },
    { timeout: 20000 }
  ).catch(() => {})

  await pause(page, candDur > 0 ? Math.max(0, candDur - 6000) : 1500)
  await hideCaption(page)

  await slowClick(page, 'button[type="submit"], button:has-text("Add"), button:has-text("Save")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1000)

  // ── SCENE: START INTERVIEW ─────────────────────────────────────
  await showScene(page, 'Step 4 — Begin Architecture Interview')
  const startDur = await playNarration(page, path.join(NARRATION, 'interview_start.mp3'))
  await showCaption(page, 'The AI architect begins. No hand-holding. No softball questions.')

  await slowClick(page, 'a[href*="templates"], nav a:has-text("Templates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Start Interview"), button:has-text("Conduct"), button:has-text("Interview")')
  await pause(page, 1000)

  const candidateSelectVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false)
  if (candidateSelectVisible) {
    await slowClick(page, 'text=Sanjay Krishnan')
    await pause(page, 500)
    await slowClick(page, 'button[type="submit"], button:has-text("Start"), button:has-text("Begin")')
  }

  await pause(page, startDur)
  await hideCaption(page)

  // ── SCENE: INTERVIEW — Q1 ──────────────────────────────────────
  await page.waitForURL(/interview|session/, { timeout: 20000 }).catch(async () => {
    const interviewLink = page.locator('a[href*="interview"]').first()
    if (await interviewLink.isVisible()) {
      await interviewLink.click()
      await page.waitForLoadState('networkidle')
    }
  })

  await pause(page, 2000)

  const q1Dur = await playNarration(page, path.join(NARRATION, 'q1.mp3'))
  await showScene(page, 'Q1 — Distributed Event System')
  await showCaption(page, 'Distributed systems design. The AI probes the trade-offs.')
  await pause(page, q1Dur + 500)
  await hideCaption(page)
  await pause(page, 1500)

  await showCaption(page, '"I\'d start by understanding the event contract... Kafka, 12 partitions, dead letter queue from day one."')
  const dur1 = await injectAudioResponse(page, path.join(RESPONSES, 'response-1.mp3'))
  await pause(page, dur1 + 2000)
  await hideCaption(page)
  await pause(page, 3000)

  // ── Q2 ─────────────────────────────────────────────────────────
  const q2Dur = await playNarration(page, path.join(NARRATION, 'q2.mp3'))
  await showScene(page, 'Q2 — Monolith to Microservices')
  await showCaption(page, 'Monolith decomposition. Real-world experience, not textbook answers.')
  await pause(page, q2Dur + 500)
  await hideCaption(page)
  await pause(page, 1500)

  await showCaption(page, '"The biggest mistake: starting with infrastructure before domain analysis. Strangler Fig. Never share a database."')
  const dur2 = await injectAudioResponse(page, path.join(RESPONSES, 'response-2.mp3'))
  await pause(page, dur2 + 2000)
  await hideCaption(page)
  await pause(page, 3000)

  // ── Q3 ─────────────────────────────────────────────────────────
  const q3Dur = await playNarration(page, path.join(NARRATION, 'q3.mp3'))
  await showScene(page, 'Q3 — CAP Theorem Under Pressure')
  await showCaption(page, 'CAP theorem — theory applied under production pressure.')
  await pause(page, q3Dur + 500)
  await hideCaption(page)
  await pause(page, 1500)

  await showCaption(page, '"CAP is a framework, not a prescription. Financial transactions need consistency. Product catalogs don\'t."')
  const dur3 = await injectAudioResponse(page, path.join(RESPONSES, 'response-3.mp3'))
  await pause(page, dur3 + 2000)
  await hideCaption(page)
  await pause(page, 3000)

  // ── Q4 ─────────────────────────────────────────────────────────
  const q4Dur = await playNarration(page, path.join(NARRATION, 'q4.mp3'))
  await showScene(page, 'Q4 — Leading a Controversial Technical Decision')
  await showCaption(page, 'Leadership under fire. The AI surfaces the human behind the architecture.')
  await pause(page, q4Dur + 500)
  await hideCaption(page)
  await pause(page, 1500)

  await showCaption(page, '"I proposed a controlled experiment. Made the first win concrete and undeniable."')
  const dur4 = await injectAudioResponse(page, path.join(RESPONSES, 'response-4.mp3'))
  await pause(page, dur4 + 2000)
  await hideCaption(page)
  await pause(page, 3000)

  // ── Q5 ─────────────────────────────────────────────────────────
  const q5Dur = await playNarration(page, path.join(NARRATION, 'q5.mp3'))
  await showScene(page, 'Q5 — Multi-Tenant Security Architecture')
  await showCaption(page, 'Multi-tenant security. The question that separates architects from engineers.')
  await pause(page, q5Dur + 500)
  await hideCaption(page)
  await pause(page, 1500)

  await showCaption(page, '"Row-level security in Postgres. OPA Gatekeeper. Audit log as a first-class deliverable — not an afterthought."')
  const dur5 = await injectAudioResponse(page, path.join(RESPONSES, 'response-5.mp3'))
  await pause(page, dur5 + 2000)
  await hideCaption(page)
  await pause(page, 2000)

  // ── SCENE: RESULTS ─────────────────────────────────────────────
  await showScene(page, 'Results — Comprehensive Architecture Report')
  const resultsDur = await playNarration(page, path.join(NARRATION, 'results.mp3'))
  await showCaption(page, 'System design depth, trade-off communication, decision-making under ambiguity. Ready in minutes.')

  await slowClick(page, 'button:has-text("End Interview"), button:has-text("Finish"), button:has-text("Complete")').catch(() => {})
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  const resultsLink = page.locator('a[href*="result"], a[href*="report"], button:has-text("View Report"), button:has-text("Results")')
  if (await resultsLink.first().isVisible().catch(() => false)) {
    await slowClick(page, 'a[href*="result"], a[href*="report"], button:has-text("View Report"), button:has-text("Results")')
    await page.waitForLoadState('networkidle')
    await pause(page, 2000)
  }

  await pause(page, resultsDur)
  await hideCaption(page)

  // ── SCENE: CTA ─────────────────────────────────────────────────
  await showScene(page, 'intervue.singularraritylabs.com')
  const ctaDur = await playNarration(page, path.join(NARRATION, 'cta.mp3'))
  await showCaption(page, 'Intervue — Enterprise-grade interviews, startup speed.')
  await pause(page, ctaDur + 1000)
  await hideCaption(page)

  await pause(page, 1500)
})
