@extends('layouts.admin')

@section('title')
    Edit Dedicated Allocation
@endsection

@section('content-header')
    <h1>Edit Dedicated Allocation<small>Modify allocation for {{ $allocation->user->email }}</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.dedicated.index') }}">Dedicated Servers</a></li>
        <li class="active">Edit</li>
    </ol>
@endsection

@section('content')
    <form action="{{ route('admin.dedicated.update', $allocation->id) }}" method="POST">
        @csrf
        @method('PATCH')
        <div class="row">
            <div class="col-md-6">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Basic Information</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label class="control-label">User</label>
                            <input type="text" class="form-control" value="{{ $allocation->user->email }}" disabled>
                            <p class="text-muted small">User cannot be changed after creation.</p>
                        </div>
                        <div class="form-group">
                            <label class="control-label">Node</label>
                            <input type="text" class="form-control" value="{{ $allocation->node->name }}" disabled>
                            <p class="text-muted small">Node cannot be changed after creation.</p>
                        </div>
                        <div class="form-group">
                            <label for="name" class="control-label">Name (optional)</label>
                            <input type="text" name="name" id="name" class="form-control" value="{{ old('name', $allocation->name) }}" maxlength="255">
                        </div>
                    </div>
                </div>

                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Port Configuration</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label for="port_range_start" class="control-label">Port Range Start *</label>
                            <input type="number" name="port_range_start" id="port_range_start" class="form-control" value="{{ old('port_range_start', $allocation->port_range_start) }}" min="1024" max="65535" required>
                        </div>
                        <div class="form-group">
                            <label for="port_range_end" class="control-label">Port Range End *</label>
                            <input type="number" name="port_range_end" id="port_range_end" class="form-control" value="{{ old('port_range_end', $allocation->port_range_end) }}" min="1024" max="65535" required>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Resource Limits</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label for="cpu" class="control-label">CPU (Percent) *</label>
                            <input type="number" name="cpu" id="cpu" class="form-control" value="{{ old('cpu', $allocation->cpu) }}" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="memory" class="control-label">Memory (MB) *</label>
                            <input type="number" name="memory" id="memory" class="form-control" value="{{ old('memory', $allocation->memory) }}" min="128" step="128" required>
                        </div>
                        <div class="form-group">
                            <label for="disk" class="control-label">Disk (MB) *</label>
                            <input type="number" name="disk" id="disk" class="form-control" value="{{ old('disk', $allocation->disk) }}" min="512" step="512" required>
                        </div>
                        <div class="form-group">
                            <label for="swap" class="control-label">Swap (MB) *</label>
                            <input type="number" name="swap" id="swap" class="form-control" value="{{ old('swap', $allocation->swap) }}" min="-1" required>
                        </div>
                        <div class="form-group">
                            <label for="io" class="control-label">IO Weight *</label>
                            <input type="number" name="io" id="io" class="form-control" value="{{ old('io', $allocation->io) }}" min="10" max="1000" required>
                        </div>
                        <div class="form-group">
                            <label for="backup_limit" class="control-label">Backup Slots *</label>
                            <input type="number" name="backup_limit" id="backup_limit" class="form-control" value="{{ old('backup_limit', $allocation->backup_limit) }}" min="-1" required>
                        </div>
                        <div class="form-group">
                            <label for="allocation_limit" class="control-label">Allocation Slots *</label>
                            <input type="number" name="allocation_limit" id="allocation_limit" class="form-control" value="{{ old('allocation_limit', $allocation->allocation_limit) }}" min="-1" required>
                        </div>
                        <div class="form-group">
                            <label for="database_limit" class="control-label">Database Slots *</label>
                            <input type="number" name="database_limit" id="database_limit" class="form-control" value="{{ old('database_limit', $allocation->database_limit) }}" min="-1" required>
                        </div>
                    </div>
                </div>

                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Overallocation Settings</h3>
                    </div>
                    <div class="box-body">
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="allow_memory_overallocation" value="1" {{ old('allow_memory_overallocation', $allocation->allow_memory_overallocation) ? 'checked' : '' }}>
                                Allow Memory Overallocation
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="allow_disk_overallocation" value="1" {{ old('allow_disk_overallocation', $allocation->allow_disk_overallocation) ? 'checked' : '' }}>
                                Allow Disk Overallocation
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="active" value="1" {{ old('active', $allocation->active) ? 'checked' : '' }}>
                                Active
                            </label>
                        </div>
                    </div>
                </div>

                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Nest & Egg Restrictions</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label for="allowed_nests" class="control-label">Allowed Nests (optional)</label>
                            <select name="allowed_nests[]" id="allowed_nests" class="form-control" multiple>
                                @foreach($nests as $nest)
                                    <option value="{{ $nest->id }}" {{ in_array($nest->id, $allocation->allowed_nests ?? []) ? 'selected' : '' }}>
                                        {{ $nest->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="allowed_eggs" class="control-label">Allowed Eggs (optional)</label>
                            <select name="allowed_eggs[]" id="allowed_eggs" class="form-control" multiple>
                                @foreach($eggs as $egg)
                                    <option value="{{ $egg->id }}" {{ in_array($egg->id, $allocation->allowed_eggs ?? []) ? 'selected' : '' }}>
                                        {{ $egg->nest->name }} - {{ $egg->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="box">
                    <div class="box-footer">
                        <a href="{{ route('admin.dedicated.show', $allocation->id) }}" class="btn btn-default">Cancel</a>
                        <button type="submit" class="btn btn-primary pull-right">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    </form>
@endsection

@section('footer-scripts')
    @parent
    {!! Theme::js('vendor/select2/select2.full.min.js?t={cache-version}') !!}
    <script>
        $(document).ready(function() {
            $('#allowed_nests, #allowed_eggs').select2({
                placeholder: 'Select options',
                allowClear: true
            });
        });
    </script>
@endsection
