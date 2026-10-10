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
for (const [input, output] of targets) {
  const from = resolve(root, input), to = resolve(root, 'dist/styles', output);
  const result = await processor.process(await readFile(from, 'utf8'), { from, to });
  await mkdir(dirname(to), { recursive: true });
  await writeFile(to, result.css);
  console.log(`${input} → ${output}`);
}
