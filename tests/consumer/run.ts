import { cp, copyFile, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '../..');
const fixture = resolve(root, '.artifacts/consumer');
const packs = resolve(root, '.artifacts/packs');
const env = { ...process.env };
const nextCore = process.argv.slice(2).includes('--scope=next-core');
if (process.argv.slice(2).some(argument => argument !== '--scope=next-core')) throw new Error('Supported scope: --scope=next-core');

function run(command: string, args: string[], cwd = root, extra: Record<string, string> = {}) {
  const result = spawnSync(command, args, { cwd, env: { ...env, ...extra }, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited ${result.status}`);
}

await mkdir(fixture, { recursive: true });
await mkdir(packs, { recursive: true });
const dependencies: Record<string, string> = {};
for (const name of ['primitives', 'icons', 'icons-extra', 'themes', 'charts']) {
  run('pnpm', ['--dir', `packages/${name}`, 'pack', '--pack-destination', packs]);
  const metadata = JSON.parse(await readFile(resolve(root, `packages/${name}/package.json`), 'utf8'));
  const tarball = resolve(packs, `${metadata.name.replace(/^@/, '').replace('/', '-')}-${metadata.version}.tgz`);
  const archive = `${name}-${createHash('sha256').update(await readFile(tarball)).digest('hex')}.tgz`;
  // A changed tarball must have a new dependency identity, not a cached constant file path.
  await rename(tarball, resolve(packs, archive));
  dependencies[metadata.name] = `file:../packs/${archive}`;
  console.log(`Packed ${metadata.name}@${metadata.version}: ${archive}`);
}
const manifest: unknown = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (!manifest || typeof manifest !== 'object' || !('devDependencies' in manifest) || !manifest.devDependencies || typeof manifest.devDependencies !== 'object') {
  throw new Error('Consumer requires the pinned workspace verification toolchain.');
}
const tools: Record<string, string> = {};
for (const [name, version] of Object.entries(manifest.devDependencies)) {
  if (Object.hasOwn(dependencies, name)) continue;
  if (typeof version !== 'string' || version.startsWith('workspace:')) throw new Error(`Invalid consumer tool pin ${name}`);
  tools[name] = version;
}
await writeFile(resolve(fixture, 'package.json'), JSON.stringify({
  name: 'radix-solid-independent-consumer', private: true, type: 'module',
  dependencies,
  devDependencies: tools
}, null, 2));
// Its own workspace boundary retains exact overrides; no source aliases or parent workspace links.
// The prepared, not yet published Themes candidate must resolve the same real primitives tarball, not npm.
const workspace = (await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf8')).replace(
  'overrides:\n', `overrides:\n  '@wsagency/radix2solid-primitives': ${JSON.stringify(dependencies['@wsagency/radix2solid-primitives'])}\n`
);
await writeFile(resolve(fixture, 'pnpm-workspace.yaml'), workspace);
const config: unknown = JSON.parse(await readFile(resolve(root, 'tsconfig.json'), 'utf8'));
if (!config || typeof config !== 'object' || !('compilerOptions' in config)) throw new Error('Missing consumer compiler settings.');
await writeFile(resolve(fixture, 'tsconfig.json'), JSON.stringify({ compilerOptions: config.compilerOptions, include: ['src', 'scripts', '*.test.ts', 'types.tsx', 'vite.config.ts'] }, null, 2));
await cp(resolve(root, 'apps/gallery/src'), resolve(fixture, 'src'), { recursive: true });
await cp(resolve(root, 'apps/gallery/scripts'), resolve(fixture, 'scripts'), { recursive: true });
await copyFile(resolve(root, 'apps/gallery/vite.config.ts'), resolve(fixture, 'vite.config.ts'));
for (const name of ['state.test.ts', 'themes.test.ts', 'theme-settings.test.ts', 'charts.test.ts', 'packed.test.ts', 'types.tsx', 'check-distribution.ts', 'check-tree-shaking.ts', 'coverage-manifest.json']) await copyFile(resolve(root, `tests/consumer/${name}`), resolve(fixture, name));
await copyFile(resolve(root, 'packages/icons/icons.json'), resolve(fixture, 'icons.json'));
await copyFile(resolve(root, 'packages/icons-extra/icons.json'), resolve(fixture, 'icons-extra.json'));
await cp(resolve(root, 'e2e'), resolve(fixture, 'e2e'), { recursive: true });
await writeFile(resolve(fixture, 'consumer-check-files.json'), JSON.stringify([
  'tests/consumer/packed.test.ts', 'tests/consumer/types.tsx', 'tests/consumer/state.test.ts', 'tests/consumer/themes.test.ts', 'tests/consumer/theme-settings.test.ts', 'tests/consumer/charts.test.ts',
  ...(await readdir(resolve(root, 'e2e'))).filter(name => name.endsWith('.spec.ts')).map(name => `e2e/${name}`)
]));
run('pnpm', ['install', '--no-frozen-lockfile'], fixture);
run('pnpm', ['exec', 'vite', 'build'], fixture);
run('pnpm', ['exec', 'vite', 'build', '--ssr'], fixture);
run('pnpm', ['exec', 'tsc', '--noEmit'], fixture);
run(process.execPath, ['--conditions=browser', '--conditions=development', '--test', 'state.test.ts', 'themes.test.ts'], fixture);
run(process.execPath, ['--conditions=development', '--test', 'theme-settings.test.ts', 'charts.test.ts'], fixture);
run(process.execPath, ['--test', 'packed.test.ts'], fixture);
run(process.execPath, ['check-distribution.ts'], fixture);
run(process.execPath, ['check-tree-shaking.ts'], fixture);
if (nextCore) {
  run('pnpm', ['exec', 'playwright', 'test', 'e2e/inputs.spec.ts', 'e2e/tree.spec.ts', 'e2e/splitter.spec.ts', 'e2e/assets.spec.ts', 'e2e/charts.spec.ts', 'e2e/theme-extensions.spec.ts', 'e2e/theme-css.spec.ts', '--project=ssr', '--project=csr'], root, { GALLERY_PACKED: '1' });
  run('pnpm', ['exec', 'playwright', 'test', 'e2e/hydration.spec.ts', '--project=ssr'], root, { GALLERY_PACKED: '1' });
  run('pnpm', ['exec', 'playwright', 'test',
    'e2e/composition.spec.ts', 'e2e/controls.spec.ts', 'e2e/layers.spec.ts', 'e2e/theme-interactions.spec.ts', 'e2e/advanced.spec.ts', 'e2e/select.spec.ts',
    '--project=ssr', '--project=csr', '--grep',
    'controlled rejection|reactive custom target|native ref consumers|atomic prop updates|required checkbox validation|required delete confirmation|mixed checks, external ownership|a nested native render root|a portalled nonmodal Popover|modal themed portals|themed menus propagate|form native default props|form server errors clear|Select keyboard Home and End|toast announces priority and action alternatives|settled native gallery and an open modal'
  ], root, { GALLERY_PACKED: '1' });
  // Development gallery: dev-only reactive diagnostics never reach the packed production checks above.
  run('pnpm', ['exec', 'playwright', 'test', 'e2e/advanced.spec.ts', 'e2e/inputs.spec.ts', '--project=ssr', '--project=csr', '--grep',
    'toast announces priority and action alternatives|settled native gallery and an open modal|uncontrolled data loss clears without selecting a neighbor|object replacement and data reorder preserve the active key|filtering: trimmed case-insensitive matching'
  ], root, { GALLERY_PACKED: '', GALLERY_PRODUCTION: '' });
} else {
  run('pnpm', ['exec', 'playwright', 'test'], root, { GALLERY_PACKED: '1' });
}
console.log(`Independent packed consumer (${nextCore ? 'next-core' : 'all'}): client/server/TS7/TS5/state/selected browser checks passed.`);
