<?php

namespace Pterodactyl\Console\Commands\Analytics;

use Pterodactyl\Models\Server;
use App\Models\ServerAnalytic;
use Illuminate\Console\Command;
use Pterodactyl\Repositories\Wings\DaemonServerRepository;

class CollectServerAnalytics extends Command
{
    protected $signature = 'analytics:collect';
    protected $description = 'Collect resource usage analytics for all running servers';

    public function __construct(private DaemonServerRepository $daemonRepository)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $servers = Server::with('node')->get();
        $collected = 0;
        $errors = 0;

        $this->info('Collecting analytics for ' . $servers->count() . ' servers...');

        foreach ($servers as $server) {
            try {
                // Get current stats from Wings daemon
                $details = $this->daemonRepository->setServer($server)->getDetails();
                
                if (isset($details['state']) && $details['state'] === 'running') {
                    ServerAnalytic::create([
                        'server_id' => $server->id,
                        'cpu_usage' => $details['utilization']['cpu_absolute'] ?? 0,
                        'memory_usage' => $details['utilization']['memory_bytes'] ?? 0,
                        'disk_usage' => $details['utilization']['disk_bytes'] ?? 0,
                        'network_rx' => $details['utilization']['network_rx_bytes'] ?? 0,
                        'network_tx' => $details['utilization']['network_tx_bytes'] ?? 0,
                        'recorded_at' => now(),
                    ]);
                    $collected++;
                }
            } catch (\Exception $e) {
                $errors++;
                $this->warn("Failed to collect analytics for server {$server->id}: " . $e->getMessage());
            }
        }

        // Clean up old analytics data (older than 7 days)
        $deleted = ServerAnalytic::where('recorded_at', '<', now()->subDays(7))->delete();

        $this->info("Analytics collection complete: {$collected} collected, {$errors} errors, {$deleted} old records deleted.");

        return 0;
    }
}
