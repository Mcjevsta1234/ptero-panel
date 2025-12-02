<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServerMod extends Model
{
    protected $table = 'server_mods';

    protected $fillable = [
        'server_id',
        'mod_id',
        'file_id',
        'name',
        'version',
        'filename',
        'type',
        'status',
        'error_message',
    ];

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
