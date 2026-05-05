import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;
const STANDALONE = join(ROOT, '.next', 'standalone');
const DIST = join(ROOT, 'dist-tauri');

// Clean and create dist
if (existsSync(DIST)) {
  rmSync(DIST, { recursive: true });
}
mkdirSync(DIST, { recursive: true });

// Copy standalone build without node_modules
if (existsSync(STANDALONE)) {
  cpSync(STANDALONE, DIST, {
    recursive: true,
    filter: (src) => !src.includes('node_modules')
  });
}

console.log('Tauri distribution prepared successfully');
