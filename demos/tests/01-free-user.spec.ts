/**
 * Demo 01 — Free User Plan
 * Candidate: Priya Sharma (junior frontend developer)
 * Company: TechFlow Solutions
 */

import { test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  setupCursorOverlay,
  startAudioTimeline,
  showScene,
  showCaption,
  hideCaption,
  slowClick,
  slowType,
  pause,
  login,
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
  test.setTimeout(8 * 60 * 1000)

  await setupMicrophoneInjection(context)
  await setupCursorOverlay(context)
  startAudioTimeline(path.join(DEMOS_ROOT, 'output', 'timelines', 'demo-free'))

  // ── INTRO ──────────────────────────────────────────
  await page.goto('about:blank')
  const introDur = await playNarration(page, path.join(NARRATION, 'intro.mp3'))
  await showScene(page, 'Intervue — Free Plan')
  await showCaption(page, 'Meet Priya Sharma — junior frontend developer, first job search.')
  await pause(page, introDur)
  await hideCaption(page)

  // ── LOGIN ──────────────────────────────────────────
  await login(page, EMAIL, PASS)
  await pause(page, 800)

  // ── CREATE TEMPLATE ────────────────────────────────
  await showScene(page, 'Step 1 — Create Screening Template')
  const tmplDur = await playNarration(page, path.join(NARRATION, 'template_create.mp3'))
  await showCaption(page, 'Creating a screening template — smart defaults for the free plan.')

  // Navigate to templates via sidebar
  await slowClick(page, 'a[href="/templates"]')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  // Click "Create Template" header button (might be "Create Template" or shown in empty state)
  await slowClick(page, 'button:has-text("Create Template"), button:has-text("New Template")')
  await page.waitForSelector('h2:has-text("New Interview Template")', { timeout: 8000 })
  await pause(page, 500)

  // Fill the role/title (placeholder = "e.g., Senior React Developer")
  await slowType(
    page,
    'input[placeholder="e.g., Senior React Developer"]',
    'Junior Frontend Developer Screening'
  )
  await pause(page, Math.max(0, tmplDur - 4000))
  await hideCaption(page)

  // ── JD UPLOAD ──────────────────────────────────────
  await showScene(page, 'Step 2 — Upload Job Description')
  const jdDur = await playNarration(page, path.join(NARRATION, 'jd_upload.mp3'))
  await showCaption(page, "Upload the JD — Intervue's AI parses it automatically.")

  // The JD file input is hidden — use setInputFiles directly on it
  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles(JD_PATH)
  await pause(page, 4000) // wait for AI parse to populate fields
  await pause(page, Math.max(0, jdDur - 5000))
  await hideCaption(page)

  // Submit template creation
  await slowClick(page, 'button[type="submit"]:has-text("Create Template")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  // ── ADD CANDIDATE ──────────────────────────────────
  await showScene(page, 'Step 3 — Add Candidate')
  const candDur = await playNarration(page, path.join(NARRATION, 'candidate_add.mp3'))
  await showCaption(page, "Adding Priya — resume upload fills every field automatically.")

  await slowClick(page, 'a[href="/candidates"]')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  // Click "Add Candidate" header button
  await slowClick(page, 'button:has-text("Add Candidate")')
  await page.waitForSelector('h2:has-text("Add Candidate")', { timeout: 8000 })
  await pause(page, 500)

  // Upload resume — the hidden file input is accept=".pdf,.doc,.docx,.txt"
  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles(RESUME_PATH)
  await pause(page, 5000) // wait for AI to parse resume and populate form

  // Always set required Name + Email
  await page.locator('input[placeholder="John Doe"]').fill('Priya Sharma')
  await page.locator('input[placeholder="john@example.com"]').fill('priya.sharma@gmail.com')
  // Clear experience_years — backend has a NUMERIC/f32 deserialization bug
  await page.locator('input[type="number"]').fill('')
  await pause(page, 500)

  await pause(page, Math.max(0, candDur - 6000))
  await hideCaption(page)

  // Submit
  const submitBtn = page.locator('form button[type="submit"]')
  await submitBtn.scrollIntoViewIfNeeded()
  await pause(page, 500)
  await submitBtn.click()
  await page.waitForLoadState('networkidle')
  // Wait for candidate card to appear in the list
  await page.waitForSelector('button:has-text("Start Interview")', { timeout: 15000 })
  await pause(page, 800)
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  // ── START INTERVIEW ────────────────────────────────
  await showScene(page, 'Step 4 — Start the Interview')
  const startDur = await playNarration(page, path.join(NARRATION, 'interview_start.mp3'))
  await showCaption(page, 'One click. The AI interviewer takes over.')

  // Click "Start Interview" on the candidate card
  await slowClick(page, 'button:has-text("Start Interview")')
  await page.waitForSelector('h2:has-text("Start Interview")', { timeout: 8000 })
  await pause(page, 500)

  // Select the template (only one exists)
  const select = page.locator('#template-select')
  await select.selectOption({ index: 1 })
  await pause(page, 500)

  // Click "Conduct Interview Now" in the modal — opens the interview in a new tab
  const [interviewPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 15000 }),
    slowClick(page, 'div.fixed button:has-text("Conduct Interview Now")'),
  ])

  await interviewPage.waitForLoadState('domcontentloaded')
  await pause(page, startDur)
  await hideCaption(page)

  // ── INTERVIEW RUNNING ──────────────────────────────
  await showScene(interviewPage, 'Live AI Interview')
  const runDur = await playNarration(interviewPage, path.join(NARRATION, 'interview_running.mp3'))
  await showCaption(interviewPage, 'Priya speaks naturally. The AI listens and responds.')
  await pause(interviewPage, 3000)

  // The interview UI has a mic button. We need to click it to start recording,
  // then inject audio, then click again to stop.
  // For demo simplicity, just play the response audio through speakers while caption shows.
  await showCaption(interviewPage, '"Hi, I\'m Priya Sharma, a recent CS graduate..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-1.mp3')).catch(() => 0)
  await pause(interviewPage, 14000) // approximate response length

  await hideCaption(interviewPage)
  await pause(interviewPage, 2000)

  await showCaption(interviewPage, '"When I face a CSS issue, I open Chrome DevTools first..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-2.mp3')).catch(() => 0)
  await pause(interviewPage, 16000)

  await hideCaption(interviewPage)
  await pause(interviewPage, Math.max(0, runDur - 30000))

  await showCaption(interviewPage, '"In three years, I see myself owning frontend features end-to-end..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-3.mp3')).catch(() => 0)
  await pause(interviewPage, 13000)

  await hideCaption(interviewPage)

  // ── RESULTS ────────────────────────────────────────
  await showScene(interviewPage, 'Results — Instant Evaluation')
  const resultsDur = await playNarration(interviewPage, path.join(NARRATION, 'results.mp3'))
  await showCaption(interviewPage, 'Complete evaluation ready — skills matched, recommendation surfaced.')
  await pause(interviewPage, resultsDur)
  await hideCaption(interviewPage)

  // ── CTA ────────────────────────────────────────────
  await showScene(interviewPage, 'intervue.singularraritylabs.com')
  const ctaDur = await playNarration(interviewPage, path.join(NARRATION, 'cta.mp3'))
  await showCaption(interviewPage, 'Intervue — AI-powered interviews. Start free today.')
  await pause(interviewPage, ctaDur + 1500)
  await hideCaption(interviewPage)
  await pause(interviewPage, 1500)
})
