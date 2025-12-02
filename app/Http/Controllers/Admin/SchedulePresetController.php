<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Prologue\Alerts\AlertsMessageBag;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\SchedulePreset;
use Pterodactyl\Models\SchedulePresetTask;

class SchedulePresetController extends Controller
{
    public function __construct(
        protected AlertsMessageBag $alert,
        protected ViewFactory $view,
    ) {
    }

    public function index(): View
    {
        $presets = SchedulePreset::query()->withCount('tasks')->orderBy('name')->get();
        return $this->view->make('admin.schedule-presets.index', compact('presets'));
    }

    public function create(): View
    {
        return $this->view->make('admin.schedule-presets.form', [
            'preset' => new SchedulePreset(),
            'tasks' => [],
            'mode' => 'create',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatePreset($request);
        $preset = SchedulePreset::create($data);
        $this->syncTasks($preset, $request);

        $this->alert->success('Schedule preset created.')->flash();
        return redirect()->route('admin.schedule-presets.index');
    }

    public function edit(SchedulePreset $preset): View
    {
        $preset->load('tasks');
        return $this->view->make('admin.schedule-presets.form', [
            'preset' => $preset,
            'tasks' => $preset->tasks()->orderBy('sequence_id')->get(),
            'mode' => 'edit',
        ]);
    }

    public function update(Request $request, SchedulePreset $preset): RedirectResponse
    {
        $data = $this->validatePreset($request);
        $preset->forceFill($data)->save();
        $this->syncTasks($preset, $request);

        $this->alert->success('Schedule preset updated.')->flash();
        return redirect()->route('admin.schedule-presets.index');
    }

    public function destroy(SchedulePreset $preset): RedirectResponse
    {
        $preset->delete();
        $this->alert->success('Schedule preset deleted.')->flash();
        return redirect()->route('admin.schedule-presets.index');
    }

    protected function validatePreset(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:191',
            'description' => 'nullable|string',
            'cron_minute' => 'required|string',
            'cron_hour' => 'required|string',
            'cron_day_of_month' => 'required|string',
            'cron_month' => 'required|string',
            'cron_day_of_week' => 'required|string',
            'only_when_online' => 'sometimes|boolean',
        ]);
    }

    protected function syncTasks(SchedulePreset $preset, Request $request): void
    {
        $actions = $request->input('tasks.action', []);
        $payloads = $request->input('tasks.payload', []);
        $offsets = $request->input('tasks.time_offset', []);
        $continues = $request->input('tasks.continue_on_failure', []);

        $preset->tasks()->delete();

        $count = max(count($actions), count($payloads), count($offsets));
        for ($i = 0; $i < $count; $i++) {
            $action = $actions[$i] ?? null;
            if (!$action) { continue; }
            $payload = $payloads[$i] ?? null;
            $offset = (int)($offsets[$i] ?? 0);
            $cont = isset($continues[$i]) && (bool)$continues[$i];
            SchedulePresetTask::create([
                'preset_id' => $preset->id,
                'sequence_id' => $i + 1,
                'action' => $action,
                'payload' => $payload,
                'time_offset' => $offset,
                'continue_on_failure' => $cont,
            ]);
        }
    }
}
