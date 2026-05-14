/**
 * Demo 03 — Startup Plan
 * Candidate: Sanjay Krishnan (Principal Architect, 14 years)
 * Company: NovaStar Systems
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
const NARRATION = path.join(AUDIO, 'narration', 'startup')
const RESPONSES = path.join(AUDIO, 'responses', 'startup')
const JD_PATH = path.join(DEMOS_ROOT, 'assets', 'jds', '03-principal-architect.txt')
const RESUME_PATH = path.join(DEMOS_ROOT, 'assets', 'resumes', '03-sanjay-krishnan.txt')

const EMAIL = process.env.DEMO_STARTUP_EMAIL!
const PASS = process.env.DEMO_STARTUP_PASS!

test('Startup Plan — Sanjay Krishnan architecture interview', async ({ page, context }) => {
  test.setTimeout(18 * 60 * 1000)

  await setupMicrophoneInjection(context)
  await setupCursorOverlay(context)

  // ── INTRO ──────────────────────────────────────────
  await page.goto('about:blank')
  const introDur = await playNarration(page, path.join(NARRATION, 'intro.mp3'))
  await showScene(page, 'Intervue — Startup Plan')
  await showCaption(page, 'Sanjay Krishnan. Principal Architect. 14 years. IIT Madras.')
  await pause(page, introDur)
  await hideCaption(page)

  // ── LOGIN ──────────────────────────────────────────
  await login(page, EMAIL, PASS)
  await pause(page, 800)

  // ── CREATE TEMPLATE ────────────────────────────────
  await showScene(page, 'Step 1 — Expert Architecture Template')
  const tmplDur = await playNarration(page, path.join(NARRATION, 'template_create.mp3'))
  await showCaption(page, 'Expert difficulty. 60 minutes. Five deep architecture questions.')

  await slowClick(page, 'a[href="/templates"]')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Create Template"), button:has-text("New Template")')
  await page.waitForSelector('h2:has-text("New Interview Template")', { timeout: 8000 })
  await pause(page, 500)

  await slowType(
    page,
    'input[placeholder="e.g., Senior React Developer"]',
    'Principal Architect — System Design & Leadership'
  )

  await page.locator('select').nth(0).selectOption('Technical').catch(() => {})
  await page.locator('select').nth(1).selectOption('Expert').catch(() => {})
  await page.locator('select').nth(2).selectOption('60').catch(() => {})

  await pause(page, Math.max(0, tmplDur - 4000))
  await hideCaption(page)

  // ── JD UPLOAD ──────────────────────────────────────
  await showScene(page, 'Step 2 — Upload Job Description')
  const jdDur = await playNarration(page, path.join(NARRATION, 'jd_upload.mp3'))
  await showCaption(page, 'Distributed systems, Kubernetes, Kafka at scale.')

  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles(JD_PATH)
  await pause(page, 5000)
  await pause(page, Math.max(0, jdDur - 6000))
  await hideCaption(page)

  await slowClick(page, 'button[type="submit"]:has-text("Create Template")')
  await page.waitForLoadState('networkidle')
  await pause(page, 1500)

  // ── ADD CANDIDATE ──────────────────────────────────
  await showScene(page, "Step 3 — Load Sanjay's Profile")
  const candDur = await playNarration(page, path.join(NARRATION, 'candidate_add.mp3'))
  await showCaption(page, '14 years of architecture decisions. Intervue reads all of it.')

  await slowClick(page, 'a[href="/candidates"]')
  await page.waitForLoadState('networkidle')
  await pause(page, 600)

  await slowClick(page, 'button:has-text("Add Candidate")')
  await page.waitForSelector('h2:has-text("Add Candidate")', { timeout: 8000 })
  await pause(page, 500)

  await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles(RESUME_PATH)
  await pause(page, 5500)

  await page.locator('input[placeholder="John Doe"]').fill('Sanjay Krishnan')
  await page.locator('input[placeholder="john@example.com"]').fill('sanjay.krishnan@gmail.com')
  await page.locator('input[type="number"]').fill('')
  await pause(page, 500)

  await pause(page, Math.max(0, candDur - 7000))
  await hideCaption(page)

  const submitBtn = page.locator('form button[type="submit"]')
  await submitBtn.scrollIntoViewIfNeeded()
  await pause(page, 500)
  await submitBtn.click()
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('button:has-text("Start Interview")', { timeout: 15000 })
  await pause(page, 800)

  // ── START INTERVIEW ────────────────────────────────
  await showScene(page, 'Step 4 — Begin Architecture Interview')
  const startDur = await playNarration(page, path.join(NARRATION, 'interview_start.mp3'))
  await showCaption(page, 'The AI architect begins. No softball questions.')

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

  // ── INTERVIEW — 5 QUESTIONS ────────────────────────
  const questions = [
    { dur: 'q1.mp3', scene: 'Q1 — Distributed Event System',
      cap: '"Kafka backbone, 12 partitions, dead letter queue from day one."',
      respDur: 38000 },
    { dur: 'q2.mp3', scene: 'Q2 — Monolith to Microservices',
      cap: '"Strangler Fig approach. Never share a database."',
      respDur: 36000 },
    { dur: 'q3.mp3', scene: 'Q3 — CAP Theorem Under Pressure',
      cap: '"Financial transactions need consistency. Product catalogs don\'t."',
      respDur: 28000 },
    { dur: 'q4.mp3', scene: 'Q4 — Leading a Controversial Decision',
      cap: '"Made the first win concrete and undeniable."',
      respDur: 36000 },
    { dur: 'q5.mp3', scene: 'Q5 — Multi-Tenant Security',
      cap: '"Row-level security. Audit log as a first-class deliverable."',
      respDur: 38000 },
  ]

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const qDur = await playNarration(interviewPage, path.join(NARRATION, q.dur))
    await showScene(interviewPage, q.scene)
    await showCaption(interviewPage, q.cap.split('"')[0] || 'AI asks…')
    await pause(interviewPage, qDur + 500)
    await hideCaption(interviewPage)
    await pause(interviewPage, 1500)

    await showCaption(interviewPage, q.cap)
    await injectAudioResponse(interviewPage, path.join(RESPONSES, `response-${i + 1}.mp3`)).catch(() => 0)
    await pause(interviewPage, q.respDur)
    await hideCaption(interviewPage)
    await pause(interviewPage, 2500)
  }

  // ── RESULTS ────────────────────────────────────────
  await showScene(interviewPage, 'Results — Architecture Report')
  const resultsDur = await playNarration(interviewPage, path.join(NARRATION, 'results.mp3'))
  await showCaption(interviewPage, 'System design depth, trade-off communication — shareable in minutes.')
  await pause(interviewPage, resultsDur)
  await hideCaption(interviewPage)

  // ── CTA ────────────────────────────────────────────
  await showScene(interviewPage, 'intervue.singularraritylabs.com')
  const ctaDur = await playNarration(interviewPage, path.join(NARRATION, 'cta.mp3'))
  await showCaption(interviewPage, 'Intervue — Enterprise-grade interviews, startup speed.')
  await pause(interviewPage, ctaDur + 1500)
  await hideCaption(interviewPage)
  await pause(interviewPage, 1500)
})
