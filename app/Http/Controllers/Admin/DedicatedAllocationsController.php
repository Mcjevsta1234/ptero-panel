<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Pterodactyl\Models\User;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\Nest;
use Pterodactyl\Models\DedicatedServerAllocation;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class DedicatedAllocationsController extends BaseController
{
    /**
     * Display all dedicated server allocations.
     */
    public function index(Request $request): View
    {
        $allocations = DedicatedServerAllocation::query()
            ->with(['user', 'node'])
            ->when($request->input('user_id'), function ($query, $userId) {
                return $query->where('user_id', $userId);
            })
            ->when($request->input('node_id'), function ($query, $nodeId) {
                return $query->where('node_id', $nodeId);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(25);

        return view('admin.dedicated.index', [
            'allocations' => $allocations,
            'users' => User::orderBy('email')->get(),
            'nodes' => Node::orderBy('name')->get(),
        ]);
    }

    /**
     * Show form to create a new allocation.
     */
    public function create(): View
    {
        return view('admin.dedicated.create', [
            'users' => User::orderBy('email')->get(),
            'nodes' => Node::orderBy('name')->get(),
            'nests' => Nest::with('eggs')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a new dedicated server allocation.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'node_id' => 'required|exists:nodes,id',
            'name' => 'nullable|string|max:255',
            'memory' => 'required|integer|min:128',
            'disk' => 'required|integer|min:512',
            'cpu' => 'required|integer|min:0',
            'swap' => 'required|integer|min:-1',
            'io' => 'required|integer|min:10|max:1000',
            'allow_memory_overallocation' => 'boolean',
            'allow_disk_overallocation' => 'boolean',
            'port_range_start' => 'nullable|integer|min:1024|max:65535',
            'port_range_end' => 'nullable|integer|min:1024|max:65535|gte:port_range_start',
            'database_limit' => 'required|integer|min:-1',
            'allocation_limit' => 'required|integer|min:-1',
            'backup_limit' => 'required|integer|min:-1',
            'allowed_nests' => 'nullable|array',
            'allowed_nests.*' => 'exists:nests,id',
            'allowed_eggs' => 'nullable|array',
            'allowed_eggs.*' => 'exists:eggs,id',
            'active' => 'boolean',
        ]);

        $validated['allow_memory_overallocation'] = $request->has('allow_memory_overallocation');
        $validated['allow_disk_overallocation'] = $request->has('allow_disk_overallocation');
        $validated['active'] = $request->has('active');

        DedicatedServerAllocation::create($validated);

        return redirect()->route('admin.dedicated.index')
            ->with('success', 'Dedicated server allocation created successfully.');
    }

    /**
     * Show form to edit an allocation.
     */
    public function edit(DedicatedServerAllocation $allocation): View
    {
        return view('admin.dedicated.edit', [
            'allocation' => $allocation->load(['user', 'node', 'servers']),
            'users' => User::orderBy('email')->get(),
            'nodes' => Node::orderBy('name')->get(),
            'nests' => Nest::with('eggs')->orderBy('name')->get(),
        ]);
    }

    /**
     * Update an existing allocation.
     */
    public function update(Request $request, DedicatedServerAllocation $allocation): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'node_id' => 'required|exists:nodes,id',
            'name' => 'nullable|string|max:255',
            'memory' => 'required|integer|min:128',
            'disk' => 'required|integer|min:512',
            'cpu' => 'required|integer|min:0',
            'swap' => 'required|integer|min:-1',
            'io' => 'required|integer|min:10|max:1000',
            'allow_memory_overallocation' => 'boolean',
            'allow_disk_overallocation' => 'boolean',
            'port_range_start' => 'nullable|integer|min:1024|max:65535',
            'port_range_end' => 'nullable|integer|min:1024|max:65535|gte:port_range_start',
            'database_limit' => 'required|integer|min:-1',
            'allocation_limit' => 'required|integer|min:-1',
            'backup_limit' => 'required|integer|min:-1',
            'allowed_nests' => 'nullable|array',
            'allowed_nests.*' => 'exists:nests,id',
            'allowed_eggs' => 'nullable|array',
            'allowed_eggs.*' => 'exists:eggs,id',
            'active' => 'boolean',
        ]);

        $validated['allow_memory_overallocation'] = $request->has('allow_memory_overallocation');
        $validated['allow_disk_overallocation'] = $request->has('allow_disk_overallocation');
        $validated['active'] = $request->has('active');

        $allocation->update($validated);

        return redirect()->route('admin.dedicated.index')
            ->with('success', 'Dedicated server allocation updated successfully.');
    }

    /**
     * Delete an allocation.
     */
    public function destroy(DedicatedServerAllocation $allocation): RedirectResponse
    {
        if ($allocation->servers()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete allocation with existing servers. Delete servers first.');
        }

        $allocation->delete();

        return redirect()->route('admin.dedicated.index')
            ->with('success', 'Dedicated server allocation deleted successfully.');
    }

    /**
     * View detailed allocation info with resource usage.
     */
    public function show(DedicatedServerAllocation $allocation): View
    {
        return view('admin.dedicated.show', [
            'allocation' => $allocation->load(['user', 'node', 'servers.egg']),
            'used' => $allocation->used_resources,
            'available' => $allocation->available_resources,
        ]);
    }
}
