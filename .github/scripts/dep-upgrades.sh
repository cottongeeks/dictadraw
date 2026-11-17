#!/usr/bin/env bash
# Usage: NCU_TARGET=minor|latest dep-upgrades.sh
#
# Bumps package.json with npm-check-updates (policy in ncurc.cjs) and updates
# pnpm-lock.yaml. With NCU_TARGET=latest it changes nothing unless some
# dependency has a new major, so the majors PR only exists when there are
# majors to review.
#
# Outputs written to $GITHUB_OUTPUT: has_updates ("true"/"false") and body
# (PR markdown, only when has_updates=true).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NCU=(npm-check-updates --configFilePath "$SCRIPT_DIR" --configFileName ncurc.cjs)

UPGRADES=$("${NCU[@]}" --jsonUpgraded)
if [ "$NCU_TARGET" = "latest" ] && [ "$UPGRADES" = "$(NCU_TARGET=minor "${NCU[@]}" --jsonUpgraded)" ]; then
  UPGRADES='{}'
fi

if [ "$UPGRADES" = '{}' ]; then
  echo "has_updates=false" >>"$GITHUB_OUTPUT"
  echo "No dependency updates available."
  exit 0
fi

REPORT=$("${NCU[@]}" | grep -vE '^(Using |Checking |Run ncu )' | sed '/^[[:space:]]*$/d')
"${NCU[@]}" -u
pnpm install --no-frozen-lockfile

echo "has_updates=true" >>"$GITHUB_OUTPUT"

EOF_MARKER=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
{
  echo "body<<$EOF_MARKER"
  echo "## Dependency Upgrades"
  echo ""
  if [ "$NCU_TARGET" = "latest" ]; then
    echo "Weekly npm upgrades including new major versions. This PR is not"
    echo "merged automatically. Review the changelogs before merging."
  else
    echo "Weekly npm upgrades within current major versions. This PR merges"
    echo "automatically once CI passes."
  fi
  echo ""
  echo '```'
  echo "$REPORT"
  echo '```'
  echo ""
  echo "CI re-renders every artwork. If an upgrade changes a render, CI fails:"
  echo "re-render on this branch and commit the output if the change is fine."
  echo "$EOF_MARKER"
} >>"$GITHUB_OUTPUT"
