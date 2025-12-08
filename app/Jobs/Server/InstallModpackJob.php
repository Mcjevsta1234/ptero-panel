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
        $waitForState = function (string $desiredState, int $maxSeconds) use ($daemonServerRepository): bool {
            $elapsed = 0;
            while ($elapsed < $maxSeconds) {
                try {
                    $state = $daemonServerRepository->getDetails()['state'] ?? null;
                    if ($state === $desiredState) {
                        return true;
                    }
                } catch (\Exception $e) {
                    // ignore transient daemon errors
                }

                sleep(1);
                $elapsed++;
            }

            return false;
        };

        // Kill server if running
        $daemonPowerRepository->setServer($this->server)->send('kill');
        $daemonServerRepository->setServer($this->server);

        // Wait for the server to be offline
        $waitForState('offline', 30);

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

        // Wait for installation to complete (up to 5 minutes)
        $waitForState('offline', 300); // wait up to 5 minutes for install to finish

        // Revert the egg back to original
        $startupModificationService->handle($this->server, [
            'egg_id' => $currentEgg->id,
        ]);

        // Wait for egg reversion to complete
        $waitForState('offline', 60);

        // Accept EULA by creating/updating eula.txt
        try {
            $fileRepository->setServer($this->server);
            $fileRepository->putContent('eula.txt', "eula=true\n");
        } catch (\Exception $e) {
            \Log::error('Failed to create eula.txt', ['error' => $e->getMessage()]);
        }

        // Attempt to start the server with retries (helps when version switching)
        $daemonPowerRepository->setServer($this->server);
        $startAttempts = 0;
        while ($startAttempts < 3) {
            try {
                $daemonPowerRepository->send('start');
                // wait for running state
                if ($waitForState('running', 30)) {
                    return;
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to start server after modpack installation', [
                    'attempt' => $startAttempts + 1,
                    'error' => $e->getMessage(),
                    'server_id' => $this->server->id,
                ]);
            }

            $startAttempts++;
            sleep(5);
        }

        \Log::error('Server failed to reach running state after modpack installation', [
            'server_id' => $this->server->id,
        ]);
    }
}
