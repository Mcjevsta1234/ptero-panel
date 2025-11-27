<?php

namespace Pterodactyl\Http\Requests\Admin\Witchcrafter;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class ColorSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return all the rules to apply to this request's data.
     */
    public function rules(): array
    {
        return [
            'witchcrafter:colorPrimary' => 'required|string',
            'witchcrafter:colorSuccess' => 'required|string',
            'witchcrafter:colorDanger' => 'required|string',
            'witchcrafter:colorSecondary' => 'required|string',
            'witchcrafter:color50' => 'required|string',
            'witchcrafter:color100' => 'required|string',
            'witchcrafter:color200' => 'required|string',
            'witchcrafter:color300' => 'required|string',
            'witchcrafter:color400' => 'required|string',
            'witchcrafter:color500' => 'required|string',
            'witchcrafter:color600' => 'required|string',
            'witchcrafter:color700' => 'required|string',
            'witchcrafter:color800' => 'required|string',
            'witchcrafter:color900' => 'required|string',

            'witchcrafter:theme1:name'    => 'required|string',
            'witchcrafter:theme1:colorPrimary' => 'required|string',
            'witchcrafter:theme1:color50' => 'required|string',
            'witchcrafter:theme1:color100' => 'required|string',
            'witchcrafter:theme1:color200' => 'required|string',
            'witchcrafter:theme1:color300' => 'required|string',
            'witchcrafter:theme1:color400' => 'required|string',
            'witchcrafter:theme1:color500' => 'required|string',
            'witchcrafter:theme1:color600' => 'required|string',
            'witchcrafter:theme1:color700' => 'required|string',
            'witchcrafter:theme1:color800' => 'required|string',
            'witchcrafter:theme1:color900' => 'required|string',

            'witchcrafter:theme2:name'    => 'required|string',
            'witchcrafter:theme2:colorPrimary' => 'required|string',
            'witchcrafter:theme2:color50' => 'required|string',
            'witchcrafter:theme2:color100' => 'required|string',
            'witchcrafter:theme2:color200' => 'required|string',
            'witchcrafter:theme2:color300' => 'required|string',
            'witchcrafter:theme2:color400' => 'required|string',
            'witchcrafter:theme2:color500' => 'required|string',
            'witchcrafter:theme2:color600' => 'required|string',
            'witchcrafter:theme2:color700' => 'required|string',
            'witchcrafter:theme2:color800' => 'required|string',
            'witchcrafter:theme2:color900' => 'required|string',

            'witchcrafter:theme3:name'    => 'required|string',
            'witchcrafter:theme3:colorPrimary' => 'required|string',
            'witchcrafter:theme3:color50' => 'required|string',
            'witchcrafter:theme3:color100' => 'required|string',
            'witchcrafter:theme3:color200' => 'required|string',
            'witchcrafter:theme3:color300' => 'required|string',
            'witchcrafter:theme3:color400' => 'required|string',
            'witchcrafter:theme3:color500' => 'required|string',
            'witchcrafter:theme3:color600' => 'required|string',
            'witchcrafter:theme3:color700' => 'required|string',
            'witchcrafter:theme3:color800' => 'required|string',
            'witchcrafter:theme3:color900' => 'required|string',

            'witchcrafter:theme4:name'    => 'required|string',
            'witchcrafter:theme4:colorPrimary' => 'required|string',
            'witchcrafter:theme4:color50' => 'required|string',
            'witchcrafter:theme4:color100' => 'required|string',
            'witchcrafter:theme4:color200' => 'required|string',
            'witchcrafter:theme4:color300' => 'required|string',
            'witchcrafter:theme4:color400' => 'required|string',
            'witchcrafter:theme4:color500' => 'required|string',
            'witchcrafter:theme4:color600' => 'required|string',
            'witchcrafter:theme4:color700' => 'required|string',
            'witchcrafter:theme4:color800' => 'required|string',
            'witchcrafter:theme4:color900' => 'required|string',

            'witchcrafter:theme5:name'    => 'required|string',
            'witchcrafter:theme5:colorPrimary' => 'required|string',
            'witchcrafter:theme5:color50' => 'required|string',
            'witchcrafter:theme5:color100' => 'required|string',
            'witchcrafter:theme5:color200' => 'required|string',
            'witchcrafter:theme5:color300' => 'required|string',
            'witchcrafter:theme5:color400' => 'required|string',
            'witchcrafter:theme5:color500' => 'required|string',
            'witchcrafter:theme5:color600' => 'required|string',
            'witchcrafter:theme5:color700' => 'required|string',
            'witchcrafter:theme5:color800' => 'required|string',
            'witchcrafter:theme5:color900' => 'required|string',

            'witchcrafter:theme6:name'    => 'required|string',
            'witchcrafter:theme6:colorPrimary' => 'required|string',
            'witchcrafter:theme6:color50' => 'required|string',
            'witchcrafter:theme6:color100' => 'required|string',
            'witchcrafter:theme6:color200' => 'required|string',
            'witchcrafter:theme6:color300' => 'required|string',
            'witchcrafter:theme6:color400' => 'required|string',
            'witchcrafter:theme6:color500' => 'required|string',
            'witchcrafter:theme6:color600' => 'required|string',
            'witchcrafter:theme6:color700' => 'required|string',
            'witchcrafter:theme6:color800' => 'required|string',
            'witchcrafter:theme6:color900' => 'required|string',

            'witchcrafter:theme7:name'    => 'required|string',
            'witchcrafter:theme7:colorPrimary' => 'required|string',
            'witchcrafter:theme7:color50' => 'required|string',
            'witchcrafter:theme7:color100' => 'required|string',
            'witchcrafter:theme7:color200' => 'required|string',
            'witchcrafter:theme7:color300' => 'required|string',
            'witchcrafter:theme7:color400' => 'required|string',
            'witchcrafter:theme7:color500' => 'required|string',
            'witchcrafter:theme7:color600' => 'required|string',
            'witchcrafter:theme7:color700' => 'required|string',
            'witchcrafter:theme7:color800' => 'required|string',
            'witchcrafter:theme7:color900' => 'required|string',
        ];
    }
}
