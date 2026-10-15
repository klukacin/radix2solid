import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

const src = resolve(import.meta.dirname, 'src');
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: true })],
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    lib: {
      entry: Object.fromEntries(['index.ts', ...readdirSync(src).filter(name => name.endsWith('Icon.tsx'))].map(name => [name.replace(/\.(?:ts|tsx)$/, ''), resolve(src, name)])),
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`
    },
    minify: false,
    rolldownOptions: { external: [/^solid-js(?:\/|$)/, /^@solidjs\//] }
  }
}));
