<?php

namespace Pterodactyl\Http\Requests\Admin\Witchcrafter;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class SocialsSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'witchcrafter:socialBilling' => 'required|string',
            'witchcrafter:socialStatus' => 'required|string',
            'witchcrafter:socialDiscord' => 'required|string',
            'witchcrafter:socialWebsite' => 'required|string',
            'witchcrafter:socialKnowledgebase' => 'required|string',
            'witchcrafter:socialTrials' => 'required|string',
        ];
    }

    public function attributes(): array
    {
        return [
            'witchcrafter:socialBilling' => 'Billing URL',
            'witchcrafter:socialStatus' => 'Status URL',
            'witchcrafter:socialDiscord' => 'Discord URL',
            'witchcrafter:socialWebsite' => 'Website URL',
            'witchcrafter:socialKnowledgebase' => 'Knowledgebase URL',
            'witchcrafter:socialTrials' => 'Trials URL',
        ];
    }
}
