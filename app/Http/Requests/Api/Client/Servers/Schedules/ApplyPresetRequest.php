<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Schedules;

use Pterodactyl\Models\Permission;
use Pterodactyl\Http\Requests\Api\Client\Servers\Schedules\ViewScheduleRequest;

class ApplyPresetRequest extends ViewScheduleRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SCHEDULE_CREATE;
    }

    public function rules(): array
    {
        return [
            'preset_id' => 'required|integer|exists:schedule_presets,id',
            'name' => 'nullable|string|max:191',
        ];
    }
}
