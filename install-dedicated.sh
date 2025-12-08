#!/bin/bash

set -e

###############################################################
# Pterodactyl Dedicated Server Management Feature Installer
# Version: 1.0.0
# Branch: experimental
###############################################################

# Basic option parsing (non-intrusive)
ASSUME_YES=${ASSUME_YES:-0}
AUTO_GIT=${AUTO_GIT:-0}
DEFAULT_REPO="${REPO:-https://github.com/Mcjevsta1234/ptero-panel.git}"

for arg in "$@"; do
    case "$arg" in
        -y|--yes)
            ASSUME_YES=1
            ;;
        --auto-git)
            AUTO_GIT=1
            ;;
        --repo=*)
            DEFAULT_REPO="${arg#*=}"
            ;;
    esac
done

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
    attempt_backup() {
        local host="$1" port="$2" db="$3" user="$4" pass="$5" mode="$6"
        local timestamp=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backup_before_dedicated_${timestamp}.sql"
        BACKUP_LOG="/var/backups/backup_before_dedicated_${timestamp}.log"
        mkdir -p /var/backups
        echo "[${timestamp}] Attempting ${mode} backup: host=${host} port=${port} db=${db} user=${user}" | tee -a "$BACKUP_LOG"
        
        # Create temporary MySQL config file to handle special characters in password
        local TMP_CNF=$(mktemp)
        cat > "$TMP_CNF" <<EOF
[client]
host=${host}
port=${port}
user=${user}
password=${pass}
EOF
        chmod 600 "$TMP_CNF"
        
        # Use config file to avoid shell escaping issues
        if mysql --defaults-extra-file="$TMP_CNF" -e "SELECT 1" "$db" &>> "$BACKUP_LOG"; then
            if mysqldump --defaults-extra-file="$TMP_CNF" "$db" > "/var/backups/$BACKUP_FILE" 2>> "$BACKUP_LOG"; then
                rm -f "$TMP_CNF"
                print_success "Database backup created: /var/backups/$BACKUP_FILE"
                echo "Log: $BACKUP_LOG"
                return 0
            else
                rm -f "$TMP_CNF"
                print_warning "mysqldump failed during ${mode} attempt. See $BACKUP_LOG"
                return 2
            fi
        else
            rm -f "$TMP_CNF"
            print_warning "Database connection failed during ${mode} attempt. See $BACKUP_LOG"
            return 1
        fi
    }

    # Read database credentials from .env
    if [ ! -f ".env" ]; then
        print_error ".env file not found in $PANEL_DIR"
    fi
    
    DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
    DB_PORT=$(grep "^DB_PORT=" .env | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
    DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
    DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2 | tr -d '\r' | tr -d '"' | tr -d "'")
    
    # Set defaults if empty
    DB_HOST=${DB_HOST:-127.0.0.1}
    DB_PORT=${DB_PORT:-3306}
    
    echo "Attempting automatic database backup with env credentials..."
    set +e  # Temporarily disable exit on error for backup attempt
    attempt_backup "$DB_HOST" "$DB_PORT" "$DB_DATABASE" "$DB_USERNAME" "$DB_PASSWORD" "automatic"
    AUTO_STATUS=$?
    set -e  # Re-enable exit on error
    if [ $AUTO_STATUS -ne 0 ]; then
        if [ "$ASSUME_YES" -eq 0 ]; then
            print_warning "Automatic backup failed. Would you like to enter credentials manually to retry? (y/n)"
            read -r retry_manual
        else
            retry_manual="n"
        fi
        if [[ "$retry_manual" =~ ^[Yy]$ ]]; then
            echo "Enter database connection details (leave blank to keep defaults)." 
            read -p "Host [$DB_HOST]: " MAN_HOST; MAN_HOST=${MAN_HOST:-$DB_HOST}
            read -p "Port [$DB_PORT]: " MAN_PORT; MAN_PORT=${MAN_PORT:-$DB_PORT}
            read -p "Database [$DB_DATABASE]: " MAN_DB; MAN_DB=${MAN_DB:-$DB_DATABASE}
            read -p "Username [$DB_USERNAME]: " MAN_USER; MAN_USER=${MAN_USER:-$DB_USERNAME}
            read -s -p "Password [hidden]: " MAN_PASS; echo ""
            set +e  # Temporarily disable exit on error for manual backup attempt
            attempt_backup "$MAN_HOST" "$MAN_PORT" "$MAN_DB" "$MAN_USER" "$MAN_PASS" "manual"
            MAN_STATUS=$?
            set -e  # Re-enable exit on error
            if [ $MAN_STATUS -ne 0 ]; then
                if [ "$ASSUME_YES" -eq 0 ]; then
                    print_warning "Manual backup attempt failed. Proceed WITHOUT a backup? (y/n)"
                    read -r proceed_no_backup
                else
                    proceed_no_backup="y"
                fi
                if [[ ! "$proceed_no_backup" =~ ^[Yy]$ ]]; then
                    print_error "Installation cancelled due to backup failure"
                fi
            fi
        else
            if [ "$ASSUME_YES" -eq 0 ]; then
                print_warning "Skipping manual retry. Proceed WITHOUT a backup? (y/n)"
                read -r proceed_no_backup
            else
                proceed_no_backup="y"
            fi
            if [[ ! "$proceed_no_backup" =~ ^[Yy]$ ]]; then
                print_error "Installation cancelled due to backup failure"
            fi
        fi
    fi
