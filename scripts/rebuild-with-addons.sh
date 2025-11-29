#!/usr/bin/env bash
set -euo pipefail

# Rebuild panel from scratch keeping .env, storage, and database
# Then install ainx and all addons per READMEs.

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "[INFO] Running without root; some steps may require sudo." >&2
fi

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

# Confirm
echo "This will reset the panel repository except .env and storage."
read -p "Type 'RESET' to continue: " CONFIRM
[[ "$CONFIRM" == "RESET" ]] || { err "Confirmation failed"; exit 1; }

# Maintenance mode
info "Entering maintenance mode"
php artisan down || true

# Preserve critical files
info "Preserving .env and storage/uploads"
mkdir -p ../panel-backup
cp -f .env ../panel-backup/.env
rsync -a storage/ ../panel-backup/storage/ || true

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
cp -f ../panel-backup/.env .env || true
rsync -a ../panel-backup/storage/ storage/ || true

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
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

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
php artisan migrate --path=database/migrations-versionchanger --force || true
php artisan migrate --path=database/migrations-serversplitter --force || true
php artisan migrate --path=database/migrations-serverimporter --force || true

# Install Modpack Manager (file patches, upload copy, egg import)
info "Installing Modpack Manager"
bash scripts/install-modpack-manager.sh || { err "Failed to install Modpack Manager"; exit 1; }

# Build assets once after installing all addons
info "Building production assets"
yarn build:production

# Up
info "Exiting maintenance mode"
php artisan up || true

info "Rebuild complete with addons installed."