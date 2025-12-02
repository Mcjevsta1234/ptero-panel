<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerAnalytic extends Model
{
    protected $table = 'server_analytics';

    protected $fillable = [
        'server_id',
        'cpu_usage',
        'memory_usage',
        'disk_usage',
        'network_rx',
        'network_tx',
        'recorded_at',
    ];

    protected $casts = [
        'cpu_usage' => 'float',
        'memory_usage' => 'integer',
        'disk_usage' => 'integer',
        'network_rx' => 'integer',
        'network_tx' => 'integer',
        'recorded_at' => 'datetime',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
