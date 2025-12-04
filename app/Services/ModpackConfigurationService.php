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
    protected DaemonFileRepository $fileRepository;
    protected StartupModificationService $startupModificationService;

    public function __construct(
        DaemonFileRepository $fileRepository,
        StartupModificationService $startupModificationService
    ) {
        $this->fileRepository = $fileRepository;
        $this->startupModificationService = $startupModificationService;
    }

    /**
     * Configure modpack server with correct Java version and startup arguments.
     * Detects modpack type and sets appropriate JVM flags.
     */
    public function configureModpack(Server $server, ?string $minecraftVersion = null): void
    {
        $this->fileRepository->setServer($server);

        try {
            // Detect modpack type
            $modpackType = $this->detectModpackType($server);
            
            \Log::info('Detected modpack type', [
                'server_id' => $server->id,
                'modpack_type' => $modpackType,
            ]);

            // Set Java version based on Minecraft version
            if ($minecraftVersion) {
                $this->setJavaVersionForServer($server, $minecraftVersion);
            }

            // Update startup arguments based on modpack type
            $this->updateStartupArguments($server, $modpackType);

        } catch (\Exception $e) {
            \Log::error('Failed to configure modpack', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Detect the modpack type by examining server files.
     */
    protected function detectModpackType(Server $server): string
    {
        try {
            $files = collect($this->fileRepository->getDirectory('/'))->pluck('name')->toArray();

            // Check for NeoForge (newer versions)
            if ($this->fileExists($files, 'neoforge-server.jar') || 
                $this->fileExists($files, 'neoforge-*-server.jar')) {
                return 'neoforge';
            }

            // Check for Forge
            if ($this->fileExists($files, 'forge-*-server.jar') ||
                $this->fileExists($files, 'minecraft_server.*.jar')) {
                return 'forge';
            }

            // Check for Fabric
            if ($this->fileExists($files, 'fabric-server-launch.jar')) {
                return 'fabric';
            }

            // Check for Quilt
            if ($this->fileExists($files, 'quilt-server-launch.jar')) {
                return 'quilt';
            }

            // Check for unix_args.txt (generic modpack indicator)
            if ($this->fileExists($files, 'unix_args.txt')) {
                return 'generic_modpack';
            }

            // Check for Vanilla or Paper
            if ($this->fileExists($files, 'server.jar') || 
                $this->fileExists($files, 'paper-*.jar')) {
                return 'vanilla';
            }

            return 'unknown';
        } catch (\Exception $e) {
            \Log::warning('Could not detect modpack type', [
                'server_id' => $server->id,
                'error' => $e->getMessage(),
            ]);
            return 'unknown';
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
            }
        }
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

    /**
     * Update startup arguments based on modpack type.
     * Handles both Unix-style arguments (unix_args.txt) and Windows batch files.
     */
    protected function updateStartupArguments(Server $server, string $modpackType): void
    {
        // Get current startup command
        $currentStartup = $server->startup;
        
        // Determine the appropriate startup command based on modpack type
        $newStartup = match($modpackType) {
            'neoforge', 'forge', 'fabric', 'quilt', 'generic_modpack' => 
                $this->getUnixAwareStartup($server),
            default => $currentStartup,
        };

        // Only update if different
        if ($newStartup !== $currentStartup) {
            try {
                \Log::info('Updating startup command for modpack', [
                    'server_id' => $server->id,
                    'modpack_type' => $modpackType,
                    'old_startup' => substr($currentStartup, 0, 100),
                    'new_startup' => substr($newStartup, 0, 100),
                ]);

                $this->startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);
                $this->startupModificationService->handle($server, [
                    'startup' => $newStartup,
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to update startup arguments', [
                    'server_id' => $server->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Get startup command that is Unix-aware (uses unix_args.txt if available).
     * This supports both NeoForge and modern Forge versions.
     */
    protected function getUnixAwareStartup(Server $server): string
    {
        // Get the memory variable from the server or use default
        $memoryVariable = '{{server.build.memory}}';
        
        // Modern Pterodactyl startup command that checks for unix_args.txt
        // This works with NeoForge, Forge 1.20.1+, and Fabric servers
        $startup = "java -Xms{$memoryVariable}M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true \$( [[ ! -f unix_args.txt ]] && printf %s \"-jar server.jar\" || printf %s \"@unix_args.txt\" )";
        
        return $startup;
    }

    /**
     * Check if a file exists in the given files array (supports wildcards).
     */
    protected function fileExists(array $files, string $pattern): bool
    {
        if (strpos($pattern, '*') === false) {
            // Exact match
            return in_array($pattern, $files);
        }

        // Wildcard match
        $regex = '/^' . str_replace(
            ['*', '.'],
            ['.*', '\.'],
            $pattern
        ) . '$/i';

        foreach ($files as $file) {
            if (preg_match($regex, $file)) {
                return true;
            }
        }

        return false;
    }
}
