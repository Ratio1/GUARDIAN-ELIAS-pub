// Production HTTP server for the built site (./build).
//
// - Serves files with the same URL semantics as `docusaurus serve` for this
//   site: serve-handler with clean URLs, no directory listing, and the
//   generated 404 page for unknown paths (this site uses baseUrl "/").
// - Adds security headers to every response and sets cache headers.
// - Redirects HTTP to HTTPS when, and only when, the Cloudflare `CF-Visitor`
//   request header reports that the visitor used plain HTTP. Requests without
//   that header (local requests, health checks) are served directly, so there
//   is no redirect loop behind the tunnel.
//
// Environment: PORT (default 3000), HOST (default 0.0.0.0),
//              HSTS_MAX_AGE (seconds, default 86400).
//
// Normally started through scripts/supervise.mjs (`npm start`), which
// restarts this process if it exits.

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import serveHandler from 'serve-handler';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = path.join(ROOT, 'build');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseIntEnv('PORT', 3000, 1, 65535);
const HSTS_MAX_AGE = parseIntEnv('HSTS_MAX_AGE', 86400, 0, 63072000);

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

function walkHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Docusaurus emits a few small inline scripts (for example the colour-mode
// bootstrap). Allow exactly those by hash instead of 'unsafe-inline'. JSON-LD
// and other non-executable data blocks are not subject to script-src.
function inlineScriptHashes(dir) {
  const hashes = new Set();
  const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  const typeRe = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
  const executableTypes = new Set(['', 'text/javascript', 'application/javascript', 'module']);
  for (const file of walkHtml(dir)) {
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
    log(`missing ${path.join(BUILD_DIR, required)}; run "npm run build" first`);
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

const HASHED_ASSET_CACHE = 'public, max-age=31536000, immutable';
const REVALIDATE_CACHE = 'no-cache';
const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

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

function httpsLocation(req) {
  const hostname = String(req.headers.host || '').replace(/:\d+$/, '');
  if (!HOST_RE.test(hostname)) return null;
  const target = typeof req.url === 'string' && req.url.startsWith('/') ? req.url : '/';
  return `https://${hostname.toLowerCase()}${target}`;
}

function handle(req, res) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end('Method Not Allowed\n');
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

  // Cache policy depends on the final status, so decide it when headers are written.
  // Docusaurus content-hashes every file under /assets/.
  const pathname = (req.url || '/').split('?')[0];
  const writeHead = res.writeHead;
  res.writeHead = function (statusCode, ...rest) {
    if (!res.hasHeader('Cache-Control')) {
      const cacheable = statusCode === 200 || statusCode === 206 || statusCode === 304;
      res.setHeader('Cache-Control', cacheable && pathname.startsWith('/assets/') ? HASHED_ASSET_CACHE : REVALIDATE_CACHE);
    }
    return writeHead.call(this, statusCode, ...rest);
  };

  serveHandler(req, res, {
    public: BUILD_DIR,
    cleanUrls: true,
    directoryListing: false,
    etag: true,
  }).catch((err) => {
    log(`error serving ${pathname}: ${err && err.stack ? err.stack : err}`);
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
  log(`serving ${BUILD_DIR} on http://${HOST}:${PORT} (${scriptHashes.length} inline script hash(es) in CSP)`);
});

function shutdown(signal) {
  log(`received ${signal}, closing`);
  server.close(() => process.exit(0));
  server.closeIdleConnections();
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
