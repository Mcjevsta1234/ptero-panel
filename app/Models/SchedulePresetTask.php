<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchedulePresetTask extends Model
{
    protected $table = 'schedule_preset_tasks';

    protected $fillable = [
        'preset_id',
        'sequence_id',
        'action',
        'payload',
        'time_offset',
        'continue_on_failure',
    ];

    protected $casts = [
        'preset_id' => 'integer',
        'sequence_id' => 'integer',
        'time_offset' => 'integer',
        'continue_on_failure' => 'boolean',
    ];

    public function preset(): BelongsTo
    {
        return $this->belongsTo(SchedulePreset::class, 'preset_id');
    }
}
