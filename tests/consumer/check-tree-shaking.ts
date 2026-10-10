import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'vite';
import solid from '@solidjs/vite-plugin';

const fixture = await mkdtemp(resolve(process.cwd(), 'selective-import-'));
const iconNames: Record<string, string> = JSON.parse(await readFile(new URL('./icons.json', import.meta.url), 'utf8'));
const unrelatedIcons = new Set(Object.keys(iconNames).filter(name => name !== 'CheckIcon').map(name => `${name}.js`));
const unrelatedEngine = (id: string) => /\/primitives\/dist\/client\/(?:accordion|alert-dialog|announce|avatar|checkbox|collapsible|collection|context-menu|dialog|dismissable-layer|dropdown-menu|focus-guards|focus-scope|form|hover-card|menu|menubar|navigation-menu|one-time-password-field|overlay|password-toggle-field|pointer-grace|popover|popper|portal|presence|radio-group|roving-focus|scroll-area|scroll-lock|select|slider|switch|tabs|toast|toggle-group|toolbar|tooltip)(?:-[^/]+)?\.js$/.test(id) || id.includes('@floating-ui/');
// Root Theme renders TooltipProvider, whose scope initialization also retains Popper contexts.
const requiredThemeContext = (id: string) => /\/primitives\/dist\/client\/(?:tooltip|popper)(?:-[^/]+)?\.js$/.test(id);
const scenes = [
  { name: 'Toggle', source: "import { Toggle } from '@radix-solid/primitives'; const Scene = () => <Toggle.Root>Bold</Toggle.Root>;", required: '/primitives/dist/client/toggle.js', excluded: unrelatedEngine },
  { name: 'CheckIcon', source: "import { CheckIcon } from '@radix-solid/icons'; const Scene = () => <CheckIcon title='Saved' />;", required: '/icons/dist/client/CheckIcon.js', excluded: (id: string) => unrelatedEngine(id) || (id.includes('/icons/dist/client/') && unrelatedIcons.has(id.slice(id.lastIndexOf('/') + 1))) },
  { name: 'Theme/Button', source: "import { Theme, Button } from '@radix-solid/themes'; import '@radix-solid/themes/styles.css'; const Scene = () => <Theme><Button>Save</Button></Theme>;", required: '/themes/dist/client/components/button.js', excluded: (id: string) => (unrelatedEngine(id) && !requiredThemeContext(id)) || /\/themes\/dist\/client\/components\/(?:dialog|select|slider|table|checkbox|theme-panel|scroll-area)(?:-[^/]+)?\.js$/.test(id), css: true },
];
try {
  await writeFile(resolve(fixture, 'index.html'), '<!doctype html><html><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>');
  for (const scene of scenes) {
    await writeFile(resolve(fixture, 'entry.tsx'), `import { render } from '@solidjs/web'; ${scene.source} render(() => <Scene />, document.getElementById('root')!);`);
    await build({ root: fixture, configFile: false, plugins: [solid({ ssr: true }), {
      name: 'selective-native-consumer', generateBundle(_options, bundle) {
        const chunks = Object.values(bundle).filter(output => output.type === 'chunk');
        const rendered = chunks.flatMap(chunk => Object.entries(chunk.modules).filter(([, module]) => module.renderedLength > 0).map(([id]) => id));
        assert(rendered.some(id => id.endsWith(scene.required)), `${scene.name}: expected native implementation missing`);
        assert.deepEqual(rendered.filter(scene.excluded), [], `${scene.name}: unrelated native implementations survived tree shaking`);
        assert(!rendered.some(id => /\/node_modules\/(?:react|react-dom)(?:\/|$)/.test(id) || id.includes('/upstream/')), `${scene.name}: non-native runtime/source entered bundle`);
        if (scene.css) assert(Object.values(bundle).some(output => output.type === 'asset' && output.fileName.endsWith('.css')), 'Theme/Button: explicit CSS import was dropped');
        console.log(`${scene.name}: ${chunks.reduce((sum, chunk) => sum + Buffer.byteLength(chunk.code), 0)} consumer JS bytes including runtime; selective implementations retained, unrelated widgets removed${scene.css ? ', CSS retained' : ''}.`);
      }
    }], build: { outDir: `dist-${scene.name.replace('/', '-')}` }, logLevel: 'warn' });
  }
} finally { await rm(fixture, { recursive: true, force: true }); }
