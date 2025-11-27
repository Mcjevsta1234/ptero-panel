<?php

namespace Pterodactyl\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class UpdateChecker extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'p:update:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check For Updates';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $currentVersion = config('app.version');
        $currentBuild = config('app.build');

        $this->line("Current version: <comment>{$currentVersion} ({$currentBuild})</comment>");
        $this->info('Update checking has been disabled.');
        $this->comment('This is a WitchyWorlds custom installation.');

        return Command::SUCCESS;
    }
}
