/**
 * Demo 02 — Individual Plan
 * Candidate: Arjun Mehta (4 years full-stack)
 * Company: Zeno Fintech
 * Duration target: ≤90s reel + extended cut
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  injectCursor,
  setupCursorOverlay,
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
const NARRATION = path.join(AUDIO, 'narration', 'individual')
const RESPONSES = path.join(AUDIO, 'responses', 'individual')
const JD_PATH = path.join(DEMOS_ROOT, 'assets', 'jds', '02-fullstack-engineer.txt')
const RESUME_PATH = path.join(DEMOS_ROOT, 'assets', 'resumes', '02-arjun-mehta.txt')

const EMAIL = process.env.DEMO_INDIVIDUAL_EMAIL!
const PASS = process.env.DEMO_INDIVIDUAL_PASS!

test('Individual Plan — Arjun Mehta full-stack interview', async ({ page, context }) => {
  await setupMicrophoneInjection(context)
  await setupCursorOverlay(context)

  // ── SCENE: INTRO ──────────────────────────────────────────────
  await page.goto('about:blank')
  await injectCursor(page)
  const introDur = await playNarration(page, path.join(NARRATION, 'intro.mp3'))
  await showScene(page, 'Intervue — Individual Plan')
  await showCaption(page, 'Arjun Mehta — 4 years full-stack. Interviewing at Zeno Fintech.')
  await pause(page, introDur)
  await hideCaption(page)

  // ── LOGIN ──────────────────────────────────────────────────────
  await login(page, EMAIL, PASS)
  await injectCursor(page)
  await pause(page, 800)

  // ── SCENE: CREATE TEMPLATE ─────────────────────────────────────
  await showScene(page, 'Step 1 — Create Technical Interview Template')
  const tmplDur = await playNarration(page, path.join(NARRATION, 'template_create.mp3'))
  await showCaption(page, 'Full control: Technical interview, 30 min, Hard difficulty.')

  await slowClick(page, 'a[href*="templates"], nav a:has-text("Templates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("New Template"), button:has-text("Create Template"), button:has-text("+")')
  await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 8000 })
  await pause(page, 500)

  await slowType(page, 'input[name="title"], input[placeholder*="title"], input[placeholder*="name"]', 'Senior Full-Stack Engineer — Technical Round')
  await pause(page, 400)

  // Set interview type to Technical (Individual plan has full control)
  const typeSelect = page.locator('select[name="interview_type"], select[id*="type"]').first()
  if (await typeSelect.isVisible().catch(() => false)) {
    await typeSelect.selectOption({ label: 'Technical' })
    await pause(page, 300)
  }

  // Set difficulty to Hard
  const diffSelect = page.locator('select[name="difficulty"], select[id*="difficulty"]').first()
  if (await diffSelect.isVisible().catch(() => false)) {
    await diffSelect.selectOption({ value: 'Hard', label: 'Hard' })
    await pause(page, 300)
  }

  // Set duration to 30 min
  const durSelect = page.locator('select[name="duration"], select[id*="duration"]').first()
  if (await durSelect.isVisible().catch(() => false)) {
    await durSelect.selectOption({ value: '30', label: '30 minutes' })
    await pause(page, 300)
  }

  await pause(page, tmplDur > 0 ? Math.max(0, tmplDur - 5000) : 1000)
  await hideCaption(page)

  // ── SCENE: JD UPLOAD ──────────────────────────────────────────
  await showScene(page, 'Step 2 — Upload Job Description')
  const jdDur = await playNarration(page, path.join(NARRATION, 'jd_upload.mp3'))
  await showCaption(page, 'Drop the JD — Intervue extracts topics, difficulty, and duration.')

  await uploadFile(page, 'input[type="file"]', JD_PATH)
  await pause(page, 3500)

  await page.waitForFunction(
    () => {
      const inputs = document.querySelectorAll('input, textarea, select')
      return Array.from(inputs).some((el) => (el as HTMLInputElement).value.length > 3)
    },
    { timeout: 15000 }
  ).catch(() => {})

  await pause(page, jdDur > 0 ? Math.max(0, jdDur - 5000) : 1000)
  await hideCaption(page)

  await slowClick(page, 'button[type="submit"], button:has-text("Save"), button:has-text("Create")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1200)

  // ── SCENE: ADD CANDIDATE ───────────────────────────────────────
  await showScene(page, 'Step 3 — Add Candidate')
  const candDur = await playNarration(page, path.join(NARRATION, 'candidate_add.mp3'))
  await showCaption(page, "Arjun's resume uploaded — every field auto-populated from his CV.")

  await slowClick(page, 'a[href*="candidates"], nav a:has-text("Candidates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Add Candidate"), button:has-text("New Candidate"), button:has-text("+")')
  await page.waitForSelector('[role="dialog"], .modal', { timeout: 8000 })
  await pause(page, 500)

  await uploadFile(page, 'input[type="file"]', RESUME_PATH)
  await pause(page, 3500)

  await page.waitForFunction(
    () => {
      const nameInput = document.querySelector('input[name="name"], input[placeholder*="name"]') as HTMLInputElement
      return nameInput && nameInput.value.length > 2
    },
    { timeout: 15000 }
  ).catch(() => {})

  await pause(page, candDur > 0 ? Math.max(0, candDur - 5000) : 1000)
  await hideCaption(page)

  await slowClick(page, 'button[type="submit"], button:has-text("Add"), button:has-text("Save")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1000)

  // ── SCENE: START INTERVIEW ─────────────────────────────────────
  await showScene(page, 'Step 4 — Start Technical Interview')
  const startDur = await playNarration(page, path.join(NARRATION, 'interview_start.mp3'))
  await showCaption(page, 'The AI conducts a structured technical interview. No prep needed.')

  await slowClick(page, 'a[href*="templates"], nav a:has-text("Templates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Start Interview"), button:has-text("Conduct"), button:has-text("Interview")')
  await pause(page, 1000)

  const candidateSelectVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false)
  if (candidateSelectVisible) {
    await slowClick(page, 'text=Arjun Mehta')
    await pause(page, 500)
    await slowClick(page, 'button[type="submit"], button:has-text("Start"), button:has-text("Begin")')
  }

  await pause(page, startDur)
  await hideCaption(page)

  // ── SCENE: INTERVIEW RUNNING ───────────────────────────────────
  await showScene(page, 'Live Technical Interview — 4 Questions')
  const runDur = await playNarration(page, path.join(NARRATION, 'interview_running.mp3'))

  await page.waitForURL(/interview|session/, { timeout: 20000 }).catch(async () => {
    const interviewLink = page.locator('a[href*="interview"]').first()
    if (await interviewLink.isVisible()) {
      await interviewLink.click()
      await page.waitForLoadState('networkidle')
    }
  })

  await pause(page, 2000)

  // Q1: full-stack experience
  await showCaption(page, '"I\'ve been working full-stack for four years..."')
  const dur1 = await injectAudioResponse(page, path.join(RESPONSES, 'response-1.mp3'))
  await pause(page, dur1 + 2000)
  await hideCaption(page)
  await pause(page, 2500)

  // Q2: state management philosophy
  await showCaption(page, '"My philosophy: use the simplest tool that solves the problem..."')
  const dur2 = await injectAudioResponse(page, path.join(RESPONSES, 'response-2.mp3'))
  await pause(page, dur2 + 2000)
  await hideCaption(page)
  await pause(page, 2500)

  // Q3: code maintainability
  await showCaption(page, '"I think about this in three layers: structure, abstraction, testing..."')
  const dur3 = await injectAudioResponse(page, path.join(RESPONSES, 'response-3.mp3'))
  await pause(page, dur3 + 2000)
  await hideCaption(page)
  await pause(page, 2500)

  // Q4: keeping up with React
  await showCaption(page, '"I follow key sources — React RFCs, TC39 proposals, newsletters..."')
  const dur4 = await injectAudioResponse(page, path.join(RESPONSES, 'response-4.mp3'))
  await pause(page, dur4 + 2000)
  await hideCaption(page)

  await pause(page, runDur > 0 ? Math.max(0, runDur - 10000) : 1500)

  // ── SCENE: RESULTS ─────────────────────────────────────────────
  await showScene(page, 'Results — Detailed Scorecard')
  const resultsDur = await playNarration(page, path.join(NARRATION, 'results.mp3'))
  await showCaption(page, 'Technical depth, communication clarity, culture signals — shareable in one link.')

  await slowClick(page, 'button:has-text("End Interview"), button:has-text("Finish"), button:has-text("Complete")').catch(() => {})
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  const resultsLink = page.locator('a[href*="result"], a[href*="report"], button:has-text("View Report"), button:has-text("Results")')
  if (await resultsLink.first().isVisible().catch(() => false)) {
    await slowClick(page, 'a[href*="result"], a[href*="report"], button:has-text("View Report"), button:has-text("Results")')
    await page.waitForLoadState('networkidle')
    await pause(page, 1500)
  }

  await pause(page, resultsDur)
  await hideCaption(page)

  // ── SCENE: CTA ─────────────────────────────────────────────────
  await showScene(page, 'intervue.singularraritylabs.com')
  const ctaDur = await playNarration(page, path.join(NARRATION, 'cta.mp3'))
  await showCaption(page, 'Intervue — Smarter technical hiring. Try the Individual plan today.')
  await pause(page, ctaDur + 1000)
  await hideCaption(page)

  await pause(page, 1500)
})
