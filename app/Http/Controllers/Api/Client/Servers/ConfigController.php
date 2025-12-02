<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Illuminate\Http\Request;
use Symfony\Component\Yaml\Yaml;

class ConfigController extends ClientApiController
{
    public function __construct(
        private DaemonFileRepository $fileRepository,
    ) {
        parent::__construct();
    }

    /**
     * Get server.properties parsed into key-value pairs
     */
    public function getServerProperties(Request $request, Server $server): JsonResponse
    {
        $request->user()->can('file.read', $server);

        try {
            $contents = $this->fileRepository
                ->setServer($server)
                ->getContent('/server.properties');

            $properties = $this->parseProperties($contents);

            return new JsonResponse($properties);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Could not read server.properties'], 500);
        }
    }

    /**
     * Update server.properties
     */
    public function updateServerProperties(Request $request, Server $server): JsonResponse
    {
        $request->user()->can('file.update', $server);

        $properties = $request->input('properties', []);
        
        $content = $this->buildPropertiesFile($properties);

        try {
            $this->fileRepository
                ->setServer($server)
                ->putContent('/server.properties', $content);

            return new JsonResponse(['success' => true]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Could not update server.properties'], 500);
        }
    }

    /**
     * Get all available config files
     */
    public function getConfigs(Request $request, Server $server): JsonResponse
    {
        $request->user()->can('file.read', $server);

        $configs = [];

        // Automatically discover YAML config files
        $discoveredFiles = $this->discoverConfigFiles($server);

        foreach ($discoveredFiles as $file) {
            try {
                $contents = $this->fileRepository
                    ->setServer($server)
                    ->getContent($file['path']);

                $parsed = Yaml::parse($contents);
                $configs[] = [
                    'name' => $file['name'],
                    'path' => $file['path'],
                    'type' => 'yaml',
                    'sections' => $this->buildConfigSections($parsed, $file['path']),
                ];
            } catch (\Exception $e) {
                // Failed to parse config, skip it
                continue;
            }
        }

        return new JsonResponse(['data' => $configs]);
    }

    /**
     * Update a config file
     */
    public function updateConfig(Request $request, Server $server): JsonResponse
    {
        $request->user()->can('file.update', $server);

        $filePath = $request->input('file');
        $updates = $request->input('updates', []);

        try {
            $contents = $this->fileRepository
                ->setServer($server)
                ->getContent($filePath);

            $parsed = Yaml::parse($contents);

            // Apply updates
            foreach ($updates as $update) {
                $path = explode('.', $update['path']);
                $this->setNestedValue($parsed, $path, $update['value']);
            }

            $newContent = Yaml::dump($parsed, 10, 2);

            $this->fileRepository
                ->setServer($server)
                ->putContent($filePath, $newContent);

            return new JsonResponse(['success' => true]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Could not update config file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Parse .properties file into array
     */
    private function parseProperties(string $contents): array
    {
        $properties = [];
        $lines = explode("\n", $contents);

        foreach ($lines as $line) {
            $line = trim($line);
            
            // Skip comments and empty lines
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $key = trim($parts[0]);
                $value = trim($parts[1]);

                // Convert to appropriate type
                if ($value === 'true') {
                    $value = true;
                } elseif ($value === 'false') {
                    $value = false;
                } elseif (is_numeric($value)) {
                    $value = str_contains($value, '.') ? (float)$value : (int)$value;
                }

                $properties[$key] = $value;
            }
        }

        return $properties;
    }

    /**
     * Build .properties file from array
     */
    private function buildPropertiesFile(array $properties): string
    {
        $lines = ["#Minecraft server properties", "#Generated by Pterodactyl Panel", ""];

        foreach ($properties as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $lines[] = "{$key}={$value}";
        }

        return implode("\n", $lines);
    }

    /**
     * Build config sections from parsed YAML
     */
    private function buildConfigSections(array $data, string $basePath, string $parentPath = ''): array
    {
        $sections = [];
        $currentSection = ['name' => $parentPath ?: 'General', 'options' => []];

        foreach ($data as $key => $value) {
            $fullPath = $parentPath ? "{$parentPath}.{$key}" : $key;

            if (is_array($value) && $this->isAssociativeArray($value)) {
                // If we have accumulated options, add them as a section
                if (!empty($currentSection['options'])) {
                    $sections[] = $currentSection;
                    $currentSection = ['name' => $key, 'options' => []];
                }

                // Recursively process nested arrays
                $nested = $this->buildConfigSections($value, $basePath, $fullPath);
                $sections = array_merge($sections, $nested);
            } else {
                // Add as option
                $type = $this->getValueType($value);
                $currentSection['options'][] = [
                    'key' => $key,
                    'value' => $value,
                    'type' => $type,
                    'path' => $fullPath,
                    'description' => $this->generateDescription($key, $fullPath, $value),
                ];
            }
        }

        // Add remaining options
        if (!empty($currentSection['options'])) {
            $sections[] = $currentSection;
        }

        return $sections;
    }

    /**
     * Check if array is associative
     */
    private function isAssociativeArray($arr): bool
    {
        if (!is_array($arr)) {
            return false;
        }
        return array_keys($arr) !== range(0, count($arr) - 1);
    }

    /**
     * Get value type
     */
    private function getValueType($value): string
    {
        if (is_bool($value)) {
            return 'boolean';
        }
        if (is_int($value) || is_float($value)) {
            return 'number';
        }
        if (is_array($value)) {
            return $this->isAssociativeArray($value) ? 'object' : 'list';
        }
        return 'string';
    }

    /**
     * Set nested value in array using dot notation path
     */
    private function setNestedValue(array &$array, array $path, $value): void
    {
        $key = array_shift($path);

        if (empty($path)) {
            $array[$key] = $value;
        } else {
            if (!isset($array[$key]) || !is_array($array[$key])) {
                $array[$key] = [];
            }
            $this->setNestedValue($array[$key], $path, $value);
        }
    }

    /**
     * Discover all YAML config files in the server directory
     */
    private function discoverConfigFiles(Server $server): array
    {
        $files = [];
        
        // Common config file locations and patterns
        $searchPaths = [
            '/' => ['*.yml', '*.yaml'],
            '/config/' => ['*.yml', '*.yaml'],
            '/plugins/' => [], // We'll skip plugins for now as there could be hundreds
        ];

        foreach ($searchPaths as $directory => $patterns) {
            try {
                $dirContents = $this->fileRepository
                    ->setServer($server)
                    ->getDirectory($directory);

                foreach ($dirContents as $item) {
                    if (!$item->isFile()) {
                        continue;
                    }

                    $fileName = $item->name();
                    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                    
                    // Only include .yml and .yaml files
                    if (!in_array($extension, ['yml', 'yaml'])) {
                        continue;
                    }

                    // Skip some files that aren't config files
                    $skipFiles = ['commands.yml', 'help.yml', 'permissions.yml'];
                    if (in_array($fileName, $skipFiles)) {
                        continue;
                    }

                    $fullPath = $directory === '/' ? '/' . $fileName : $directory . $fileName;
                    $name = $this->generateConfigName($fileName, $fullPath);

                    $files[] = [
                        'path' => $fullPath,
                        'name' => $name,
                    ];
                }
            } catch (\Exception $e) {
                // Directory doesn't exist or can't be read
                continue;
            }
        }

        return $files;
    }

    /**
     * Generate a friendly name for a config file
     */
    private function generateConfigName(string $fileName, string $fullPath): string
    {
        $baseName = pathinfo($fileName, PATHINFO_FILENAME);
        
        // Known config file mappings
        $knownConfigs = [
            'bukkit' => 'Bukkit',
            'spigot' => 'Spigot',
            'paper' => 'Paper',
            'paper-global' => 'Paper Global',
            'paper-world-defaults' => 'Paper World Defaults',
            'purpur' => 'Purpur',
            'pufferfish' => 'Pufferfish',
            'tuinity' => 'Tuinity',
            'airplane' => 'Airplane',
            'config' => 'Configuration',
        ];

        if (isset($knownConfigs[$baseName])) {
            return $knownConfigs[$baseName];
        }

        // For files in /config/ directory, add "Config" suffix
        if (str_starts_with($fullPath, '/config/')) {
            return ucfirst($baseName) . ' Config';
        }

        // Default: capitalize the filename
        return ucfirst(str_replace(['-', '_'], ' ', $baseName));
    }

    /**
     * Generate description for config option based on key and context
     */
    private function generateDescription(string $key, string $path, $value): string
    {
        // Common config option descriptions
        $descriptions = [
            // Performance & Optimization
            'max-tick-time' => 'Maximum time in milliseconds a single tick may take before the server watchdog stops the server',
            'view-distance' => 'The number of chunks the server will send to clients (affects performance)',
            'simulation-distance' => 'Distance in chunks around a player where the game will process entities and blocks',
            'chunk-gc-period' => 'Period in ticks for chunk garbage collection',
            'max-auto-save-chunks-per-tick' => 'Maximum number of chunks to save per tick during auto-save',
            'tick-inactive-villagers' => 'Whether to tick villagers outside of activation range',
            'mob-spawn-range' => 'Radius in chunks around players where mobs can spawn',
            'entity-activation-range' => 'Distance at which entities become active',
            'max-entity-collisions' => 'Maximum number of entities that can collide with each other',
            'use-faster-eigencraft-redstone' => 'Use optimized redstone implementation',
            
            // Network & Connection
            'connection-throttle' => 'Time in milliseconds between connection attempts from the same IP',
            'network-compression-threshold' => 'Threshold for packet compression in bytes (-1 to disable)',
            'timeout-time' => 'Time in seconds before a player is kicked for being idle',
            'rate-limit' => 'Number of packets per second a player can send before being kicked',
            'max-packet-rate' => 'Maximum packet rate before kicking player',
            
            // Spawn & Entities
            'spawn-protection' => 'Radius in blocks around spawn where only operators can build',
            'spawn-limits' => 'Maximum number of entities that can spawn per world',
            'monster-spawn-max-light-level' => 'Maximum light level at which monsters can spawn',
            'animal-spawns-per-chunk' => 'Maximum number of animals that can spawn per chunk',
            'monster-spawns-per-chunk' => 'Maximum number of monsters that can spawn per chunk',
            'water-ambient-spawns-per-chunk' => 'Maximum number of water ambient mobs per chunk',
            'water-creature-spawns-per-chunk' => 'Maximum number of water creatures per chunk',
            'ambient-spawns-per-chunk' => 'Maximum number of ambient mobs (bats) per chunk',
            
            // Gameplay & Mechanics
            'difficulty' => 'Game difficulty setting (peaceful, easy, normal, hard)',
            'hardcore' => 'Enable hardcore mode where players are banned on death',
            'pvp' => 'Enable player versus player combat',
            'allow-flight' => 'Allow players to fly in survival mode',
            'disable-chest-cat-detection' => 'Allow chests to open even with cats sitting on them',
            'fix-curing-zombie-villager-discount-exploit' => 'Prevent infinite discount exploit from curing zombie villagers',
            'baby-zombie-movement-modifier' => 'Movement speed multiplier for baby zombies',
            'zombie-aggressive-towards-villager' => 'Whether zombies target and attack villagers',
            'experience-merge-max-value' => 'Maximum value of experience orbs before they stop merging',
            
            // World & Generation
            'seed' => 'World generation seed (leave empty for random)',
            'generator-settings' => 'Custom world generation settings in JSON format',
            'level-type' => 'Type of world to generate (normal, flat, amplified, etc.)',
            'generate-structures' => 'Generate structures like villages, temples, and strongholds',
            'max-build-height' => 'Maximum height players can build to',
            
            // Anti-cheat & Security
            'prevent-proxy-connections' => 'Prevent players from connecting through proxy servers (requires BungeeCord disabled)',
            'max-players' => 'Maximum number of players that can join the server',
            'enable-player-collisions' => 'Allow players to collide and push each other',
            'player-blocking-damage-multiplier' => 'Damage multiplier when player is blocking with shield',
            
            // Redstone & Mechanics
            'redstone-implementation' => 'Redstone calculation algorithm (eigencraft, vanilla, alternate)',
            'hopper-transfer' => 'Ticks between hopper item transfers',
            'hopper-check' => 'Ticks between hopper inventory checks',
            'hopper-amount' => 'Number of items hoppers transfer at once',
            'disable-teleportation-suffocation-check' => 'Skip suffocation check when teleporting',
            
            // Containers & Storage
            'max-container-distance' => 'Maximum distance player can be from container to access it',
            'container-update-tick-rate' => 'Ticks between container inventory updates',
            
            // Chat & Messaging
            'chat-threads-enabled' => 'Enable chat message threading',
            'enable-command-block' => 'Allow command blocks to function',
            'command-block-console' => 'Show command block output in console',
            
            // Logging & Debugging
            'log-villager-deaths' => 'Log villager deaths to console',
            'log-named-deaths' => 'Log deaths of named entities',
            'verbose' => 'Enable verbose logging',
            
            // Paper-specific
            'async-chunks' => 'Load chunks asynchronously for better performance',
            'use-alternate-keepalive' => 'Use alternate keepalive packet handling',
            'use-versioned-world' => 'Use versioned world format',
            'armor-stands-tick' => 'Whether armor stands tick (disable for better performance)',
            'per-player-mob-spawns' => 'Use per-player mob spawning for better distribution',
            
            // Purpur-specific
            'idle-timeout' => 'AFK timeout settings',
            'tps-catchup' => 'Whether server tries to catch up after lag spikes',
            'advancement-disable-saving' => 'Disable saving advancements to improve performance',
            
            // Pufferfish-specific
            'dab-enabled' => 'Enable Dynamic Activation of Brains optimization',
            'activation-dist-mod' => 'Modifier for entity activation distance',
        ];

        // Check exact matches
        $lowerKey = strtolower($key);
        if (isset($descriptions[$lowerKey])) {
            return $descriptions[$lowerKey];
        }

        // Check partial matches
        foreach ($descriptions as $pattern => $desc) {
            if (str_contains($lowerKey, $pattern)) {
                return $desc;
            }
        }

        // Generate based on key name patterns
        if (str_contains($lowerKey, 'enable') || str_contains($lowerKey, 'enabled')) {
            return 'Enable or disable this feature';
        }
        if (str_contains($lowerKey, 'disable') || str_contains($lowerKey, 'disabled')) {
            return 'Disable this feature when set to true';
        }
        if (str_contains($lowerKey, 'max')) {
            return 'Maximum value for ' . str_replace(['-', '_'], ' ', $key);
        }
        if (str_contains($lowerKey, 'min')) {
            return 'Minimum value for ' . str_replace(['-', '_'], ' ', $key);
        }
        if (str_contains($lowerKey, 'timeout')) {
            return 'Timeout duration in seconds';
        }
        if (str_contains($lowerKey, 'delay')) {
            return 'Delay in ticks or seconds';
        }
        if (str_contains($lowerKey, 'distance')) {
            return 'Distance in blocks or chunks';
        }
        if (str_contains($lowerKey, 'radius')) {
            return 'Radius in blocks';
        }
        if (str_contains($lowerKey, 'limit')) {
            return 'Limit for ' . str_replace(['-', '_'], ' ', $key);
        }
        if (str_contains($lowerKey, 'range')) {
            return 'Range in blocks or chunks for ' . str_replace(['-', '_'], ' ', $key);
        }
        if (str_contains($lowerKey, 'rate')) {
            return 'Rate at which this occurs';
        }
        if (str_contains($lowerKey, 'period')) {
            return 'Time period in ticks';
        }
        if (str_contains($lowerKey, 'interval')) {
            return 'Interval between occurrences in ticks';
        }
        if (str_contains($lowerKey, 'multiplier')) {
            return 'Multiplier applied to base value';
        }
        if (str_contains($lowerKey, 'threshold')) {
            return 'Threshold value for triggering this behavior';
        }
        if (str_contains($lowerKey, 'per-chunk')) {
            return 'Value per chunk';
        }
        if (str_contains($lowerKey, 'spawn')) {
            return 'Controls spawning behavior';
        }
        if (str_contains($lowerKey, 'tick')) {
            return 'Controls tick behavior or timing';
        }

        // Default description
        return 'Configuration option for ' . str_replace(['-', '_'], ' ', $key);
    }

        // Check exact matches
        $lowerKey = strtolower($key);
        if (isset($descriptions[$lowerKey])) {
            return $descriptions[$lowerKey];
        }

        // Check partial matches
        foreach ($descriptions as $pattern => $desc) {
            if (str_contains($lowerKey, $pattern)) {
                return $desc;
            }
        }

        // Generate based on key name
        if (str_contains($lowerKey, 'enable') || str_contains($lowerKey, 'enabled')) {
            return 'Enable or disable this feature';
        }
        if (str_contains($lowerKey, 'max')) {
            return 'Maximum value for ' . str_replace(['-', '_'], ' ', $key);
        }
        if (str_contains($lowerKey, 'min')) {
            return 'Minimum value for ' . str_replace(['-', '_'], ' ', $key);
        }
        if (str_contains($lowerKey, 'timeout')) {
            return 'Timeout duration in seconds';
        }
        if (str_contains($lowerKey, 'delay')) {
            return 'Delay in ticks or seconds';
        }
        if (str_contains($lowerKey, 'distance')) {
            return 'Distance in blocks or chunks';
        }
        if (str_contains($lowerKey, 'radius')) {
            return 'Radius in blocks';
        }
        if (str_contains($lowerKey, 'limit')) {
            return 'Limit for ' . str_replace(['-', '_'], ' ', $key);
        }

        // Default description
        return 'Configuration option for ' . str_replace(['-', '_'], ' ', $key);
    }
}
