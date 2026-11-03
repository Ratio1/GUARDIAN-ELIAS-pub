// Keeps the production server running: starts scripts/server.mjs as a child
// process and, whenever it exits for any reason (crash, port already in use,
// missing build, killed), logs the exit and starts it again after a short
// backoff (1 s doubling to 10 s; reset after 60 s of healthy uptime).
// This process only exits when it receives SIGTERM or SIGINT itself.

import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'server.mjs');
const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;
const STABLE_AFTER_MS = 60000;
const SIGNAL_EXIT_CODES = {SIGINT: 130, SIGTERM: 143};

let child = null;
let delay = MIN_DELAY_MS;
let restartTimer = null;
let stopping = null;

function log(message) {
  console.log(`[supervisor] ${new Date().toISOString()} ${message}`);
}

function start() {
  restartTimer = null;
  const startedAt = Date.now();
  let settled = false;
  child = spawn(process.execPath, [SERVER], {stdio: 'inherit', env: process.env});
  log(`started server (pid ${child.pid})`);

  const onEnd = (description) => {
    if (settled) return;
    settled = true;
    child = null;
    if (stopping) {
      log(`server ${description}; supervisor exiting after ${stopping}`);
      process.exit(SIGNAL_EXIT_CODES[stopping] ?? 1);
    }
    if (Date.now() - startedAt >= STABLE_AFTER_MS) delay = MIN_DELAY_MS;
    log(`server ${description}; restarting in ${delay / 1000}s`);
    restartTimer = setTimeout(start, delay);
    delay = Math.min(delay * 2, MAX_DELAY_MS);
  };

  child.on('exit', (code, signal) => onEnd(signal ? `killed by ${signal}` : `exited with code ${code}`));
  child.on('error', (err) => onEnd(`failed to start (${err.message})`));
}

function stop(signal) {
  if (stopping) return;
  stopping = signal;
  log(`received ${signal}, stopping server`);
  if (restartTimer) clearTimeout(restartTimer);
  if (!child) process.exit(SIGNAL_EXIT_CODES[signal]);
  child.kill('SIGTERM');
  setTimeout(() => {
    if (child) child.kill('SIGKILL');
  }, 10000).unref();
}

process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
process.on('uncaughtException', (err) => log(`unexpected error: ${err && err.stack ? err.stack : err}`));

start();
