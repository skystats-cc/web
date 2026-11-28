import { defineConfig, devices } from '@playwright/test';

// End-to-end smoke tests against the production build (vite preview). The API is mocked in each
// test with page.route, so these run in CI without a server or database.
export default defineConfig({
  testDir: 'e2e',
  timeout: 20_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // --host 127.0.0.1: on GitHub's runners "localhost" resolves to IPv6 (::1) first, so vite preview
  // listened on ::1 while Playwright waited on 127.0.0.1 and timed out. Bind the address we wait on.
  webServer: {
    command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe', // show the build and server output in the CI log if it fails again
  },
});
