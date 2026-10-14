import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

const src = resolve(import.meta.dirname, 'src');
const entries = { index: resolve(src, 'index.ts'), helpers: resolve(src, 'helpers/index.ts'), props: resolve(src, 'props/index.ts'),
  ...Object.fromEntries(readdirSync(resolve(src, 'components')).filter(name => /\.(ts|tsx)$/.test(name))
    .map(name => [`components/${name.replace(/\.(ts|tsx)$/, '')}`, resolve(src, 'components', name)])) };
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: true })],
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    lib: { entry: entries, formats: ['es'], fileName: (_format, name) => `${name}.js` },
    minify: false,
    rolldownOptions: { external: [/^solid-js(?:\/|$)/, /^@solidjs\//, /^@wsagency\/radix2solid-primitives(?:\/|$)/] }
  }
}));
