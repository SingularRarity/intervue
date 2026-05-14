/**
 * Demo 01 — Free User Plan
 * Candidate: Priya Sharma (junior frontend developer)
 * Company: TechFlow Solutions
 * Duration target: ≤90s reel + extended cut
 */

import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
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
const NARRATION = path.join(AUDIO, 'narration', 'free')
const RESPONSES = path.join(AUDIO, 'responses', 'free')
const JD_PATH = path.join(DEMOS_ROOT, 'assets', 'jds', '01-junior-frontend.txt')
const RESUME_PATH = path.join(DEMOS_ROOT, 'assets', 'resumes', '01-priya-sharma.txt')

const EMAIL = process.env.DEMO_FREE_EMAIL!
const PASS = process.env.DEMO_FREE_PASS!

test('Free Plan — Priya Sharma screening', async ({ page, context }) => {
  await setupMicrophoneInjection(context)

  // ── SCENE: INTRO ──────────────────────────────────────────────
  await page.goto('about:blank')
  await injectCursor(page)
  const introDur = await playNarration(page, path.join(NARRATION, 'intro.mp3'))
  await showScene(page, 'Intervue — Free Plan')
  await showCaption(page, 'Meet Priya Sharma — junior frontend developer, first job search.')
  await pause(page, introDur)
  await hideCaption(page)

  // ── LOGIN ──────────────────────────────────────────────────────
  await login(page, EMAIL, PASS)
  await injectCursor(page)
  await pause(page, 800)

  // ── SCENE: CREATE TEMPLATE ─────────────────────────────────────
  await showScene(page, 'Step 1 — Create Interview Template')
  const tmplDur = await playNarration(page, path.join(NARRATION, 'template_create.mp3'))
  await showCaption(page, 'Creating a screening template — smart defaults for the free plan.')

  // Navigate to templates
  await slowClick(page, 'a[href*="templates"], nav a:has-text("Templates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  // Open new template modal
  await slowClick(page, 'button:has-text("New Template"), button:has-text("Create Template"), button:has-text("+")')
  await page.waitForSelector('[role="dialog"], .modal, form', { timeout: 8000 })
  await pause(page, 500)

  // Fill template name
  await slowType(page, 'input[name="title"], input[placeholder*="title"], input[placeholder*="name"]', 'Junior Frontend Developer Screening')
  await pause(page, tmplDur > 0 ? Math.max(0, tmplDur - 4000) : 1000)
  await hideCaption(page)

  // ── SCENE: JD UPLOAD ──────────────────────────────────────────
  await showScene(page, 'Step 2 — Upload Job Description')
  const jdDur = await playNarration(page, path.join(NARRATION, 'jd_upload.mp3'))
  await showCaption(page, 'Uploading the job description — AI parses it automatically.')

  await uploadFile(page, 'input[type="file"][accept*=".txt"], input[type="file"][accept*=".pdf"], input[type="file"]', JD_PATH)
  await pause(page, 3000) // wait for AI parse

  // Wait for fields to auto-fill
  await page.waitForFunction(
    () => {
      const inputs = document.querySelectorAll('input, textarea, select')
      return Array.from(inputs).some((el) => (el as HTMLInputElement).value.length > 3)
    },
    { timeout: 15000 }
  )
  await pause(page, jdDur > 0 ? Math.max(0, jdDur - 5000) : 1000)
  await hideCaption(page)

  // Save template
  await slowClick(page, 'button[type="submit"], button:has-text("Save"), button:has-text("Create")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1200)

  // ── SCENE: ADD CANDIDATE ───────────────────────────────────────
  await showScene(page, 'Step 3 — Add Candidate')
  const candDur = await playNarration(page, path.join(NARRATION, 'candidate_add.mp3'))
  await showCaption(page, 'Adding Priya — resume upload fills every field automatically.')

  // Navigate to candidates
  await slowClick(page, 'a[href*="candidates"], nav a:has-text("Candidates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  // Open add candidate modal
  await slowClick(page, 'button:has-text("Add Candidate"), button:has-text("New Candidate"), button:has-text("+")')
  await page.waitForSelector('[role="dialog"], .modal', { timeout: 8000 })
  await pause(page, 500)

  // Upload resume
  await uploadFile(page, 'input[type="file"]', RESUME_PATH)
  await pause(page, 3500) // wait for parse

  // Wait for name to auto-fill
  await page.waitForFunction(
    () => {
      const nameInput = document.querySelector('input[name="name"], input[placeholder*="name"]') as HTMLInputElement
      return nameInput && nameInput.value.length > 2
    },
    { timeout: 15000 }
  ).catch(() => {})

  await pause(page, candDur > 0 ? Math.max(0, candDur - 5000) : 1000)
  await hideCaption(page)

  // Save candidate
  await slowClick(page, 'button[type="submit"], button:has-text("Add"), button:has-text("Save")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1000)

  // ── FIND TEMPLATE AND START INTERVIEW ─────────────────────────
  await showScene(page, 'Step 4 — Start the Interview')
  const startDur = await playNarration(page, path.join(NARRATION, 'interview_start.mp3'))
  await showCaption(page, 'One click. The AI interviewer takes over.')

  // Navigate back to templates to start interview
  await slowClick(page, 'a[href*="templates"], nav a:has-text("Templates")')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  // Find the template we created and click start/conduct interview
  await slowClick(page, 'button:has-text("Start Interview"), button:has-text("Conduct"), button:has-text("Interview")')
  await pause(page, 1000)

  // Select candidate if modal appears
  const candidateSelectVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false)
  if (candidateSelectVisible) {
    await slowClick(page, 'text=Priya Sharma')
    await pause(page, 500)
    await slowClick(page, 'button[type="submit"], button:has-text("Start"), button:has-text("Begin")')
  }

  await pause(page, startDur)
  await hideCaption(page)

  // ── SCENE: INTERVIEW RUNNING ───────────────────────────────────
  await showScene(page, 'Live AI Interview')
  const runDur = await playNarration(page, path.join(NARRATION, 'interview_running.mp3'))
  await showCaption(page, 'Priya speaks naturally. The AI listens and responds in real time.')

  // Wait for interview page to load
  await page.waitForURL(/interview|session/, { timeout: 20000 }).catch(async () => {
    // Try finding interview link and navigating
    const interviewLink = page.locator('a[href*="interview"]').first()
    if (await interviewLink.isVisible()) {
      await interviewLink.click()
      await page.waitForLoadState('networkidle')
    }
  })

  await pause(page, 2000)

  // Inject first candidate response
  await showCaption(page, '"Hi, I\'m Priya Sharma, a recent CS graduate..."')
  const dur1 = await injectAudioResponse(page, path.join(RESPONSES, 'response-1.mp3'))
  await pause(page, dur1 + 1500)

  await hideCaption(page)
  await pause(page, 2500) // AI processes and asks next question

  // Second response
  await showCaption(page, '"When I face a CSS issue, I open Chrome DevTools first..."')
  const dur2 = await injectAudioResponse(page, path.join(RESPONSES, 'response-2.mp3'))
  await pause(page, dur2 + 1500)

  await hideCaption(page)
  await pause(page, runDur > 0 ? Math.max(0, runDur - 6000) : 2000)

  // Third response (career goals)
  await showCaption(page, '"In three years, I see myself owning frontend features end-to-end..."')
  const dur3 = await injectAudioResponse(page, path.join(RESPONSES, 'response-3.mp3'))
  await pause(page, dur3 + 1500)

  await hideCaption(page)

  // ── SCENE: RESULTS ─────────────────────────────────────────────
  await showScene(page, 'Results — Instant Evaluation')
  const resultsDur = await playNarration(page, path.join(NARRATION, 'results.mp3'))
  await showCaption(page, 'Complete evaluation ready — skills matched, recommendation surfaced.')

  // Navigate to results/report
  await slowClick(page, 'button:has-text("End Interview"), button:has-text("Finish"), button:has-text("Complete")').catch(() => {})
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  // Try to navigate to results
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
  await showCaption(page, 'Intervue — AI-powered interviews. Start free today.')
  await pause(page, ctaDur + 1000)
  await hideCaption(page)

  // Final pause for clean recording end
  await pause(page, 1500)
})
