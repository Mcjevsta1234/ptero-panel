# Changelog
This file is a running track of new features and fixes to each version of the panel released starting with `v2.0.0`. Reviactyl continues the development of pterodactyl from v1.11.11

This project follows [Semantic Versioning](http://semver.org) guidelines.

## v2.1.0

### Added
* New Translations for Admin Panel
* Logo, Favicon, Debug Option in Admin > General Settings
* Chinese Simplified (`zh`) translation
* Spanish (`es`) translation
* Mail Template Customization
* New button variants
* Font Family Configuration
* Configurable Layouts (!WIP)
* Progressive Web App (PWA Desktop, Mobile App)

### Changed

* Updated Witchcrafter Editor to use proper settings system
* Use proper settings variable for Buttons
* Use `revicons`, `react-icons` package for icons
* Security Improvements
* Update primary colour from `orange` to `blue`
* Update Reviactyl assets
* UI Refinements on Admin & Client Dashboard

### Fixed

* Sidebar elements appear broken
* Admin Styles appear broken

### BREAKING CHANGES

* Updated Witchcrafter Structure
* Updated Sidebar Structure

## v2.0.2

### Added
* New strings for search & server layout.
* Swedish (`se`) translation

### Changed

* Change Reviactyl UI Components import from `@/components/` to `@/reviactyl/`
* Store user locale in database
* Update Telemetry Collection *(Reviactyl now collects anonymous telemetry data)*
* Make locale list utilise existing methods

### Fixed

* Some elements appear broken in smaller screens
* Fixed UI for widescreen devices

## v2.0.1

### Added

* Customizable Terminal, Daemon Prelude from per-Node Settings
* Artisan Command to Check for Updates (`p:update:check`)
* Hindi (`hi`) translation

### Changed

* Use Reviactyl Repo for Upgrade Command (`p:upgrade`)
* Use proper color shade for Search Bar
* Re-style few parts of Admin dashboard

### Fixed

* Admin dashboard url not opening in sidebar
* Broken parts of admin dashboard

## v2.0.0

### Added

* ThemeEngine for switching between multiple color palettes
* Panel-wide translation system
* Portuguese (Brazil) translation by @d-belli
* New Designify Editor for modifying panel look & feel
* Customizable Color scheme
* Customizable Site Logo
* Customizable Meta tags
* Custom copyright
* Maintenance mode
* Blur for allocation and ips in activity
* Customizable Panel background image
* Per-egg banner for Server Card layout
* Customizable Alert/Notification system
* Top Server Details for all routes under /server
* Language Switcher
* Smart Color Invert Filter
* Nest and Egg limitation for Navigation

### Changed

* Updated UI Design for Administration & Dashboard
* Use Gravatar instead of Boring Avatars
* Updated ServerRow with more accessible Card
* Icons for navigation links
* Option to show password before login
