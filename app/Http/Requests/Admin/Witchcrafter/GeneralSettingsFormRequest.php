<?php

namespace Pterodactyl\Http\Requests\Admin\Witchcrafter;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class GeneralSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'witchcrafter:customCopyright' => 'required|in:true,false',
            'witchcrafter:copyright' => 'required|string',
            'witchcrafter:isUnderMaintenance' => 'required|in:true,false',
            'witchcrafter:maintenance' => 'required|string',
        ];
    }

    public function attributes(): array
    {
        return [
            'witchcrafter:customCopyright' => 'Custom Copyright',
            'witchcrafter:copyright' => 'Copyright Text',
            'witchcrafter:isUnderMaintenance' => 'Maintenance',
            'witchcrafter:maintenance' => 'Maintenance Message',
        ];
    }
}
