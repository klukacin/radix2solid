import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4147', browserName: 'chromium' },
  projects: [
    { name: 'ssr' },
    { name: 'csr', testMatch: '**/{composition,layers,controls,menus,select,advanced,assets,themes,theme-interactions,theme-extensions,theme-css,charts,inputs,tree,splitter}.spec.ts' },
    { name: 'firefox-ssr', testMatch: '**/{hydration,layers,menus,select,advanced,assets,themes,theme-interactions,inputs,tree,splitter}.spec.ts', use: { browserName: 'firefox' } },
    { name: 'firefox-csr', testMatch: '**/{layers,menus,select,advanced,assets,themes,theme-interactions,inputs,tree,splitter}.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit-ssr', testMatch: '**/{hydration,layers,menus,select,advanced,assets,themes,theme-interactions,inputs,tree,splitter}.spec.ts', use: { browserName: 'webkit' } },
    { name: 'webkit-csr', testMatch: '**/{layers,menus,select,advanced,assets,themes,theme-interactions,inputs,tree,splitter}.spec.ts', use: { browserName: 'webkit' } }
  ],
  webServer: [{
    command: process.env.GALLERY_PACKED === '1'
      ? 'node .artifacts/consumer/scripts/serve.ts --production'
      : process.env.GALLERY_PRODUCTION === '1' ? 'pnpm --filter @radix-solid/gallery preview' : 'pnpm dev',
    url: 'http://127.0.0.1:4147',
    reuseExistingServer: false
  }],
  outputDir: '.artifacts/playwright',
  reporter: 'list'
});
