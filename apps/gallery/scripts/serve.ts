import { createServer as createHttpServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

type Renderer = { renderPage: (nonce: string, entry?: string, mode?: 'ssr' | 'csr', stylesheets?: readonly string[], initiallyOpenDatePicker?: boolean) => string };
const production = process.argv.includes('--production');
const root = resolve(import.meta.dirname, '..');
const vite = production ? undefined : await createServer({ root, server: { middlewareMode: true } });
const server = createHttpServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost');
  const pathname = requestUrl.pathname;
  const initiallyOpenDatePicker = requestUrl.searchParams.get('date-picker-initially-open') === '1';
  if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  if (pathname !== '/' && pathname !== '/csr') {
    if (vite) { vite.middlewares(request, response); return; }
    const assets = resolve(root, 'dist/client');
    const file = resolve(assets, `.${pathname}`);
    if (!pathname.startsWith('/assets/') || !file.startsWith(`${assets}/`)) {
      response.writeHead(404); response.end(); return;
    }
    try {
      const content = await readFile(file);
      response.writeHead(200, { 'Content-Type': file.endsWith('.css') ? 'text/css' : 'text/javascript' });
      response.end(content);
    } catch { response.writeHead(404); response.end(); }
    return;
  }
  try {
    let renderer: Renderer;
    let entry: string | undefined;
    let stylesheets: string[] | undefined;
    if (production) {
      // Built output does not exist in dev; load it only in the post-build production fixture.
      renderer = await import(pathToFileURL(resolve(root, 'dist/server/entry-server.js')).href);
      const manifest: unknown = JSON.parse(await readFile(resolve(root, 'dist/client/.vite/manifest.json'), 'utf8'));
      if (!manifest || typeof manifest !== 'object' || !('src/entry-client.tsx' in manifest)) throw new Error('Missing gallery client manifest entry.');
      const asset = manifest['src/entry-client.tsx'];
      if (!asset || typeof asset !== 'object' || !('file' in asset) || typeof asset.file !== 'string') throw new Error('Invalid gallery client asset.');
      entry = `/${asset.file}`;
      if ('css' in asset) {
        if (!Array.isArray(asset.css) || asset.css.some(path => typeof path !== 'string')) throw new Error('Invalid gallery stylesheet assets.');
        stylesheets = asset.css.map(path => `/${path}`);
      }
    } else {
      if (!vite) throw new Error('Missing development renderer.');
      // Vite owns JSX compilation and the development module-loading boundary.
      renderer = await vite.ssrLoadModule('/src/entry-server.tsx') as Renderer;
    }
    const nonce = randomBytes(24).toString('base64');
    const html = renderer.renderPage(nonce, entry, pathname === '/csr' ? 'csr' : 'ssr', stylesheets, initiallyOpenDatePicker);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'`
    });
    response.end(html);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end('Gallery rendering failed.');
  }
});
const port = Number(process.env.GALLERY_PORT ?? 4147);
server.listen(port, '127.0.0.1', () => console.log(`Gallery ready http://127.0.0.1:${port}`));
process.on('SIGTERM', () => { server.close(); void vite?.close(); });
