<?php

namespace Pterodactyl\Services\Mods;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class SpigotService
{
    private Client $client;
    private string $baseUrl = 'https://api.spiget.org/v2';

    public function __construct()
    {
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'Accept' => 'application/json',
                'User-Agent' => 'Pterodactyl-Panel',
            ],
        ]);
    }

    /**
     * Search for plugins on Spigot
     */
    public function search(string $query, int $size = 20): array
    {
        try {
            $response = $this->client->get('/search/resources/' . urlencode($query), [
                'query' => [
                    'size' => $size,
                    'sort' => '-downloads',
                ]
            ]);
            
            $results = json_decode($response->getBody()->getContents(), true);
            
            // Get full details for each result
            $detailedResults = [];
            foreach (array_slice($results ?? [], 0, $size) as $result) {
                try {
                    $resource = $this->getResource($result['id']);
                    if ($resource) {
                        $detailedResults[] = $resource;
                    }
                } catch (\Exception $e) {
                    Log::warning("Failed to get Spigot resource {$result['id']}: " . $e->getMessage());
                }
            }
            
            return $detailedResults;
        } catch (\Exception $e) {
            Log::error('Spigot search failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get resource details
     */
    public function getResource(int $resourceId): ?array
    {
        try {
            $response = $this->client->get("/resources/{$resourceId}");
            $data = json_decode($response->getBody()->getContents(), true);

            // Get latest version
            $versions = $this->getVersions($resourceId);
            $latestVersion = $versions[0] ?? null;

            return [
                'id' => $data['id'],
                'name' => $data['name'] ?? $data['title'] ?? 'Unknown',
                'tag' => $data['tag'] ?? '',
                'downloads' => $data['downloads'] ?? 0,
                'rating' => $data['rating']['average'] ?? 0,
                'author' => $data['author']['name'] ?? 'Unknown',
                'icon' => $data['icon']['url'] ?? null,
                'latest_version' => $latestVersion,
            ];
        } catch (\Exception $e) {
            Log::error('Spigot get resource failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get resource versions
     */
    public function getVersions(int $resourceId): array
    {
        try {
            $response = $this->client->get("/resources/{$resourceId}/versions", [
                'query' => ['size' => 10, 'sort' => '-releaseDate']
            ]);
            return json_decode($response->getBody()->getContents(), true) ?? [];
        } catch (\Exception $e) {
            Log::error('Spigot get versions failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get download URL for a specific version
     */
    public function getDownloadUrl(int $resourceId, int $versionId): string
    {
        return "https://api.spiget.org/v2/resources/{$resourceId}/versions/{$versionId}/download";
    }

    /**
     * Get download URL for latest version
     */
    public function getLatestDownloadUrl(int $resourceId): string
    {
        return "https://api.spiget.org/v2/resources/{$resourceId}/download";
    }
}
