#!/usr/bin/env bash
set -euo pipefail

# WitchyWorlds Addons Installer
# - Resets existing panel assets (removes Arix theme wiring)
# - Installs WitchyWorlds theme and all addons from ./addons
# - Registers routes and rebuilds assets

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

# 1) Maintenance mode
info "Entering maintenance mode"
php artisan down || true

# 2) Backup current public assets
info "Backing up current public assets"
mkdir -p backups
TS="$(date +%Y%m%d-%H%M%S)"
zip -qr "backups/public-assets-$TS.zip" public resources || warn "Failed to zip, continuing"

# 3) Remove old theme overrides if present
info "Removing old Arix theme overrides (if any)"
rm -rf public/themes/arix || true
rm -rf resources/scripts/arix || true

# 4) Install addons
if [[ -d addons ]]; then
  info "Installing addons from ./addons"
  # Copy all addon component trees into expected locations
  rsync -a addons/components/ resources/scripts/components/ || true
  rsync -a addons/api/ resources/scripts/api/ || true
  rsync -a addons/styles/ resources/styles/ || true
  rsync -a addons/views/ resources/views/ || true
  rsync -a addons/routes/ resources/scripts/routers/extra/ || true
else
  warn "No addons directory found; skipping copy"
fi

# 5) Composer deps
info "Installing composer dependencies"
composer install --no-interaction --prefer-dist --no-dev || composer install --no-interaction --prefer-dist

# 6) Node deps
info "Installing node dependencies"
yarn install --frozen-lockfile || yarn install

# 7) Clear caches
info "Clearing Laravel caches"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan optimize:clear

# 8) Build assets
info "Building production assets"
yarn build:production

# 9) Database migrations (if addons shipped migrations)
if ls database/migrations/*_addons_*.php 1> /dev/null 2>&1; then
  info "Running addon migrations"
  php artisan migrate --force
fi

# 10) Exit maintenance mode
info "Exiting maintenance mode"
php artisan up || true

info "All done. Addons installed and assets rebuilt."