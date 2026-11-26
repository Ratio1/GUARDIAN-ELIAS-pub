#!/bin/bash
# Everything that must hold before a change is pushed (a push to main is
# published at once). It checks the committed state of the checkout it runs in,
# so run it in a fresh checkout of the commit: `npm run verify:docker` does
# that inside a container, with nothing installed on the host. Run directly
# it needs the development packages (`npm ci --include=dev`) and a clean tree.
#
# It type-checks, runs the tests, rebuilds the site from the committed sources
# and fails unless the result is exactly the committed build/ (no file
# changed, missing, added or ignored), checks the stamp and the manifest, and
# then runs the node's own commands (plain npm install, npm run build, npm
# start) in a clean clone with the same smoke checks as CI.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  git status --short
  echo "Commit or remove these changes first: the checks compare the build with the commit."
  exit 1
fi

npm run typecheck
npm test
npm run clear
npm run build:site

drift="$(git status --porcelain --ignored --untracked-files=all -- build)"
if [ -n "$drift" ]; then
  printf '%s\n' "$drift" | head -50
  echo "The committed build/ is not the build these sources produce."
  echo "Fix: run 'npm ci --include=dev && npm run clear && npm run build:site' and commit build/ with the sources."
  exit 1
fi

npm run check:sources
npm run check:build
if grep -rq 'Running on Ratio1' build; then
  echo "The built pages contain a node line; the server adds it at run time."
  exit 1
fi
id="$(node -e "import('./src/clientModules/nodeLineElement.mjs').then((m) => console.log(m.NODE_LINE_ELEMENT_ID))")"
# The footer paragraph in the markup of every built page (read as text).
node scripts/check-footer.mjs
grep -q "getElementById(\"$id\")" build/assets/js/main.*.js
grep -q '/node-line.json' build/assets/js/main.*.js

bash scripts/node-checks.sh
echo "All checks passed."