else
    if [ "$ASSUME_YES" -eq 0 ]; then
        print_warning "mysqldump not found. Continue without backup? (y/n)"
        read -r response
    else
        response="y"
    fi
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_error "Installation cancelled"
    fi
fi

# Put panel in maintenance mode
print_step "Enabling maintenance mode"
php artisan down || print_warning "Could not enable maintenance mode"

# Pull latest changes from experimental branch (bootstrap git if needed)
print_step "Syncing code from experimental branch"
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git and re-run."
fi

# Mark directory safe for root if needed
git config --global --add safe.directory "$PANEL_DIR" 2>/dev/null || true

if [ ! -d ".git" ]; then
    if [ "$AUTO_GIT" -eq 1 ] || [ "$ASSUME_YES" -eq 1 ]; then
        print_warning "Git not initialized in $PANEL_DIR. Auto-initializing with $DEFAULT_REPO"
        git init
        git remote add origin "$DEFAULT_REPO" 2>/dev/null || print_warning "Origin already exists"
        print_step "Fetching experimental from origin"
        git fetch origin experimental || print_error "Failed to fetch 'experimental' from origin"
        # Force sync to origin/experimental; clean untracked if running non-interactively
        git reset --hard origin/experimental || print_error "Failed to sync files to origin/experimental"
        # Disabled: git clean to preserve .env and other untracked files
        # if [ "$AUTO_GIT" -eq 1 ] || [ "$ASSUME_YES" -eq 1 ]; then
        #     git clean -fdx || true
        # fi
        git checkout -B experimental >/dev/null 2>&1 || true
        print_success "Repository initialized and synced to experimental"
    else
        print_warning "Git not initialized in $PANEL_DIR. Initialize now? (y/n)"
        read -r init_git
        if [[ "$init_git" =~ ^[Yy]$ ]]; then
            read -p "Remote repository URL [$DEFAULT_REPO]: " REPO_URL
            REPO_URL=${REPO_URL:-$DEFAULT_REPO}
            git init
            git remote add origin "$REPO_URL" || print_warning "Origin already exists"
            print_step "Fetching experimental from origin"
            git fetch origin experimental || print_error "Failed to fetch 'experimental' from origin"
            if ! git checkout -B experimental origin/experimental; then
                print_warning "Checkout failed due to existing files. Clean untracked files and force sync? (y/n)"
                read -r clean_choice
                if [[ "$clean_choice" =~ ^[Yy]$ ]]; then
                    git reset --hard origin/experimental || print_error "Failed to reset to origin/experimental"
                    # Disabled: git clean to preserve .env and other untracked files
                    # git clean -fdx || true
                    git checkout -B experimental >/dev/null 2>&1 || true
                    print_success "Repository initialized and synced to experimental"
                else
                    print_error "Failed to checkout experimental due to untracked files"
                fi
            else
                print_success "Repository initialized and experimental branch checked out"
            fi
        else
            print_error "Cannot proceed without git repository setup"
        fi
    fi
