// What `npm run build` does. The site is built ahead of time and committed in
// build/ (see DEPLOY.md), so this is only a check that build/ is whole: every
// file of its manifest is present and unchanged, and nothing else is there.
// It reads nothing outside build/ (not the sources, not package.json, not the
// lock file), so it cannot fail because of anything `npm install` rewrites.
//
// - build/ is whole: print one line, exit 0.
// - `--rebuild` and the development packages are installed: run the real build
//   (`npm run build:site`).
// - Otherwise fail with a message that says what to do.

import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {manifestProblems, ROOT} from './build-manifest.mjs';

const rebuild = process.argv.includes('--rebuild');

function developmentPackagesInstalled() {
  try {
    createRequire(import.meta.url).resolve('@docusaurus/core/package.json');
    return true;
  } catch {
    return false;
  }
}

if (rebuild && developmentPackagesInstalled()) {
  const result = spawnSync('npm', ['run', 'build:site'], {cwd: ROOT, stdio: 'inherit'});
  process.exit(result.status ?? 1);
}

const problems = manifestProblems();
if (problems.length === 0) {
  console.log('[build] the committed build/ is whole; nothing to build');
  process.exit(0);
}

console.error(
  `[build] build/ is not whole:\n  ${problems.slice(0, 10).join('\n  ')}\n` +
    (developmentPackagesInstalled()
      ? 'Run "npm run build:site" and commit the sources and build/ together.'
      : 'The site is built ahead of time. On a development machine run "npm ci --include=dev && npm run build:site" and commit build/.'),
);
process.exit(1);
