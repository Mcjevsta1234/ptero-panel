#!/bin/bash
# Deploy script for demo.witchyworlds.top

echo "Pulling latest changes from experimental branch..."
git pull origin experimental

echo "Installing/updating dependencies..."
composer install --no-dev --optimize-autoloader

echo "Clearing caches..."
php artisan route:clear
php artisan config:clear
php artisan view:clear

echo "Installing frontend dependencies..."
yarn install

echo "Building frontend..."
yarn build:production

echo "Optimizing..."
php artisan optimize

echo "Setting permissions..."
chmod -R 755 storage/* bootstrap/cache/

echo "Deployment complete!"
