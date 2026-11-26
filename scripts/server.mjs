// Production HTTP server for the built site (./build).
//
// - Serves files with the same URL semantics as `docusaurus serve` for this
//   site: serve-handler with clean URLs, no directory listing, and the
//   generated 404 page for unknown paths (this site uses baseUrl "/").
// - Adds security headers to every response and sets cache headers.
// - Rejects request paths that contain a `..` segment (also when
//   percent-encoded) with 400 before they reach serve-handler.
// - Redirects HTTP to HTTPS when, and only when, the Cloudflare `CF-Visitor`
//   request header reports that the visitor used plain HTTP and the Host is
//   one of CANONICAL_HOSTS. Requests without that header (local requests,
//   health checks) and requests for other hosts are served directly, so there
//   is no redirect loop behind the tunnel.
//
// - Answers GET /node-line.json with the footer line that names the Edge Node
//   the site runs on ({"running_on": "<sentence>"}, or {"running_on": null}
//   when the environment gives no valid node id; see scripts/node-id.mjs).
//   The site's own script fetches it and fills the footer.
//
// Environment: R1EN_HOST_ID / EE_HOST_ID (the node's id, set by the node's
//              runner), PORT (default 3000), HOST (default 0.0.0.0),
//              HSTS_MAX_AGE (seconds, default 86400),
//              CANONICAL_HOSTS (comma-separated hostnames that may be
//              redirected to HTTPS, default "edge-guardian.eu,www.edge-guardian.eu").
//
// Normally started through scripts/supervise.mjs (`npm start`), which
// restarts this process if it exits.

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import serveHandler from 'serve-handler';
import {nodeLineFromEnv} from './node-id.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = path.join(ROOT, 'build');
const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseIntEnv('PORT', 3000, 1, 65535);
const HSTS_MAX_AGE = parseIntEnv('HSTS_MAX_AGE', 86400, 0, 63072000);
const CANONICAL_HOSTS = parseHostsEnv('CANONICAL_HOSTS', 'edge-guardian.eu,www.edge-guardian.eu');

function log(message) {
  console.log(`[server] ${new Date().toISOString()} ${message}`);
}

function parseIntEnv(name, fallback, min, max) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    log(`invalid ${name}=${JSON.stringify(raw)}; expected an integer in [${min}, ${max}]`);
    process.exit(2);
  }
  return value;
}

function parseHostsEnv(name, fallback) {
  const raw = process.env[name];
  const value = raw === undefined || raw.trim() === '' ? fallback : raw;
  const hosts = value.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (hosts.length === 0 || !hosts.every((h) => HOST_RE.test(h))) {
    log(`invalid ${name}=${JSON.stringify(raw)}; expected comma-separated hostnames`);
    process.exit(2);
  }
  return new Set(hosts);
}

function walkFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

// URL paths of the files that Docusaurus emits under /assets/ with a content
// hash in their name (for example /assets/js/main.0123abcd.js). Only these
// are cached as immutable.
function hashedAssetPaths(dir) {
  const assetsDir = path.join(dir, 'assets');
  if (!fs.existsSync(assetsDir)) return new Set();
  return new Set(
    walkFiles(assetsDir)
      .filter((file) => /[.-][0-9a-f]{8,}\.[a-z0-9]+$/i.test(path.basename(file)))
      .map((file) => '/' + path.relative(dir, file).split(path.sep).join('/')),
  );
}

// Docusaurus emits a few small inline scripts (for example the colour-mode
// bootstrap). Allow exactly those by hash instead of 'unsafe-inline'. JSON-LD
// and other non-executable data blocks are not subject to script-src.
function inlineScriptHashes(dir) {
  const hashes = new Set();
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const typeRe = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
  const executableTypes = new Set(['', 'text/javascript', 'application/javascript', 'module']);
  for (const file of walkFiles(dir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [, attrs, body] of html.matchAll(scriptRe)) {
      if (/\bsrc\s*=/i.test(attrs) || body.length === 0) continue;
      const typeMatch = attrs.match(typeRe);
      const type = typeMatch ? (typeMatch[1] ?? typeMatch[2] ?? typeMatch[3]).trim().toLowerCase() : '';
      if (!executableTypes.has(type)) continue;
      hashes.add(`'sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}'`);
    }
  }
  return [...hashes].sort();
}

