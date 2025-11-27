<?php

namespace Pterodactyl\Providers;

use Psr\Log\LoggerInterface as Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Encryption\Encrypter;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;

class WitchcrafterServiceProvider extends ServiceProvider
{
    /**
     * An array of configuration keys to override with database values
     * if they exist.
     */
    protected array $keys = [
        "witchcrafter:customCopyright",
        "witchcrafter:customCopyright",
        "witchcrafter:copyright",
        "witchcrafter:isUnderMaintenance",
        "witchcrafter:maintenance",
        "witchcrafter:colorPrimary",
        "witchcrafter:colorSuccess",
        "witchcrafter:colorDanger",
        "witchcrafter:colorSecondary",
        "witchcrafter:color50",
        "witchcrafter:color100",
        "witchcrafter:color200",
        "witchcrafter:color300",
        "witchcrafter:color400",
        "witchcrafter:color500",
        "witchcrafter:color600",
        "witchcrafter:color700",
        "witchcrafter:color800",
        "witchcrafter:color900",
        "witchcrafter:themeSelector",
        "witchcrafter:background",
        "witchcrafter:radius",
        "witchcrafter:allocationBlur",
        "witchcrafter:fontFamily",
        "witchcrafter:alertType",
        "witchcrafter:alertMessage",
        "witchcrafter:site_color",
        "witchcrafter:site_title",
        "witchcrafter:site_description",
        "witchcrafter:site_image",
        "witchcrafter:site_favicon",
        "witchcrafter:socialBilling",
        "witchcrafter:socialStatus",
        "witchcrafter:socialDiscord",
        "witchcrafter:socialWebsite",
        "witchcrafter:socialKnowledgebase",
        "witchcrafter:socialCustomTitle",
        "witchcrafter:socialCustomUrl",
        "witchcrafter:socialCustom2Title",
        "witchcrafter:socialCustom2Url",
        "witchcrafter:socialCustom3Title",
        "witchcrafter:socialCustom3Url",
        "witchcrafter:socialCustom4Title",
        "witchcrafter:socialCustom4Url",
        "witchcrafter:theme1:name",
        "witchcrafter:theme1:colorPrimary",
        "witchcrafter:theme1:color50",
        "witchcrafter:theme1:color100",
        "witchcrafter:theme1:color200",
        "witchcrafter:theme1:color300",
        "witchcrafter:theme1:color400",
        "witchcrafter:theme1:color500",
        "witchcrafter:theme1:color600",
        "witchcrafter:theme1:color700",
        "witchcrafter:theme1:color800",
        "witchcrafter:theme1:color900",
        "witchcrafter:theme2:name",
        "witchcrafter:theme2:colorPrimary",
        "witchcrafter:theme2:color50",
        "witchcrafter:theme2:color100",
        "witchcrafter:theme2:color200",
        "witchcrafter:theme2:color300",
        "witchcrafter:theme2:color400",
        "witchcrafter:theme2:color500",
        "witchcrafter:theme2:color600",
        "witchcrafter:theme2:color700",
        "witchcrafter:theme2:color800",
        "witchcrafter:theme2:color900",
        "witchcrafter:theme3:name",
        "witchcrafter:theme3:colorPrimary",
        "witchcrafter:theme3:color50",
        "witchcrafter:theme3:color100",
        "witchcrafter:theme3:color200",
        "witchcrafter:theme3:color300",
        "witchcrafter:theme3:color400",
        "witchcrafter:theme3:color500",
        "witchcrafter:theme3:color600",
        "witchcrafter:theme3:color700",
        "witchcrafter:theme3:color800",
        "witchcrafter:theme3:color900",
        "witchcrafter:theme4:name",
        "witchcrafter:theme4:colorPrimary",
        "witchcrafter:theme4:color50",
        "witchcrafter:theme4:color100",
        "witchcrafter:theme4:color200",
        "witchcrafter:theme4:color300",
        "witchcrafter:theme4:color400",
        "witchcrafter:theme4:color500",
        "witchcrafter:theme4:color600",
        "witchcrafter:theme4:color700",
        "witchcrafter:theme4:color800",
        "witchcrafter:theme4:color900",
        "witchcrafter:theme5:name",
        "witchcrafter:theme5:colorPrimary",
        "witchcrafter:theme5:color50",
        "witchcrafter:theme5:color100",
        "witchcrafter:theme5:color200",
        "witchcrafter:theme5:color300",
        "witchcrafter:theme5:color400",
        "witchcrafter:theme5:color500",
        "witchcrafter:theme5:color600",
        "witchcrafter:theme5:color700",
        "witchcrafter:theme5:color800",
        "witchcrafter:theme5:color900",
        "witchcrafter:theme6:name",
        "witchcrafter:theme6:colorPrimary",
        "witchcrafter:theme6:color50",
        "witchcrafter:theme6:color100",
        "witchcrafter:theme6:color200",
        "witchcrafter:theme6:color300",
        "witchcrafter:theme6:color400",
        "witchcrafter:theme6:color500",
        "witchcrafter:theme6:color600",
        "witchcrafter:theme6:color700",
        "witchcrafter:theme6:color800",
        "witchcrafter:theme6:color900",
        "witchcrafter:theme7:name",
        "witchcrafter:theme7:colorPrimary",
        "witchcrafter:theme7:color50",
        "witchcrafter:theme7:color100",
        "witchcrafter:theme7:color200",
        "witchcrafter:theme7:color300",
        "witchcrafter:theme7:color400",
        "witchcrafter:theme7:color500",
        "witchcrafter:theme7:color600",
        "witchcrafter:theme7:color700",
        "witchcrafter:theme7:color800",
        "witchcrafter:theme7:color900",
    ];

    /**
     * Boot the service provider.
     */
    public function boot(ConfigRepository $config, Encrypter $encrypter, Log $log, SettingsRepositoryInterface $settings): void
    {
        try {
            $values = $settings->all()->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->value];
            })->toArray();
        } catch (QueryException $exception) {
            $log->notice('A query exception was encountered while trying to load settings from the database: ' . $exception->getMessage());

            return;
        }

        foreach ($this->keys as $key) {
            $value = array_get($values, 'settings::' . $key, $config->get(str_replace(':', '.', $key)));

            switch (strtolower($value)) {
                case 'true':
                case '(true)':
                    $value = true;
                    break;
                case 'false':
                case '(false)':
                    $value = false;
                    break;
                case 'empty':
                case '(empty)':
                    $value = '';
                    break;
                case 'null':
                case '(null)':
                    $value = null;
            }

            $config->set(str_replace(':', '.', $key), $value);
        }
    }

    public function resetToDefaults(SettingsRepositoryInterface $settings, Log $log): void
    {
        try {
            DB::table('settings')
                ->where('key', 'like', 'settings::witchcrafter:%')
                ->delete();

            $log->info('All Witchcrafter settings have been reset to defaults.');
        } catch (QueryException $exception) {
            $log->error('Failed to reset Witchcrafter settings: ' . $exception->getMessage());
        }
    }

    public static function getEncryptedKeys(): array
    {
        return self::$encrypted;
    }
}
