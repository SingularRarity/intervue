import { defineConfig, devices } from '@playwright/test'

// In Docker, PLATFORM_URL is set to http://host.docker.internal:3001
const BASE_URL = process.env.PLATFORM_URL || 'http://localhost:3001'

// --no-sandbox is required when running as root in Docker
const isDocker = process.env.DOCKER === '1'

export default defineConfig({
  testDir: './tests',
  timeout: 20 * 60 * 1000, // 20 minutes per test (startup demo has 5 questions)
  expect: { timeout: 15000 },
  fullyParallel: false, // run demos sequentially
  reporter: [['html', { outputFolder: 'report' }], ['list']],

  use: {
    baseURL: BASE_URL,
    video: {
      mode: 'on',
      size: { width: 1280, height: 800 },
    },
    screenshot: 'only-on-failure',
    // slow motion for visual clarity in recordings
    slowMo: 60,
    // Grant permissions needed for interview (microphone)
    permissions: ['microphone', 'camera'],
    // Chromium args for audio injection
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--allow-file-access-from-files',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        ...(isDocker ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : []),
      ],
    },
  },

  outputDir: './output/recordings',

  projects: [
    {
      name: 'demo-free',
      testMatch: '01-free-user.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'demo-individual',
      testMatch: '02-individual.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'demo-startup',
      testMatch: '03-startup.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
