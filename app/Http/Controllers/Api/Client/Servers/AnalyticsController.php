<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerAnalytic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnalyticsController extends ClientApiController
{
    /**
     * Get server analytics data for a specified time range.
     */
    public function index(Request $request, Server $server): JsonResponse
    {
        $this->authorize('view-analytics', $server);

        $request->validate([
            'period' => 'required|in:1h,3h,6h,12h,24h,1d,2d,3d,4d,5d,6d,7d',
        ]);

        $period = $request->input('period');
        $startTime = $this->getStartTime($period);

        $analytics = ServerAnalytic::where('server_id', $server->id)
            ->where('recorded_at', '>=', $startTime)
            ->orderBy('recorded_at', 'asc')
            ->get();

        return new JsonResponse([
            'data' => $analytics->map(function ($record) {
                return [
                    'timestamp' => $record->recorded_at->toIso8601String(),
                    'cpu' => $record->cpu_usage,
                    'memory' => $record->memory_usage,
                    'disk' => $record->disk_usage,
                    'network_rx' => $record->network_rx,
                    'network_tx' => $record->network_tx,
                ];
            }),
        ]);
    }

    /**
     * Store current server stats (called via WebSocket or cron).
     */
    public function store(Request $request, Server $server): JsonResponse
    {
        $request->validate([
            'cpu' => 'required|numeric|min:0',
            'memory' => 'required|integer|min:0',
            'disk' => 'required|integer|min:0',
            'network_rx' => 'required|integer|min:0',
            'network_tx' => 'required|integer|min:0',
        ]);

        $analytic = ServerAnalytic::create([
            'server_id' => $server->id,
            'cpu_usage' => $request->input('cpu'),
            'memory_usage' => $request->input('memory'),
            'disk_usage' => $request->input('disk'),
            'network_rx' => $request->input('network_rx'),
            'network_tx' => $request->input('network_tx'),
            'recorded_at' => now(),
        ]);

        // Clean up old records (keep only last 7 days)
        ServerAnalytic::where('server_id', $server->id)
            ->where('recorded_at', '<', now()->subDays(7))
            ->delete();

        return new JsonResponse(['success' => true], 201);
    }

    private function getStartTime(string $period): Carbon
    {
        return match ($period) {
            '1h' => now()->subHour(),
            '3h' => now()->subHours(3),
            '6h' => now()->subHours(6),
            '12h' => now()->subHours(12),
            '24h', '1d' => now()->subDay(),
            '2d' => now()->subDays(2),
            '3d' => now()->subDays(3),
            '4d' => now()->subDays(4),
            '5d' => now()->subDays(5),
            '6d' => now()->subDays(6),
            '7d' => now()->subDays(7),
            default => now()->subDay(),
        };
    }
}
