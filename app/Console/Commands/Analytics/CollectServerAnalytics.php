<?php

namespace Pterodactyl\Console\Commands\Analytics;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerAnalytic;
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
        // Collect 6 times with 10 second intervals to achieve 10-second collection rate
        for ($i = 0; $i < 6; $i++) {
            if ($i > 0) {
                sleep(10);
            }
            $this->collectOnce();
        }

        return 0;
    }

    private function collectOnce(): void
    {
        $servers = Server::with('node')->get();
        $collected = 0;
        $errors = 0;

        foreach ($servers as $server) {
            try {
                // Get current stats from Wings daemon
                $details = $this->daemonRepository->setServer($server)->getDetails();
                
                if (isset($details['state']) && $details['state'] === 'running') {
                    // Wings returns network as cumulative totals, not rates
                    // Map correct field names from Wings API response
                    ServerAnalytic::create([
                        'server_id' => $server->id,
                        'cpu_usage' => $details['utilization']['cpu_absolute'] ?? 0,
                        'memory_usage' => $details['utilization']['memory_bytes'] ?? 0,
                        'disk_usage' => $details['utilization']['disk_bytes'] ?? 0,
                        'network_rx' => $details['utilization']['network']['rx_bytes'] ?? ($details['utilization']['network_rx_bytes'] ?? 0),
                        'network_tx' => $details['utilization']['network']['tx_bytes'] ?? ($details['utilization']['network_tx_bytes'] ?? 0),
                        'recorded_at' => now(),
                    ]);
                    $collected++;
                }
            } catch (\Exception $e) {
                $errors++;
            }
        }

        // Clean up old analytics data (older than 7 days) only on first iteration
        static $cleaned = false;
        if (!$cleaned) {
            ServerAnalytic::where('recorded_at', '<', now()->subDays(7))->delete();
            $cleaned = true;
        }
    }
}
