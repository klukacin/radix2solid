import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: true })],
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    lib: { entry: resolve(import.meta.dirname, 'src/index.ts'), formats: ['es'], fileName: () => 'index.js' },
    minify: false,
    rolldownOptions: { external: [/^solid-js(?:\/|$)/, /^@solidjs\//, /^d3-(?:scale|shape)(?:\/|$)/] }
  }
}));
