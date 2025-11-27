<?php

namespace Pterodactyl\Http\Requests\Admin\Witchcrafter;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class SiteSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'witchcrafter:site_color' => 'required|string',
            'witchcrafter:site_title' => 'required|string',
            'witchcrafter:site_description' => 'required|string',
            'witchcrafter:site_image' => 'required|string',
            'witchcrafter:site_favicon' => 'required|string',
        ];
    }

    public function attributes(): array
    {
        return [
            'witchcrafter:site_color' => 'Site Color',
            'witchcrafter:site_title' => 'Site Title',
            'witchcrafter:site_description' => 'Site Description',
            'witchcrafter:site_image' => 'Site Banner',
            'witchcrafter:site_favicon' => 'Site Favicon',
        ];
    }
}
