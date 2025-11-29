#!/usr/bin/env bash
set -euo pipefail

# Modpack Manager installer - applies all required file patches and uploads

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$ROOT_DIR"

info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[1;31m[ERR ]\033[0m $*"; }

MODPACK_DIR="$ROOT_DIR/addons/Modpack-Manager"

if [[ ! -d "$MODPACK_DIR" ]]; then
  err "Modpack Manager addon not found at $MODPACK_DIR"
  exit 1
fi

info "Installing Modpack Manager from $MODPACK_DIR"

# 1. Copy upload directory contents
info "Copying upload directory to panel root"
rsync -av "$MODPACK_DIR/upload/" "$ROOT_DIR/" || {
  err "Failed to copy upload directory"
  exit 1
}

# 2. Patch config/services.php
info "Patching config/services.php"
if ! grep -q "curseforge_api_key" config/services.php; then
  # Find the closing bracket of the array and add the curseforge line before it
  sed -i.bak '/^];$/i\
\
    '\''curseforge_api_key'\'' => env('\''CURSEFORGE_API_KEY'\''),
' config/services.php
fi

# 3. Patch app/Http/Controllers/Api/Remote/Servers/ServerInstallController.php
info "Patching ServerInstallController.php"
INSTALL_CTRL="app/Http/Controllers/Api/Remote/Servers/ServerInstallController.php"

# Add imports
if ! grep -q "use Pterodactyl\\\\Services\\\\Minecraft\\\\MinecraftSoftwareService;" "$INSTALL_CTRL"; then
  sed -i '/use Pterodactyl\\Http\\Requests\\Api\\Remote\\InstallationDataRequest;/a\
use Exception;\
use Illuminate\\Support\\Facades\\DB;\
use Pterodactyl\\Models\\User;\
use Pterodactyl\\Services\\Minecraft\\MinecraftSoftwareService;\
use Pterodactyl\\Services\\Servers\\StartupModificationService;
' "$INSTALL_CTRL"
fi

# Update constructor
if ! grep -q "MinecraftSoftwareService" "$INSTALL_CTRL" | grep -q "__construct"; then
  sed -i 's/public function __construct(private ServerRepository \$repository, private EventDispatcher \$eventDispatcher)/public function __construct(private ServerRepository $repository, private EventDispatcher $eventDispatcher,\n        private MinecraftSoftwareService $minecraftSoftwareService, private StartupModificationService $startupModificationService)/' "$INSTALL_CTRL"
fi

# Add updateServerImageFromMinecraftSoftware call and methods
if ! grep -q "updateServerImageFromMinecraftSoftware" "$INSTALL_CTRL"; then
  # Find the closing of the if (!$request->boolean('successful')) block and add else
  cat >> "$INSTALL_CTRL.patch" << 'EOPATCH'
--- a
+++ b
@@ -1,6 +1,9 @@
         if (!$request->boolean('successful')) {
             $status = Server::STATUS_INSTALL_FAILED;
 
             if ($request->boolean('reinstall')) {
                 $status = Server::STATUS_REINSTALL_FAILED;
             }
+        } else {
+            $this->updateServerImageFromMinecraftSoftware($server);
         }
EOPATCH
  
  # Add methods at end of class (before final closing brace)
  sed -i '$d' "$INSTALL_CTRL"  # Remove last closing brace
  cat >> "$INSTALL_CTRL" << 'EOMETHODS'

    protected function updateServerImageFromMinecraftSoftware(Server $server) {
        try {
            if (DB::table('modpack_installations')
                ->where('server_id', $server->id)
                ->where('finalized', false)
                ->exists()) {

                    // Update Java Docker image depending on the detected Minecraft version.
                    $this->minecraftSoftwareService->setServer($server);
                    $buildInfo = $this->minecraftSoftwareService->getServerBuildInformation();

                    if (isset($buildInfo['java'])) {
                        $availableImages = $server->egg->docker_images;
                        $newImage = $this->getImageForJavaVersion($availableImages, $buildInfo['java']) ?? 'ghcr.io/pterodactyl/yolks:java_' . $buildInfo['java'];
                        $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN)->handle($server, [
                            'docker_image' => $newImage,
                        ]);
                    }
                    DB::table('modpack_installations')
                        ->where('server_id', $server->id)
                        ->where('finalized', false)
                        ->update(['finalized' => true]);
                }
            } catch (Exception) {}
    }

    protected function getImageForJavaVersion(array $availableImages, string $javaVersion): ?string
    {
        if (function_exists('array_find')) {
            return array_find($availableImages, fn ($v, $k) => str_ends_with($k, ' ' . $javaVersion));
        }
        foreach ($availableImages as $name => $avImage) {
            if (str_ends_with($name, ' ' . $javaVersion)) {
                return $avImage;
            }
        }
        return null;
    }
}
EOMETHODS
  rm -f "$INSTALL_CTRL.patch"
fi

# 4. Patch app/Repositories/Wings/DaemonFileRepository.php
info "Patching DaemonFileRepository.php"
DAEMON_REPO="app/Repositories/Wings/DaemonFileRepository.php"

if ! grep -q "use GuzzleHttp\\\\Psr7\\\\Query;" "$DAEMON_REPO"; then
  sed -i '/use GuzzleHttp\\Exception\\TransferException;/a\
use GuzzleHttp\\Psr7\\Query;
' "$DAEMON_REPO"
fi

