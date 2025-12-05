BLUEPRINT INSTALLATION

Downloaded addon: Server Importer 1.1.2
Author: 0x7d8

(!) BLUEPRINT:
Make sure blueprint is installed fully using the steps from
  https://blueprint.zip/docs/?page=getting-started/Installation

 - Installation of the addon:
  1. Copy serverimporter.blueprint to your pterodactyl folder (usually /var/www/pterodactyl)
  2. Run
    blueprint -install serverimporter
  3. Done!

 - Updating the addon:
  1. Copy the new serverimporter.blueprint to your pterodactyl folder
  2. Run
    blueprint -install serverimporter
  3. Done!

 - Removing the addon: (only if you want to remove the addon, not update)
  1. Run
    blueprint -remove serverimporter
  2. Done!

(!) Manually migrate the database:
If you use a test panel before production you may need to migrate the database
manually depending on how you test, you can use this command for blueprint:
  php artisan migrate --force