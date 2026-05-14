/**
 * Demo 02 — Individual Plan
 * Candidate: Arjun Mehta (senior full-stack)
 * Company: Zeno Fintech
 */

import { test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  setupCursorOverlay,
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
const NARRATION = path.join(AUDIO, 'narration', 'individual')
const RESPONSES = path.join(AUDIO, 'responses', 'individual')
const JD_PATH = path.join(DEMOS_ROOT, 'assets', 'jds', '02-fullstack-engineer.txt')
const RESUME_PATH = path.join(DEMOS_ROOT, 'assets', 'resumes', '02-arjun-mehta.txt')

const EMAIL = process.env.DEMO_INDIVIDUAL_EMAIL!
const PASS = process.env.DEMO_INDIVIDUAL_PASS!

test('Individual Plan — Arjun Mehta full-stack interview', async ({ page, context }) => {
  test.setTimeout(12 * 60 * 1000)

  await setupMicrophoneInjection(context)
  await setupCursorOverlay(context)

  // ── INTRO ──────────────────────────────────────────
  await page.goto('about:blank')
  const introDur = await playNarration(page, path.join(NARRATION, 'intro.mp3'))
  await showScene(page, 'Intervue — Individual Plan')
  await showCaption(page, 'Arjun Mehta — 4 years full-stack. Interviewing at Zeno Fintech.')
  await pause(page, introDur)
  await hideCaption(page)

  // ── LOGIN ──────────────────────────────────────────
  await login(page, EMAIL, PASS)
  await pause(page, 800)

  // ── CREATE TEMPLATE ────────────────────────────────
  await showScene(page, 'Step 1 — Create Technical Template')
  const tmplDur = await playNarration(page, path.join(NARRATION, 'template_create.mp3'))
  await showCaption(page, 'Full control: technical interview, 30 minutes, Hard difficulty.')

  await slowClick(page, 'a[href="/templates"]')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Create Template"), button:has-text("New Template")')
  await page.waitForSelector('h2:has-text("New Interview Template")', { timeout: 8000 })
  await pause(page, 500)

  await slowType(
    page,
    'input[placeholder="e.g., Senior React Developer"]',
    'Senior Full-Stack Engineer — Technical Round'
  )

  // Individual plan can set Interview Type, Duration, Difficulty
  await page.locator('select').nth(0).selectOption('Technical').catch(() => {})
  await page.locator('select').nth(1).selectOption('Hard').catch(() => {})
  await page.locator('select').nth(2).selectOption('30').catch(() => {})

  await pause(page, Math.max(0, tmplDur - 4000))
  await hideCaption(page)

  // ── JD UPLOAD ──────────────────────────────────────
  await showScene(page, 'Step 2 — Upload Job Description')
  const jdDur = await playNarration(page, path.join(NARRATION, 'jd_upload.mp3'))
  await showCaption(page, 'Drop the JD — Intervue extracts topics, difficulty, and duration.')

  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles(JD_PATH)
  await pause(page, 4000)
  await pause(page, Math.max(0, jdDur - 5000))
  await hideCaption(page)

  await slowClick(page, 'button[type="submit"]:has-text("Create Template")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  // ── ADD CANDIDATE ──────────────────────────────────
  await showScene(page, 'Step 3 — Add Candidate')
  const candDur = await playNarration(page, path.join(NARRATION, 'candidate_add.mp3'))
  await showCaption(page, "Arjun's resume uploaded — every field auto-populated.")

  await slowClick(page, 'a[href="/candidates"]')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Add Candidate")')
  await page.waitForSelector('h2:has-text("Add Candidate")', { timeout: 8000 })
  await pause(page, 500)

  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles(RESUME_PATH)
  await pause(page, 5000)

  await page.locator('input[placeholder="John Doe"]').fill('Arjun Mehta')
  await page.locator('input[placeholder="john@example.com"]').fill('arjun.mehta@gmail.com')
  // Clear experience_years — avoids backend NUMERIC/f32 bug
  await page.locator('input[type="number"]').fill('')
  await pause(page, 500)

  await pause(page, Math.max(0, candDur - 6000))
  await hideCaption(page)

  const submitBtn = page.locator('form button[type="submit"]')
  await submitBtn.scrollIntoViewIfNeeded()
  await pause(page, 500)
  await submitBtn.click()
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('button:has-text("Start Interview")', { timeout: 15000 })
  await pause(page, 800)

  // ── START INTERVIEW ────────────────────────────────
  await showScene(page, 'Step 4 — Start Technical Interview')
  const startDur = await playNarration(page, path.join(NARRATION, 'interview_start.mp3'))
  await showCaption(page, 'The AI conducts a structured technical interview. No prep needed.')

  await slowClick(page, 'button:has-text("Start Interview")')
  await page.waitForSelector('h2:has-text("Start Interview")', { timeout: 8000 })
  await pause(page, 500)

  await page.locator('#template-select').selectOption({ index: 1 })
  await pause(page, 500)

  const [interviewPage] = await Promise.all([
    context.waitForEvent('page', { timeout: 15000 }),
    slowClick(page, 'div.fixed button:has-text("Start Interview")'),
  ])

  await interviewPage.waitForLoadState('domcontentloaded')
  await pause(page, startDur)
  await hideCaption(page)

  // ── INTERVIEW RUNNING ──────────────────────────────
  await showScene(interviewPage, 'Live Technical Interview — 4 Questions')
  const runDur = await playNarration(interviewPage, path.join(NARRATION, 'interview_running.mp3'))
  await pause(interviewPage, 3000)

  // Q1
  await showCaption(interviewPage, '"I\'ve been working full-stack for four years..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-1.mp3')).catch(() => 0)
  await pause(interviewPage, 22000)
  await hideCaption(interviewPage)
  await pause(interviewPage, 2500)

  // Q2
  await showCaption(interviewPage, '"My philosophy: use the simplest tool that solves the problem..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-2.mp3')).catch(() => 0)
  await pause(interviewPage, 19000)
  await hideCaption(interviewPage)
  await pause(interviewPage, 2500)

  // Q3
  await showCaption(interviewPage, '"I think about this in three layers: structure, abstraction, testing..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-3.mp3')).catch(() => 0)
  await pause(interviewPage, 19000)
  await hideCaption(interviewPage)
  await pause(interviewPage, 2500)

  // Q4
  await showCaption(interviewPage, '"I follow key sources — React RFCs, TC39 proposals, newsletters..."')
  await injectAudioResponse(interviewPage, path.join(RESPONSES, 'response-4.mp3')).catch(() => 0)
  await pause(interviewPage, 16000)
  await hideCaption(interviewPage)
  await pause(interviewPage, Math.max(0, runDur - 90000))

  // ── RESULTS ────────────────────────────────────────
  await showScene(interviewPage, 'Results — Detailed Scorecard')
  const resultsDur = await playNarration(interviewPage, path.join(NARRATION, 'results.mp3'))
  await showCaption(interviewPage, 'Technical depth, communication clarity — shareable in one link.')
  await pause(interviewPage, resultsDur)
  await hideCaption(interviewPage)

  // ── CTA ────────────────────────────────────────────
  await showScene(interviewPage, 'intervue.singularraritylabs.com')
  const ctaDur = await playNarration(interviewPage, path.join(NARRATION, 'cta.mp3'))
  await showCaption(interviewPage, 'Intervue — Smarter technical hiring. Try the Individual plan today.')
  await pause(interviewPage, ctaDur + 1500)
  await hideCaption(interviewPage)
  await pause(interviewPage, 1500)
})
