# WitchyWorlds Panel Customizations

This document outlines all the customizations made to create the WitchyWorlds panel.

## Complete Rebranding

### Brand Changes
- All "Reviactyl" references replaced with "WitchyWorlds"
- "Designify" theme system renamed to "Witchcrafter"
- Footer branding changed to "WitchyWorlds™ © 2025"
- Copyright changed to "Panel Revision 1"
- All file paths updated from `@/reviactyl/` to `@/witchyworlds/`
- State management updated from `reviactyl` to `witchyworlds`
- TypeScript interfaces updated from `Reviactyl*` to `WitchyWorlds*`

### Files Renamed
- `config/designify.php` → `config/witchcrafter.php`
- `app/Http/ViewComposers/DesignifyComposer.php` → `app/Http/ViewComposers/WitchcrafterComposer.php`
- `resources/scripts/state/reviactyl.ts` → `resources/scripts/state/witchyworlds.ts`
- `resources/scripts/reviactyl/` → `resources/scripts/witchyworlds/`
- `public/reviactyl/` → `public/witchyworlds/`

## Configuration System (Witchcrafter)

The theme and customization system is now called **Witchcrafter**:
- Configuration file: `config/witchcrafter.php`
- Admin panel accessible at: `/admin/witchcrafter`
- Controls all theme colors, fonts, backgrounds, and UI customization

### Social Links Configuration

Social links are configured in `config/witchcrafter.php`:

```php
'socialBilling' => 'https://client.witchyworlds.top',
'socialStatus' => 'https://status.witchyworlds.top',
'socialDiscord' => 'https://discord.gg/Af7k4fX8de',
'socialWebsite' => 'https://witchyworlds.top',
```

These links appear in the Quick Links section on the server console page.

## UI Enhancements

### Modern Server Console Layout
- Clean stats grid at the top showing CPU, Memory, Disk, and Uptime
- 4-column responsive layout for server statistics
- Larger, more readable stats cards with percentage indicators
- Console and network stats below in 3:1 column ratio
- Quick Links sidebar on the right

**Files created/modified:**
- `resources/scripts/components/server/console/ServerStatsGrid.tsx` (new component)
- `resources/scripts/components/server/console/ServerConsoleContainer.tsx` (updated layout)
- `resources/scripts/components/server/console/SocialsSection.tsx` (social links sidebar)

### Social Links Section
Quick access links displayed on the server console page:
- Billing Area
- Status Page
- Discord
- Website

The section uses WitchyWorlds branding colors and only displays links that are configured.

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
