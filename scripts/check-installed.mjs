// Checks that node_modules holds exactly the production tree of the committed
// package-lock.json: every locked package that is not a development package,
// and nothing else. Run in a clean copy after a plain `npm install`, which
// must install only what the server needs at run time (the project's .npmrc
// sets omit=dev).

import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The committed lock file, not the working copy that `npm install` may have
// rewritten.
const lock = JSON.parse(
  execFileSync('git', ['show', 'HEAD:package-lock.json'], {cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28}),
);
const expected = new Set(
  Object.entries(lock.packages)
    .filter(([key, entry]) => key.startsWith('node_modules/') && !entry.dev && !entry.devOptional && !entry.optional)
    .map(([key]) => key),
);

const installed = new Set();
function walk(dir, relative) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    const rel = `${relative}/${entry.name}`;
    if (fs.existsSync(path.join(full, 'package.json'))) {
      installed.add(rel);
      walk(path.join(full, 'node_modules'), `${rel}/node_modules`);
    } else if (entry.name.startsWith('@')) {
      walk(full, rel);
    }
  }
}
const modules = path.join(ROOT, 'node_modules');
if (fs.existsSync(modules)) walk(modules, 'node_modules');

const extra = [...installed].filter((p) => !expected.has(p));
const missing = [...expected].filter((p) => !installed.has(p));
if (extra.length > 0 || missing.length > 0) {
  console.error(`unexpected packages: ${extra.join(', ') || 'none'}\nmissing packages: ${missing.join(', ') || 'none'}`);
  process.exit(1);
}
console.log(`[install] ${installed.size} packages installed, as the lock file's production tree requires`);
