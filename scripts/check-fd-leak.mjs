// Checks the production server for file-descriptor leaks (Linux only).
//
// Starts the server (scripts/server.mjs, or the script given as the first
// argument) on a free local port and then:
//   1. sends repeated conditional requests (If-None-Match and
//      If-Modified-Since, using the validators the server itself returns) to
//      HTML pages, the search index, a hashed asset and the 404 page;
//   2. starts downloads of the largest files and aborts them, either as soon
//      as the request is sent or part-way through the response.
// After each phase it counts the server process's open file descriptors in
// /proc/<pid>/fd and exits with status 1 if the count has grown by more than
// a small tolerance. Needs a built site in build/ (`npm run build`).
//
// Usage: node scripts/check-fd-leak.mjs [server-script] [requests]
//   requests: number of conditional requests in phase 1 (default 600).

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(process.argv[2] || path.join(HERE, 'server.mjs'));
const BUILD_DIR = path.resolve(path.dirname(SERVER), '..', 'build');
const REQUESTS = Number(process.argv[3] || 600);
const ABORTS = 100;
const CONCURRENCY = 8;
const TOLERANCE = 4;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const {port} = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// One GET request. With `abort: 'mid'` the response body is never read and
// the connection is destroyed shortly after the response starts; with
// `abort: 'early'` it is destroyed as soon as the request has been sent.
function get(port, urlPath, {headers = {}, agent = false, abort} = {}) {
  return new Promise((resolve, reject) => {
    let status = 0;
    const req = http.get({host: '127.0.0.1', port, path: urlPath, headers, agent}, (res) => {
      status = res.statusCode;
      if (abort) {
        res.pause();
        if (abort === 'mid') setTimeout(() => req.destroy(), 20);
        return;
      }
      res.resume();
      res.on('end', () => resolve({status, headers: res.headers}));
      res.on('error', reject);
    });
    if (abort) {
      if (abort === 'early') req.on('finish', () => setImmediate(() => req.destroy()));
      req.on('error', () => {});
      req.on('close', () => resolve({status, headers: {}}));
    } else {
      req.on('error', reject);
    }
  });
}

async function pool(tasks, size) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  };
  await Promise.all(Array.from({length: size}, worker));
  return results;
}

function fdCount(pid) {
  return fs.readdirSync(`/proc/${pid}/fd`).length;
}

// Waits until the descriptor count has been the same for three readings in a
// row, so that sockets closed by the client are no longer counted.
async function settledFdCount(pid) {
  let last = -1;
  let same = 0;
  for (let i = 0; i < 50 && same < 3; i++) {
    await sleep(100);
    const now = fdCount(pid);
    same = now === last ? same + 1 : 0;
    last = now;
  }
  return last;
}

function largestAssets(count) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push({file: full, size: fs.statSync(full).size});
    }
  };
  walk(path.join(BUILD_DIR, 'assets'));
  return files
    .sort((a, b) => b.size - a.size)
    .slice(0, count)
    .map(({file, size}) => ({urlPath: '/' + path.relative(BUILD_DIR, file).split(path.sep).join('/'), size}));
}

function tally(results) {
  const counts = {};
  for (const {status} of results) counts[status] = (counts[status] || 0) + 1;
  return JSON.stringify(counts);
}

async function main() {
  if (!fs.existsSync(path.join(BUILD_DIR, 'index.html'))) {
    console.error(`no built site in ${BUILD_DIR}; run "npm run build" first`);
    return 2;
  }
  const port = await freePort();
  const child = spawn(process.execPath, [SERVER], {
    env: {...process.env, HOST: '127.0.0.1', PORT: String(port)},
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  let exited = false;
  child.on('exit', () => (exited = true));

  try {
    for (let i = 0; ; i++) {
      if (exited || i === 300) throw new Error('server did not start');
      const ok = await get(port, '/').then((r) => r.status === 200, () => false);
      if (ok) break;
      await sleep(100);
    }
    if (!fs.existsSync(`/proc/${child.pid}/fd`)) {
      console.error('cannot read /proc/<pid>/fd; this check needs Linux');
      return 2;
    }
    console.log(`server ${path.relative(process.cwd(), SERVER) || SERVER} (pid ${child.pid}) on http://127.0.0.1:${port}`);

    const [largest] = largestAssets(1);
    const paths = ['/', '/docs/about/', '/search-index.json', largest.urlPath, '/no/such/page'];
    const kinds = [];
    for (const urlPath of paths) {
      const {headers} = await get(port, urlPath);
      kinds.push({urlPath, name: 'If-None-Match', headers: {'If-None-Match': headers.etag || '"fd-check"'}});
      kinds.push({
        urlPath,
        name: 'If-Modified-Since',
        headers: {'If-Modified-Since': headers['last-modified'] || new Date().toUTCString()},
      });
    }
    const agent = new http.Agent({keepAlive: true, maxSockets: CONCURRENCY});
    const run = (count) =>
      pool(
        Array.from({length: count}, (_, i) => {
          const kind = kinds[i % kinds.length];
          return () => get(port, kind.urlPath, {headers: kind.headers, agent}).then((r) => ({...r, kind: kind.name}));
        }),
        CONCURRENCY,
      );

    // Warm-up, then the baseline.
    await run(kinds.length);
    agent.destroy();
    const baseline = await settledFdCount(child.pid);
    console.log(`baseline open fds: ${baseline}`);

    // Phase 1: conditional requests.
    const results = await run(REQUESTS);
    agent.destroy();
    for (const name of ['If-None-Match', 'If-Modified-Since']) {
      const subset = results.filter((r) => r.kind === name);
      console.log(`  ${subset.length} x ${name}: statuses ${tally(subset)}`);
    }
    const afterConditional = await settledFdCount(child.pid);
    console.log(`open fds after ${REQUESTS} conditional requests: ${afterConditional} (${afterConditional - baseline >= 0 ? '+' : ''}${afterConditional - baseline})`);

    // Phase 2: aborted downloads of the largest files.
    const big = largestAssets(3);
    const aborted = await pool(
      Array.from({length: ABORTS}, (_, i) => () =>
        get(port, big[i % big.length].urlPath, {abort: i % 2 ? 'early' : 'mid'}),
      ),
      CONCURRENCY,
    );
    const afterAborts = await settledFdCount(child.pid);
    console.log(`  ${ABORTS} aborted downloads of ${big.map((b) => `${b.urlPath} (${b.size} bytes)`).join(', ')}: statuses ${tally(aborted)}`);
    console.log(`open fds after aborted downloads: ${afterAborts} (${afterAborts - baseline >= 0 ? '+' : ''}${afterAborts - baseline})`);

    const growth = Math.max(afterConditional, afterAborts) - baseline;
    if (growth > TOLERANCE) {
      console.log(`FAIL: open file descriptors grew by ${growth} (tolerance ${TOLERANCE})`);
      return 1;
    }
    console.log(`PASS: open file descriptors stayed flat (growth ${growth}, tolerance ${TOLERANCE})`);
    return 0;
  } catch (err) {
    console.error(`error: ${err.message}`);
    if (output) console.error(output);
    return 2;
  } finally {
    if (!exited) child.kill('SIGTERM');
  }
}

process.exitCode = await main();
