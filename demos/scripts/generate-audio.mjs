/**
 * Generate all demo audio files using Microsoft Edge TTS (free, natural voices)
 *
 * Produces:
 *   assets/audio/
 *     narration/   — voiceover for each scene
 *     responses/   — candidate answers for each question
 *
 * Usage: node scripts/generate-audio.mjs
 * Requires: npm install (msedge-tts is in package.json)
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMOS_ROOT = path.join(__dirname, '..')
const AUDIO_DIR = path.join(DEMOS_ROOT, 'assets', 'audio')
const NARRATION_DIR = path.join(AUDIO_DIR, 'narration')
const RESPONSES_DIR = path.join(AUDIO_DIR, 'responses')

// Create output dirs
for (const dir of [AUDIO_DIR, NARRATION_DIR, RESPONSES_DIR,
  path.join(RESPONSES_DIR, 'free'),
  path.join(RESPONSES_DIR, 'individual'),
  path.join(RESPONSES_DIR, 'startup'),
  path.join(NARRATION_DIR, 'free'),
  path.join(NARRATION_DIR, 'individual'),
  path.join(NARRATION_DIR, 'startup'),
]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ────────────────────────────────────────
// TTS helper — msedge-tts v2 API:
// rawToFile(dirPath, ssml) writes to <dirPath>/audio.mp3 and returns the path.
// We then rename it to the desired filename.
// ────────────────────────────────────────
async function synthesize(text, voice, outputPath, rate = '+0%', pitch = '+0Hz') {
  if (fs.existsSync(outputPath)) {
    console.log(`  ✓ Already exists: ${path.basename(outputPath)}`)
    return
  }

  const tts = new MsEdgeTTS()
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US"><voice name="${voice}"><prosody rate="${rate}" pitch="${pitch}">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</prosody></voice></speak>`

  const outDir = path.dirname(outputPath)
  const result = await tts.rawToFile(outDir, ssml)
  // v2 writes to <dir>/audio.mp3 — move to the desired filename
  if (result.audioFilePath !== outputPath) {
    fs.renameSync(result.audioFilePath, outputPath)
  }
  tts.close()

  console.log(`  ✓ Generated: ${path.basename(outputPath)}`)
}

// ────────────────────────────────────────
// Narration data
// ────────────────────────────────────────
const NARRATION_VOICE = 'en-US-AndrewNeural'
const NARRATION_RATE = '+5%'

const narrations = {
  free: {
    intro: "Meet Priya Sharma — a freshly graduated frontend developer applying for her first job. The hiring manager at TechFlow Solutions uses Intervue on the free plan to screen her today.",
    template_create: "In seconds, the template is ready. Interview type, difficulty, and duration are smart-defaulted for the free plan.",
    jd_upload: "Upload the job description — Intervue's AI reads it and auto-fills the template details.",
    candidate_add: "Add the candidate. Upload her resume and watch the form fill itself.",
    interview_start: "One click. The AI interviewer takes over.",
    interview_running: "Priya speaks naturally. The AI listens, understands, and responds in real time.",
    results: "In minutes — a complete evaluation. Skills matched, red flags surfaced, hiring recommendation ready.",
    cta: "Intervue. AI-powered interviews. Start free at intervue dot singularraritylabs dot com.",
  },
  individual: {
    intro: "Arjun Mehta — four years of full-stack experience. He's interviewing at Zeno Fintech for a senior role. Their recruiter runs a structured technical interview on Intervue's Individual plan.",
    template_create: "Full control: technical interview type, 30-minute duration, Hard difficulty. The AI will push this candidate.",
    jd_upload: "Drop the job description. Intervue extracts topics, difficulty, and recommended duration automatically.",
    candidate_add: "Arjun's resume is uploaded. Every field auto-populated from his CV.",
    interview_start: "The AI conducts a structured technical interview. No prep needed from the recruiter.",
    interview_running: "Four thoughtful, technical questions. The AI probes deeper based on each answer.",
    results: "A detailed scorecard: technical depth, communication clarity, culture signals. Ready to share with the team.",
    cta: "Intervue. Smarter technical hiring. Try the Individual plan today.",
  },
  startup: {
    intro: "Sanjay Krishnan. Principal Architect. 14 years. IIT Madras. The kind of candidate you get one shot at impressing. NovaStar Systems uses Intervue's Startup plan to conduct a rigorous architecture interview — without tying up two Staff engineers for two hours.",
    template_create: "Expert difficulty. 60 minutes. Five deep architecture questions seeded from the job description.",
    jd_upload: "The JD is dense — distributed systems, Kubernetes, Kafka at scale. Intervue parses every requirement.",
    candidate_add: "Sanjay's resume is loaded. 14 years of architecture decisions in a two-page document. Intervue reads all of it.",
    interview_start: "The AI architect begins. No hand-holding. No softball questions.",
    q1: "Distributed systems design. The AI doesn't just ask — it probes the trade-offs.",
    q2: "Monolith decomposition. Real-world experience, not textbook answers.",
    q3: "CAP theorem — theory applied under production pressure.",
    q4: "Leadership under fire. The AI surfaces the human behind the architecture.",
    q5: "Multi-tenant security. The question that separates architects from engineers.",
    results: "A comprehensive report: system design depth, communication of trade-offs, decision-making under ambiguity. Shareable in one link. Ready in minutes, not days.",
    cta: "Intervue. Enterprise-grade interviews, startup speed.",
  },
}

// ────────────────────────────────────────
// Response data
// ────────────────────────────────────────
const responses = {
  free: {
    voice: 'en-IN-NeerjaNeural',
    rate: '+5%',
    items: [
      { id: 1, text: "Hi, thank you for the opportunity. I'm Priya Sharma, a recent Computer Science graduate from RV College of Engineering in Bengaluru. During my final year I built four personal projects using React — a task manager, a weather dashboard, and a portfolio site. I also did a three-month internship at Pixel Labs where I converted Figma designs into responsive HTML and CSS components. I'm really excited to grow as a developer, and I learn very quickly when I get hands-on with real problems." },
      { id: 2, text: "When I face a CSS issue in production, my first step is always to open Chrome DevTools and inspect the element. I check the computed styles to see which rules are being applied and whether something is overridden unexpectedly. In my internship I found a lot of specificity conflicts between Bootstrap's defaults and our custom styles. I also check for box model issues like unexpected margin collapsing. If it's a layout bug I try flexbox or grid alternatives in the Styles panel before touching the code. I always test across Chrome, Firefox, and Safari before pushing." },
      { id: 3, text: "In three years, I see myself as a confident React developer who can independently own frontend features end-to-end — from design system components all the way to API integration and performance optimization. I want to get into TypeScript deeply and start contributing to architectural decisions. Eventually I'd love to mentor junior developers the way I've been mentored. I'm also very curious about accessibility and want to make inclusive web experiences a real strength of mine." },
    ],
  },
  individual: {
    voice: 'en-IN-PrabhatNeural',
    rate: '+3%',
    items: [
      { id: 1, text: "Sure. I've been working full-stack for about four years now. On the frontend, I've done a full migration of a large enterprise SaaS product from jQuery to React 18 with TypeScript — that involved building a component library, introducing React Query for server state, and reducing the bundle size by 62 percent. On the backend, I work in Node.js with TypeScript, building REST APIs and WebSocket services. At Claraview I built a real-time analytics dashboard that handles about 50 thousand concurrent WebSocket connections. I'm comfortable owning a feature from database schema design all the way to the React component." },
      { id: 2, text: "My philosophy is to use the simplest tool that solves the problem. Server state — data that comes from an API — I always reach for React Query first. It handles caching, background refetching, optimistic updates, and loading states out of the box, and I've seen it eliminate thousands of lines of custom cache logic. For global UI state — things like theme, user preferences, modal open states — I use Zustand because it's lightweight and avoids Redux boilerplate. The goal is to keep components as dumb as possible and push logic into the query layer." },
      { id: 3, text: "I think about this in three layers. First, structure — I organize code by feature rather than by type, so all the files related to a feature live together. Second, abstraction — I keep components focused on a single responsibility and extract logic into custom hooks that can be tested independently. And third, testing strategy — I write integration tests using React Testing Library that test user behavior rather than implementation details. The measure of good code for me is: if I came back six months later having forgotten everything, could I understand what this does and why in under five minutes?" },
      { id: 4, text: "I follow key sources — the React RFC GitHub, TC39 proposals, and newsletters like Bytes and This Week in React. But honestly, the most valuable thing is building small experiments. When React Server Components became a topic, I built a toy Next.js app just to understand the model. When I heard about Signals, I ported a piece of our UI to understand the trade-offs firsthand. I gave a talk at ReactConf India last year on state management patterns, which forced me to synthesize everything I'd learned." },
    ],
  },
  startup: {
    voice: 'en-US-AndrewNeural',
    rate: '-3%',
    items: [
      { id: 1, text: "I'd start by understanding the event contract before touching infrastructure. What does an event look like? What are the consumer SLOs — is it okay for a consumer to be 30 seconds behind, or do we need sub-second delivery? Assuming sub-100 millisecond end-to-end, I'd go with Apache Kafka as the backbone. At 10 million events per day that's roughly 115 events per second on average, but you need to design for peak — probably 5 to 10 times that. I'd shard the topic with 12 partitions keyed on a natural entity ID so ordering is preserved per entity. For the fanout problem I'd use a stream processing layer — Kafka Streams or Flink — to route and transform rather than having consumers read the same raw topic. And I'd implement a dead letter queue and replay API from day one, because operational life without replay is miserable." },
      { id: 2, text: "The biggest mistake people make is starting with the infrastructure — spinning up Kubernetes, setting up service meshes — before they've done the domain analysis. The first thing I do is an event storming session with domain experts to find the natural bounded contexts. Where do transactions cross team ownership boundaries? Where do deployments cause the most friction? Those are your first candidates for extraction. The pattern I've found most reliable is the Strangler Fig approach — you don't rewrite, you intercept. Put a thin routing layer in front of the monolith and gradually move traffic to new services as you extract them. The key constraint I enforce: never share a database between the new service and the monolith. At Razorpay we extracted 40 services over 2 years with zero production outages because we were disciplined about this rule." },
      { id: 3, text: "CAP is a framework, not a prescription. The real question is: what is the cost of being wrong in either direction? For a financial transaction, inconsistency can mean double-charging a customer — that's an irreversible trust-destroying error, so I'll accept availability hits. For a product catalog, being stale for 5 seconds is completely acceptable, so I'd choose eventual consistency with CRDT-style merge semantics. In practice, most teams don't actually need global strong consistency — they need linearizability within a single entity's history. That's a much easier problem. You can achieve it with per-entity ordering in Kafka, or with optimistic concurrency control in Postgres using version columns." },
      { id: 4, text: "At PhonePe, I pushed to move our service-to-service communication from REST to event-driven, even for synchronous-looking operations. The engineering team was deeply skeptical — they felt it was over-engineering. I had to resist the instinct to override through authority. Instead I proposed a controlled experiment: pick one service pair, implement the event-driven version, measure operational overhead for one quarter. I also built the argument financially — showed the cost of point-to-point coupling compounding over 3 years as the service count grew. What changed minds wasn't the architecture slides — it was when I demonstrated the first real operational win: we replayed 6 hours of events after a downstream outage and recovered state without a single manual SQL script. The lesson: make the first win concrete and undeniable." },
      { id: 5, text: "Multi-tenancy security is a spectrum. At one end, full silo — separate database per tenant. Maximum isolation, terrible unit economics. At the other end, shared everything — simplest operationally, scariest from a breach perspective. My preferred pattern is a shared Postgres cluster with row-level security, where every row has a tenant ID and the application switches to a row-security context on every request. The advantage is you can graduate a tenant to a dedicated cluster when they hit tier thresholds without changing any application code. For the Kubernetes platform layer I enforce namespace-level network policies and OPA Gatekeeper policies. And critically, I treat the audit log as a first-class deliverable, not an afterthought. If you can't answer who accessed which tenant's data at 2am on Tuesday, you don't have multi-tenant security — you have multi-tenant vibes." },
    ],
  },
}

// ────────────────────────────────────────
// Generate everything
// ────────────────────────────────────────
async function generate() {
  console.log('\n🎙  Generating narration audio...\n')
  for (const [demo, scenes] of Object.entries(narrations)) {
    console.log(`  Demo: ${demo}`)
    for (const [scene, text] of Object.entries(scenes)) {
      const outPath = path.join(NARRATION_DIR, demo, `${scene}.mp3`)
      await synthesize(text, NARRATION_VOICE, outPath, NARRATION_RATE)
    }
  }

  console.log('\n🎤  Generating candidate response audio...\n')
  for (const [demo, config] of Object.entries(responses)) {
    console.log(`  Demo: ${demo} — voice: ${config.voice}`)
    for (const item of config.items) {
      const outPath = path.join(RESPONSES_DIR, demo, `response-${item.id}.mp3`)
      await synthesize(item.text, config.voice, outPath, config.rate)
    }
  }

  console.log('\n✅  All audio files generated.\n')
  console.log(`Output: ${AUDIO_DIR}`)
}

generate().catch((err) => {
  console.error('Audio generation failed:', err)
  process.exit(1)
})
