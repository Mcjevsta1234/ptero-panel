<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\CurseForgeModService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Jobs\Server\DownloadModJob;

class ModController extends ClientApiController
{
    public function __construct(
        protected CurseForgeModService $curseForgeService
    ) {
        parent::__construct();
    }

    /**
     * Search for mods.
     */
    public function search(Request $request, Server $server): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'required|numeric|integer|min:1',
            'page_size' => 'required|numeric|integer|max:50',
            'search_query' => 'nullable|string',
            'game_version' => 'nullable|string',
            'category_id' => 'nullable|integer',
        ]);

        $page = (int) $validated['page'];
        $pageSize = (int) $validated['page_size'];
        $searchQuery = $validated['search_query'] ?? '';
        $gameVersion = $validated['game_version'] ?? null;
        $categoryId = $validated['category_id'] ?? null;

        $data = $this->curseForgeService->search($searchQuery, $pageSize, $page, $gameVersion, $categoryId);

        return new JsonResponse([
            'object' => 'list',
            'data' => $data['data'],
            'meta' => [
                'pagination' => [
                    'total' => $data['total'],
                    'count' => count($data['data']),
                    'per_page' => $pageSize,
                    'current_page' => $page,
                    'total_pages' => ceil($data['total'] / $pageSize),
                ],
            ],
        ]);
    }

    /**
     * Get mod versions.
     */
    public function versions(Request $request, Server $server, int $modId): JsonResponse
    {
        $versions = $this->curseForgeService->getVersions($modId);

        return new JsonResponse([
            'object' => 'list',
            'data' => $versions,
        ]);
    }

    /**
     * Download a mod.
     */
    public function download(Request $request, Server $server): JsonResponse
    {
        $validated = $request->validate([
            'mod_id' => 'required|integer',
            'file_id' => 'required|integer',
        ]);

        $modId = (int) $validated['mod_id'];
        $fileId = (int) $validated['file_id'];

        $downloadUrl = $this->curseForgeService->getDownloadUrl($modId, $fileId);

        if (!$downloadUrl) {
            return new JsonResponse([
                'error' => 'Failed to get download URL for mod',
            ], 400);
        }

        // Queue the download job
        DownloadModJob::dispatch($server, $downloadUrl);

        return new JsonResponse([
            'object' => 'server_resource_action',
            'attributes' => [
                'completed_at' => null,
            ],
        ]);
    }
}
