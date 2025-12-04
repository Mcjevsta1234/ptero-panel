<?php

namespace Pterodactyl\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CurseForgeModpackService
{
    private const BASE_URL = 'https://api.curseforge.com/v1';
    private const MINECRAFT_GAME_ID = 432;
    private const MODPACK_CLASS_ID = 4471;

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.curseforge.api_key', '');
    }

    /**
     * Search for modpacks.
     */
    public function search(string $searchQuery = '', int $pageSize = 20, int $page = 1): array
    {
        if (empty($this->apiKey)) {
            Log::error('CurseForge API key is not configured');
            return ['data' => [], 'total' => 0];
        }

        try {
            $index = ($page - 1) * $pageSize;
            
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ])->get(self::BASE_URL . '/mods/search', [
                'gameId' => self::MINECRAFT_GAME_ID,
                'classId' => self::MODPACK_CLASS_ID,
                'searchFilter' => $searchQuery,
                'pageSize' => $pageSize,
                'index' => $index,
                'sortField' => 2, // Popularity
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
                'data' => collect($data['data'] ?? [])->map(fn($modpack) => [
                    'id' => (string) $modpack['id'],
                    'name' => $modpack['name'],
                    'description' => $modpack['summary'] ?? '',
                    'iconUrl' => $modpack['logo']['url'] ?? null,
                    'url' => $modpack['links']['websiteUrl'] ?? null,
                    'downloadCount' => $modpack['downloadCount'] ?? 0,
                ])->toArray(),
                'total' => $data['pagination']['totalCount'] ?? 0,
            ];
        } catch (\Exception $e) {
            Log::error('CurseForge API search exception', ['error' => $e->getMessage()]);
            return ['data' => [], 'total' => 0];
        }
    }

    /**
     * Get modpack versions.
     */
    public function versions(string $modpackId): array
    {
        if (empty($this->apiKey)) {
            return [];
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ])->get(self::BASE_URL . "/mods/{$modpackId}/files", [
                'pageSize' => 50,
            ]);

            if (!$response->successful()) {
                return [];
            }

            $data = $response->json();
            
            return collect($data['data'] ?? [])->map(fn($file) => [
                'id' => (string) $file['id'],
                'name' => $file['displayName'],
                'gameVersions' => $file['gameVersions'] ?? [],
                'fileDate' => $file['fileDate'],
            ])->toArray();
        } catch (\Exception $e) {
            Log::error('CurseForge versions exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get modpack details.
     */
    public function details(string $modpackId): ?array
    {
        if (empty($this->apiKey)) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'x-api-key' => $this->apiKey,
            ])->get(self::BASE_URL . "/mods/{$modpackId}");

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json('data');
            
            return [
                'id' => (string) $data['id'],
                'name' => $data['name'],
                'description' => $data['summary'] ?? '',
                'iconUrl' => $data['logo']['url'] ?? null,
                'url' => $data['links']['websiteUrl'] ?? null,
            ];
        } catch (\Exception $e) {
            Log::error('CurseForge details exception', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
