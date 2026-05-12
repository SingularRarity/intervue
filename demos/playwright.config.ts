import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 10 * 60 * 1000, // 10 minutes per test
  expect: { timeout: 15000 },
  fullyParallel: false, // run demos sequentially
  reporter: [['html', { outputFolder: 'report' }], ['list']],

  use: {
    baseURL: 'http://localhost:3001',
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
