<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class SchedulePreset extends Model
{
    protected $table = 'schedule_presets';

    protected $fillable = [
        'name',
        'description',
        'cron_day_of_week',
        'cron_month',
        'cron_day_of_month',
        'cron_hour',
        'cron_minute',
        'only_when_online',
    ];

    protected $casts = [
        'only_when_online' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'id';
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(SchedulePresetTask::class, 'preset_id');
    }
}
