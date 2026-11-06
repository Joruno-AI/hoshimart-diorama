import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const minify = !process.argv.includes('--dev');
await mkdir(resolve('dist'), { recursive: true });

const result = await build({
  entryPoints: [resolve('src/main.js')],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  minify,
  legalComments: 'none',
  write: false,
  logLevel: 'info',
});

const js = result.outputFiles[0].text;
const template = await readFile(resolve('src/index.template.html'), 'utf8');
const html = template.replace('/*__BUNDLE__*/', () => js);
await mkdir(resolve('dist'), { recursive: true });
await writeFile(resolve('dist/index.html'), html);
await writeFile(resolve('index.html'), html);
console.log(`built index.html and dist/index.html (${(html.length / 1024).toFixed(1)} kB)`);
