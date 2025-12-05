<?php

namespace Pterodactyl\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurseForgeModService
{
    private const BASE_URL = 'https://api.curseforge.com/v1';
    private const MINECRAFT_GAME_ID = 432;
    private const MOD_CLASS_ID = 6;

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.curseforge.api_key', '');
    }

    /**
     * Search for mods on CurseForge.
     */
    public function search(string $searchQuery = '', int $pageSize = 20, int $page = 1): array
    {
        if (empty($this->apiKey)) {
            Log::warning('CurseForge API key not configured');
            return ['data' => [], 'total' => 0];
        }

        try {
            $index = ($page - 1) * $pageSize;

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ])->get(self::BASE_URL . '/mods/search', [
                'gameId' => self::MINECRAFT_GAME_ID,
                'classId' => self::MOD_CLASS_ID,
                'searchFilter' => $searchQuery,
                'pageSize' => $pageSize,
                'index' => $index,
                'sortField' => 2,
                'sortOrder' => 'desc',
            ]);

            if (!$response->successful()) {
                Log::error('CurseForge API search failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return ['data' => [], 'total' => 0];
            }

            $data = $response->json();

            return [
                'data' => collect($data['data'] ?? [])->map(fn($mod) => [
                    'id' => (string) $mod['id'],
                    'name' => $mod['name'],
                    'description' => $mod['summary'] ?? '',
                    'icon' => $mod['logo']['url'] ?? null,
                    'url' => $mod['links']['websiteUrl'] ?? null,
                    'downloadCount' => $mod['downloadCount'] ?? 0,
                ])->toArray(),
                'total' => $data['pagination']['totalCount'] ?? 0,
            ];
        } catch (\Exception $e) {
            Log::error('CurseForge mod search exception', ['error' => $e->getMessage()]);
            return ['data' => [], 'total' => 0];
        }
    }

    /**
     * Get available file versions for a mod.
     */
    public function getVersions(int $modId): array
    {
        if (empty($this->apiKey)) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ])->get(self::BASE_URL . "/mods/{$modId}/files", [
                'pageSize' => 50,
                'sortBy' => 0,
            ]);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();

            return collect($data['data'] ?? [])->map(fn($file) => [
                'id' => (string) $file['id'],
                'name' => $file['displayName'],
                'fileName' => $file['fileName'],
                'releaseType' => $file['releaseType'],
                'fileLength' => $file['fileLength'] ?? 0,
                'downloadUrl' => $file['downloadUrl'] ?? null,
                'gameVersions' => $file['gameVersions'] ?? [],
            ])->toArray();
        } catch (\Exception $e) {
            Log::error('CurseForge get versions exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get download URL for a specific file.
     */
    public function getDownloadUrl(int $modId, int $fileId): ?string
    {
        if (empty($this->apiKey)) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ])->get(self::BASE_URL . "/mods/{$modId}/files/{$fileId}/download-url");

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            return $data['data'] ?? null;
        } catch (\Exception $e) {
            Log::error('CurseForge get download URL exception', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
