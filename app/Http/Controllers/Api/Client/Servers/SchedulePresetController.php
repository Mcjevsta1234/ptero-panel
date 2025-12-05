<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Helpers\Utilities;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Schedules\ApplyPresetRequest;
use Pterodactyl\Models\Schedule;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;
use Pterodactyl\Models\SchedulePreset;

class SchedulePresetController extends ClientApiController
{
    public function index(Request $request, Server $server): array
    {
        // Listing presets does not create resources; allow if the user can at least read schedules.
        // Gate is enforced by ApplyPresetRequest for applying.
        $presets = SchedulePreset::query()->with('tasks')->orderBy('name')->get();

        return [
            'data' => $presets->map(function (SchedulePreset $p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'cron' => [
                        'minute' => $p->cron_minute,
                        'hour' => $p->cron_hour,
                        'day_of_month' => $p->cron_day_of_month,
                        'month' => $p->cron_month,
                        'day_of_week' => $p->cron_day_of_week,
                    ],
                    'only_when_online' => (bool)$p->only_when_online,
                    'tasks' => $p->tasks->map(fn($t) => [
                        'sequence_id' => $t->sequence_id,
                        'action' => $t->action,
                        'payload' => $t->payload,
                        'time_offset' => $t->time_offset,
                        'continue_on_failure' => (bool)$t->continue_on_failure,
                    ]),
                ];
            }),
        ];
    }

    /**
     * Applies a preset by creating a schedule and tasks on the server.
     *
     * @throws DisplayException
     */
    public function apply(ApplyPresetRequest $request, Server $server): JsonResponse
    {
        $presetId = (int) $request->input('preset_id');
        $name = $request->input('name');

        /** @var SchedulePreset|null $preset */
        $preset = SchedulePreset::query()->with('tasks')->find($presetId);
        if (!$preset) {
            return new JsonResponse(['error' => 'Preset not found'], 404);
        }

        $schedule = new Schedule([
            'server_id' => $server->id,
            'name' => $name ?: $preset->name,
            'cron_minute' => $preset->cron_minute,
            'cron_hour' => $preset->cron_hour,
            'cron_day_of_month' => $preset->cron_day_of_month,
            'cron_month' => $preset->cron_month,
            'cron_day_of_week' => $preset->cron_day_of_week,
            'is_active' => true,
            'only_when_online' => (bool)$preset->only_when_online,
        ]);

        // Compute next run date
        $schedule->next_run_at = Utilities::getScheduleNextRunDate(
            $schedule->cron_minute,
            $schedule->cron_hour,
            $schedule->cron_day_of_month,
            $schedule->cron_month,
            $schedule->cron_day_of_week
        );

        $schedule->save();

        // Create tasks
        foreach ($preset->tasks->sortBy('sequence_id') as $t) {
            Task::create([
                'schedule_id' => $schedule->id,
                'sequence_id' => $t->sequence_id,
                'action' => $t->action,
                'payload' => $t->payload,
                'time_offset' => $t->time_offset,
                'continue_on_failure' => (bool)$t->continue_on_failure,
            ]);
        }

        return new JsonResponse([
            'id' => $schedule->id,
        ], 201);
    }
}
