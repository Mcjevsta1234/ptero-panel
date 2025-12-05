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
    public $timeout = 900;

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

        // Wait a bit for the installer to start
        sleep(3);

        // Wait for installation to complete (up to 10 minutes)
        $installAttempts = 0;
        $lastState = 'unknown';
        $stateChanges = 0;
        
        \Log::info("Starting modpack installation wait for server {$this->server->uuid}");
        
        while ($installAttempts < 600) {  // 600 seconds = 10 minutes
            try {
                $details = $daemonServerRepository->getDetails();
                $state = $details['state'] ?? 'unknown';
                
                // Track state changes to detect crashes
                if ($state !== $lastState) {
                    $stateChanges++;
                    \Log::info("Modpack installer state change for server {$this->server->uuid}: {$lastState} -> {$state}");
                    $lastState = $state;
                }
                
                // If server goes offline, installation is done
                if ($state === 'offline') {
                    \Log::info("Modpack installation completed for server {$this->server->uuid}");
                    break;
                }
            } catch (\Exception $e) {
                \Log::warning("Error checking server state during modpack installation", ['error' => $e->getMessage()]);
            }
            
            sleep(1);
            $installAttempts++;
            
            // Log progress every 30 seconds
            if ($installAttempts % 30 === 0) {
                \Log::info("Modpack installation still running for server {$this->server->uuid}", [
                    'elapsed_seconds' => $installAttempts,
                    'last_state' => $lastState,
                ]);
            }
        }
        
        \Log::info("Modpack installation wait completed for server {$this->server->uuid}", [
            'total_attempts' => $installAttempts,
            'state_changes' => $stateChanges,
            'final_state' => $lastState,
        ]);

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

        // Clear the installing status
        $this->server->update(['status' => null]);
    }
}
