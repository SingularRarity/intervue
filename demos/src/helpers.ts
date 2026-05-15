import { Page, BrowserContext } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// ──────────────────────────────────────────
// Audio playback timeline tracker
// Records timestamps of every narration / response playback so postprocess
// can mux a real audio track onto the (silent) Playwright video recording.
// ──────────────────────────────────────────
type AudioEvent = { type: 'narration' | 'response'; file: string; startMs: number; durationMs: number }
let _timelineStart: number | null = null
const _events: AudioEvent[] = []
let _timelinePath: string | null = null

export function startAudioTimeline(outDir: string) {
  _timelineStart = Date.now()
  _events.length = 0
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  _timelinePath = path.join(outDir, 'audio-timeline.json')
}

function recordEvent(type: 'narration' | 'response', file: string, durationMs: number) {
  if (_timelineStart == null) return
  const startMs = Date.now() - _timelineStart
  _events.push({ type, file, startMs, durationMs })
  if (_timelinePath) {
    fs.writeFileSync(_timelinePath, JSON.stringify({ events: _events }, null, 2))
  }
}

// ──────────────────────────────────────────
// Cursor + caption overlay — installed once per context.
// addInitScript runs on EVERY page navigation, so the overlay survives login redirects.
// ──────────────────────────────────────────
const OVERLAY_CSS = `
  * { cursor: none !important; }
  #pw-cursor {
    position: fixed; width: 22px; height: 22px;
    background: radial-gradient(circle at 35% 35%, #ff5f57, #c0392b);
    border-radius: 50%; pointer-events: none; z-index: 2147483647;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 2px 12px rgba(0,0,0,0.4);
    transition: transform 0.08s ease, opacity 0.15s ease;
  }
  #pw-cursor.pw-click {
    transform: translate(-50%, -50%) scale(0.7);
    background: radial-gradient(circle at 35% 35%, #ff9500, #e67e22);
  }
  #pw-scene-label {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.75); color: white;
    padding: 6px 18px; border-radius: 24px;
    font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500; letter-spacing: 0.3px; z-index: 2147483646;
    pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
    max-width: 80vw; text-align: center;
  }
  #pw-scene-label.visible { opacity: 1; }
  #pw-caption {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.82); color: white;
    padding: 10px 22px; border-radius: 8px;
    font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 400; line-height: 1.5; z-index: 2147483645;
    pointer-events: none; opacity: 0; transition: opacity 0.4s ease;
    max-width: 75vw; text-align: center;
  }
  #pw-caption.visible { opacity: 1; }
`

export async function setupCursorOverlay(context: BrowserContext) {
  await context.addInitScript((cssText: string) => {
    const install = () => {
      if (!document.body) return
      if (document.getElementById('pw-cursor')) return

      const style = document.createElement('style')
      style.textContent = cssText
      document.head.appendChild(style)

      const c = document.createElement('div')
      c.id = 'pw-cursor'
      document.body.appendChild(c)
      document.addEventListener('mousemove', (e: MouseEvent) => {
        c.style.left = e.clientX + 'px'
        c.style.top = e.clientY + 'px'
      })

      const sl = document.createElement('div')
      sl.id = 'pw-scene-label'
      document.body.appendChild(sl)

      const cap = document.createElement('div')
      cap.id = 'pw-caption'
      document.body.appendChild(cap)

      ;(window as any).__pwShowScene = (text: string) => {
        sl.textContent = text
        sl.classList.add('visible')
        setTimeout(() => sl.classList.remove('visible'), 2500)
      }
      ;(window as any).__pwShowCaption = (text: string) => {
        cap.textContent = text
        cap.classList.add('visible')
      }
      ;(window as any).__pwHideCaption = () => {
        cap.classList.remove('visible')
      }
      ;(window as any).__pwClickAnim = () => {
        c.classList.add('pw-click')
        setTimeout(() => c.classList.remove('pw-click'), 200)
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install)
    } else {
      install()
    }
  }, OVERLAY_CSS)
}

// Back-compat no-op (specs still call this on about:blank)
export async function injectCursor(_page: Page) {}

// ──────────────────────────────────────────
// Scene announcement overlay
// ──────────────────────────────────────────
export async function showScene(page: Page, label: string) {
  await page.evaluate((text) => {
    const fn = (window as any).__pwShowScene
    if (typeof fn === 'function') fn(text)
  }, label)
  await page.waitForTimeout(400)
}

export async function showCaption(page: Page, text: string) {
  await page.evaluate((t) => {
    const fn = (window as any).__pwShowCaption
    if (typeof fn === 'function') fn(t)
  }, text)
}

export async function hideCaption(page: Page) {
  await page.evaluate(() => {
    const fn = (window as any).__pwHideCaption
    if (typeof fn === 'function') fn()
  })
}

// ──────────────────────────────────────────
// Slow, visually clear mouse movement
// ──────────────────────────────────────────
export async function moveTo(page: Page, selector: string, steps = 25) {
  const el = page.locator(selector).first()
  const box = await el.boundingBox()
  if (!box) return
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y, { steps })
  await page.waitForTimeout(200)
}

export async function slowClick(page: Page, selector: string, steps = 20) {
  await moveTo(page, selector, steps)
  await page.evaluate(() => {
    const fn = (window as any).__pwClickAnim
    if (typeof fn === 'function') fn()
  })
  await page.locator(selector).first().click()
  await page.waitForTimeout(300)
}

