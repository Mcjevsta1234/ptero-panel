<?php

namespace Pterodactyl\Http\Controllers\Base;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Allocation;
use Pterodactyl\Models\DedicatedServerAllocation;
use Pterodactyl\Services\Servers\ServerCreationService;
use Pterodactyl\Transformers\Api\Client\ServerTransformer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;
use Illuminate\Support\Str;
use Pterodactyl\Http\Controllers\Controller;

class DedicatedServerController extends Controller
{
    public function __construct(
        private ServerCreationService $creationService,
    ) {
    }

    /**
     * Display the dedicated server management page.
     */
    public function index(Request $request): View
    {
        $allocations = DedicatedServerAllocation::query()
            ->where('user_id', $request->user()->id)
            ->where('active', true)
            ->with(['node', 'servers'])
            ->get();

        return view('base.dedicated.index', [
            'allocations' => $allocations,
        ]);
    }

    /**
     * Show the create server form for a specific allocation.
     */
    public function create(Request $request, DedicatedServerAllocation $allocation): View
    {
        // Check ownership
        if ($allocation->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!$allocation->active) {
            abort(403, 'This allocation is not active.');
        }

        // Get allowed nests and eggs
        $nests = Nest::query()
            ->when($allocation->allowed_nests, function ($query) use ($allocation) {
                return $query->whereIn('id', $allocation->allowed_nests);
            })
            ->with(['eggs' => function ($query) use ($allocation) {
                if ($allocation->allowed_eggs) {
                    $query->whereIn('id', $allocation->allowed_eggs);
                }
            }])
            ->get();

        return view('base.dedicated.create', [
            'allocation' => $allocation,
            'nests' => $nests,
            'used' => $allocation->used_resources,
            'available' => $allocation->available_resources,
        ]);
    }

    /**
     * Create a new server under the dedicated allocation.
     */
    public function store(Request $request, DedicatedServerAllocation $allocation): JsonResponse
    {
        // Check ownership
        if ($allocation->user_id !== $request->user()->id || !$allocation->active) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|min:1|max:191',
            'description' => 'nullable|string|max:191',
            'egg_id' => 'required|exists:eggs,id',
            'memory' => 'required|integer|min:128',
            'disk' => 'required|integer|min:512',
            'cpu' => 'required|integer|min:0',
            'swap' => 'required|integer|min:-1',
            'io' => 'required|integer|min:10|max:1000',
            'databases' => 'required|integer|min:0',
            'allocations_count' => 'required|integer|min:1',
            'backups' => 'required|integer|min:0',
            'startup' => 'nullable|string',
            'environment' => 'nullable|array',
            'docker_image' => 'nullable|string',
        ]);

        // Verify egg is allowed
        $egg = Egg::findOrFail($validated['egg_id']);
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
            $validated['allocations_count'],
            $validated['backups']
        )) {
            return response()->json(['error' => 'Insufficient resources available in your allocation.'], 400);
        }

        // Find available port allocation
        $portAllocation = $this->findAvailableAllocation($allocation);
        if (!$portAllocation) {
            return response()->json(['error' => 'No available ports on this node.'], 500);
        }

        try {
            // Create the server
            $server = $this->creationService->handle([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? '',
                'owner_id' => $request->user()->id,
                'egg_id' => $validated['egg_id'],
                'node_id' => $allocation->node_id,
                'allocation_id' => $portAllocation->id,
                'memory' => $validated['memory'],
                'disk' => $validated['disk'],
                'cpu' => $validated['cpu'],
                'swap' => $validated['swap'],
                'io' => $validated['io'],
                'database_limit' => $validated['databases'],
                'allocation_limit' => $validated['allocations_count'],
                'backup_limit' => $validated['backups'],
                'startup' => $validated['startup'] ?? $egg->startup,
                'environment' => $validated['environment'] ?? [],
                'docker_image' => $validated['docker_image'] ?? array_values($egg->docker_images)[0] ?? '',
                'dedicated_allocation_id' => $allocation->id,
                'start_on_completion' => false,
            ]);

            return response()->json([
                'success' => true,
                'server' => fractal($server, new ServerTransformer())->toArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create server: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Find an available port allocation within the user's range.
     */
    private function findAvailableAllocation(DedicatedServerAllocation $allocation): ?Allocation
    {
        $query = Allocation::query()
            ->where('node_id', $allocation->node_id)
            ->whereNull('server_id');

        // If port range is specified, limit to that range
        if ($allocation->port_range_start && $allocation->port_range_end) {
            $query->whereBetween('port', [$allocation->port_range_start, $allocation->port_range_end]);
        }

        return $query->first();
    }

    /**
     * Get egg details for the create form.
     */
    public function getEgg(Request $request, Egg $egg): JsonResponse
    {
        return response()->json([
            'id' => $egg->id,
            'name' => $egg->name,
            'description' => $egg->description,
            'startup' => $egg->startup,
            'docker_images' => $egg->docker_images,
            'config' => [
                'files' => $egg->inherit_config_files,
                'startup' => $egg->inherit_config_startup,
                'logs' => $egg->inherit_config_logs,
                'stop' => $egg->inherit_config_stop,
            ],
            'variables' => $egg->variables()->get()->map(function ($var) {
                return [
                    'name' => $var->name,
                    'description' => $var->description,
                    'env_variable' => $var->env_variable,
                    'default_value' => $var->default_value,
                    'user_viewable' => $var->user_viewable,
                    'user_editable' => $var->user_editable,
                    'rules' => $var->rules,
                ];
            }),
        ]);
    }
}
