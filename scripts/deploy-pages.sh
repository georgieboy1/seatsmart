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

# Build a commit whose tree is exactly out/, using a throwaway index so the
# working tree and the real index are never touched.
INDEX="$(mktemp)"
trap 'rm -f "$INDEX"' EXIT
rm -f "$INDEX"
GIT_INDEX_FILE="$INDEX" git --work-tree=out add -A .
TREE="$(GIT_INDEX_FILE="$INDEX" git --work-tree=out write-tree)"

PARENT_ARGS=()
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch -q origin gh-pages
  PARENT="$(git rev-parse FETCH_HEAD)"
  if [[ "$(git rev-parse "${PARENT}^{tree}")" == "$TREE" ]]; then
    echo "Nothing changed since the last deploy."
    exit 0
  fi
  PARENT_ARGS=(-p "$PARENT")
fi

COMMIT="$(git commit-tree "$TREE" ${PARENT_ARGS[@]+"${PARENT_ARGS[@]}"} -m "Deploy SynDesk from ${SOURCE_SHA}")"
git push -q origin "${COMMIT}:refs/heads/gh-pages"
echo "Deployed ${SOURCE_SHA} to gh-pages (${COMMIT:0:7})."
