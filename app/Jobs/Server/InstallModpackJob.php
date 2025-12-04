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
    }
}
