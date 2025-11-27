<?php

namespace Pterodactyl\Http\Requests\Admin\Witchcrafter;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class LookNFeelSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'witchcrafter:themeSelector' => 'required|in:true,false',
            'witchcrafter:background' => 'required|string',
            'witchcrafter:allocationBlur' => 'required|in:true,false',
            'witchcrafter:radius' => 'required|string',
            'witchcrafter:fontFamily' => 'required|string',
        ];
    }

    public function attributes(): array
    {
        return [
            'witchcrafter:themeSelector' => 'Theme Selector',
            'witchcrafter:background' => 'Panel Background',
            'witchcrafter:allocationBlur' => 'Allocation Blur',
            'witchcrafter:radius' => 'Border Radius',
            'witchcrafter:fontFamily' => 'Font Family',
        ];
    }
}
