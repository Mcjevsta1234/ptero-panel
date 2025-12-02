<?php

namespace Pterodactyl\Services\Mods;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerMod;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class ModInstallerService
{
    public function __construct(
        private CurseForgeService $curseForge,
        private SpigotService $spigot,
        private DaemonFileRepository $fileRepository
    ) {}

    /**
     * Install a mod/plugin on a server
     */
    public function install(Server $server, int $modId, int $fileId, string $type = 'mod', string $source = 'curseforge'): ServerMod
    {
        if ($source === 'spigot' && $type === 'plugin') {
            return $this->installSpigotPlugin($server, $modId, $fileId);
        }

        return $this->installCurseForge($server, $modId, $fileId, $type);
    }

    /**
     * Install from CurseForge
     */
    private function installCurseForge(Server $server, int $modId, int $fileId, string $type): ServerMod
    {
        // Get file details from CurseForge
        $fileData = $this->curseForge->getFile($modId, $fileId);
        $modData = $this->curseForge->getMod($modId);

        // Create database record
        $serverMod = ServerMod::create([
            'server_id' => $server->id,
            'mod_id' => (string) $modId,
            'file_id' => (string) $fileId,
            'name' => $modData['name'] ?? 'Unknown',
            'version' => $fileData['displayName'] ?? 'Unknown',
            'filename' => $fileData['fileName'] ?? 'unknown.jar',
            'type' => $type,
            'status' => 'downloading',
        ]);

        try {
            // Get download URL
            $downloadUrl = $this->curseForge->getFileDownloadUrl($modId, $fileId);

            // Determine installation path based on type
            $path = $type === 'plugin' ? '/plugins/' : '/mods/';

            // Download file to server via Wings
            $this->downloadToServer($server, $downloadUrl, $path . $fileData['fileName']);

            // Update status
            $serverMod->update(['status' => 'installed']);

            return $serverMod;
        } catch (\Exception $e) {
            Log::error("Failed to install mod {$modId}: " . $e->getMessage());
            
            $serverMod->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Install from Spigot
     */
    private function installSpigotPlugin(Server $server, int $resourceId, int $versionId): ServerMod
    {
        $resource = $this->spigot->getResource($resourceId);
        
        if (!$resource) {
            throw new \Exception('Failed to fetch Spigot resource details');
        }

        // Create database record
        $serverMod = ServerMod::create([
            'server_id' => $server->id,
            'mod_id' => (string) $resourceId,
            'file_id' => (string) $versionId,
            'name' => $resource['name'],
            'version' => $resource['latest_version']['name'] ?? 'Latest',
            'filename' => $this->sanitizeFilename($resource['name']) . '.jar',
            'type' => 'plugin',
            'status' => 'downloading',
        ]);

        try {
            // Get download URL
            $downloadUrl = $versionId > 0 
                ? $this->spigot->getDownloadUrl($resourceId, $versionId)
                : $this->spigot->getLatestDownloadUrl($resourceId);

            // Download to plugins folder
            $this->downloadToServer($server, $downloadUrl, '/plugins/' . $serverMod->filename);

            // Update status
            $serverMod->update(['status' => 'installed']);

            return $serverMod;
        } catch (\Exception $e) {
            Log::error("Failed to install Spigot plugin {$resourceId}: " . $e->getMessage());
            
            $serverMod->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Sanitize filename
     */
    private function sanitizeFilename(string $name): string
    {
        return preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
    }

    /**
     * Download file to server via Wings
     */
    private function downloadToServer(Server $server, string $url, string $path): void
    {
        $this->fileRepository->setServer($server)->pull($path, $url);
    }

    /**
     * Uninstall a mod/plugin
     */
    public function uninstall(ServerMod $serverMod): void
    {
        $server = $serverMod->server;
        
        try {
            // Delete file from server
            $path = $serverMod->type === 'plugin' ? '/plugins/' : '/mods/';
            $this->fileRepository->setServer($server)->delete([$path . $serverMod->filename]);

            // Delete database record
            $serverMod->delete();
        } catch (\Exception $e) {
            Log::error("Failed to uninstall mod {$serverMod->id}: " . $e->getMessage());
            throw $e;
        }
    }
}
