// Original Radix Themes CSS target order; MIT, Copyright (c) 2023 WorkOS.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import postcss from 'postcss';
import postcssConfig from '../postcss.config.js';

const root = resolve(import.meta.dirname, '..');
const processor = postcss(postcssConfig.plugins);
const targets = [
  ['src/styles/index.css', 'styles.css'],
  ['src/components/index.css', 'components.css'],
  ['src/styles/utilities/index.css', 'utilities.css'],
  ['src/styles/tokens/index.css', 'tokens.css'],
  ['src/styles/tokens/base.css', 'tokens/base.css'],
  ...(await readdir(resolve(root, 'src/styles/tokens/colors'))).filter(name => name.endsWith('.css'))
    .map(name => [join('src/styles/tokens/colors', name), join('tokens/colors', name)]),
  ['src/styles/layout.css', 'layout.css'],
  ['src/styles/tokens/layout.css', 'layout/tokens.css'],
  ['src/components/layout.css', 'layout/components.css'],
  ['src/styles/utilities/layout.css', 'layout/utilities.css']
];

const common = ['reset', 'animations', 'layout', 'skeleton', 'text'];
const index = await readFile(resolve(root, 'src/components/index.css'), 'utf8');
const order = [...index.matchAll(/^@import '\.\/([\w-]+)\.css';/gm)]
  .map(match => match[1]).filter(name => !common.includes(name) && name !== 'shared');
// Composed JSX dependencies not already imported by the component's CSS.
const dependencies = {
  button: ['spinner'],
  'icon-button': ['spinner'],
  'dropdown-menu': ['scroll-area'],
  'context-menu': ['scroll-area'],
  table: ['scroll-area'],
  dialog: ['heading', 'text'],
  'alert-dialog': ['heading', 'text'],
  callout: ['text'],
  'data-list': ['text'],
  'checkbox-group': ['text'],
  'radio-group': ['text'],
  tooltip: ['text'],
  'checkbox-cards': ['grid'],
  'radio-cards': ['grid'],
  'theme-panel': ['box', 'button', 'flex', 'grid', 'heading', 'icon-button', 'kbd', 'popover', 'scroll-area', 'text', 'tooltip']
};
targets.push(
  ['src/components/index.css', 'css/common.css', common.map(name => `@import './${name}.css';`).join('\n')],
  ['src/components/index.css', 'css/utilities.css', "@import './shared.css';\n@import '../styles/utilities/index.css';"]
);
for (const name of [...order, 'skeleton', 'text', 'box', 'flex', 'grid', 'container', 'section', 'theme', 'reset']) {
  const included = new Set();
  const include = name => {
    if (included.has(name)) return;
    included.add(name);
    for (const dependency of dependencies[name] ?? []) include(dependency);
  };
  include(name);
  const names = order.filter(name => included.has(name));
  if (!order.includes(name)) names.unshift(name === 'theme' ? 'shared' : name);
  const source = names.map(name => `@import './${name}.css';`).join('\n');
  targets.push(['src/components/index.css', `css/${name}.css`, source]);
}
for (const [input, output, source] of targets) {
  const from = resolve(root, input), to = resolve(root, 'dist/styles', output);
  const result = await processor.process(source ?? await readFile(from, 'utf8'), { from, to });
  const css = result.root.toString();
  await mkdir(dirname(to), { recursive: true });
  await writeFile(to, css);
  await writeFile(to.replace(/\.css$/, '.layer.css'), `@layer radix {\n${css}\n}\n`);
  console.log(`${input} → ${output}`);
}