function buildCsp(scriptHashes) {
  return [
    "default-src 'self'",
    `script-src 'self' ${scriptHashes.join(' ')}`.trim(),
    // React style attributes and Mermaid's generated SVG <style> need inline styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

for (const required of ['index.html', '404.html']) {
  if (!fs.existsSync(path.join(BUILD_DIR, required))) {
    log(`missing ${path.join(BUILD_DIR, required)}; build/ is committed with the sources (see DEPLOY.md)`);
    process.exit(1);
  }
}

const scriptHashes = inlineScriptHashes(BUILD_DIR);
const SECURITY_HEADERS = {
  'Strict-Transport-Security': `max-age=${HSTS_MAX_AGE}`,
  'Content-Security-Policy': buildCsp(scriptHashes),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const NODE_LINE_BODY = JSON.stringify({running_on: nodeLineFromEnv(process.env)}) + '\n';

const HASHED_ASSETS = hashedAssetPaths(BUILD_DIR);
const HASHED_ASSET_CACHE = 'public, max-age=31536000, immutable';
const REVALIDATE_CACHE = 'no-cache';
const DOT_SEGMENT_RE = /(^|[/\\])\.\.([/\\]|$)/;

// True only when Cloudflare reports that the visitor connected over plain HTTP.
// X-Forwarded-Proto alone is deliberately not trusted.
function visitorUsedHttp(req) {
  const raw = req.headers['cf-visitor'];
  if (typeof raw !== 'string') return false;
  try {
    return JSON.parse(raw)?.scheme === 'http';
  } catch {
    return false;
  }
}

// The HTTPS URL for the same host and path, or null when the host is not one
// of CANONICAL_HOSTS (such requests are served without a redirect).
function httpsLocation(req) {
  const hostname = String(req.headers.host || '').toLowerCase().replace(/:\d+$/, '');
  if (!CANONICAL_HOSTS.has(hostname)) return null;
  const target = typeof req.url === 'string' && req.url.startsWith('/') ? req.url : '/';
  return `https://${hostname}${target}`;
}

// The request path as serve-handler resolves it: query and fragment removed,
// backslashes read as slashes, percent-decoded once. Null if it cannot be decoded.
function decodedPathname(url) {
  const pathname = String(url || '/').split(/[?#]/, 1)[0].replace(/\\/g, '/');
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function handle(req, res) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end('Method Not Allowed\n');
    return;
  }

  const pathname = decodedPathname(req.url);
  if (pathname === null || pathname.includes('\0') || DOT_SEGMENT_RE.test(pathname)) {
    res.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end('Bad Request\n');
    return;
  }

  if (visitorUsedHttp(req)) {
    const location = httpsLocation(req);
    if (location) {
      res.writeHead(301, {Location: location, 'Cache-Control': 'no-store'});
      res.end();
      return;
    }
  }

  if (pathname === '/node-line.json') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(NODE_LINE_BODY),
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : NODE_LINE_BODY);
    return;
  }

  // Cache policy depends on the file served and the final status, so decide it
  // when headers are written. serve-handler serves the file at the normalised
  // decoded path, so only real content-hashed files are cached as immutable.
  const hashedAsset = HASHED_ASSETS.has(path.posix.normalize(pathname));
  const writeHead = res.writeHead;
  res.writeHead = function (statusCode, ...rest) {
    if (!res.hasHeader('Cache-Control')) {
      const cacheable = statusCode === 200 || statusCode === 206 || statusCode === 304;
      res.setHeader('Cache-Control', cacheable && hashedAsset ? HASHED_ASSET_CACHE : REVALIDATE_CACHE);
    }
    return writeHead.call(this, statusCode, ...rest);
  };

  // ETags stay off, as in `docusaurus serve`: serve-handler answers a matching
  // If-None-Match with 304 without closing the file it has already opened.
  // Responses carry Last-Modified instead. serve-handler also pipes files with
  // stream.pipe(), which leaves the file open when the response closes early
  // (for example an aborted download), so close every file stream when its
  // response closes.
  const methods = {
    createReadStream(file, options) {
      const stream = fs.createReadStream(file, options);
      if (res.destroyed) stream.destroy();
      else res.once('close', () => stream.destroy());
      return stream;
    },
  };

  serveHandler(req, res, {public: BUILD_DIR, cleanUrls: true, directoryListing: false, etag: false}, methods).catch((err) => {
    log(`error serving ${req.url}: ${err && err.stack ? err.stack : err}`);
    if (!res.headersSent) {
      res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Internal Server Error\n');
    } else {
      res.destroy();
    }
  });
}

const server = http.createServer(handle);
// Keep idle keep-alive connections open longer than the tunnel's idle timeout
// so the proxy does not reuse a connection the server has just closed.
server.keepAliveTimeout = 95_000;
server.headersTimeout = 100_000;

server.on('error', (err) => {
  log(`cannot listen on ${HOST}:${PORT}: ${err.code || err.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  log(
    `serving ${BUILD_DIR} on http://${HOST}:${PORT} (node line: ${NODE_LINE_BODY.trim()}; ${scriptHashes.length} inline script hash(es) in CSP, ` +
      `${HASHED_ASSETS.size} immutable asset(s), HTTPS redirect for ${[...CANONICAL_HOSTS].join(', ')})`,
  );
});

function shutdown(signal) {
  log(`received ${signal}, closing`);
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