export async function slowType(page: Page, selector: string, text: string, delay = 55) {
  await moveTo(page, selector)
  const loc = page.locator(selector).first()
  await loc.click()
  await page.waitForTimeout(200)
  await loc.fill('')
  // pressSequentially handles character-by-character typing with the given delay,
  // and properly fires the React-compatible input events.
  await loc.pressSequentially(text, { delay })
  await page.waitForTimeout(300)
}

// ──────────────────────────────────────────
// Upload a file via a hidden file input
// ──────────────────────────────────────────
export async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  const fileInput = page.locator(inputSelector)
  await fileInput.setInputFiles(filePath)
  await page.waitForTimeout(500)
}

// ──────────────────────────────────────────
// Wait with a visual pause (natural feel)
// ──────────────────────────────────────────
export async function pause(page: Page, ms: number) {
  await page.waitForTimeout(ms)
}

// ──────────────────────────────────────────
// Login helper
// ──────────────────────────────────────────
export async function login(page: Page, email: string, password: string) {
  // Log browser console + page errors for debugging
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[browser ${msg.type()}] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => console.log(`[page error] ${err.message}`))
  page.on('requestfailed', (req) => {
    console.log(`[req failed] ${req.method()} ${req.url()} — ${req.failure()?.errorText}`)
  })
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[api] ${res.request().method()} ${res.url()} -> ${res.status()}`)
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Handle redirect to login
  if (!page.url().includes('/login')) {
    await page.goto('/login')
  }

  await slowType(page, 'input[type="email"], input[name="email"]', email)
  await slowType(page, 'input[type="password"], input[name="password"]', password)
  await slowClick(page, 'button[type="submit"]')
  try {
    await page.waitForURL(/\/(dashboard|templates|candidates)/, { timeout: 20000 })
  } catch (err) {
    console.error('[login] redirect failed — url:', page.url())
    throw err
  }
  await page.waitForLoadState('networkidle')
  // Dismiss onboarding tour if it appears for new accounts
  await page.waitForTimeout(800)
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(300)
}

// ──────────────────────────────────────────
// Microphone audio injection for interview simulation
// Plays an MP3 file as the "microphone" input
// ──────────────────────────────────────────
export async function setupMicrophoneInjection(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      // navigator.mediaDevices is undefined on insecure origins (http://host.docker.internal).
      // Create a stub so audio injection still works.
      if (!navigator.mediaDevices) {
        ;(navigator as any).mediaDevices = {}
      }
      const md: any = navigator.mediaDevices
      const original = typeof md.getUserMedia === 'function'
        ? md.getUserMedia.bind(md)
        : null

      md.getUserMedia = async (constraints: MediaStreamConstraints | undefined) => {
        if (constraints?.audio) {
          const ctx = new AudioContext()
          const dest = ctx.createMediaStreamDestination()
          const silence = ctx.createGain()
          silence.gain.value = 0
          silence.connect(dest)
          ;(window as any).__demoAudioCtx = ctx
          ;(window as any).__demoDest = dest
          ;(window as any).__demoReady = true
          return dest.stream
        }
        if (original) return original(constraints!)
        throw new Error('getUserMedia not available')
      }
    } catch (e) {
      // Never let the init script throw — it would surface as a pageerror and break React
      console.warn('[demo] mic injection setup skipped:', e)
    }
  })
}

export async function injectAudioResponse(page: Page, audioPath: string) {
  if (!fs.existsSync(audioPath)) {
    console.warn(`Audio file not found: ${audioPath} — skipping injection`)
    return 0
  }

  const audioBuffer = fs.readFileSync(audioPath)
  const base64 = audioBuffer.toString('base64')
  const ext = path.extname(audioPath).slice(1) // mp3, wav, etc.

  const durationMs = await page.evaluate(
    async ({ b64, extension }: { b64: string; extension: string }) => {
      const ctx: AudioContext = (window as any).__demoAudioCtx
      const dest: MediaStreamAudioDestinationNode = (window as any).__demoDest
      if (!ctx || !dest) return 3000

      const dataUrl = `data:audio/${extension};base64,${b64}`
      const response = await fetch(dataUrl)
      const arrayBuffer = await response.arrayBuffer()
      const decoded = await ctx.decodeAudioData(arrayBuffer)

      const source = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(dest)
      source.start(0)

      return Math.round(decoded.duration * 1000)
    },
    { b64: base64, extension: ext }
  )

  // Record on the timeline so postprocess can mux this onto the video
  recordEvent('response', audioPath, durationMs as number)
  return durationMs as number
}

// ──────────────────────────────────────────
// Play narration audio through page speakers
// (captured by screen recorder as video audio)
// ──────────────────────────────────────────
export async function playNarration(page: Page, audioPath: string): Promise<number> {
  if (!fs.existsSync(audioPath)) {
    console.warn(`Narration file not found: ${audioPath}`)
    return 2000
  }

  const audioBuffer = fs.readFileSync(audioPath)
  const base64 = audioBuffer.toString('base64')
  const ext = path.extname(audioPath).slice(1)

  const durationMs = await page.evaluate(
    async ({ b64, extension }: { b64: string; extension: string }) => {
      const dataUrl = `data:audio/${extension};base64,${b64}`
      const audio = new Audio(dataUrl)
      audio.volume = 1.0

      await new Promise<void>((resolve) => {
        audio.oncanplaythrough = () => resolve()
        audio.onerror = () => resolve()
        setTimeout(resolve, 3000)
      })

      audio.play()

      return Math.round(audio.duration * 1000) || 3000
    },
    { b64: base64, extension: ext }
  )

  recordEvent('narration', audioPath, durationMs)
  return durationMs
}
