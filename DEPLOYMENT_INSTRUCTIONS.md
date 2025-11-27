# WitchyWorlds Panel - Deployment Instructions

## Complete Rebranding Summary
This panel has been completely rebranded from **Reviactyl** to **WitchyWorlds** with the theme system renamed from **Designify** to **Witchcrafter**.

## Server Deployment Steps

### 1. Pull Latest Changes
```bash
cd /var/www/pterodactyl
git pull origin develop
```

### 2. Update Dependencies
```bash
composer install --no-dev --optimize-autoloader
yarn install
```

### 3. Clear All Caches
```bash
# Clear Laravel caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

# Clear compiled assets
rm -rf public/assets/*
rm -rf public/js/*
```

### 4. Build Frontend Assets
The build scripts have been updated to fix Node.js v22 compatibility:
```bash
# For production build
yarn build:production

# OR for development build
yarn build
```

**Note:** If you're using Node.js v22.x, the build scripts now include `NODE_OPTIONS=--openssl-legacy-provider` to fix the SSL error you encountered.

### 5. Update Permissions
```bash
chmod -R 755 storage/* bootstrap/cache/
chown -R www-data:www-data /var/www/pterodactyl
```

### 6. Restart Services
```bash
# Restart PHP-FPM
systemctl restart php8.2-fpm  # Adjust version if needed

# Restart queue workers
php artisan queue:restart

# If using supervisor for queue workers
supervisorctl restart all
```

### 7. Database Migration (Optional - No new migrations in this update)
```bash
php artisan migrate --force
```

## Configuration Changes

### Admin Panel Access
The admin customization panel has been moved from:
- **Old:** `/admin/designify`
- **New:** `/admin/witchcrafter`

### Social Links Configuration
Social links can now be edited in the admin panel at:
- **URL:** `https://demo.witchyworlds.top/admin/witchcrafter/socials`

Available social link fields:
1. Billing URL
2. Status URL
3. Discord URL
4. Website URL
5. Knowledgebase URL (NEW)
6. Custom Link Title (NEW)
7. Custom Link URL (NEW)

### Config Files Renamed
- `config/designify.php` → `config/witchcrafter.php` (already renamed)
- Database settings keys updated: `settings::designify:*` → `settings::witchcrafter:*`

### Admin Routes Updated
All admin routes have been updated:
- `admin.designify.general` → `admin.witchcrafter.general`
- `admin.designify.colors` → `admin.witchcrafter.colors`
- `admin.designify.looks` → `admin.witchcrafter.looks`
- `admin.designify.alerts` → `admin.witchcrafter.alerts`
- `admin.designify.site` → `admin.witchcrafter.site`
- `admin.witchcrafter.socials` (NEW)

## Verification Steps

### 1. Check Build Success
After running `yarn build:production`, verify:
```bash
ls -lh public/assets/
ls -lh public/js/
```
You should see compiled JS and CSS files with recent timestamps.

### 2. Check Frontend
Visit your panel URL and verify:
- Dashboard loads correctly
- Server console shows stats properly (CPU, Memory, Disk, Uptime, Network)
- Quick Links sidebar displays on dashboard and console
- All social links work (Billing, Status, Discord, Website, Knowledgebase, Custom)

### 3. Check Admin Panel
Visit `https://demo.witchyworlds.top/admin/witchcrafter` and verify:
- All navigation works
- Social links configuration page accessible
- Changes save successfully

### 4. Test Functionality
- Create a test server
- View console - stats should show properly formatted values
- Check RAM doesn't show "NaN%"
- Check Disk doesn't show "MiB0"
- Network stats should display in stats grid

## Troubleshooting

### If webpack errors persist
```bash
# Clear node modules and reinstall
rm -rf node_modules
rm -rf public/assets/*
rm -rf public/js/*
yarn install
yarn build:production
```

### If stats show NaN or incorrect values
Clear browser cache and hard refresh (Ctrl+Shift+R).

### If admin panel shows 404
```bash
# Clear route cache
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### If changes don't appear
```bash
# Restart queue workers
php artisan queue:restart

# Clear all caches
php artisan optimize:clear
```

## Default Announcement Message
The default announcement has been updated to:
> **Welcome to WitchyWorlds!** You can modify Theme Look & Feel using [Witchcrafter](/admin/witchcrafter) at the administration area.

This can be edited at `/admin/witchcrafter/alerts`

## Brand Colors
The primary brand color classes have been updated throughout:
- `bg-reviactyl` → `bg-witchyworlds`
- Tailwind CSS classes still available for customization

## Support
For issues or questions:
1. Check browser console for JavaScript errors
2. Check Laravel logs: `storage/logs/laravel.log`
3. Check web server error logs
4. Ensure all file permissions are correct

---

**Last Updated:** November 27, 2025  
**Panel Version:** WitchyWorlds Panel (Pterodactyl Fork)  
**Rebrand:** Reviactyl → WitchyWorlds | Designify → Witchcrafter
