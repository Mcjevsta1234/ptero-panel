<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;

Route::get('/', [Base\IndexController::class, 'index'])->name('index')->fallback();
Route::get('/account', [Base\IndexController::class, 'index'])
    ->withoutMiddleware(RequireTwoFactorAuthentication::class)
    ->name('account');

Route::get('/locales/locale.json', Base\LocaleController::class)
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
    ->where('namespace', '.*');

Route::get('/locales/list.json', [Base\LocaleController::class, 'list'])
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class]);

Route::get('/manifest.json', [Base\PwaManifestController::class, 'index'])
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class]);

/*
|--------------------------------------------------------------------------
| Dedicated Server Management Routes
|--------------------------------------------------------------------------
|
| Endpoint: /dedicated
|
*/
Route::group(['prefix' => 'dedicated'], function () {
    Route::get('/', [Base\DedicatedServerController::class, 'index'])->name('dedicated.index');
    Route::get('/create/{allocation}', [Base\DedicatedServerController::class, 'create'])->name('dedicated.create');
    Route::post('/create/{allocation}', [Base\DedicatedServerController::class, 'store']);
    Route::get('/egg/{egg}', [Base\DedicatedServerController::class, 'getEgg'])->name('dedicated.egg');
});

Route::get('/{react}', [Base\IndexController::class, 'index'])
    ->where('react', '^(?!(\/)?(api|auth|admin|daemon)).+');
