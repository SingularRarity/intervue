/**
 * Post-process recorded Playwright videos.
 * Finds the webm/mp4 recording for each demo and copies it to output/ with a clean name.
 *
 * Playwright already captures audio from the page (narration + interview audio)
 * because we play it through the page's Audio API and AudioContext.
 * This script just renames and organises the output files.
 *
 * Usage:
 *   node scripts/postprocess.mjs free
 *   node scripts/postprocess.mjs individual
 *   node scripts/postprocess.mjs startup
 *   node scripts/postprocess.mjs all
 */

import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMOS_ROOT = path.join(__dirname, '..')
const RECORDINGS_DIR = path.join(DEMOS_ROOT, 'output', 'recordings')
const FINAL_DIR = path.join(DEMOS_ROOT, 'output', 'final')

if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true })

const DEMO_MAP = {
  free: { project: 'demo-free', spec: '01-free-user', label: '01-free-user-priya-sharma' },
  individual: { project: 'demo-individual', spec: '02-individual', label: '02-individual-arjun-mehta' },
  startup: { project: 'demo-startup', spec: '03-startup', label: '03-startup-sanjay-krishnan' },
}

function findRecording(projectName) {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    console.warn(`  ⚠ Recordings directory not found: ${RECORDINGS_DIR}`)
    return null
  }

  // Playwright dir name format: <spec-prefix>-<test-title-slug>-<project>
  // e.g. "01-free-user-Free-Plan-...-demo-free"
  // Match by exact "-<project>" suffix to isolate the correct demo's directory.
  const dirs = fs.readdirSync(RECORDINGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith(`-${projectName}`))
    .map((e) => path.join(RECORDINGS_DIR, e.name))

  if (dirs.length === 0) return null

  // Prefer video.webm (main page recording) over video-1.webm (interview tab).
  // If both exist, picks the largest (longest recording).
  let best = null
  let bestSize = 0
  for (const dir of dirs) {
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.webm') || file.endsWith('.mp4')) {
        const full = path.join(dir, file)
        const size = fs.statSync(full).size
        if (size > bestSize) {
          bestSize = size
          best = full
        }
      }
    }
  }
  return best
}

async function processDemo(key) {
  const config = DEMO_MAP[key]
  if (!config) {
    console.error(`Unknown demo: ${key}. Valid options: ${Object.keys(DEMO_MAP).join(', ')}`)
    return false
  }

  console.log(`\n  Processing: ${config.label}`)

  const recording = findRecording(config.project)
  if (!recording) {
    console.warn(`  ⚠ No recording found for ${config.project}`)
    console.warn(`    Run: npm run demo:${key} first`)
    return false
  }

  const ext = path.extname(recording)
  const dest = path.join(FINAL_DIR, `${config.label}${ext}`)

  fs.copyFileSync(recording, dest)
  const stat = fs.statSync(dest)
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1)

  console.log(`  ✓ Copied: ${path.basename(dest)} (${sizeMB} MB)`)
  console.log(`    Source: ${recording}`)
  console.log(`    Output: ${dest}`)
  return true
}

const target = process.argv[2] || 'all'
const demos = target === 'all' ? Object.keys(DEMO_MAP) : [target]

console.log(`\n🎬  Post-processing demo recordings...\n`)

let success = 0
for (const demo of demos) {
  const ok = await processDemo(demo)
  if (ok) success++
}

console.log(`\n✅  Done. ${success}/${demos.length} demos processed.`)
console.log(`    Output: ${FINAL_DIR}\n`)

if (success < demos.length) {
  console.log('  Missing recordings? Run:')
  for (const demo of demos) {
    console.log(`    npm run demo:${demo}`)
  }
  console.log()
}
