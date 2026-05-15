/**
 * Demo post-processing
 *
 * For each demo:
 *  1. Find the main-page recording (largest .webm in the project's recording dir)
 *  2. Read the audio-timeline.json written by helpers.startAudioTimeline()
 *  3. Build a single soundtrack with ffmpeg: each clip placed at its startMs via adelay
 *  4. Mux the soundtrack onto the silent video → output/final/<demo>.mp4
 *
 * Usage:
 *   node scripts/postprocess.mjs free | individual | startup | all
 */

import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { spawnSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMOS_ROOT = path.join(__dirname, '..')
const RECORDINGS_DIR = path.join(DEMOS_ROOT, 'output', 'recordings')
const TIMELINES_DIR = path.join(DEMOS_ROOT, 'output', 'timelines')
const FINAL_DIR = path.join(DEMOS_ROOT, 'output', 'final')

if (!fs.existsSync(FINAL_DIR)) fs.mkdirSync(FINAL_DIR, { recursive: true })

const DEMO_MAP = {
  free:       { project: 'demo-free',       label: '01-free-user-priya-sharma' },
  individual: { project: 'demo-individual', label: '02-individual-arjun-mehta' },
  startup:    { project: 'demo-startup',    label: '03-startup-sanjay-krishnan' },
}

function findRecording(projectName) {
  if (!fs.existsSync(RECORDINGS_DIR)) return null
  const dirs = fs.readdirSync(RECORDINGS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith(`-${projectName}`))
    .map((e) => path.join(RECORDINGS_DIR, e.name))
  let best = null
  let bestSize = 0
  for (const dir of dirs) {
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.webm') || f.endsWith('.mp4')) {
        const full = path.join(dir, f)
        const size = fs.statSync(full).size
        if (size > bestSize) { bestSize = size; best = full }
      }
    }
  }
  return best
}

function readTimeline(projectName) {
  const p = path.join(TIMELINES_DIR, projectName, 'audio-timeline.json')
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    console.warn(`  ⚠ Could not parse timeline at ${p}: ${e.message}`)
    return null
  }
}

function runFfmpeg(args) {
  // Allow override via env (e.g. ffmpeg in PATH or a packaged binary)
  const ffmpeg = process.env.FFMPEG_BIN || 'ffmpeg'
  const res = spawnSync(ffmpeg, args, { encoding: 'utf8' })
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed (exit ${res.status}):\n${res.stderr || res.stdout}`)
  }
  return res
}

async function processDemo(key) {
  const config = DEMO_MAP[key]
  if (!config) {
    console.error(`Unknown demo: ${key}. Valid: ${Object.keys(DEMO_MAP).join(', ')}`)
    return false
  }

  console.log(`\n  Processing: ${config.label}`)
  const video = findRecording(config.project)
  if (!video) {
    console.warn(`  ⚠ No recording found for ${config.project} — skipping`)
    return false
  }
  console.log(`    Video: ${video}`)

  const timeline = readTimeline(config.project)
  if (!timeline || !timeline.events || timeline.events.length === 0) {
    console.warn(`  ⚠ No audio timeline — copying video without audio`)
    const ext = path.extname(video)
    const dest = path.join(FINAL_DIR, `${config.label}${ext}`)
    fs.copyFileSync(video, dest)
    return true
  }

  // Build ffmpeg args:
  //   inputs:  -i video  -i clip1.mp3 -i clip2.mp3 ...
  //   filter:  for each clip i (1..N), [i:a]adelay=startMs|startMs[a_i]
  //            then amix to single track
  //   map:     -map 0:v -map [aout]
  const events = timeline.events
  const args = ['-y', '-i', video]
  for (const ev of events) {
    if (!fs.existsSync(ev.file)) {
      console.warn(`    ⚠ Missing audio clip: ${ev.file}`)
      continue
    }
    args.push('-i', ev.file)
  }

  const filterParts = []
  const mixLabels = []
  events.forEach((ev, i) => {
    if (!fs.existsSync(ev.file)) return
    const idx = i + 1 // input index (0 is the video)
    const label = `a${idx}`
    // adelay accepts ms per channel — apply to all channels with `all=1`
    filterParts.push(`[${idx}:a]adelay=${ev.startMs}|${ev.startMs}[${label}]`)
    mixLabels.push(`[${label}]`)
  })

  if (mixLabels.length === 0) {
    console.warn(`  ⚠ No usable audio events — copying video without audio`)
    const ext = path.extname(video)
    const dest = path.join(FINAL_DIR, `${config.label}${ext}`)
    fs.copyFileSync(video, dest)
    return true
  }

  // amix with normalize=0 prevents auto-attenuation when only one clip plays at a time
  filterParts.push(`${mixLabels.join('')}amix=inputs=${mixLabels.length}:normalize=0:duration=longest[aout]`)
  const filter = filterParts.join(';')

  const dest = path.join(FINAL_DIR, `${config.label}.mp4`)
  args.push(
    '-filter_complex', filter,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    dest,
  )

  try {
    runFfmpeg(args)
  } catch (e) {
    console.error(`  ✘ ffmpeg failed for ${key}: ${e.message}`)
    return false
  }

  const sz = (fs.statSync(dest).size / 1024 / 1024).toFixed(1)
  console.log(`  ✓ Wrote ${path.basename(dest)} (${sz} MB) with ${mixLabels.length} audio clips muxed`)
  return true
}

const target = process.argv[2] || 'all'
const demos = target === 'all' ? Object.keys(DEMO_MAP) : [target]

console.log(`\n🎬  Post-processing demo recordings (with audio mux)...`)

let ok = 0
for (const d of demos) {
  if (await processDemo(d)) ok++
}

console.log(`\n✅  Done. ${ok}/${demos.length} demos processed.`)
console.log(`    Output: ${FINAL_DIR}\n`)