if ! grep -q "getFingerprints" "$DAEMON_REPO"; then
  # Add method before final closing brace
  sed -i '$d' "$DAEMON_REPO"
  cat >> "$DAEMON_REPO" << 'EOMETHODS'

    /**
     * Returns fingerprints of given files' content.
     *
     * @param  $path  string[]
     * @param  $algorithm string should be `sha512` or `curseforge`
     * @return array<string, string>
     *
     * @throws \GuzzleHttp\Exception\TransferException
     * @throws \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException
     */
    public function getFingerprints(array $paths, string $algorithm = 'sha512'): array
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            $response = $this->getHttpClient()->get(
                sprintf('/api/servers/%s/files/fingerprints', $this->server->uuid),
                [
                    'query' => Query::build(['files' => $paths, 'algorithm' => $algorithm]),
                ]
            );
        } catch (ClientException|TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }

        $response = $response->getBody()->__toString();

        return json_decode($response, true)['fingerprints'];
    }
}
EOMETHODS
fi

# 5. Patch app/Transformers/Api/Client/ServerTransformer.php
info "Patching ServerTransformer.php"
TRANSFORMER="app/Transformers/Api/Client/ServerTransformer.php"

if ! grep -q "'egg_id' => \\$server->egg_id," "$TRANSFORMER"; then
  sed -i "/'internal_id' => \\$server->id,/a\\
            'egg_id' => \$server->egg_id," "$TRANSFORMER"
fi

# 6. Patch resources/scripts/api/server/getServer.ts
info "Patching getServer.ts"
GET_SERVER="resources/scripts/api/server/getServer.ts"

if ! grep -q "eggId: number;" "$GET_SERVER"; then
  sed -i '/internalId: number | string;/a\
    eggId: number;' "$GET_SERVER"
fi

if ! grep -q "eggId: data.egg_id," "$GET_SERVER"; then
  sed -i '/internalId: data.internal_id,/a\
    eggId: data.egg_id,' "$GET_SERVER"
fi

# 7. Patch resources/scripts/routers/routes.ts
info "Patching routes.ts"
ROUTES_FILE="resources/scripts/routers/routes.ts"

# Add import
if ! grep -q "ModpacksContainer" "$ROUTES_FILE"; then
  sed -i "/import FileManagerContainer from/a\\
import ModpacksContainer from '@/components/server/minecraft-modpacks/ModpacksContainer';" "$ROUTES_FILE"
fi

# Add eggIds to interface if not present
if ! grep -q "eggIds?: number\\[\\];" "$ROUTES_FILE"; then
  sed -i '/interface ServerRouteDefinition extends RouteDefinition {/,/}/ {
    /permission: string | string\[\] | null;/a\
    eggIds?: number[];
  }' "$ROUTES_FILE"
fi

# Add modpacks route after files route in management section
if ! grep -q "path: '/modpacks'" "$ROUTES_FILE"; then
  # Find files route and add modpacks after it
  sed -i "/path: '\/files',/,/},/ {
    /},/a\\
            {\\
                path: '/modpacks',\\
                permission: 'file.*',\\
                name: 'server.modpacks',\\
                component: ModpacksContainer,\\
                icon: FaFolder,\\
                eggIds: [1, 3],\\
            },
  }" "$ROUTES_FILE"
fi

# 8. Patch resources/scripts/routers/ServerRouter.tsx (if exists and not already patched)
info "Patching ServerRouter.tsx (if needed)"
SERVER_ROUTER="resources/scripts/routers/ServerRouter.tsx"

if [[ -f "$SERVER_ROUTER" ]]; then
  if ! grep -q "serverEggId" "$SERVER_ROUTER"; then
    sed -i "/const serverId = ServerContext.useStoreState/a\\
    const serverEggId = ServerContext.useStoreState((state) => state.server.data?.eggId);" "$SERVER_ROUTER"
  fi
  
  if ! grep -q "route.eggIds" "$SERVER_ROUTER"; then
    sed -i '/\.filter((route) => !!route\.name)/a\
                                    .filter((route) =>\
                                        route.eggIds && serverEggId ? route.eggIds.includes(serverEggId) : true\
                                    )' "$SERVER_ROUTER"
  fi
fi

# 9. Patch routes/api-client.php
info "Patching api-client.php routes"
API_CLIENT_ROUTES="routes/api-client.php"

if ! grep -q "minecraft-modpacks" "$API_CLIENT_ROUTES"; then
  # Find the settings group closing and add modpacks routes after
  sed -i "/Route::group.*'prefix' => '\/settings'/,/});/ {
    /});/a\\
\\
    Route::group(['prefix' => '/minecraft-modpacks'], function () {\\
        Route::get('/', [Client\\\\Servers\\\\ModpackController::class, 'index']);\\
        Route::get('/versions', [Client\\\\Servers\\\\ModpackController::class, 'versions']);\\
        Route::post('/install', [Client\\\\Servers\\\\ModpackController::class, 'install']);\\
    });
  }" "$API_CLIENT_ROUTES"
fi

# 10. Patch resources/lang/en/activity.php (optional)
info "Patching activity.php language file"
ACTIVITY_LANG="resources/lang/en/activity.php"

if [[ -f "$ACTIVITY_LANG" ]] && ! grep -q "'modpack'" "$ACTIVITY_LANG"; then
  sed -i "/'subuser' =>/,/\\],/ {
    /\\],/a\\
        'modpack' => [\\
            'install' => 'Installed modpack :modpack_name (:modpack_id), version :modpack_version_id from :provider',\\
        ],
  }" "$ACTIVITY_LANG"
fi

# 11. Import the modpack installer egg
info "Importing modpack installer egg via seeding"
php artisan migrate --force --seed || warn "Seeding may have encountered issues; egg import might be incomplete"

info "Modpack Manager installation complete!"