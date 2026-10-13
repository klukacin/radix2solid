import assert from 'node:assert/strict';
import { access, readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

type Coverage = {
  modules: { module: string; exports: string; checks: string[] }[];
  checks: Record<string, string>;
  css: string[];
  plugins: string[];
  publicCounts: { modules: number; declarations: number; css: number; plugins: number; icons: number };
};
type ExportTarget = string | null | { [condition: string]: ExportTarget };
const coverage: Coverage = JSON.parse(await readFile(new URL('./coverage-manifest.json', import.meta.url), 'utf8'));
const iconNames: Record<string, string> = JSON.parse(await readFile(new URL('./icons.json', import.meta.url), 'utf8'));
const reachableChecks: string[] = JSON.parse(await readFile(resolve('consumer-check-files.json'), 'utf8'));
for (const [name, path] of Object.entries(coverage.checks)) {
  assert(reachableChecks.includes(path), `${name}: check is not reached by the consumer runner: ${path}`);
  await access(resolve(path.startsWith('tests/consumer/') ? path.slice('tests/consumer/'.length) : path));
}

// Expand the installed export maps from real packed files, independently of the coverage list.
function targets(value: ExportTarget): string[] {
  return value === null ? [] : typeof value === 'string' ? [value] : Object.values(value).flatMap(targets);
}
const publicPaths = new Set<string>();
for (const name of ['primitives', 'themes', 'icons']) {
  const packageName = `@wsagency/radix2solid-${name}`;
  const packageRoot = resolve(dirname(await realpath(fileURLToPath(import.meta.resolve(packageName)))), '../..');
  const manifest: { exports: Record<string, ExportTarget> } = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
  const files = (await readdir(packageRoot, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile()).map(entry => `./${resolve(entry.parentPath, entry.name).slice(packageRoot.length + 1)}`);
  const keys = Object.keys(manifest.exports).sort((a, b) => {
    if (!a.includes('*')) return b.includes('*') ? -1 : 0;
    if (!b.includes('*')) return 1;
    return b.indexOf('*') - a.indexOf('*') || b.length - a.length;
  });
  for (const key of keys) {
    const patterns = targets(manifest.exports[key]);
    const substitutions = key.includes('*') ? new Set(patterns.flatMap(pattern => {
      const [prefix, suffix] = pattern.split('*');
      assert(suffix !== undefined, `${packageName}${key}: wildcard target must include its substitution`);
      return files.filter(file => file.startsWith(prefix) && file.endsWith(suffix))
        .map(file => file.slice(prefix.length, suffix ? -suffix.length : undefined));
    })) : [''];
    for (const substitution of substitutions) {
      const subpath = key.replace('*', substitution);
      const selected = keys.find(candidate => {
        if (!candidate.includes('*')) return candidate === subpath;
        const [prefix, suffix] = candidate.split('*');
        return subpath.startsWith(prefix) && subpath.endsWith(suffix) && subpath.length >= prefix.length + suffix.length;
      });
      if (selected !== key || manifest.exports[key] === null) continue;
      for (const target of patterns) await access(resolve(packageRoot, target.replaceAll('*', substitution)));
      publicPaths.add(packageName + (subpath === '.' ? '' : subpath.slice(1)));
    }
  }
}
const expectedPaths = [
  ...coverage.modules.map(contract => contract.module), ...coverage.css, ...coverage.plugins,
  '@wsagency/radix2solid-icons', ...Object.keys(iconNames).map(name => `@wsagency/radix2solid-icons/${name}`),
  ...Object.values(iconNames).map(asset => `@wsagency/radix2solid-icons/icons/${asset}`)
];
assert.deepEqual([...publicPaths].sort(), expectedPaths.sort(), 'Every actual packed export and all conditional targets require a coverage mapping');

const config = ts.readConfigFile(resolve('tsconfig.json'), ts.sys.readFile);
assert.equal(config.error, undefined);
const options = { ...ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd()).options, skipLibCheck: false };
const anchor = resolve('distribution-consumer.ts');
const contracts = [
  ...coverage.modules,
  { module: '@wsagency/radix2solid-icons', exports: ['IconProps', ...Object.keys(iconNames)].join(' '), checks: ['assets', 'types'] },
  ...Object.keys(iconNames).map(name => ({ module: `@wsagency/radix2solid-icons/${name}`, exports: `${name} default`, checks: ['assets', 'types'] }))
].map(contract => {
  const resolved = ts.resolveModuleName(contract.module, anchor, options, ts.sys).resolvedModule;
  assert(resolved, `Missing declared public subpath ${contract.module}`);
  return { ...contract, file: resolved.resolvedFileName };
});
const program = ts.createProgram([resolve('types.tsx'), ...contracts.map(contract => contract.file)], options);
const checker = program.getTypeChecker();
assert.deepEqual(ts.getPreEmitDiagnostics(program).map(diagnostic =>
  `TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`
), [], 'All public declaration subpaths compile together without suppressed library diagnostics');
let declarations = 0;
let values = 0;
for (const contract of contracts) {
  for (const check of contract.checks) assert(check in coverage.checks, `${contract.module}: unmapped check ${check}`);
  const source = program.getSourceFile(contract.file);
  assert(source, `Missing declaration source for ${contract.module}`);
  const module = checker.getSymbolAtLocation(source);
  assert(module, `Missing declared module ${contract.module}`);
  const symbols = checker.getExportsOfModule(module);
  assert.deepEqual(symbols.map(symbol => symbol.name).sort(), contract.exports.split(' ').sort(), `${contract.module}: public part/type contract`);
  if (!contract.module.startsWith('@wsagency/radix2solid-icons')) declarations += symbols.length;
  const runtime: Record<string, unknown> = await import(contract.module);
  for (const exported of symbols) {
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (!(symbol.flags & ts.SymbolFlags.Value)) continue;
    assert(exported.name in runtime && runtime[exported.name] !== undefined, `${contract.module}.${exported.name}: declared value missing from server export`);
    const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? source);
    assert(!(type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)), `${contract.module}.${exported.name}: untyped public value`);
    if (type.getCallSignatures().length || type.getConstructSignatures().length) {
      assert.equal(typeof runtime[exported.name], 'function', `${contract.module}.${exported.name}: declared callable is not callable`);
    }
    values++;
  }
}
for (const module of [...coverage.css, ...coverage.plugins]) await access(fileURLToPath(import.meta.resolve(module)));
assert.deepEqual({ modules: coverage.modules.length, declarations, css: coverage.css.length, plugins: coverage.plugins.length, icons: Object.keys(iconNames).length }, coverage.publicCounts, 'Exact intentional public counts');
assert(!program.getSourceFiles().some(source => /\/node_modules\/(?:react|react-dom|@types\/react)(?:\/|$)/.test(source.fileName)), 'Declaration graph must remain native');
console.log(`Distribution contract passed: ${coverage.modules.length} public modules, ${declarations} part/type exports, ${values} server values, ${coverage.css.length} CSS outputs, ${coverage.plugins.length} plugin subpaths and ${Object.keys(iconNames).length} icons.`);
