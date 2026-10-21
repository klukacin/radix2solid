import { defineConfig } from '@playwright/test';

const galleryURL = `http://127.0.0.1:${process.env.GALLERY_PORT ?? 4147}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: galleryURL, browserName: 'chromium' },
  projects: [
    { name: 'ssr' },
    { name: 'csr', testMatch: '**/{composition,layers,controls,menus,select,advanced,assets,themes,theme-interactions,theme-extensions,theme-css,charts,inputs,tree,splitter,calendar,date-picker,file-drop}.spec.ts' },
    { name: 'firefox-ssr', testMatch: '**/{hydration,layers,menus,select,advanced,assets,themes,theme-interactions,theme-css,inputs,tree,splitter,calendar,date-picker,file-drop}.spec.ts', use: { browserName: 'firefox' } },
    { name: 'firefox-csr', testMatch: '**/{layers,menus,select,advanced,assets,themes,theme-interactions,theme-css,inputs,tree,splitter,calendar,date-picker,file-drop}.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit-ssr', testMatch: '**/{hydration,layers,menus,select,advanced,assets,themes,theme-interactions,theme-css,inputs,tree,splitter,calendar,date-picker,file-drop}.spec.ts', use: { browserName: 'webkit' } },
    { name: 'webkit-csr', testMatch: '**/{layers,menus,select,advanced,assets,themes,theme-interactions,theme-css,inputs,tree,splitter,calendar,date-picker,file-drop}.spec.ts', use: { browserName: 'webkit' } }
  ],
  webServer: [{
    command: process.env.GALLERY_PACKED === '1'
      ? 'node .artifacts/consumer/scripts/serve.ts --production'
      : process.env.GALLERY_PRODUCTION === '1' ? 'pnpm --filter @radix-solid/gallery preview' : 'pnpm dev',
    url: galleryURL,
    reuseExistingServer: false
  }],
  outputDir: '.artifacts/playwright',
  reporter: 'list'
});
