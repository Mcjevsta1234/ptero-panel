<?php

namespace Pterodactyl\Services;

use Pterodactyl\Models\EggVariable;
use Pterodactyl\Models\ServerVariable;
use Pterodactyl\Models\Server;

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
     * Get the Java memory/startup variable names for this egg.
     */
    public static function getJavaVariableNames(Server $server): array
    {
        $egg = $server->egg;
        
        $variables = [
            'java_version' => null,
            'startup_memory' => null,
        ];

        // Find common Java version and memory variables
        $egg->variables->each(function ($var) use (&$variables) {
            $envVar = strtolower($var->env_variable);
            
            if (str_contains($envVar, 'java') && str_contains($envVar, 'version')) {
                $variables['java_version'] = $var->env_variable;
            } elseif (str_contains($envVar, 'memory') || str_contains($envVar, '_xmx')) {
                $variables['startup_memory'] = $var->env_variable;
            }
        });

        return $variables;
    }

    /**
     * Set Java version for a server based on Minecraft version.
     */
    public static function setJavaVersionForServer(Server $server, string $minecraftVersion): void
    {
        $javaVersion = self::getJavaVersionForMinecraft($minecraftVersion);
        $variables = self::getJavaVariableNames($server);

        if ($variables['java_version']) {
            ServerVariable::query()->updateOrCreate(
                [
                    'server_id' => $server->id,
                    'variable_id' => EggVariable::query()
                        ->where('egg_id', $server->egg_id)
                        ->where('env_variable', $variables['java_version'])
                        ->first()?->id,
                ],
                ['variable_value' => $javaVersion]
            );
        }
    }
}
