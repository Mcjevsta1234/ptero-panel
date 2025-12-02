<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\ServerCrashLog;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\GetServerRequest;
use Illuminate\Http\Request;

class CrashLogController extends ClientApiController
{
    /**
     * Get stored crash logs for a server
     */
    public function index(GetServerRequest $request, Server $server): JsonResponse
    {
        $logs = ServerCrashLog::where('server_id', $server->id)
            ->orderBy('uploaded_at', 'desc')
            ->take(10)
            ->get(['filename', 'log_type', 'mclo_url', 'uploaded_at']);

        return new JsonResponse($logs);
    }

    /**
     * Store a new crash log
     */
    public function store(GetServerRequest $request, Server $server): JsonResponse
    {
        $validated = $request->validate([
            'filename' => 'required|string',
            'log_type' => 'required|in:latest,crash',
            'mclo_url' => 'required|url',
        ]);

        // If storing latest.log, delete previous latest.log entry
        if ($validated['log_type'] === 'latest') {
            ServerCrashLog::where('server_id', $server->id)
                ->where('log_type', 'latest')
                ->delete();
        }

        $log = ServerCrashLog::create([
            'server_id' => $server->id,
            'filename' => $validated['filename'],
            'log_type' => $validated['log_type'],
            'mclo_url' => $validated['mclo_url'],
            'uploaded_at' => now(),
        ]);

        return new JsonResponse($log, 201);
    }

    /**
     * Clear old crash logs (keep only last 24 hours)
     */
    public function cleanup(GetServerRequest $request, Server $server): JsonResponse
    {
        $deleted = ServerCrashLog::where('server_id', $server->id)
            ->where('uploaded_at', '<', now()->subDay())
            ->delete();

        return new JsonResponse(['deleted' => $deleted]);
    }
}
