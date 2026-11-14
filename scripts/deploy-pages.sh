#!/usr/bin/env bash
# Build SynDesk and publish the static site to the gh-pages branch, which
# GitHub Pages serves at https://syndesk.futureoftheisles.org.
#
# Usage: npm run deploy   (from a clean main branch)
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or stash your changes first; deploys are built from what's committed." >&2
  exit 1
fi

npm run lint
npm test
npm run build

test -f out/CNAME || { echo "out/CNAME missing (public/CNAME sets the custom domain)" >&2; exit 1; }
test -f out/.nojekyll || { echo "out/.nojekyll missing (Pages would hide _next/)" >&2; exit 1; }

SOURCE_SHA="$(git rev-parse --short HEAD)"
TMP="$(mktemp -d)"
trap 'git worktree remove --force "$TMP" >/dev/null 2>&1 || true' EXIT

if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch -q origin gh-pages
  git worktree add -q "$TMP" origin/gh-pages --detach
else
  git worktree add -q --detach "$TMP"
  git -C "$TMP" checkout -q --orphan gh-pages-new
fi

git -C "$TMP" rm -rq --ignore-unmatch . >/dev/null
cp -R out/. "$TMP"/
git -C "$TMP" add -A
if git -C "$TMP" diff --cached --quiet; then
  echo "Nothing changed since the last deploy."
  exit 0
fi
git -C "$TMP" commit -q -m "Deploy SynDesk from ${SOURCE_SHA}"
git -C "$TMP" push -q origin HEAD:refs/heads/gh-pages
echo "Deployed ${SOURCE_SHA} to gh-pages."
