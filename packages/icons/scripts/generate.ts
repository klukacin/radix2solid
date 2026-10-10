import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const names: Record<string, string> = JSON.parse(await readFile(resolve(root, 'icons.json'), 'utf8'));
const assets = (await readdir(resolve(root, 'icons'))).filter(name => name.endsWith('.svg')).sort();
const entries = Object.entries(names).sort(([a], [b]) => a.localeCompare(b, 'en'));
assert.deepEqual([...new Set(Object.values(names))].sort(), assets, 'Every local SVG needs exactly one authoritative export');
assert.equal(entries.length, assets.length, 'Icon names must form a bijection with assets');
await mkdir(resolve(root, 'src'), { recursive: true });

for (const [name, asset] of entries) {
  assert.match(name, /^[A-Z][A-Za-z0-9]*Icon$/);
  assert.match(asset, /^[a-z0-9-]+\.svg$/);
  const svg = await readFile(resolve(root, 'icons', asset), 'utf8');
  const match = /^<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(svg);
  assert.ok(match, `Invalid SVG: ${asset}`);
  assert.match(match[1], /\bviewBox="0 0 15 15"/);
  // ponytail: trusted quoted SVGs and mask-only IDs; add an XML parser if asset syntax expands.
  assert.ok(!/<!--|<\?|&|[{}]/.test(match[2]), `Unsupported SVG syntax: ${asset}`);
  const ids = [...match[2].matchAll(/\bid="([^"]+)"/g)].map(value => value[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate SVG IDs: ${asset}`);
  let body = match[2].replace(/\b(fill|stroke)="currentColor"/g, '$1={props.color ?? \'currentColor\'}');
  body = body.replace(/\bid="([^"]+)"/g, (_match, id: string) => `id={maskId + ${JSON.stringify(`-${id}`)}}`);
  body = body.replace(/\bmask="url\(#([^)]+)\)"/g, (_match, id: string) => {
    assert.ok(ids.includes(id), `Unknown mask reference: ${asset}`);
    return `mask={'url(#' + maskId + ${JSON.stringify(`-${id})`)}}`;
  });
  const source = `// Generated from icons/${asset}; run pnpm generate, do not edit.\n` +
    `import { omit${ids.length ? ', createUniqueId' : ''}, type Element } from 'solid-js';\n` +
    `import type { IconProps } from './types.js';\n\n` +
    `import { IconTitle } from './title.js';\n\n` +
    `export function ${name}(props: IconProps): Element {\n` +
    (ids.length ? `  const maskId = createUniqueId();\n` : '') +
    `  return <svg width={props.size ?? 15} height={props.size ?? 15} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"\n` +
    `    role={props.title || props['aria-label'] || props['aria-labelledby'] ? 'img' : undefined}\n` +
    `    aria-hidden={props.title || props['aria-label'] || props['aria-labelledby'] ? undefined : 'true'}\n` +
    `    {...omit(props, 'children', 'title', 'size')}>\n` +
    `    {props.title ? <IconTitle xmlns="http://www.w3.org/2000/svg">{props.title}</IconTitle> : undefined}\n` +
    `    ${body}\n` +
    `  </svg>;\n}\n\nexport default ${name};\n`;
  await writeFile(resolve(root, 'src', `${name}.tsx`), source);
}
await writeFile(resolve(root, 'src/index.ts'), `export type { IconProps } from './types.js';\n` + entries.map(([name]) => `export { default as ${name} } from './${name}.js';\n`).join(''));
const generated = (await readdir(resolve(root, 'src'))).filter(name => name.endsWith('Icon.tsx')).sort();
assert.deepEqual(generated, entries.map(([name]) => `${name}.tsx`).sort(), 'Generated source inventory diverged');
console.log(`Generated ${entries.length} native icons from local SVG assets; names and paths are consistent.`);