else
    # Ensure origin exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        if [ "$ASSUME_YES" -eq 1 ]; then
            git remote add origin "$DEFAULT_REPO"
        else
            read -p "No 'origin' remote found. Enter URL [$DEFAULT_REPO]: " REPO_URL
            REPO_URL=${REPO_URL:-$DEFAULT_REPO}
            git remote add origin "$REPO_URL"
        fi
    fi
    git fetch origin experimental || print_error "Failed to fetch experimental"
    # Checkout experimental if not current
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [ "$CURRENT_BRANCH" != "experimental" ]; then
        git checkout -B experimental || print_error "Failed to switch to experimental"
    fi
    git reset --hard origin/experimental || print_error "Failed to sync to origin/experimental"
    # Disabled: git clean to preserve .env and other untracked files
    # if [ "$ASSUME_YES" -eq 1 ]; then
    #     git clean -fdx || true
    # fi
    print_success "Code synced to origin/experimental"
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

# Seed default schedule presets (idempotent)
print_step "Seeding default schedule presets"
set +e
php artisan db:seed --class=Database\\Seeders\\SchedulePresetSeeder
SEED_STATUS=$?
set -e
if [ $SEED_STATUS -eq 0 ]; then
    print_success "Schedule presets seeded (or already present)"
else
    print_warning "Could not seed schedule presets; continuing without defaults"
fi

# Clear caches
print_step "Clearing application caches"
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Manually delete compiled views to ensure fresh compilation
print_step "Removing compiled view cache files"
rm -rf storage/framework/views/*
rm -rf storage/framework/cache/*
rm -rf bootstrap/cache/*.php
print_success "All caches cleared"

# Clear composer autoload cache to prevent duplicate class declarations
print_step "Clearing composer autoload cache"
COMPOSER_ALLOW_SUPERUSER=1 composer dump-autoload --no-dev --optimize
print_success "Composer autoload cache cleared"

# Run database migrations
print_step "Running database migrations"
php artisan migrate --force || print_error "Migration failed"
print_success "Database migrations completed"

# Set correct permissions
print_step "Setting file permissions"
chmod -R 755 storage/* bootstrap/cache/
chown -R www-data:www-data "$PANEL_DIR"/*
print_success "Permissions updated"

# Install npm dependencies and build assets (if needed)
print_step "Building frontend assets"
if [ -f "package.json" ]; then
    # Clear webpack and build caches to force fresh rebuild
    print_step "Clearing build caches"
    rm -rf node_modules/.cache
    rm -rf public/assets/*
    print_success "Build caches cleared"
    
    if command -v yarn &> /dev/null; then
        # Install recharts for analytics charts
        print_step "Installing recharts dependency"
        yarn add recharts
        print_success "Recharts installed"
        
        yarn install
        yarn build:production
        print_success "Frontend assets built with yarn"
    elif command -v npm &> /dev/null; then
        # Install recharts for analytics charts
        print_step "Installing recharts dependency"
        npm install recharts --save
        print_success "Recharts installed"
        
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

# Rebuild cache after everything is done
print_step "Rebuilding application cache"
php artisan config:cache
php artisan route:cache
print_success "Cache rebuilt"

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
