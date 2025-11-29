#!/usr/bin/env bash
set -euo pipefail

START_DIR="$(pwd)"
DEBUG="${REBUILD_DEBUG:-0}"

# Rebuild panel from scratch keeping .env, storage, and database
# Then install ainx and all addons per READMEs.

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "[INFO] Running without root; some steps may require sudo." >&2
fi

# Robust panel root detection.
# 1. Use current directory if artisan exists.
# 2. If not, try common install paths.
# 3. If still not found, abort with guidance.

if [[ -f "$START_DIR/artisan" ]]; then
  ROOT_DIR="$START_DIR"
else
  CANDIDATES=("/var/www/pterodactyl" "/srv/pterodactyl" "$START_DIR/pterodactyl")
  ROOT_DIR=""
  for d in "${CANDIDATES[@]}"; do
    [[ -f "$d/artisan" ]] && ROOT_DIR="$d" && break || true
  done
  if [[ -z "$ROOT_DIR" ]]; then
    echo "[ERR ] Could not locate panel root (artisan not found). Run this from the directory containing artisan." >&2
    echo "        Current directory: $START_DIR" >&2
    echo "        Tried: ${CANDIDATES[*]}" >&2
    exit 1
  fi
fi
cd "$ROOT_DIR"

if [[ "$DEBUG" == "1" ]]; then
  echo "[DEBUG] START_DIR=$START_DIR ROOT_DIR=$ROOT_DIR PWD=$(pwd)"
  ls -1 | head -20 || true
  [[ -f artisan ]] && echo "[DEBUG] artisan found" || echo "[DEBUG] artisan missing";
  [[ -f .env ]] && echo "[DEBUG] .env present" || echo "[DEBUG] .env missing";
fi

info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

# Confirm
echo "This will reset the panel repository except .env and storage."
read -p "Type 'RESET' to continue: " CONFIRM
[[ "$CONFIRM" == "RESET" ]] || { err "Confirmation failed"; exit 1; }

# Maintenance mode
info "Entering maintenance mode"
if [[ -f artisan ]]; then
  php artisan down || true
else
  warn "artisan not found at runtime (PWD=$(pwd)). Skipping maintenance mode."
fi

# Preserve critical files
info "Preserving .env and storage/uploads"
mkdir -p ../panel-backup
if [[ -f .env ]]; then
  cp -f .env ../panel-backup/.env
else
  warn ".env not found at $(pwd); skipping backup"
fi
if [[ -d storage ]]; then
  rsync -a storage/ ../panel-backup/storage/
else
  warn "storage/ directory not found; skipping backup"
fi

# Fresh clone into a temp directory to ensure clean state
info "Cloning fresh repository"
TMP_DIR="../panel-clean-$(date +%s)"
REMOTE_URL="$(git config --get remote.origin.url)"
if [[ -z "$REMOTE_URL" ]]; then
  err "Cannot determine remote.origin.url"
  exit 1
fi
git clone --branch experimental --depth 1 "$REMOTE_URL" "$TMP_DIR"

# Replace working tree with fresh clone (preserve .git and .env)
info "Replacing working tree with fresh clone"
find . -maxdepth 1 -mindepth 1 ! -name .git ! -name .env -exec rm -rf {} +
rsync -a "$TMP_DIR/" ./ --exclude .git
rm -rf "$TMP_DIR"

# Restore .env and storage
info "Restoring .env and storage"
if [[ -f ../panel-backup/.env ]]; then
  cp -f ../panel-backup/.env .env
else
  warn "No .env backup to restore"
fi
if [[ -d ../panel-backup/storage ]]; then
  rsync -a ../panel-backup/storage/ storage/
else
  warn "No storage backup to restore"
fi

# Dependencies
info "Installing composer dependencies"
composer install --no-interaction --prefer-dist --no-dev || composer install --no-interaction --prefer-dist

info "Installing Node.js dependencies"
yarn install --frozen-lockfile || yarn install

# Install ainx and prerequisites
info "Ensuring NodeJS 16+ and installing ainx"
# Try to install ainx globally; assumes node/npm are present
npm install -g ainx || {
  warn "Failed to install ainx globally via npm. Try running: npm install -g ainx";
}

# Prompt for CurseForge API key required by Modpack Manager and write to .env before build
if grep -q "CURSEFORGE_API_KEY" .env; then
  info "CURSEFORGE_API_KEY already present in .env"
else
  echo "Modpack Manager requires a CurseForge API key."
  read -p "Enter CURSEFORGE_API_KEY (or leave empty to skip): " CF_API
  if [[ -n "$CF_API" ]]; then
    echo "CURSEFORGE_API_KEY=\"$CF_API\"" >> .env
    info "Added CURSEFORGE_API_KEY to .env"
  else
    warn "Skipped adding CURSEFORGE_API_KEY"
  fi
fi

# Clear caches
info "Clearing Laravel caches"
if [[ -f artisan ]]; then
  php artisan cache:clear || true
  php artisan config:clear || true
  php artisan route:clear || true
  php artisan view:clear || true
  php artisan optimize:clear || true
else
  warn "artisan not available for cache clear"
fi

# Run addon installers via ainx
if [[ -d addons ]]; then
  info "Installing addons via ainx"
  pushd addons >/dev/null
  # Run custom remove scripts if present (per README)
  for script in remove-*.sh; do
    [[ -f "$script" ]] && bash "$script" || true
  done
  # Install ainx packages
  for ainx in **/*.ainx *.ainx; do
    [[ -f "$ainx" ]] || continue
    info "Installing addon: $ainx"
    ainx install "$ainx" || { err "Failed to install $ainx"; exit 1; }
  done
  popd >/dev/null
else
  warn "No addons directory found; skipping ainx installation"
fi

# Migrations: some addons require manual migrations
info "Running known addon migrations if present"
if [[ -f artisan ]]; then
  php artisan migrate --path=database/migrations-versionchanger --force || true
  php artisan migrate --path=database/migrations-serversplitter --force || true
  php artisan migrate --path=database/migrations-serverimporter --force || true
else
  warn "Skipping migrations (artisan not found)"
fi

# Install Modpack Manager (file patches, upload copy, egg import)
info "Installing Modpack Manager"
if [[ -f scripts/install-modpack-manager.sh ]]; then
  bash scripts/install-modpack-manager.sh || { err "Failed to install Modpack Manager"; exit 1; }
else
  warn "Modpack Manager installer script not found; skipping"
fi

# Build assets once after installing all addons
info "Building production assets"
yarn build:production

# Up
info "Exiting maintenance mode"
if [[ -f artisan ]]; then
  php artisan up || true
else
  warn "Skipping artisan up (artisan not found)"
fi

info "Rebuild complete with addons installed."