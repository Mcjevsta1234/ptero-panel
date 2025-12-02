@extends('layouts.admin')

@section('title')
    {{ $mode === 'create' ? 'Create' : 'Edit' }} Schedule Preset
@endsection

@section('content-header')
    <h1>{{ $mode === 'create' ? 'Create' : 'Edit' }} Schedule Preset</h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.schedule-presets.index') }}">Schedule Presets</a></li>
        <li class="active">{{ $mode === 'create' ? 'Create' : 'Edit' }}</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-body">
                    <form method="POST" action="{{ $mode === 'create' ? route('admin.schedule-presets.store') : route('admin.schedule-presets.update', $preset->id) }}">
                        @csrf
                        @if($mode === 'edit')
                            @method('PATCH')
                        @endif
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" name="name" class="form-control" value="{{ old('name', $preset->name) }}" required>
                        </div>
                        <div class="form-group">
                            <label>Description</label>
                            <textarea name="description" class="form-control" rows="2">{{ old('description', $preset->description) }}</textarea>
                        </div>
                        <hr>
                        <h4>Cron Schedule</h4>
                        <div class="row">
                            <div class="col-sm-2"><label>Minute</label><input type="text" class="form-control" name="cron_minute" value="{{ old('cron_minute', $preset->cron_minute ?: '*') }}" required></div>
                            <div class="col-sm-2"><label>Hour</label><input type="text" class="form-control" name="cron_hour" value="{{ old('cron_hour', $preset->cron_hour ?: '*') }}" required></div>
                            <div class="col-sm-2"><label>Day (Month)</label><input type="text" class="form-control" name="cron_day_of_month" value="{{ old('cron_day_of_month', $preset->cron_day_of_month ?: '*') }}" required></div>
                            <div class="col-sm-2"><label>Month</label><input type="text" class="form-control" name="cron_month" value="{{ old('cron_month', $preset->cron_month ?: '*') }}" required></div>
                            <div class="col-sm-2"><label>Day (Week)</label><input type="text" class="form-control" name="cron_day_of_week" value="{{ old('cron_day_of_week', $preset->cron_day_of_week ?: '*') }}" required></div>
                            <div class="col-sm-2"><label>&nbsp;</label><div class="checkbox"><label><input type="checkbox" name="only_when_online" value="1" {{ old('only_when_online', $preset->only_when_online) ? 'checked' : '' }}> Only when server online</label></div></div>
                        </div>
                        <hr>
                        <h4>Tasks</h4>
                        <p class="text-muted">Add the actions this preset will create. Command payloads are sent to the console; power actions are one of: start, stop, restart, kill.</p>
                        <table class="table" id="tasks-table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Action</th>
                                <th>Payload</th>
                                <th>Delay (sec)</th>
                                <th>Continue on Failure</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            @php $rows = old('tasks.action') ? count(old('tasks.action', [])) : max(1, count($tasks)); @endphp
                            @for($i=0; $i<$rows; $i++)
                                @php $task = $tasks[$i] ?? null; @endphp
                                <tr>
                                    <td class="seq">{{ $i+1 }}</td>
                                    <td>
                                        <select name="tasks[action][]" class="form-control">
                                            @php $val = old("tasks.action.$i", $task->action ?? 'command'); @endphp
                                            <option value="command" {{ $val==='command' ? 'selected' : '' }}>command</option>
                                            <option value="power" {{ $val==='power' ? 'selected' : '' }}>power</option>
                                            <option value="backup" {{ $val==='backup' ? 'selected' : '' }}>backup</option>
                                        </select>
                                    </td>
                                    <td>
                                        <input type="text" name="tasks[payload][]" class="form-control" value="{{ old("tasks.payload.$i", $task->payload ?? '') }}" placeholder="e.g., say Clearing items... or restart">
                                    </td>
                                    <td style="width:140px">
                                        <input type="number" name="tasks[time_offset][]" class="form-control" min="0" max="900" value="{{ old("tasks.time_offset.$i", $task->time_offset ?? 0) }}">
                                    </td>
                                    <td class="text-center"><input type="checkbox" name="tasks[continue_on_failure][]" value="1" {{ old("tasks.continue_on_failure.$i", $task->continue_on_failure ?? false) ? 'checked' : '' }}></td>
                                    <td><button type="button" class="btn btn-xs btn-danger" onclick="removeRow(this)">Remove</button></td>
                                </tr>
                            @endfor
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-default" onclick="addRow()">Add Task</button>
                        <hr>
                        <div class="text-right">
                            <a href="{{ route('admin.schedule-presets.index') }}" class="btn btn-default">Cancel</a>
                            <button class="btn btn-primary">{{ $mode === 'create' ? 'Create Preset' : 'Save Changes' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@push('footer-scripts')
<script>
function addRow() {
    const tbody = document.querySelector('#tasks-table tbody');
    const idx = tbody.children.length;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="seq">${idx+1}</td>
        <td>
            <select name="tasks[action][]" class="form-control">
                <option value="command">command</option>
                <option value="power">power</option>
                <option value="backup">backup</option>
            </select>
        </td>
        <td><input type="text" name="tasks[payload][]" class="form-control" placeholder="e.g., say Clearing items... or restart"></td>
        <td style="width:140px"><input type="number" name="tasks[time_offset][]" class="form-control" min="0" max="900" value="0"></td>
        <td class="text-center"><input type="checkbox" name="tasks[continue_on_failure][]" value="1"></td>
        <td><button type="button" class="btn btn-xs btn-danger" onclick="removeRow(this)">Remove</button></td>`;
    tbody.appendChild(tr);
    resequence();
}
function removeRow(btn) {
    const tr = btn.closest('tr');
    tr.parentNode.removeChild(tr);
    resequence();
}
function resequence() {
    document.querySelectorAll('#tasks-table tbody tr .seq').forEach((el, i) => el.textContent = i+1);
}
</script>
@endpush
