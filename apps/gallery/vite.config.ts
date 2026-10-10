import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [solid({ ssr: true }), {
    name: 'runtime-graph',
    generateBundle(_options, bundle) {
      const modules = Object.values(bundle).flatMap(output => output.type === 'chunk' ? Object.keys(output.modules) : []);
      this.emitFile({ type: 'asset', fileName: 'runtime-graph.json', source: JSON.stringify(modules, null, 2) });
    }
  }],
  resolve: { dedupe: ['solid-js', '@solidjs/web', '@solidjs/signals'] },
  build: {
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    manifest: !isSsrBuild,
    ssr: isSsrBuild ? 'src/entry-server.tsx' : false,
    rolldownOptions: {
      input: resolve(import.meta.dirname, isSsrBuild ? 'src/entry-server.tsx' : 'src/entry-client.tsx')
    }
  },
  server: { host: '127.0.0.1', port: 4147, strictPort: true }
}));
