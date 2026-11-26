#!/bin/bash
# Runs the node's own commands in a clean clone of the committed HEAD of this
# repository, and checks the result: a plain `npm install` that installs
# exactly the production tree of the lock file, `npm run build` (which must not
# build), and `npm start` with the smoke checks against that process. CI and
# `npm run verify` both run it.
set -euo pipefail

SOURCE="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
NODE="$WORK/node"
pids=()
cleanup() {
  for pid in "${pids[@]}"; do kill -TERM -- "-$pid" 2>/dev/null || true; done
  rm -rf "$WORK"
}
trap cleanup EXIT

git clone --quiet --no-hardlinks "$SOURCE" "$NODE"
cd "$NODE"

# The committed build, not one made in the working folder, is what the node gets.
npm install --no-fund --no-audit
node scripts/check-installed.mjs
npm run build | tee build.log
grep -q 'nothing to build' build.log
test ! -e .docusaurus

# Starts `npm start` in its own process group, with both id variables unset and
# then the variables given as arguments. Waits until the server's own log says
# it is listening and the home page answers. Sets START_PID.
start_server() {
  local port="$1" log="$2"
  shift 2
  setsid env -u R1EN_HOST_ID -u EE_HOST_ID env "$@" PORT="$port" npm start > "$log" 2>&1 &
  START_PID=$!
  pids+=("$START_PID")
  local ready=no
  for _ in $(seq 1 30); do
    if grep -q '\[server\].* serving ' "$log" && curl -fsS -o /dev/null "http://127.0.0.1:$port/"; then
      ready=yes
      break
    fi
    sleep 1
  done
  if [ "$ready" != yes ]; then
    echo "the server did not become ready"; cat "$log"; return 1
  fi
}

# Stops the whole process tree (npm, supervisor, server) and checks that the
# port no longer answers.
stop_server() {
  local pid="$1" port="$2"
  kill -TERM -- "-$pid"
  wait "$pid" || true
  for _ in $(seq 1 20); do
    curl -s -o /dev/null "http://127.0.0.1:$port/" || return 0
    sleep 0.5
  done
  echo "Port $port is still serving"
  return 1
}

start_server 3000 server.log R1EN_HOST_ID=ci-node-01
curl -fsS -D headers.txt -o /dev/null http://127.0.0.1:3000/
for h in content-security-policy strict-transport-security x-content-type-options x-frame-options; do
  grep -qi "^$h:" headers.txt || { echo "missing header: $h"; exit 1; }
done
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/no-such-page)" = 404
# Paths with a `..` segment are rejected, also when percent-encoded, and only
# real content-hashed files are cached as immutable.
test "$(curl -s -o /dev/null -w '%{http_code}' --path-as-is 'http://127.0.0.1:3000/assets/%2e%2e/search-index.json')" = 400
curl -fsS -D index-headers.txt -o /dev/null 'http://127.0.0.1:3000/%73earch-index.json'
grep -qi '^cache-control: no-cache' index-headers.txt
redirect="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' \
  -H 'Host: edge-guardian.eu' -H 'CF-Visitor: {"scheme":"http"}' http://127.0.0.1:3000/docs/about/)"
test "$redirect" = "301 https://edge-guardian.eu/docs/about/"
# Hosts outside CANONICAL_HOSTS are served without a redirect.
test "$(curl -s -o /dev/null -w '%{http_code}' \
  -H 'Host: other.example' -H 'CF-Visitor: {"scheme":"http"}' http://127.0.0.1:3000/docs/about/)" = 200
# The node line is served at run time: JSON, same origin, never cached, and the
# policy allows no origin other than the site's own.
curl -fsS -D line-headers.txt -o line.json http://127.0.0.1:3000/node-line.json
grep -qi '^content-type: application/json' line-headers.txt
grep -qi '^cache-control: no-store' line-headers.txt
grep -qi "^content-security-policy:.*connect-src 'self';" line-headers.txt
test "$(cat line.json)" = '{"running_on":"Running on Ratio1 low-resource edge-node ci-node-01"}'
stop_server "$START_PID" 3000

# The node line for each kind of environment, each in a fresh server.
check_line() {
  local expected="$1"; shift
  start_server 3001 server-line.log "$@"
  local answer
  answer="$(curl -fsS http://127.0.0.1:3001/node-line.json)"
  stop_server "$START_PID" 3001
  if [ "$answer" != "$expected" ]; then
    echo "expected $expected, got $answer"; return 1
  fi
}
check_line '{"running_on":null}' CASE=none
check_line '{"running_on":null}' R1EN_HOST_ID='bad id'
check_line '{"running_on":"Running on Ratio1 low-resource edge-node old-name"}' EE_HOST_ID=old-name
check_line '{"running_on":"Running on Ratio1 low-resource edge-node new-name"}' R1EN_HOST_ID=new-name EE_HOST_ID=old-name

# The server must not leak file descriptors.
node scripts/check-fd-leak.mjs
echo "The node checks passed."
