STANDALONE INSTALLATION

Downloaded addon: Minecraft Player Manager 1.4.3
Author: 0x7d8

(!) Custom remove script:
 This addon has a custom remove script you may need to run before installing/updating it with ainx, you can run it using
  bash ./remove-playermanager.sh

(i) Patch-based Installation:
For detailed instructions on how to install the addon using a patch, visit https://ainx.dev/ainx/addons/patches

(!) How to install the addon after updating the panel:
If you have updated the panel and need to reinstall the addon, you can use the following command
  ainx install minecraftplayermanager.ainx --force
To reinstall all addons at once you can use
  ainx install *.ainx --force

(!) STANDALONE:
For detailed instructions on how to install the addon using ainx, you can visit https://ainx.dev/ainx/addons/installation
Make sure NodeJS 16+ and Yarn are installed on your system, you can use the install-ainx.sh script to install them.
To install ainx either run the script or run
  npm install -g ainx

 - Installation of the addon:
  1. Run
    ainx install minecraftplayermanager.ainx
  2. Follow any on-screen instructions if present, you can always exit while installing and run the command again
  3. Done!

 - Updating the addon:
  1. Run
    ainx upgrade minecraftplayermanager.ainx
  2. Done!

 - Updating the addon without rebuilding frontend (for modified frontends):
  1. Run
    ainx upgrade minecraftplayermanager.ainx --rebuild=false --skipSteps
  2. Done!

 - Removing the addon:
  1. Run
    ainx remove minecraftplayermanager
  2. Follow any on-screen instructions if present, you can always exit while removing and run the command again
  3. Done!