<?php

namespace Pterodactyl\Services;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Services\Servers\StartupModificationService;

/**
 * Service for configuring modpack servers with proper Java versions and startup arguments.
 * Handles Forge, NeoForge, Fabric, and other modpack types with appropriate JVM arguments.
 */
class ModpackConfigurationService
{
    public function __construct(
        protected DaemonFileRepository $fileRepository,
        protected StartupModificationService $startupModificationService
    ) {
    }

    /**
     * Configure modpack server with correct startup arguments.
     * Sets up proper JVM argument handling via unix_args.txt.
     */
    public function configureModpack(Server $server, ?string $minecraftVersion = null): void
    {
        $this->fileRepository->setServer($server);

        try {
            // Update startup arguments to use unix_args.txt properly
            $this->updateStartupCommand($server);

            \Log::info('Modpack configuration completed', [
                'server_id' => $server->id,
                'minecraft_version' => $minecraftVersion,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to configure modpack', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Update startup command to properly use unix_args.txt for modpack JVM arguments.
     */
    protected function updateStartupCommand(Server $server): void
    {
        try {
            // Check if unix_args.txt exists (indicates modpack with custom JVM args)
            $files = collect($this->fileRepository->getDirectory('/'))->pluck('name')->toArray();
            $hasUnixArgs = in_array('unix_args.txt', $files);

            if (!$hasUnixArgs) {
                \Log::debug('No unix_args.txt found, skipping startup update', [
                    'server_id' => $server->id,
                ]);
                return;
            }

            // Update startup to check for unix_args.txt and use it if present
            $newStartup = $this->getUnixAwareStartup($server);
            $currentStartup = $server->startup;

            if ($newStartup !== $currentStartup) {
                \Log::info('Updating startup command for modpack', [
                    'server_id' => $server->id,
                    'old_startup' => substr($currentStartup, 0, 100),
                    'new_startup' => substr($newStartup, 0, 100),
                ]);

                $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);
                $this->startupModificationService->handle($server, [
                    'startup' => $newStartup,
                ]);
            }
        } catch (\Exception $e) {
            \Log::warning('Could not update startup command', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - this is not critical
        }
    }

    /**
     * Get startup command that is Unix-aware (uses unix_args.txt if available).
     * This supports NeoForge, Forge, and Fabric servers.
     */
    protected function getUnixAwareStartup(Server $server): string
    {
        // Get memory setting from server or default
        $memoryVariable = '{{server.build.memory}}';

        // Startup command that checks for unix_args.txt and uses it if available
        // This allows modpacks to specify their own JVM arguments
        return "java -Xms{$memoryVariable}M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true \$( [[ ! -f unix_args.txt ]] && printf %s \"-jar server.jar\" || printf %s \"@unix_args.txt\" )";
    }

    /**
     * Get startup command that is Unix-aware (uses unix_args.txt if available).
     * This supports NeoForge, Forge, and Fabric servers.
     */
    protected function getUnixAwareStartup(Server $server): string
    {
        // Get memory setting from server or default
        $memoryVariable = '{{server.build.memory}}';

        // Startup command that checks for unix_args.txt and uses it if available
        // This allows modpacks to specify their own JVM arguments
        return "java -Xms{$memoryVariable}M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true \$( [[ ! -f unix_args.txt ]] && printf %s \"-jar server.jar\" || printf %s \"@unix_args.txt\" )";
    }
}


