<?php

namespace Pterodactyl\Jobs\Server;

use Pterodactyl\Jobs\Job;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Servers\StartupModificationService;
use Pterodactyl\Services\JavaVersionService;

class InstallModpackJob extends Job implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    public $tries = 1;
    public $timeout = 300;

    public function __construct(
        public Server $server,
        public string $modpackId,
        public string $modpackVersionId,
        public bool $deleteServerFiles,
        public ?string $minecraftVersion = null,
    ) {
    }

    public function handle(
        StartupModificationService $startupModificationService,
        DaemonFileRepository $fileRepository,
        ReinstallServerService $reinstallServerService,
        DaemonPowerRepository $daemonPowerRepository,
        DaemonServerRepository $daemonServerRepository,
    ): void {
        // Kill server if running
        $daemonPowerRepository->setServer($this->server)->send('kill');
        $daemonServerRepository->setServer($this->server);

        // Wait for the server to be offline
        $attempts = 0;
        while ($daemonServerRepository->getDetails()['state'] !== 'offline' && $attempts < 30) {
            sleep(1);
            $attempts++;
        }

        // Delete files if requested
        if ($this->deleteServerFiles) {
            $fileRepository->setServer($this->server);
            $filesToDelete = collect(
                $fileRepository->getDirectory('/')
            )->pluck('name')->toArray();

            if (count($filesToDelete) > 0) {
                $fileRepository->deleteFiles('/', $filesToDelete);
            }
        }

        $currentEgg = $this->server->egg;

        // Find the installer egg
        $installerEgg = Egg::where('author', 'modpack-installer@ric-rac.org')->firstOrFail();

        $startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);

        // Switch to installer egg and run installation
        rescue(function () use ($startupModificationService, $installerEgg, $reinstallServerService) {
            $startupModificationService->handle($this->server, [
                'egg_id' => $installerEgg->id,
                'environment' => [
                    'MODPACK_PROVIDER' => 'curseforge',
                    'MODPACK_ID' => $this->modpackId,
                    'MODPACK_VERSION_ID' => $this->modpackVersionId,
                ],
            ]);
            $reinstallServerService->handle($this->server);
        });

        // Wait for installation to start
        sleep(10);

        // Revert the egg back to original
        $startupModificationService->handle($this->server, [
            'egg_id' => $currentEgg->id,
        ]);

        // Wait for egg reversion to complete
        sleep(5);

        // Accept EULA by creating/updating eula.txt
        try {
            $fileRepository->setServer($this->server);
            $fileRepository->putContent('eula.txt', "eula=true\n");
        } catch (\Exception $e) {
            \Log::error('Failed to create eula.txt', ['error' => $e->getMessage()]);
        }

        // Wait a moment then start the server
        sleep(2);
        
        try {
            $daemonPowerRepository->setServer($this->server)->send('start');
        } catch (\Exception $e) {
            \Log::error('Failed to start server after modpack installation', ['error' => $e->getMessage()]);
        }

        // Set Java version based on Minecraft version if provided
        if ($this->minecraftVersion) {
            try {
                JavaVersionService::setJavaVersionForServer($this->server, $this->minecraftVersion);
            } catch (\Exception $e) {
                \Log::error('Failed to set Java version', ['error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Detect Java version based on Minecraft version.
     */
    private function getJavaVersionForMinecraft(string $minecraftVersion): string
    {
        // Parse version number
        $versionParts = explode('.', $minecraftVersion);
        $majorVersion = (int) ($versionParts[0] ?? 0);
        $minorVersion = (int) ($versionParts[1] ?? 0);

        // Java version recommendations for Minecraft
        // 1.20+ -> Java 21
        // 1.17-1.19 -> Java 17
        // 1.12-1.16 -> Java 11
        // 1.8-1.11 -> Java 8
        
        if ($majorVersion >= 1) {
            if ($minorVersion >= 20) {
                return 'java21';
            } elseif ($minorVersion >= 17) {
                return 'java17';
            } elseif ($minorVersion >= 12) {
                return 'java11';
            }
        }

        return 'java8';
    }
}
