<?php

namespace Pterodactyl\Http\Controllers\Admin\Witchcrafter;

use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Witchcrafter\SocialsSettingsFormRequest;

class SocialsController extends Controller
{
    /**
     * SocialsController constructor.
     */
    public function __construct(
        private AlertsMessageBag $alert,
        private ConfigRepository $config,
        private Kernel $kernel,
        private SettingsRepositoryInterface $settings,
        private ViewFactory $view,
    ) {
    }

    /**
     * Render Witchcrafter social links settings UI.
     */
    public function index(): View
    {
        return $this->view->make('admin.witchcrafter.socials');
    }

    /**
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(SocialsSettingsFormRequest $request): RedirectResponse
    {
        foreach ($request->normalize() as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Social links have been updated successfully and the queue worker was restarted to apply these changes.')->flash();

        return redirect()->route('admin.witchcrafter.socials');
    }
}
