// The manifest of the built site, kept in build/build-manifest.txt.
//
// `npm run build:site` writes it after a build. It lists every file of build/
// (except itself) with its size and SHA-256, one line each:
//   <sha256> <TAB> <size> <TAB> <path relative to build/>
// On the node, `npm run build` (scripts/prebuilt.mjs) only checks that build/
// is whole against this manifest: no listed file missing or different, no file
// present that is not listed. It reads nothing outside build/.
//
// Usage: node scripts/build-manifest.mjs [--write | --check]

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const MANIFEST_NAME = 'build-manifest.txt';

// The files under dir, and the entries that are not regular files or
// directories (symbolic links and anything else). Symbolic links are never
// followed.
function walk(dir, base = dir, found = {files: [], bad: []}) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    if (entry.isSymbolicLink()) found.bad.push(rel);
    else if (entry.isDirectory()) walk(full, base, found);
    else if (entry.isFile()) found.files.push(rel);
    else found.bad.push(rel);
  }
  return found;
}

function describeFile(buildDir, rel) {
  const bytes = fs.readFileSync(path.join(buildDir, rel));
  return {sha: crypto.createHash('sha256').update(bytes).digest('hex'), size: bytes.length};
}

// The manifest text for the files now in buildDir. Refuses symbolic links.
export function manifestText(buildDir) {
  const {files, bad} = walk(buildDir);
  if (bad.length > 0) throw new Error(`not regular files: ${bad.join(', ')}`);
  return files
    .filter((rel) => rel !== MANIFEST_NAME)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((rel) => {
      const {sha, size} = describeFile(buildDir, rel);
      return `${sha}\t${size}\t${rel}\n`;
    })
    .join('');
}

export function writeManifest(buildDir = path.join(ROOT, 'build')) {
  const text = manifestText(buildDir);
  fs.writeFileSync(path.join(buildDir, MANIFEST_NAME), text);
  return text.split('\n').length - 1;
}

// A list of problems; empty when build/ is whole.
export function manifestProblems(buildDir = path.join(ROOT, 'build')) {
  // build/ itself must be a real directory, and nothing under it may be a
  // symbolic link: a link is rejected before anything is read through it.
  let top;
  try {
    top = fs.lstatSync(buildDir);
  } catch {
    return ['build/ is missing'];
  }
  if (!top.isDirectory()) return ['build/ is not a real directory'];
  const {files, bad} = walk(buildDir);
  if (bad.length > 0) return bad.map((rel) => `not a regular file: ${rel}`);
  const manifestFile = path.join(buildDir, MANIFEST_NAME);
  if (!files.includes(MANIFEST_NAME)) return [`${MANIFEST_NAME} is missing from build/`];
  const listed = new Map();
  for (const line of fs.readFileSync(manifestFile, 'utf8').split('\n').filter(Boolean)) {
    const [sha, size, rel] = line.split('\t');
    listed.set(rel, {sha, size: Number(size)});
  }
  const problems = [];
  for (const required of ['index.html', '404.html']) {
    if (!listed.has(required)) problems.push(`${required} is not listed`);
  }
  const present = new Set(files.filter((rel) => rel !== MANIFEST_NAME));
  for (const [rel, expected] of listed) {
    if (!present.has(rel)) {
      problems.push(`missing: ${rel}`);
      continue;
    }
    const actual = describeFile(buildDir, rel);
    if (actual.size !== expected.size || actual.sha !== expected.sha) problems.push(`changed: ${rel}`);
  }
  for (const rel of present) if (!listed.has(rel)) problems.push(`not listed: ${rel}`);
  return problems;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2];
  if (mode === '--write') {
    console.log(`[build] wrote ${MANIFEST_NAME} (${writeManifest()} files)`);
  } else if (mode === '--check') {
    const problems = manifestProblems();
    if (problems.length > 0) {
      console.error(problems.slice(0, 20).join('\n') + '\nbuild/ is not the committed build.');
      process.exit(1);
    }
    console.log('[build] build/ is whole');
  } else {
    console.error('usage: node scripts/build-manifest.mjs --write | --check');
    process.exit(2);
  }
}
