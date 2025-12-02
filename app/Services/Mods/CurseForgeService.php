<?php

namespace Pterodactyl\Services\Mods;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class CurseForgeService
{
    private Client $client;
    private string $apiKey;
    private string $baseUrl = 'https://api.curseforge.com/v1';

    public function __construct()
    {
        $this->apiKey = config('services.curseforge.api_key');
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ],
        ]);
    }

    /**
     * Search for mods/plugins
     */
    public function search(string $query, string $gameVersion = null, int $classId = 6): array
    {
        try {
            $params = [
                'gameId' => 432, // Minecraft
                'classId' => $classId, // 6 = Mods, 5 = Bukkit Plugins
                'searchFilter' => $query,
                'pageSize' => 20,
            ];

            if ($gameVersion) {
                $params['gameVersion'] = $gameVersion;
            }

            $response = $this->client->get('/mods/search', ['query' => $params]);
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('CurseForge search failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get popular mods/plugins
     */
    public function getPopular(int $classId = 6, int $pageSize = 50): array
    {
        try {
            $params = [
                'gameId' => 432, // Minecraft
                'classId' => $classId, // 6 = Mods, 5 = Bukkit Plugins
                'pageSize' => $pageSize,
                'sortField' => 2, // 2 = Popularity
                'sortOrder' => 'desc',
            ];

            $response = $this->client->get('/mods/search', ['query' => $params]);
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('CurseForge getPopular failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get mod details
     */
    public function getMod(int $modId): array
    {
        try {
            $response = $this->client->get("/mods/{$modId}");
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('CurseForge get mod failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get mod files
     */
    public function getModFiles(int $modId, string $gameVersion = null): array
    {
        try {
            $params = [];
            if ($gameVersion) {
                $params['gameVersion'] = $gameVersion;
            }

            $response = $this->client->get("/mods/{$modId}/files", ['query' => $params]);
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('CurseForge get mod files failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get specific file details
     */
    public function getFile(int $modId, int $fileId): array
    {
        try {
            $response = $this->client->get("/mods/{$modId}/files/{$fileId}");
            $data = json_decode($response->getBody()->getContents(), true);

            return $data['data'] ?? [];
        } catch (\Exception $e) {
            Log::error('CurseForge get file failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get download URL for a file
     */
    public function getFileDownloadUrl(int $modId, int $fileId): string
    {
        try {
            $response = $this->client->get("/mods/{$modId}/files/{$fileId}/download-url");
            return json_decode($response->getBody()->getContents(), true)['data'] ?? '';
        } catch (\Exception $e) {
            Log::error('CurseForge get download URL failed: ' . $e->getMessage());
            throw $e;
        }
    }
}
