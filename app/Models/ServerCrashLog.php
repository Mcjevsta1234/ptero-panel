<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class ServerCrashLog extends Model
{
    protected $table = 'server_crash_logs';

    protected $fillable = [
        'server_id',
        'filename',
        'log_type',
        'mclo_url',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    /**
     * Gets the server relation.
     */
    public function server()
    {
        return $this->belongsTo(Server::class);
    }
}
