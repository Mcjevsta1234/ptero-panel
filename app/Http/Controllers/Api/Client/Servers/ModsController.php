<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerMod;
use Pterodactyl\Services\Mods\CurseForgeService;
use Pterodactyl\Services\Mods\ModInstallerService;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;
use Illuminate\Http\Request;

class ModsController extends ClientApiController
{
    public function __construct(
        private CurseForgeService $curseForge,
        private SpigotService $spigot,
        private ModInstallerService $installer
    ) {
        parent::__construct();
    }

    /**
     * Search for mods/plugins
     */
    public function search(GetServerRequest $request): JsonResponse
    {
        $query = $request->input('query', '');
        $type = $request->input('type', 'mod'); // mod or plugin
        $source = $request->input('source', 'curseforge'); // curseforge or spigot
        $gameVersion = $request->input('game_version');

        if ($source === 'spigot' && $type === 'plugin') {
            $results = $this->spigot->search($query);
            return new JsonResponse(['data' => $results, 'source' => 'spigot']);
        }

        $classId = $type === 'plugin' ? 5 : 6; // 5 = Bukkit Plugins, 6 = Mods
        $results = $this->curseForge->search($query, $gameVersion, $classId);

        return new JsonResponse(['data' => $results, 'source' => 'curseforge']);
    }

    /**
     * Get mod/plugin files
     */
    public function files(GetServerRequest $request, int $modId): JsonResponse
    {
        $source = $request->input('source', 'curseforge');
        
        if ($source === 'spigot') {
            $versions = $this->spigot->getVersions($modId);
            return new JsonResponse(['data' => $versions, 'source' => 'spigot']);
        }

        $gameVersion = $request->input('game_version');
        $files = $this->curseForge->getModFiles($modId, $gameVersion);

        return new JsonResponse(['data' => $files, 'source' => 'curseforge']);
    }

    /**
     * Get installed mods/plugins
     */
    public function index(GetServerRequest $request): JsonResponse
    {
        $server = $request->getModel(Server::class);
        $type = $request->input('type'); // Filter by type if provided

        $query = ServerMod::where('server_id', $server->id);
        
        if ($type) {
            $query->where('type', $type);
        }

        $mods = $query->orderBy('created_at', 'desc')->get();

        return new JsonResponse($mods);
    }

    /**
     * Install a mod/plugin
     */
    public function install(GetServerRequest $request): JsonResponse
    {
        $server = $request->getModel(Server::class);
        
        $validated = $request->validate([
            'mod_id' => 'required|integer',
            'file_id' => 'required|integer',
            'type' => 'required|in:mod,plugin',
            'source' => 'nullable|in:curseforge,spigot',
        ]);

        $source = $validated['source'] ?? 'curseforge';

        try {
            $serverMod = $this->installer->install(
                $server,
                $validated['mod_id'],
                $validated['file_id'],
                $validated['type'],
                $source
            );

            return new JsonResponse($serverMod, 201);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Uninstall a mod/plugin
     */
    public function uninstall(GetServerRequest $request, int $modId): JsonResponse
    {
        $server = $request->getModel(Server::class);
        $serverMod = ServerMod::where('server_id', $server->id)->where('id', $modId)->firstOrFail();

        try {
            $this->installer->uninstall($serverMod);
            return new JsonResponse(['message' => 'Mod uninstalled successfully']);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
