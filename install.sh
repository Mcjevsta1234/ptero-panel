#!/bin/bash

set -e

###########################################################
# WitchyWorlds Panel Installation Script
# Based on Reviactyl Panel (Pterodactyl Fork)
###########################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Check if Pterodactyl is already installed
if [ ! -f "/var/www/pterodactyl/artisan" ]; then
    print_error "Pterodactyl Panel must be installed first!"
    print_info "Install Pterodactyl Panel from: https://pterodactyl.io/panel/1.0/getting_started.html"
    exit 1
fi

print_info "Starting WitchyWorlds Panel installation..."
echo ""

# Navigate to panel directory
cd /var/www/pterodactyl || exit 1

# Backup current installation
print_info "Creating backup of current installation..."
if [ -d "/var/www/pterodactyl_backup" ]; then
    rm -rf /var/www/pterodactyl_backup
fi
cp -r /var/www/pterodactyl /var/www/pterodactyl_backup
print_success "Backup created at /var/www/pterodactyl_backup"

# Download WitchyWorlds Panel
print_info "Downloading WitchyWorlds Panel files..."
curl -L https://github.com/Mcjevsta1234/ptero-panel/archive/refs/heads/develop.tar.gz | tar -xzv
cp -rf ptero-panel-develop/* .
rm -rf ptero-panel-develop
print_success "Files downloaded successfully"

# Set permissions
print_info "Setting permissions..."
chmod -R 755 storage/* bootstrap/cache/

# Install composer dependencies
print_info "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

# Clear cache
print_info "Clearing application cache..."
php artisan view:clear
php artisan config:clear
php artisan route:clear

# Run database migrations
print_info "Running database migrations..."
php artisan migrate --force --seed

# Set final permissions
print_info "Setting final permissions..."
chown -R www-data:www-data /var/www/pterodactyl/*

# Build frontend assets
print_info "Building frontend assets (this may take a while)..."
yarn install
yarn build:production

print_success "Installation completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Configure social links in: config/designify.php"
echo "2. Restart PHP-FPM and Nginx:"
echo "   systemctl restart php8.2-fpm"
echo "   systemctl restart nginx"
echo "3. Restart queue workers:"
echo "   systemctl restart pteroq"
echo ""
print_success "Access your panel at: https://panel.witchyworlds.top"
