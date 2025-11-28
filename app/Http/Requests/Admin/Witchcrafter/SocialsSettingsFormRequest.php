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
            'witchcrafter:socialCustomTitle' => 'required|string',
            'witchcrafter:socialCustomUrl' => 'required|string',
            'witchcrafter:socialCustom2Title' => 'required|string',
            'witchcrafter:socialCustom2Url' => 'required|string',
            'witchcrafter:socialCustom3Title' => 'required|string',
            'witchcrafter:socialCustom3Url' => 'required|string',
            'witchcrafter:socialCustom4Title' => 'required|string',
            'witchcrafter:socialCustom4Url' => 'required|string',
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
            'witchcrafter:socialCustomTitle' => 'Custom Link Title',
            'witchcrafter:socialCustomUrl' => 'Custom Link URL',
            'witchcrafter:socialCustom2Title' => 'Custom Link 2 Title',
            'witchcrafter:socialCustom2Url' => 'Custom Link 2 URL',
            'witchcrafter:socialCustom3Title' => 'Custom Link 3 Title',
            'witchcrafter:socialCustom3Url' => 'Custom Link 3 URL',
            'witchcrafter:socialCustom4Title' => 'Custom Link 4 Title',
            'witchcrafter:socialCustom4Url' => 'Custom Link 4 URL',
            'witchcrafter:socialTrials' => 'Trials URL',
        ];
    }
}
