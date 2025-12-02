#!/bin/bash

# Quick fix script for cache issues
cd /var/www/pterodactyl

echo "Clearing all caches..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

echo "Removing bootstrap cache..."
rm -rf bootstrap/cache/*.php

echo "Clearing composer autoload cache..."
composer dump-autoload --no-dev --optimize

echo "Rebuilding caches..."
php artisan config:cache
php artisan route:cache

echo "Done! Panel should be working now."
