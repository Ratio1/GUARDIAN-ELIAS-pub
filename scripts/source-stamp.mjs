// The stamp of the sources the site is built from, kept in build/source-stamp.txt.
//
// It is computed from the commit: the input paths and their blob ids come from
// `git ls-tree` of HEAD, so line endings, checkout settings, untracked files
// and ignored files cannot change it. `build:site` refuses to run unless the
// inputs in the working folder are exactly the committed ones, so commit the
// sources first and build afterwards. The stamp is checked in CI and before a
// push; the node does not compute it.
//
// Inputs: the content (docs, blog), the site's code and styles (src), the
// static files (static), the Docusaurus configuration, sidebars, tsconfig,
// package.json and package-lock.json. The configuration imports only
// src/clientModules/nodeLineElement.mjs, which lies under src/. If it ever
// imports a file from anywhere else, list that file in REQUIRED_FILES.
//
// Usage: node scripts/source-stamp.mjs [--write | --check | --require-clean]
//   (no flag)       print the stamp
//   --write         write build/source-stamp.txt
//   --check         exit 1 unless build/source-stamp.txt holds the stamp of HEAD
//                   and the working inputs are the committed ones
//   --require-clean exit 1 unless the working inputs are the committed ones
//                   (no untracked, ignored, modified or staged file)

import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const STAMP_FILE = path.join(ROOT, 'build', 'source-stamp.txt');

const INPUT_DIRS = ['docs', 'blog', 'src', 'static', 'versioned_docs', 'versioned_sidebars', 'i18n'];
const REQUIRED_FILES = ['docusaurus.config.ts', 'sidebars.ts', 'tsconfig.json', 'package.json', 'package-lock.json'];
const OPTIONAL_FILES = ['versions.json', 'babel.config.js'];

const git = (args, input) => execFileSync('git', args, {cwd: ROOT, encoding: 'utf8', input, maxBuffer: 1 << 28});

function presentInputs() {
  // Always the full list: a folder deleted locally must show up as a deletion.
  return [...INPUT_DIRS, ...REQUIRED_FILES, ...OPTIONAL_FILES];
}

// The committed inputs: [{file, blob}] sorted by path, from HEAD.
function committedInputs() {
  const rows = git(['ls-tree', '-r', '-z', 'HEAD', '--', ...presentInputs()]).split('\0').filter(Boolean);
  const entries = rows.map((row) => {
    const [meta, file] = row.split('\t');
    const [mode, , blob] = meta.split(' ');
    return {mode, blob, file};
  });
  const missing = REQUIRED_FILES.filter((f) => !entries.some((e) => e.file === f));
  if (missing.length > 0) throw new Error(`input file(s) not committed: ${missing.join(', ')}`);
  const odd = entries.filter((e) => e.mode !== '100644' && e.mode !== '100755').map((e) => e.file);
  if (odd.length > 0) throw new Error(`symbolic links and submodules are not allowed among the inputs: ${odd.join(', ')}`);
  return entries.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
}

// The stamp of the committed inputs.
export function computeSourceStamp() {
  const total = crypto.createHash('sha256');
  for (const {blob, file} of committedInputs()) total.update(`${blob}  ${file}\n`);
  return total.digest('hex');
}

// Files that differ from the commit among the inputs: untracked, ignored,
// modified or staged.
function workingDifferences() {
  const present = presentInputs();
  const others = git(['ls-files', '--others', '-z', '--', ...present]).split('\0').filter(Boolean);
  const changed = git(['status', '--porcelain', '--', ...present]).split('\n').filter(Boolean);
  return [...others.map((f) => `untracked or ignored: ${f}`), ...changed];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  try {
    if (mode === '--require-clean') {
      const differences = workingDifferences();
      if (differences.length > 0) {
        console.error(
          'The build inputs are not exactly the committed ones:\n  ' +
            differences.join('\n  ') +
            '\nCommit the sources (and remove stray files), then run "npm run build:site" again.',
        );
        process.exit(1);
      }
    } else if (mode === '--write') {
      const stamp = computeSourceStamp();
      fs.writeFileSync(STAMP_FILE, stamp + '\n');
      console.log(`[build] wrote source stamp ${stamp.slice(0, 12)}`);
    } else if (mode === '--check') {
      const stamp = computeSourceStamp();
      const recorded = fs.existsSync(STAMP_FILE) ? fs.readFileSync(STAMP_FILE, 'utf8').trim() : null;
      if (recorded !== stamp) {
        console.error(
          'The committed build/ was not made from these sources.\n' +
            'Fix: run "npm ci --include=dev && npm run clear && npm run build:site", then commit the sources and build/ together.',
        );
        process.exit(1);
      }
      const differences = workingDifferences();
      if (differences.length > 0) {
        console.error('The build inputs are not exactly the committed ones:\n  ' + differences.join('\n  '));
        process.exit(1);
      }
      console.log(`[build] build/ was made from these sources (${stamp.slice(0, 12)})`);
    } else if (mode === undefined) {
      console.log(computeSourceStamp());
    } else {
      console.error(`unknown option ${mode}`);
      process.exit(2);
    }
  } catch (err) {
    console.error(`[build] ${err.message}`);
    process.exit(1);
  }
}
