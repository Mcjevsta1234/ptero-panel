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

        // Define config file patterns to look for
        $configPatterns = [
            // Bukkit configs
            ['path' => '/bukkit.yml', 'type' => 'yaml', 'name' => 'Bukkit'],
            
            // Spigot configs
            ['path' => '/spigot.yml', 'type' => 'yaml', 'name' => 'Spigot'],
            
            // Paper configs (1.19+)
            ['path' => '/config/paper-global.yml', 'type' => 'yaml', 'name' => 'Paper Global'],
            ['path' => '/config/paper-world-defaults.yml', 'type' => 'yaml', 'name' => 'Paper World Defaults'],
            
            // Paper configs (legacy, pre-1.19)
            ['path' => '/paper.yml', 'type' => 'yaml', 'name' => 'Paper (Legacy)'],
            
            // Purpur configs
            ['path' => '/purpur.yml', 'type' => 'yaml', 'name' => 'Purpur'],
            
            // Pufferfish configs
            ['path' => '/pufferfish.yml', 'type' => 'yaml', 'name' => 'Pufferfish'],
            
            // Tuinity (merged into Paper but some servers still have it)
            ['path' => '/tuinity.yml', 'type' => 'yaml', 'name' => 'Tuinity'],
            
            // Airplane (discontinued but some servers still use it)
            ['path' => '/airplane.yml', 'type' => 'yaml', 'name' => 'Airplane'],
        ];

        foreach ($configPatterns as $pattern) {
            try {
                $contents = $this->fileRepository
                    ->setServer($server)
                    ->getContent($pattern['path']);

                if ($pattern['type'] === 'yaml') {
                    $parsed = Yaml::parse($contents);
                    $configs[] = [
                        'name' => $pattern['name'],
                        'path' => $pattern['path'],
                        'type' => $pattern['type'],
                        'sections' => $this->buildConfigSections($parsed, $pattern['path']),
                    ];
                }
            } catch (\Exception $e) {
                // Config file doesn't exist, skip it
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
}
