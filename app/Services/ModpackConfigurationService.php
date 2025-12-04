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
     * Configure modpack server with correct Java version and startup arguments.
     * Detects modpack type and sets appropriate JVM flags.
     */
    public function configureModpack(Server $server, ?string $minecraftVersion = null): void
    {
        $this->fileRepository->setServer($server);

        try {
            // Set Java version based on Minecraft version
            if ($minecraftVersion) {
                $this->setJavaVersionForServer($server, $minecraftVersion);
            }

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
     * Set Java version for a server based on Minecraft version.
     */
    protected function setJavaVersionForServer(Server $server, string $minecraftVersion): void
    {
        $javaVersion = $this->getJavaVersionForMinecraft($minecraftVersion);
        $javaVarName = $this->findJavaVersionVariable($server);

        if ($javaVarName) {
            \Log::info('Setting Java version for modpack server', [
                'server_id' => $server->id,
                'java_version' => $javaVersion,
                'minecraft_version' => $minecraftVersion,
                'variable' => $javaVarName,
            ]);

            try {
                $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);
                $this->startupModificationService->handle($server, [
                    'environment' => [
                        $javaVarName => $javaVersion,
                    ],
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to set Java version', [
                    'server_id' => $server->id,
                    'error' => $e->getMessage(),
                ]);
                throw $e;
            }
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
     * Determine the appropriate Java version based on Minecraft version.
     */
    protected function getJavaVersionForMinecraft(string $minecraftVersion): string
    {
        // Parse version number
        $versionParts = explode('.', $minecraftVersion);
        $majorVersion = (int) ($versionParts[0] ?? 0);
        $minorVersion = (int) ($versionParts[1] ?? 0);

        // Java version recommendations for Minecraft
        // 1.20.5+ (NeoForge requires Java 17+) -> Java 21
        // 1.20-1.20.4 -> Java 17
        // 1.17-1.19 -> Java 17
        // 1.12-1.16 -> Java 11
        // 1.8-1.11 -> Java 8

        if ($majorVersion >= 1) {
            if ($minorVersion >= 20) {
                return 'java21';
            } elseif ($minorVersion >= 17) {
                return 'java17';
            } elseif ($minorVersion >= 12) {
                return 'java11';
            }
        }

        return 'java8';
    }

    /**
     * Find Java version variable for the server's egg.
     */
    protected function findJavaVersionVariable(Server $server): ?string
    {
        $egg = $server->egg;

        // Look for common Java version variable names
        $javaVarNames = [
            'JAVA_VERSION',
            'JAVA_Ver',
            'Java_Version',
            'java_version',
            'SERVER_JAVA_VERSION',
        ];

        foreach ($javaVarNames as $varName) {
            $variable = $egg->variables()
                ->where('env_variable', $varName)
                ->first();

            if ($variable) {
                return $varName;
            }
        }

        // If not found by exact name, search for variables containing 'java' and 'version'
        $variable = $egg->variables()
            ->whereRaw('LOWER(env_variable) LIKE ?', ['%java%'])
            ->whereRaw('LOWER(env_variable) LIKE ?', ['%version%'])
            ->first();

        return $variable?->env_variable;
    }
}

