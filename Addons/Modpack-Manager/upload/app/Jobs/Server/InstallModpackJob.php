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
use Pterodactyl\Services\Minecraft\MinecraftSoftwareService;
use Pterodactyl\Services\Servers\ReinstallServerService;
use Pterodactyl\Services\Servers\StartupModificationService;

class InstallModpackJob extends Job implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 1;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Server $server,
        public string $provider,
        public string $modpackId,
        public string $modpackVersionId,
        public bool $deleteServerFiles,
    ) {
    }

    /**
     * Execute the job.
     */
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
        while ($daemonServerRepository->getDetails()['state'] !== 'offline') {
            sleep(1);
        }

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

        $installerEgg = Egg::where('author', 'modpack-installer@ric-rac.org')->firstOrFail();

        $startupModificationService->setUserLevel(User::USER_LEVEL_ADMIN);

        rescue(function () use ($startupModificationService, $installerEgg, $reinstallServerService) {
            $startupModificationService->handle($this->server, [
                'egg_id' => $installerEgg->id,
                'environment' => [
                    'MODPACK_PROVIDER' => $this->provider,
                    'MODPACK_ID' => $this->modpackId,
                    'MODPACK_VERSION_ID' => $this->modpackVersionId,
                ],
            ]);
            $reinstallServerService->handle($this->server);
        });

        // Wait for installation to complete (up to 5 minutes)
        $installAttempts = 0;
        $installerOnline = false;
        
        while ($installAttempts < 300) {  // 300 seconds = 5 minutes
            try {
                $state = $daemonServerRepository->getDetails()['state'];
                if ($state === 'offline') {
                    $installerOnline = true;
                    break;
                }
            } catch (\Exception $e) {
                // Ignore errors while checking state
            }
            sleep(1);
            $installAttempts++;
        }

        // Revert the egg back to what it was.
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

        // Clear the installing status
        $this->server->update(['status' => null]);
    }
}
