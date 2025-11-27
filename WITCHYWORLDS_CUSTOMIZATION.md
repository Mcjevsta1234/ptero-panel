# WitchyWorlds Panel Customizations

This document outlines all the customizations made to the Reviactyl panel for WitchyWorlds.

## Changes Made

### 1. Footer Customization
- Changed footer branding from "Reviactyl™ © {year}" to "WitchyWorlds™ © 2025"
- Changed custom copyright text from "Powered by Reviactyl" to "Panel Revision 1"
- **Files modified:**
  - `resources/scripts/reviactyl/ui/Footer.tsx`
  - `config/designify.php`
  - `app/Http/ViewComposers/DesignifyComposer.php`

### 2. Social Links Section
Added a configurable social links section to the server console page with the following links:
- Billing Area: https://client.witchyworlds.top
- Status Page: https://status.witchyworlds.top
- Discord: https://discord.gg/Af7k4fX8de
- Website: https://witchyworlds.top

**Files created/modified:**
- `resources/scripts/components/server/console/SocialsSection.tsx` (new component)
- `resources/scripts/components/server/console/ServerConsoleContainer.tsx` (updated to include socials)
- `resources/scripts/state/reviactyl.ts` (added social link interfaces)
- `config/designify.php` (added social link configuration)
- `app/Http/ViewComposers/DesignifyComposer.php` (added social links to config)

### 3. README Updates
- Changed sponsor section from "Tietokettu" to "WitchyWorlds" with "Panel Revision 1"
- **Files modified:**
  - `README.md`

## Admin Panel Configuration

Social links can be configured in the Designify admin panel by modifying the following configuration values in `config/designify.php`:

```php
'socialBilling' => 'https://client.witchyworlds.top',
'socialStatus' => 'https://status.witchyworlds.top',
'socialDiscord' => 'https://discord.gg/Af7k4fX8de',
'socialWebsite' => 'https://witchyworlds.top',
```

## Addon Features

The following addon features are referenced in the routes configuration. These addons need to be installed separately:

### Available Addons

1. **Server Splitter**
   - URL: https://www.sourcexchange.net/products/server-splitter
   - Permission: `splitter.read`
   - Route: `/splitter`

2. **Minecraft Version Changer**
   - URL: https://www.sourcexchange.net/products/version-changer
   - Permission: `file.update`
   - Route: `/minecraft/versions`

3. **Minecraft Player Manager**
   - URL: https://www.sourcexchange.net/products/player-manager
   - Permission: `control.console`
   - Route: `/minecraft/players`

4. **Server Importer**
   - URL: https://www.sourcexchange.net/products/server-importer
   - Permission: `file.delete`
   - Route: `/importer`

5. **Modpack Installer**
   - URL: https://builtbybit.com/resources/modpack-installer-for-pterodactyl.37379/
   - Permission: TBD (based on addon installation)
   - Route: TBD (based on addon installation)

### How to Add Addon Routes

When installing these addons, they each come with installation instructions that tell you to add routes to `routes/admin.php` (or similar file from your attachment at `c:\Users\Noodle\Music\ptero\configs\routes.ts`).

The routes are organized into three sections in the navigation:
- **Control**: Console, Files, Startup, Network
- **Management**: Databases, Schedules, Backups
- **Administration**: Users, Settings, Activity

Addons should be added to the appropriate section in `resources/scripts/routers/routes.ts` based on their function. For example, the Server Splitter and Importer are currently set up in the "Control" section, while Player Manager is in "Administration".

Example route structure from your attachment:
```typescript
{
    path: '/splitter',
    name: 'Splitter',
    permission: 'splitter.read',
    icon: CogIcon,
    component: ServerSplitterContainer,
},
```

## Building the Panel

After making changes, rebuild the frontend assets:

```bash
yarn install
yarn build:production
```

Or for development:

```bash
yarn build
```

## Notes

- All social links open in a new tab
- The socials section only displays on the console page
- Social links can be configured per-installation through the config file
- The footer branding is hardcoded to "WitchyWorlds™ © 2025"
- Custom copyright text "Panel Revision 1" appears below the main footer
