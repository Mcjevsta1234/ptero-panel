#!/bin/bash

set -e

###############################################################
# Pterodactyl Dedicated Server Management Feature Installer
# Version: 1.0.0
# Branch: experimental
###############################################################

# Output colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
fi

# Detect panel directory
if [ -d "/var/www/pterodactyl" ]; then
    PANEL_DIR="/var/www/pterodactyl"
elif [ -d "/var/www/panel" ]; then
    PANEL_DIR="/var/www/panel"
else
    read -p "Enter your panel directory path: " PANEL_DIR
    if [ ! -d "$PANEL_DIR" ]; then
        print_error "Panel directory not found: $PANEL_DIR"
    fi
fi

print_step "Installing Dedicated Server Management Feature"
echo "Panel Directory: $PANEL_DIR"
echo ""

# Backup database
print_step "Creating database backup"
cd "$PANEL_DIR"

if command -v mysqldump &> /dev/null; then
    DB_HOST=$(grep DB_HOST .env | cut -d '=' -f2 | tr -d '\r')
    DB_PORT=$(grep DB_PORT .env | cut -d '=' -f2 | tr -d '\r')
    DB_DATABASE=$(grep DB_DATABASE .env | cut -d '=' -f2 | tr -d '\r')
    DB_USERNAME=$(grep DB_USERNAME .env | cut -d '=' -f2 | tr -d '\r')
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2 | tr -d '\r')
    
    BACKUP_FILE="backup_before_dedicated_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create backups directory if it doesn't exist
    mkdir -p /var/backups
    
    # Use environment variable for password to avoid command line exposure
    export MYSQL_PWD="$DB_PASSWORD"
    
    if mysqldump -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USERNAME" "$DB_DATABASE" > "/var/backups/$BACKUP_FILE" 2>&1; then
        unset MYSQL_PWD
        print_success "Database backup created: /var/backups/$BACKUP_FILE"
    else
        unset MYSQL_PWD
        print_warning "Could not create automatic backup. Continue anyway? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled"
        fi
    fi
else
    print_warning "mysqldump not found. Skipping automatic backup."
fi

# Put panel in maintenance mode
print_step "Enabling maintenance mode"
php artisan down || print_warning "Could not enable maintenance mode"

# Pull latest changes from experimental branch
print_step "Pulling latest changes from experimental branch"
if [ -d ".git" ]; then
    git fetch origin experimental
    git checkout experimental
    git pull origin experimental
    print_success "Code updated from experimental branch"
else
    print_error "Not a git repository. Please ensure you're using git to manage your panel."
fi

# Install/update composer dependencies
print_step "Installing composer dependencies"
if command -v composer &> /dev/null; then
    COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
    print_success "Composer dependencies installed"
else
    print_error "Composer not found. Please install composer first."
fi

# Run database migrations
print_step "Running database migrations"
php artisan migrate --force || print_error "Migration failed"
print_success "Database migrations completed"

# Clear caches
print_step "Clearing application caches"
php artisan view:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
print_success "Caches cleared"

# Rebuild cache
print_step "Rebuilding application cache"
php artisan config:cache
php artisan route:cache
php artisan view:cache
print_success "Cache rebuilt"

# Set correct permissions
print_step "Setting file permissions"
chmod -R 755 storage/* bootstrap/cache/
chown -R www-data:www-data "$PANEL_DIR"/*
print_success "Permissions updated"

# Install npm dependencies and build assets (if needed)
print_step "Building frontend assets"
if [ -f "package.json" ]; then
    if command -v yarn &> /dev/null; then
        yarn install
        yarn build:production
        print_success "Frontend assets built with yarn"
    elif command -v npm &> /dev/null; then
        npm install
        npm run build
        print_success "Frontend assets built with npm"
    else
        print_warning "Neither yarn nor npm found. Skipping asset build."
    fi
else
    print_warning "package.json not found. Skipping asset build."
fi

# Restart queue workers
print_step "Restarting queue workers"
php artisan queue:restart
print_success "Queue workers restarted"

# Take panel out of maintenance mode
print_step "Disabling maintenance mode"
php artisan up
print_success "Panel is now live"

# Display success message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║   Dedicated Server Management Feature Installed! ✓        ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
print_success "Installation completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Visit /admin/dedicated to create user allocations"
echo "  2. Users can access /dedicated to create their own servers"
echo ""
echo "Database backup location: /var/backups/$BACKUP_FILE"
echo ""
print_warning "If you encounter any issues, you can restore from the backup"
echo ""
