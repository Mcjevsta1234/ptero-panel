<?php

namespace Pterodactyl\Jobs\Server;

use Pterodactyl\Jobs\Job;
use Pterodactyl\Models\Server;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class DownloadModJob extends Job implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use SerializesModels;

    public $tries = 3;
    public $timeout = 300;

    public function __construct(
        public Server $server,
        public string $downloadUrl,
    ) {
    }

    public function handle(DaemonFileRepository $fileRepository): void
    {
        // Download the mod file
        $response = Http::timeout(300)->get($this->downloadUrl);

        if (!$response->successful()) {
            throw new \Exception('Failed to download mod file: ' . $response->status());
        }

        // Get filename from Content-Disposition or URL
        $filename = 'mod.jar';
        if ($response->hasHeader('Content-Disposition')) {
            $disposition = $response->header('Content-Disposition');
            if (preg_match('/filename[^;=\n]*=(?:(["\'])([^"\']*)\1|([^;\n]*))/', $disposition, $matches)) {
                $filename = $matches[2] ?: $matches[3];
            }
        } else {
            $path = parse_url($this->downloadUrl, PHP_URL_PATH);
            if ($path) {
                $filename = basename($path);
            }
        }

        // Upload to mods folder
        $fileRepository->setServer($this->server);
        $fileRepository->putContent('mods/' . $filename, $response->body());
    }
}
