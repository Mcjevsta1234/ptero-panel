<?php

namespace Pterodactyl\Http\Controllers\Admin\Witchcrafter;

use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Providers\WitchcrafterServiceProvider;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Psr\Log\LoggerInterface;

class WitchcrafterController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
    ) {
    }

    /**
     * Reset WitchyWorlds theme settings to default.
     */
    public function resetToDefaults(): RedirectResponse
    {
        $service = new WitchcrafterServiceProvider(app());
        $settings = app(SettingsRepositoryInterface::class);
        $log = app(LoggerInterface::class);

        $service->resetToDefaults($settings, $log);

        $this->alert->success('All settings have been reset to defaults.')->flash();

        return redirect()->route('admin.witchcrafter');
    }
}
