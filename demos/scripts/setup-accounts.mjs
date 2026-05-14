/**
 * Setup demo accounts via the Intervue API
 * Creates three tenant accounts (free, individual, startup) if they don't exist.
 *
 * Usage: node scripts/setup-accounts.mjs
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEMOS_ROOT = path.join(__dirname, '..')

// Load .env manually (no dotenv dep in main scripts)
const envPath = path.join(DEMOS_ROOT, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const API_URL = process.env.API_URL || 'http://localhost:8080'

const accounts = [
  {
    label: 'Free Plan',
    email: process.env.DEMO_FREE_EMAIL || 'demo-free@intervue.app',
    password: process.env.DEMO_FREE_PASS || 'Intervue@Demo1',
    name: 'TechFlow Solutions',
    plan: 'free',
  },
  {
    label: 'Individual Plan',
    email: process.env.DEMO_INDIVIDUAL_EMAIL || 'demo-individual@intervue.app',
    password: process.env.DEMO_INDIVIDUAL_PASS || 'Intervue@Demo2',
    name: 'Zeno Fintech',
    plan: 'individual',
  },
  {
    label: 'Startup Plan',
    email: process.env.DEMO_STARTUP_EMAIL || 'demo-startup@intervue.app',
    password: process.env.DEMO_STARTUP_PASS || 'Intervue@Demo3',
    name: 'NovaStar Systems',
    plan: 'startup',
  },
]

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) }
  } catch {
    return { ok: res.ok, status: res.status, data: text }
  }
}

async function accountExists(email, password) {
  const res = await post(`${API_URL}/api/v1/tenants/login`, { email, password })
  return res.ok
}

async function createAccount({ label, email, password, name }) {
  console.log(`\n  ${label} (${email})`)

  const exists = await accountExists(email, password).catch(() => false)
  if (exists) {
    console.log(`    ✓ Already exists`)
    return
  }

  const reg = await post(`${API_URL}/api/v1/tenants`, {
    email,
    password,
    company_name: name,
  })

  if (reg.ok) {
    console.log(`    ✓ Created`)
  } else {
    console.warn(`    ⚠ Registration returned ${reg.status}:`, JSON.stringify(reg.data).slice(0, 120))
  }
}

console.log(`\n🔧  Setting up demo accounts against ${API_URL}\n`)

for (const account of accounts) {
  await createAccount(account)
}

console.log('\n✅  Done. Demo accounts ready.\n')
