import { defineConfig } from '@playwright/test';

process.env.NODE_ENV = 'test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  expect: {
    timeout: 10000
  },
  reporter: 'html',
  globalSetup: './tests/e2e/global-setup.ts',
  workers: 1,
});
