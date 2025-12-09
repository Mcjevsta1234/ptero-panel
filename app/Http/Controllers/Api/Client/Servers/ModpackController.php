<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;
use Pterodactyl\Jobs\Server\InstallModpackJob;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\CurseForgeModpackService;

class ModpackController extends ClientApiController
{
    public function __construct(
        protected CurseForgeModpackService $curseForgeService
    ) {
        parent::__construct();
    }

    /**
     * List modpacks from CurseForge.
     */
    public function index(Request $request, Server $server): JsonResponse
    {
        $validated = $request->validate([
            'page' => 'required|numeric|integer|min:1',
            'page_size' => 'required|numeric|integer|max:50',
            'search_query' => 'nullable|string',
        ]);

        $page = (int) $validated['page'];
        $pageSize = (int) $validated['page_size'];
        $searchQuery = $validated['search_query'] ?? '';

        $data = $this->curseForgeService->search($searchQuery, $pageSize, $page);

        \Log::debug('ModpackController response data:', [
            'total' => $data['total'],
            'data_count' => count($data['data']),
            'calculated_pages' => ceil($data['total'] / $pageSize),
        ]);

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
     * Get modpack versions.
     */
    public function versions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'modpack_id' => 'required|string|min:1',
        ]);

        $versions = $this->curseForgeService->versions($validated['modpack_id']);

        return new JsonResponse($versions);
    }

    /**
     * Install a modpack.
     */
    public function install(
        GetServerRequest $request,
        Server $server
    ): JsonResponse {
        if (!$request->user()->can(Permission::ACTION_FILE_CREATE, $server)) {
            throw new AuthorizationException();
        }

        $installerEgg = Egg::where('author', 'modpack-installer@ric-rac.org')->first();
        if (!$installerEgg) {
            throw new DisplayException('The modpack installation service (egg) is missing. Please contact your administrator.');
        }

        $validated = $request->validate([
            'modpack_id' => 'required|string',
            'modpack_version_id' => 'required|string',
            'delete_server_files' => 'required|boolean',
            'minecraft_version' => 'nullable|string',
        ]);

        $modpackId = $validated['modpack_id'];
        $modpackVersionId = $validated['modpack_version_id'];
        $deleteServerFiles = (bool) $validated['delete_server_files'];
        $minecraftVersion = $validated['minecraft_version'] ?? null;

        // Dispatch the installation job
        InstallModpackJob::dispatch($server, $modpackId, $modpackVersionId, $deleteServerFiles, $minecraftVersion);

        // Log activity
        $activity = Activity::event('server:modpack.install')
            ->property('modpack_id', $modpackId)
            ->property('modpack_version_id', $modpackVersionId);
        
        if ($details = $this->curseForgeService->details($modpackId)) {
            $activity->property('modpack_name', $details['name']);
        }
        
        $activity->log();

        return new JsonResponse([], 204);
    }
}
