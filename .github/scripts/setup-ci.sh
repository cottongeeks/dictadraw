#!/usr/bin/env bash
set -euo pipefail

profile="$RUNNER_TEMP/nix-tools"
nix build .#ci --out-link "$profile"
export PATH="$profile/bin:$PATH"
printf '%s\n' "$profile/bin" >>"$GITHUB_PATH"

node --version
pnpm --version
