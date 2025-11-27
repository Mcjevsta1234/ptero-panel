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
            'witchcrafter:socialBilling' => 'nullable|string',
            'witchcrafter:socialStatus' => 'nullable|string',
            'witchcrafter:socialDiscord' => 'nullable|string',
            'witchcrafter:socialWebsite' => 'nullable|string',
            'witchcrafter:socialKnowledgebase' => 'nullable|string',
            'witchcrafter:socialCustomTitle' => 'nullable|string',
            'witchcrafter:socialCustomUrl' => 'nullable|string',
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
            'witchcrafter:socialCustomTitle' => 'Custom Link Title',
            'witchcrafter:socialCustomUrl' => 'Custom Link URL',
        ];
    }
}
