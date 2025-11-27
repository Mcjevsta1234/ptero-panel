<?php

namespace Pterodactyl\Http\Requests\Admin\Witchcrafter;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class AlertSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'witchcrafter:alertType' => 'required|string',
            'witchcrafter:alertMessage' => 'required|string',
        ];
    }

    public function attributes(): array
    {
        return [
            'witchcrafter:alertType' => 'Alert Type',
            'witchcrafter:alertMessage' => 'Alert Message',
        ];
    }
}
