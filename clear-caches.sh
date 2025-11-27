#!/bin/bash

echo "🧹 Clearing all Laravel caches..."
php artisan view:clear
php artisan config:clear
php artisan route:clear
php artisan cache:clear

echo "🗑️  Removing old compiled view files..."
rm -rf storage/framework/views/*

echo "🗑️  Removing old theme files..."
rm -rf public/assets/*.js
rm -rf public/assets/*.map
rm -rf public/assets/*.css

echo "📦 Installing dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader

echo "🔨 Building production assets..."
export NODE_OPTIONS=--openssl-legacy-provider
yarn install
yarn build:production

echo "♻️  Recompiling caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔄 Restarting queue workers..."
php artisan queue:restart

echo "✅ All done! Panel is ready for testing."
