#!/usr/bin/env bash
# Assemble Connector OS core's hermetic /v1 reference server from the four core packs
# (Interface, Runtime Supplement, Runtime Closure, Data Files) — read-only copies of core
# at one HEAD. Packs are verified (SHA256SUMS), must agree on CORE_HEAD, and may only ADD
# files: an existing path is never overwritten. Nothing in core is modified.
#
#   bash scripts/assemble-core.sh <pack1.zip> <pack2.zip> <pack3.zip> <pack4.zip>   # -> .core/tree
#   npm run core:api   # node .core/tree/devex/api-server/bin/serve.mjs --port 4020
set -euo pipefail
OUT=${COS_CORE_OUT:-.core}
rm -rf "$OUT" && mkdir -p "$OUT/packs" "$OUT/tree"
head=""
for zip in "$@"; do
  unzip -q -o "$zip" -d "$OUT/packs"
done
for dir in "$OUT"/packs/*/; do
  (cd "$dir" && sha256sum --quiet -c SHA256SUMS*.txt) || { echo "checksum mismatch in $dir" >&2; exit 1; }
  h=$(cat "$dir/CORE_HEAD.txt" 2>/dev/null || sed -n 's/^HEAD: //p' "$dir"/README*.txt)
  [ -z "$head" ] && head=$h
  [ "$h" = "$head" ] || { echo "CORE_HEAD mismatch: $dir has $h, expected $head" >&2; exit 1; }
  src="$dir"; [ -d "$dir/core" ] && src="$dir/core"
  # pack metadata (checksums, README, CORE_HEAD, file lists) sits only at the pack root
  (cd "$src" && find . -type f) | grep -Ev '^\./(SHA256SUMS[^/]*|README[^/]*|CORE_[^/]*|FILES_INCLUDED\.txt|KEY_INTERFACE_FILES\.txt)$' | while read -r f; do
    if [ -e "$OUT/tree/$f" ]; then cmp -s "$src/$f" "$OUT/tree/$f" || { echo "CONFLICT: $f differs between packs" >&2; exit 1; }
    else mkdir -p "$(dirname "$OUT/tree/$f")" && cp "$src/$f" "$OUT/tree/$f"; fi
  done
done
echo "$head" > "$OUT/CORE_HEAD"
(cd "$OUT/tree/devex" && npm ci --ignore-scripts --no-audit --no-fund --silent)
node scripts/core-import-closure.mjs "$OUT/tree" devex/api-server/bin/serve.mjs | tail -1
echo "core tree at $OUT/tree (HEAD $head)"
