#!/bin/bash
# Runs `npm run verify` on the commit HEAD of this repository, in a clean
# Node.js 22 container, in a fresh checkout made inside the container. Nothing
# is installed on the host, and files in the working folder that are not in the
# commit (untracked, ignored or modified) take no part in the build or in its
# verification. Commit first.
#
# The commit is handed to the container as a git bundle, so this also works
# when the repository's .git entry is a file that points outside the folder
# (a submodule or a linked worktree).
set -euo pipefail
cd "$(dirname "$0")/.."
commit="$(git rev-parse HEAD)"
if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  echo "Note: the working folder has changes that are not committed; they are not checked."
fi
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git bundle create --quiet "$tmp/source.bundle" HEAD
echo "Checking commit $commit"
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp/home -e COMMIT="$commit" \
  -v "$tmp/source.bundle":/source.bundle:ro -w /tmp node:22 \
  bash -c 'set -euo pipefail
    mkdir -p "$HOME" /tmp/checkout
    cd /tmp/checkout
    git init --quiet
    git fetch --quiet /source.bundle HEAD
    git checkout --quiet --detach "$COMMIT"
    npm ci --include=dev --no-fund --no-audit
    npm run verify'
