<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\DedicatedServerAllocation;
use Pterodactyl\Services\Servers\ServerCreationService;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\StoreServerRequest;

class DedicatedController extends ClientApiController
{
    public function __construct(
        private ServerCreationService $creationService,
    ) {
        parent::__construct();
    }

    /**
     * Get all allocations for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $allocations = DedicatedServerAllocation::query()
            ->where('user_id', $request->user()->id)
            ->where('active', true)
            ->with(['node', 'servers'])
            ->get()
            ->map(function ($allocation) {
                return [
                    'id' => $allocation->id,
                    'name' => $allocation->name,
                    'user_id' => $allocation->user_id,
                    'node_id' => $allocation->node_id,
                    'node' => [
                        'id' => $allocation->node->id,
                        'name' => $allocation->node->name,
                    ],
                    'cpu' => $allocation->cpu,
                    'memory' => $allocation->memory,
                    'disk' => $allocation->disk,
                    'swap' => $allocation->swap,
                    'io' => $allocation->io,
                    'database_limit' => $allocation->database_limit,
                    'allocation_limit' => $allocation->allocation_limit,
                    'backup_limit' => $allocation->backup_limit,
                    'port_range_start' => $allocation->port_range_start,
                    'port_range_end' => $allocation->port_range_end,
                    'allow_memory_overallocation' => $allocation->allow_memory_overallocation,
                    'allow_disk_overallocation' => $allocation->allow_disk_overallocation,
                    'allowed_nests' => $allocation->allowed_nests,
                    'allowed_eggs' => $allocation->allowed_eggs,
                    'active' => $allocation->active,
                    'used_resources' => $allocation->used_resources,
                    'available_resources' => $allocation->available_resources,
                    'servers' => $allocation->servers->map(fn($s) => [
                        'id' => $s->id,
                        'uuid' => $s->uuid,
                        'name' => $s->name,
                        'identifier' => $s->uuidShort,
                    ]),
                    'servers_count' => $allocation->servers->count(),
                ];
            });

        return new JsonResponse(['data' => $allocations]);
    }

    /**
     * Get nests and eggs available for this allocation.
     */
    public function nests(Request $request, DedicatedServerAllocation $allocation): JsonResponse
    {
        // Check ownership
        if ($allocation->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Access denied.'], 403);
        }

        $nestsQuery = Nest::with('eggs');
        
        // Filter by allowed nests if specified
        if ($allocation->allowed_nests && count($allocation->allowed_nests) > 0) {
            $nestsQuery->whereIn('id', $allocation->allowed_nests);
        }
        
        $nests = $nestsQuery->get()->map(function ($nest) use ($allocation) {
            $eggs = $nest->eggs;
            
            // Filter by allowed eggs if specified
            if ($allocation->allowed_eggs && count($allocation->allowed_eggs) > 0) {
                $eggs = $eggs->whereIn('id', $allocation->allowed_eggs);
            }
            
            return [
                'id' => $nest->id,
                'name' => $nest->name,
                'description' => $nest->description,
                'eggs' => $eggs->map(fn($egg) => [
                    'id' => $egg->id,
                    'name' => $egg->name,
                    'description' => $egg->description,
                    'nest_id' => $egg->nest_id,
                ])->values(),
            ];
        })->filter(fn($nest) => $nest['eggs']->isNotEmpty());

        return new JsonResponse(['nests' => $nests->values()]);
    }

    /**
     * Get egg details for configuration.
     */
    public function egg(Request $request, Egg $egg): JsonResponse
    {
        return new JsonResponse([
            'id' => $egg->id,
            'name' => $egg->name,
            'description' => $egg->description,
            'docker_images' => $egg->docker_images,
            'startup' => $egg->startup,
            'variables' => $egg->variables->map(fn($v) => [
                'name' => $v->name,
                'description' => $v->description,
                'env_variable' => $v->env_variable,
                'default_value' => $v->default_value,
                'user_viewable' => $v->user_viewable,
                'user_editable' => $v->user_editable,
                'rules' => $v->rules,
            ]),
        ]);
    }

