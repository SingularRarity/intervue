import { Page, BrowserContext } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// ──────────────────────────────────────────
// Cursor overlay — makes the mouse visible in recordings
// ──────────────────────────────────────────
export async function injectCursor(page: Page) {
  await page.addStyleTag({
    content: `
      * { cursor: none !important; }
      #pw-cursor {
        position: fixed;
        width: 22px;
        height: 22px;
        background: radial-gradient(circle at 35% 35%, #ff5f57, #c0392b);
        border-radius: 50%;
        pointer-events: none;
        z-index: 2147483647;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 0 2px rgba(255,255,255,0.8), 0 2px 12px rgba(0,0,0,0.4);
        transition: transform 0.08s ease, opacity 0.15s ease;
      }
      #pw-cursor.pw-click {
        transform: translate(-50%, -50%) scale(0.7);
        background: radial-gradient(circle at 35% 35%, #ff9500, #e67e22);
      }
      #pw-scene-label {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 6px 18px;
        border-radius: 24px;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: 500;
        letter-spacing: 0.3px;
        z-index: 2147483646;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        max-width: 80vw;
        text-align: center;
      }
      #pw-scene-label.visible { opacity: 1; }
      #pw-caption {
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.82);
        color: white;
        padding: 10px 22px;
        border-radius: 8px;
        font-size: 15px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: 400;
        line-height: 1.5;
        z-index: 2147483645;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s ease;
        max-width: 75vw;
        text-align: center;
      }
      #pw-caption.visible { opacity: 1; }
    `,
  })

  await page.addScriptTag({
    content: `
      (function() {
        // Cursor
        const c = document.createElement('div');
        c.id = 'pw-cursor';
        document.body.appendChild(c);
        document.addEventListener('mousemove', e => {
          c.style.left = e.clientX + 'px';
          c.style.top = e.clientY + 'px';
        });
        window.__pwCursorEl = c;

        // Scene label
        const sl = document.createElement('div');
        sl.id = 'pw-scene-label';
        document.body.appendChild(sl);
        window.__pwSceneLabel = sl;

        // Caption (narration / subtitle)
        const cap = document.createElement('div');
        cap.id = 'pw-caption';
        document.body.appendChild(cap);
        window.__pwCaption = cap;

        window.__pwShowScene = (text) => {
          sl.textContent = text;
          sl.classList.add('visible');
          setTimeout(() => sl.classList.remove('visible'), 2500);
        };

        window.__pwShowCaption = (text) => {
          cap.textContent = text;
          cap.classList.add('visible');
        };

        window.__pwHideCaption = () => {
          cap.classList.remove('visible');
        };

        window.__pwClickAnim = () => {
          c.classList.add('pw-click');
          setTimeout(() => c.classList.remove('pw-click'), 200);
        };
      })();
    `,
  })
}

// ──────────────────────────────────────────
// Scene announcement overlay
// ──────────────────────────────────────────
export async function showScene(page: Page, label: string) {
  await page.evaluate((text) => (window as any).__pwShowScene(text), label)
  await page.waitForTimeout(400)
}

export async function showCaption(page: Page, text: string) {
  await page.evaluate((t) => (window as any).__pwShowCaption(t), text)
}

export async function hideCaption(page: Page) {
  await page.evaluate(() => (window as any).__pwHideCaption())
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
  await page.evaluate(() => (window as any).__pwClickAnim())
  await page.locator(selector).first().click()
  await page.waitForTimeout(300)
}

export async function slowType(page: Page, selector: string, text: string, delay = 55) {
  await moveTo(page, selector)
  await page.locator(selector).first().click()
  await page.waitForTimeout(200)
  await page.locator(selector).first().fill('')
  for (const char of text) {
    await page.locator(selector).first().pressSequentially(char, { delay })
  }
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
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Handle redirect to login
  if (!page.url().includes('/login')) {
    await page.goto('/login')
  }

  await slowType(page, 'input[type="email"], input[name="email"]', email)
  await slowType(page, 'input[type="password"], input[name="password"]', password)
  await slowClick(page, 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")')
  await page.waitForURL(/dashboard|templates|candidates/, { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

// ──────────────────────────────────────────
// Microphone audio injection for interview simulation
// Plays an MP3 file as the "microphone" input
// ──────────────────────────────────────────
export async function setupMicrophoneInjection(context: BrowserContext) {
  await context.addInitScript(() => {
    const _getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints | undefined) => {
      if (constraints?.audio) {
        // Create silent stream initially; audio will be piped in per-response
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
      return _getUserMedia(constraints!)
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

  return durationMs
}
