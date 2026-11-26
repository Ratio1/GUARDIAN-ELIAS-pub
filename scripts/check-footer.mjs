// Checks the markup of every built page, read as text: inside <footer>, a
// hidden <p> element whose id attribute is exactly NODE_LINE_ELEMENT_ID (the
// element that the footer script fills; see src/clientModules/nodeLine.mjs).
// This is not a check of what a browser makes of the page, so it cannot see a
// paragraph that the markup places inside a comment or a <template>.
//
// Usage: node scripts/check-footer.mjs [build-folder]

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NODE_LINE_ELEMENT_ID} from '../src/clientModules/nodeLineElement.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = path.resolve(process.argv[2] || path.join(ROOT, 'build'));

function htmlFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}

// The attributes of one start tag as a Map of lower-case name to value.
function attributes(tagText) {
  const attrs = new Map();
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const [, name, dq, sq, bare] of tagText.matchAll(re)) {
    attrs.set(name.toLowerCase(), dq ?? sq ?? bare ?? '');
  }
  return attrs;
}

export function pageHasNodeLineElement(html) {
  for (const [, footer] of html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer\s*>/gi)) {
    for (const [, tag] of footer.matchAll(/<p\b([^>]*)>/gi)) {
      const attrs = attributes(tag);
      if (attrs.get('id') === NODE_LINE_ELEMENT_ID && attrs.has('hidden')) return true;
    }
  }
  return false;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pages = htmlFiles(BUILD_DIR);
  const missing = pages.filter((page) => !pageHasNodeLineElement(fs.readFileSync(page, 'utf8')));
  if (pages.length === 0 || missing.length > 0) {
    console.error(`the markup has no hidden <p id="${NODE_LINE_ELEMENT_ID}"> inside <footer> in:\n  ${missing.join('\n  ') || '(no pages found)'}`);
    process.exit(1);
  }
  console.log(`[build] the markup of all ${pages.length} pages has the footer paragraph "${NODE_LINE_ELEMENT_ID}"`);
}
