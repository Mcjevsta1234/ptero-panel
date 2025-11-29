#!/usr/bin/env bash
set -euo pipefail

# Simple panel rebuild - clone fresh experimental branch with WitchyWorlds theme
# Preserves .env and storage only

START_DIR="$(pwd)"

# Detect panel root
if [[ -f "$START_DIR/artisan" ]]; then
  ROOT_DIR="$START_DIR"
else
  CANDIDATES=("/var/www/pterodactyl" "/srv/pterodactyl" "$START_DIR/pterodactyl")
  ROOT_DIR=""
  for d in "${CANDIDATES[@]}"; do
    [[ -f "$d/artisan" ]] && ROOT_DIR="$d" && break || true
  done
  if [[ -z "$ROOT_DIR" ]]; then
    echo "[ERR] Could not locate panel root (artisan not found). Run this from /var/www/pterodactyl" >&2
    exit 1
  fi
fi
cd "$ROOT_DIR"

info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

# Confirm
echo "This will reset the panel to fresh experimental branch (WitchyWorlds theme)."
echo ".env and storage will be preserved. All other changes will be lost."
read -p "Type 'RESET' to continue: " CONFIRM
[[ "$CONFIRM" == "RESET" ]] || { err "Cancelled"; exit 1; }

# Maintenance mode
info "Entering maintenance mode"
php artisan down || true

# Backup .env and storage
info "Backing up .env and storage"
mkdir -p ../panel-backup
[[ -f .env ]] && cp -f .env ../panel-backup/.env
[[ -d storage ]] && rsync -a storage/ ../panel-backup/storage/

# Clone fresh repo
info "Cloning fresh experimental branch"
TMP_DIR="../panel-fresh-$(date +%s)"
REMOTE_URL="${PANEL_REMOTE_URL:-https://github.com/Mcjevsta1234/ptero-panel.git}"

if ! git clone --branch experimental --depth 1 "$REMOTE_URL" "$TMP_DIR"; then
  err "Failed to clone repository"
  exit 1
fi

# Replace working tree
info "Replacing panel files with fresh clone"
find . -maxdepth 1 -mindepth 1 ! -name .git ! -name .env -exec rm -rf {} +
rsync -a "$TMP_DIR/" ./ --exclude .git
rm -rf "$TMP_DIR"

# Restore .env and storage
info "Restoring .env and storage"
[[ -f ../panel-backup/.env ]] && cp -f ../panel-backup/.env .env
[[ -d ../panel-backup/storage ]] && rsync -a ../panel-backup/storage/ storage/

# Install dependencies
info "Installing Composer dependencies"
composer install --no-interaction --prefer-dist --no-dev || composer install --no-interaction --prefer-dist

info "Installing Yarn dependencies"
yarn install --frozen-lockfile || yarn install

# Clear caches
info "Clearing caches"
php artisan cache:clear || true
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Build assets
info "Building production assets"
yarn build:production

# Exit maintenance
info "Exiting maintenance mode"
php artisan up || true

info "Panel reset complete! Fresh experimental branch with WitchyWorlds theme installed."
info "You can now manually install addons as needed."
