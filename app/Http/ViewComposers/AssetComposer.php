<?php

namespace Pterodactyl\Http\ViewComposers;

use Illuminate\View\View;
use Pterodactyl\Services\Helpers\AssetHashService;

class AssetComposer
{
    /**
     * AssetComposer constructor.
     */
    public function __construct(private AssetHashService $assetHashService)
    {
    }

    /**
     * Provide access to the asset service in the views.
     */
    public function compose(View $view): void
    {
        $view->with('asset', $this->assetHashService);
        $view->with('siteConfiguration', [
            'name' => config('app.name') ?? 'Reviactyl',
            'logo' => config('app.logo') ?? '/witchyworlds/logo.png',
            'icon' => config('app.icon') ?? '/favicons/favicon.ico',
            'locale' => config('app.locale') ?? 'en',
            'pwa' => config('app.pwa', false),
            'debug' => config('app.debug', false),
            'avatar' => config('app.avatar') ?? 'gravatar',
            'recaptcha' => [
                'enabled' => config('recaptcha.enabled', false),
                'siteKey' => config('recaptcha.website_key') ?? '',
            ],
        ]);
    }
}