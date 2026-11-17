#!/usr/bin/env bash
# Renders every scene and variation under artworks/, then fails if any
# committed file in output/ changed. Renders are deterministic, so a diff means
# a code or dependency change altered an approved artwork: re-render it and
# commit the new output if the change is intended.

set -euo pipefail

for scene in artworks/*/*.ts; do
  dir=$(basename "$(dirname "$scene")")
  file=$(basename "$scene" .ts)
  name=$dir
  [ "$file" != scene ] && name="$dir/$file"
  echo "::group::$name"
  pnpm art:render "$name"
  echo "::endgroup::"
done

if ! git diff --quiet -- output; then
  echo "::error::Rendered output differs from the committed output:"
  git diff --stat -- output
  exit 1
fi
