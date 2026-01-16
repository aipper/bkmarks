#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT_DIR/extension"
OUT_DIR="$ROOT_DIR/dist"

if [[ ! -f "$EXT_DIR/manifest.json" ]]; then
  echo "manifest.json not found in $EXT_DIR" >&2
  exit 1
fi

VERSION="$(python3 - <<'PY'
import json
import pathlib

manifest = pathlib.Path("extension/manifest.json")
data = json.loads(manifest.read_text())
print(data.get("version", "0.0.0"))
PY
)"

mkdir -p "$OUT_DIR"
ZIP_NAME="bkmarks-extension-v${VERSION}.zip"

(
  cd "$EXT_DIR"
  zip -r -X "$OUT_DIR/$ZIP_NAME" . -x "*.DS_Store"
)

echo "Wrote $OUT_DIR/$ZIP_NAME"
