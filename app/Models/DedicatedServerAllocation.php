<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property int $node_id
 * @property string|null $name
 * @property int $memory
 * @property int $disk
 * @property int $cpu
 * @property int $swap
 * @property int $io
 * @property bool $allow_memory_overallocation
 * @property bool $allow_disk_overallocation
 * @property int|null $port_range_start
 * @property int|null $port_range_end
 * @property int $database_limit
 * @property int $allocation_limit
 * @property int $backup_limit
 * @property array|null $allowed_nests
 * @property array|null $allowed_eggs
 * @property bool $active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property User $user
 * @property Node $node
 */
class DedicatedServerAllocation extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'dedicated_server_allocations';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'node_id',
        'name',
        'memory',
        'disk',
        'cpu',
        'swap',
        'io',
        'allow_memory_overallocation',
        'allow_disk_overallocation',
        'port_range_start',
        'port_range_end',
        'database_limit',
        'allocation_limit',
        'backup_limit',
        'allowed_nests',
        'allowed_eggs',
        'active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'user_id' => 'integer',
        'node_id' => 'integer',
        'memory' => 'integer',
        'disk' => 'integer',
        'cpu' => 'integer',
        'swap' => 'integer',
        'io' => 'integer',
        'allow_memory_overallocation' => 'boolean',
        'allow_disk_overallocation' => 'boolean',
        'port_range_start' => 'integer',
        'port_range_end' => 'integer',
        'database_limit' => 'integer',
        'allocation_limit' => 'integer',
        'backup_limit' => 'integer',
        'allowed_nests' => 'array',
        'allowed_eggs' => 'array',
        'active' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'used_resources',
        'available_resources',
    ];

    /**
     * Get the user that owns this allocation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the node this allocation is for.
     */
    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class);
    }

    /**
     * Get servers created under this allocation.
     */
    public function servers(): HasMany
    {
        return $this->hasMany(Server::class, 'dedicated_allocation_id');
    }

    /**
     * Calculate currently used resources from servers.
     */
    public function getUsedResourcesAttribute(): array
    {
        $servers = $this->servers()->get();
        
        return [
            'memory' => $servers->sum('memory'),
            'disk' => $servers->sum('disk'),
            'cpu' => $servers->sum('cpu'),
            'databases' => $servers->sum('database_limit'),
            'allocations' => $servers->sum('allocation_limit'),
            'backups' => $servers->sum('backup_limit'),
            'server_count' => $servers->count(),
        ];
    }

    /**
     * Calculate available resources.
     */
    public function getAvailableResourcesAttribute(): array
    {
        $used = $this->used_resources;
        
        return [
            'memory' => $this->allow_memory_overallocation ? -1 : ($this->memory - $used['memory']),
            'disk' => $this->allow_disk_overallocation ? -1 : ($this->disk - $used['disk']),
            // CPU: treat 0 as unlimited
            'cpu' => $this->cpu === 0 ? -1 : ($this->cpu - $used['cpu']),
            'databases' => $this->database_limit === -1 ? -1 : ($this->database_limit - $used['databases']),
            'allocations' => $this->allocation_limit === -1 ? -1 : ($this->allocation_limit - $used['allocations']),
            'backups' => $this->backup_limit === -1 ? -1 : ($this->backup_limit - $used['backups']),
        ];
    }

    /**
     * Check if user can create a server with given specs.
     */
    public function canCreateServer(int $memory, int $disk, int $cpu, int $databases = 0, int $allocations = 1, int $backups = 0): bool
    {
        if (!$this->active) {
            return false;
        }

        $available = $this->available_resources;

        // Check memory
        if (!$this->allow_memory_overallocation && $available['memory'] < $memory) {
            return false;
        }

        // Check disk
        if (!$this->allow_disk_overallocation && $available['disk'] < $disk) {
            return false;
        }

        // Check CPU (unlimited when -1)
        if ($available['cpu'] !== -1 && $available['cpu'] < $cpu) {
            return false;
        }

        // Check databases
        if ($available['databases'] !== -1 && $available['databases'] < $databases) {
            return false;
        }

        // Check allocations
        if ($available['allocations'] !== -1 && $available['allocations'] < $allocations) {
            return false;
        }

        // Check backups
        if ($available['backups'] !== -1 && $available['backups'] < $backups) {
            return false;
        }

        return true;
    }
}
