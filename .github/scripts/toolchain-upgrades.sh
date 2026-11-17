#!/usr/bin/env bash
# Refreshes flake.lock, which pins Node, pnpm, and the rest of the toolchain,
# then rebuilds the CI profile with the result. Node stays on the major named in
# flake.nix (nodejs_26); moving to a new major is a manual edit.
#
# Outputs written to $GITHUB_OUTPUT: has_updates ("true"/"false") and body
# (PR markdown, only when has_updates=true).

set -euo pipefail

versions() {
  printf 'Node %s\n' "$(node --version)"
  printf 'pnpm %s\n' "$(pnpm --version)"
  printf 'npm-check-updates %s\n' "$(npm-check-updates --version)"
}

before=$(versions)

nix flake update

if git diff --quiet; then
  echo "has_updates=false" >>"$GITHUB_OUTPUT"
  echo "Toolchains are up to date."
  exit 0
fi

.github/scripts/setup-ci.sh
after=$(versions)

echo "has_updates=true" >>"$GITHUB_OUTPUT"

EOF_MARKER=$(dd if=/dev/urandom bs=15 count=1 status=none | base64)
{
  echo "body<<$EOF_MARKER"
  echo "## Toolchain Upgrades"
  echo ""
  echo "Weekly \`nix flake update\`."
  echo ""
  echo "| Tool | Before | After |"
  echo "| ---- | ------ | ----- |"
  paste -d ' ' <(echo "$before") <(echo "$after") |
    awk '{ printf "| %s | `%s` | %s |\n", $1, $2, ($2 == $4 ? "unchanged" : "`" $4 "`") }'
  echo ""
  echo "$EOF_MARKER"
} >>"$GITHUB_OUTPUT"
