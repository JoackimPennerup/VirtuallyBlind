import { build } from 'esbuild';

await build({
  entryPoints: ['src/content/index.ts'],
  bundle: true,
  outfile: 'dist/content/index.js',
  format: 'iife',
  target: ['chrome107'],
  sourcemap: false,
  minify: false
});

await build({
  entryPoints: ['src/background/serviceWorker.ts'],
  bundle: true,
  outfile: 'dist/background/serviceWorker.js',
  format: 'esm',
  target: ['chrome107'],
  sourcemap: false,
  minify: false
});
