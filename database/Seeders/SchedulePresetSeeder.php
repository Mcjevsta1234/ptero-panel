<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Pterodactyl\Models\SchedulePreset;
use Pterodactyl\Models\SchedulePresetTask;

class SchedulePresetSeeder extends Seeder
{
    public function run(): void
    {
        if (SchedulePreset::query()->count() > 0) {
            return;
        }

        // Auto Restart (daily at 4am)
        $restart = SchedulePreset::create([
            'name' => 'Auto Restart (Daily 04:00)',
            'description' => 'Restarts the server daily at 4:00 AM.',
            'cron_minute' => '0',
            'cron_hour' => '4',
            'cron_day_of_month' => '*',
            'cron_month' => '*',
            'cron_day_of_week' => '*',
            'only_when_online' => false,
        ]);
        SchedulePresetTask::create([
            'preset_id' => $restart->id,
            'sequence_id' => 1,
            'action' => 'power',
            'payload' => 'restart',
            'time_offset' => 0,
            'continue_on_failure' => false,
        ]);

        // Minecraft: Clear Dropped Items (hourly)
        $clear = SchedulePreset::create([
            'name' => 'MC: Clear Dropped Items (Hourly)',
            'description' => 'Executes an items clear command every hour.',
            'cron_minute' => '0',
            'cron_hour' => '*',
            'cron_day_of_month' => '*',
            'cron_month' => '*',
            'cron_day_of_week' => '*',
            'only_when_online' => true,
        ]);
        SchedulePresetTask::create([
            'preset_id' => $clear->id,
            'sequence_id' => 1,
            'action' => 'command',
            'payload' => 'say Clearing dropped items in 10 seconds...; schedule function clear_items 10s',
            'time_offset' => 0,
            'continue_on_failure' => false,
        ]);
    }
}