    /**
     * Create a server under a dedicated allocation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'allocation_id' => 'required|exists:dedicated_server_allocations,id',
            'name' => 'required|string|min:1|max:191',
            'description' => 'nullable|string|max:191',
            'egg_id' => 'required|exists:eggs,id',
            'memory' => 'required|integer|min:128',
            'disk' => 'required|integer|min:512',
            'cpu' => 'required|integer|min:0',
            'swap' => 'required|integer|min:-1',
            'io' => 'required|integer|min:10|max:1000',
            'databases' => 'required|integer|min:0',
            'allocations' => 'required|integer|min:1',
            'backups' => 'required|integer|min:0',
            'startup' => 'nullable|string',
            'environment' => 'nullable|array',
            'docker_image' => 'nullable|string',
        ]);

        $allocation = DedicatedServerAllocation::findOrFail($validated['allocation_id']);

        // Check ownership and active status
        if ($allocation->user_id !== $request->user()->id || !$allocation->active) {
            return response()->json(['error' => 'Access denied to this allocation.'], 403);
        }

        // Verify egg is allowed
        $egg = Egg::with('nest')->findOrFail($validated['egg_id']);
        if ($allocation->allowed_nests && !in_array($egg->nest_id, $allocation->allowed_nests)) {
            return response()->json(['error' => 'This egg is not allowed for your allocation.'], 403);
        }
        if ($allocation->allowed_eggs && !in_array($egg->id, $allocation->allowed_eggs)) {
            return response()->json(['error' => 'This egg is not allowed for your allocation.'], 403);
        }

        // Check resource availability
        if (!$allocation->canCreateServer(
            $validated['memory'],
            $validated['disk'],
            $validated['cpu'],
            $validated['databases'],
            $validated['allocations'],
            $validated['backups']
        )) {
            return response()->json(['error' => 'Insufficient resources available in your allocation.'], 400);
        }

        // Find an available allocation on the node within the port range
        $nodeAllocation = Allocation::query()
            ->where('node_id', $allocation->node_id)
            ->whereNull('server_id')
            ->when($allocation->port_range_start && $allocation->port_range_end, function ($query) use ($allocation) {
                return $query->whereBetween('port', [$allocation->port_range_start, $allocation->port_range_end]);
            })
            ->first();

        if (!$nodeAllocation) {
            return response()->json(['error' => 'No available allocations on the node within your port range.'], 400);
        }

        // Prepare environment variables
        $environment = $validated['environment'] ?? [];
        foreach ($egg->variables as $variable) {
            if (!isset($environment[$variable->env_variable]) && $variable->default_value) {
                $environment[$variable->env_variable] = $variable->default_value;
            }
        }

        // Create the server
        try {
            $server = $this->creationService->handle([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? '',
                'owner_id' => $request->user()->id,
                'egg_id' => $validated['egg_id'],
                'node_id' => $allocation->node_id,
                'allocation_id' => $nodeAllocation->id,
                'allocation_additional' => [],
                'memory' => $validated['memory'],
                'disk' => $validated['disk'],
                'cpu' => $validated['cpu'],
                'swap' => $validated['swap'],
                'io' => $validated['io'],
                'database_limit' => $validated['databases'],
                'allocation_limit' => $validated['allocations'],
                'backup_limit' => $validated['backups'],
                'startup' => $validated['startup'] ?? $egg->startup,
                'environment' => $environment,
                'docker_image' => $validated['docker_image'] ?? array_key_first($egg->docker_images),
                'start_on_completion' => true,
                'dedicated_allocation_id' => $allocation->id,
            ]);

            return new JsonResponse([
                'id' => $server->id,
                'uuid' => $server->uuid,
                'identifier' => $server->uuidShort,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create server: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get real-time stats for a dedicated allocation.
     */
    public function stats(Request $request, DedicatedServerAllocation $allocation): JsonResponse
    {
        // Check ownership
        if ($allocation->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Access denied.'], 403);
        }

        $servers = $allocation->servers()->with(['egg', 'node'])->get();
        
        // Calculate aggregated stats
        $totalMemoryUsed = $servers->sum('memory');
        $totalDiskUsed = $servers->sum('disk');
        $totalCpuUsed = $servers->sum('cpu');
        
        $serverStats = $servers->map(function ($server) {
            return [
                'id' => $server->id,
                'uuid' => $server->uuid,
                'name' => $server->name,
                'identifier' => $server->uuidShort,
                'egg' => $server->egg ? $server->egg->name : 'Unknown',
                'cpu' => $server->cpu,
                'memory' => $server->memory,
                'disk' => $server->disk,
                'status' => $server->status,
                'suspended' => $server->suspended,
                'created_at' => $server->created_at->toIso8601String(),
            ];
        });

        $node = $allocation->node;
        $nodeMemoryAllocated = $node->servers()->sum('memory');
        $nodeDiskAllocated = $node->servers()->sum('disk');
        $nodeCpuAllocated = $node->servers()->sum('cpu');

        return new JsonResponse([
            'allocation' => [
                'id' => $allocation->id,
                'name' => $allocation->name,
                'node' => [
                    'id' => $allocation->node->id,
                    'name' => $allocation->node->name,
                    'fqdn' => $allocation->node->fqdn,
                    'location' => $allocation->node->location->short ?? 'Unknown',
                ],
                'limits' => [
                    'cpu' => $allocation->cpu,
                    'memory' => $allocation->memory,
                    'disk' => $allocation->disk,
                ],
                'used' => [
                    'cpu' => $totalCpuUsed,
                    'memory' => $totalMemoryUsed,
                    'disk' => $totalDiskUsed,
                    'servers' => $servers->count(),
                ],
                'available' => $allocation->available_resources,
                'overallocation' => [
                    'memory' => $allocation->allow_memory_overallocation,
                    'disk' => $allocation->allow_disk_overallocation,
                ],
            ],
            'node_usage' => [
                'memory_allocated' => $nodeMemoryAllocated,
                'memory_capacity' => $node->memory,
                'disk_allocated' => $nodeDiskAllocated,
                'disk_capacity' => $node->disk,
                'cpu_allocated' => $nodeCpuAllocated,
                'cpu_capacity' => null,
            ],
            'servers' => $serverStats,
        ]);
    }
}
