<?php

namespace Pterodactyl\Services;

use Pterodactyl\Models\Server;
use Pterodactyl\Services\Servers\StartupModificationService;

class JavaVersionService
{
    /**
     * Determine the appropriate Java version based on Minecraft version.
     */
    public static function getJavaVersionForMinecraft(string $minecraftVersion): string
    {
        // Parse version number
        $versionParts = explode('.', $minecraftVersion);
        $majorVersion = (int) ($versionParts[0] ?? 0);
        $minorVersion = (int) ($versionParts[1] ?? 0);

        // Java version recommendations for Minecraft
        // 1.20+ -> Java 21
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
    public static function findJavaVersionVariable(Server $server): ?string
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
     * Set Java version for a server based on Minecraft version.
     * Uses StartupModificationService to properly persist the change.
     */
    public static function setJavaVersionForServer(Server $server, string $minecraftVersion): void
    {
        $javaVersion = self::getJavaVersionForMinecraft($minecraftVersion);
        $javaVarName = self::findJavaVersionVariable($server);

        if ($javaVarName) {
            \Log::info('Setting Java version for server', [
                'server_id' => $server->id,
                'java_version' => $javaVersion,
                'variable' => $javaVarName,
            ]);

            try {
                $service = app(StartupModificationService::class);
                $service->setUserLevel(\Pterodactyl\Models\User::USER_LEVEL_ADMIN);
                $service->handle($server, [
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
        } else {
            \Log::warning('Could not find Java version variable for egg', [
                'server_id' => $server->id,
                'egg_id' => $server->egg_id,
            ]);
        }
    }
}
