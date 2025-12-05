#!/usr/bin/env bash
set -euo pipefail
SCRIPT_URL="https://raw.githubusercontent.com/Mcjevsta1234/ptero-panel/experimental/scripts/rebuild-with-addons.sh"
LOCAL_SCRIPT="rebuild-with-addons.sh"

echo "[INFO] Downloading rebuild script to local file ($LOCAL_SCRIPT)" >&2
curl -fsSL "$SCRIPT_URL" -o "$LOCAL_SCRIPT"
chmod +x "$LOCAL_SCRIPT"

echo "[INFO] Running rebuild script from local file (avoids process substitution truncation)" >&2
exec bash "$LOCAL_SCRIPT" "$@"
