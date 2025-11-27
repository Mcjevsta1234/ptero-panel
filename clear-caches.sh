#!/bin/bash

# Clear all Laravel caches
php artisan view:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Remove compiled view files
rm -rf storage/framework/views/*

# Recompile config and routes
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "All caches cleared and recompiled!"
