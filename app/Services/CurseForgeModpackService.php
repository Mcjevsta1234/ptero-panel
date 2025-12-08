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
            $totalFromApi = $data['pagination']['total'] ?? 0;
            
            // Filter modpacks
            $filteredModpacks = collect($data['data'] ?? [])->filter(function ($modpack) {
                // Filter out FTB modpacks (they use custom installers)
                $authors = collect($modpack['authors'] ?? []);
                if ($authors->contains(fn($author) => strtolower($author['name'] ?? '') === 'ftb')) {
                    return false;
                }
                
                return true;
            });
            
            return [
                'data' => $filteredModpacks->map(fn($modpack) => [
                    'id' => (string) $modpack['id'],
                    'name' => $modpack['name'],
                    'description' => $modpack['summary'] ?? '',
                    'iconUrl' => $modpack['logo']['url'] ?? null,
                    'url' => $modpack['links']['websiteUrl'] ?? null,
                    'downloadCount' => $modpack['downloadCount'] ?? 0,
                ])->values()->toArray(),
                'total' => $totalFromApi,
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
            
            // Map versions with Java detection (no filtering - let users choose)
            return collect($data['data'] ?? [])->map(function ($file) {
                $gameVersions = $file['gameVersions'] ?? [];
                $minecraftVersion = null;
                $javaVersion = null;
                
                // Find Minecraft version (format like "1.20.1")
                foreach ($gameVersions as $version) {
                    if (preg_match('/^1\.\d+/', $version)) {
                        $minecraftVersion = $version;
                        $javaVersion = self::getJavaVersionForMinecraft($version);
                        break;
                    }
                }
                
                return [
                    'id' => (string) $file['id'],
                    'name' => $file['displayName'],
                    'gameVersions' => $gameVersions,
                    'fileDate' => $file['fileDate'],
                    'minecraftVersion' => $minecraftVersion,
                    'javaVersion' => $javaVersion,
                ];
            })->values()->toArray();
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

    /**
     * Get recommended Java version for a Minecraft version.
     */
    public static function getJavaVersionForMinecraft(string $minecraftVersion): string
    {
        // Extract version number (e.g., "1.20.1" -> 1.20)
        if (preg_match('/^(\d+)\.(\d+)/', $minecraftVersion, $matches)) {
            $major = (int) $matches[1];
            $minor = (int) $matches[2];
            
            // Minecraft 1.20.5+ requires Java 21
            if ($major === 1 && $minor >= 20 && version_compare($minecraftVersion, '1.20.5', '>=')) {
                return '21';
            }
            
            // Minecraft 1.18-1.20.4 requires Java 17
            if ($major === 1 && $minor >= 18) {
                return '17';
            }
            
            // Minecraft 1.17-1.17.1 requires Java 16
            if ($major === 1 && $minor === 17) {
                return '16';
            }
        }
        
        // Minecraft 1.16.5 and below uses Java 8
        return '8';
    }
}
