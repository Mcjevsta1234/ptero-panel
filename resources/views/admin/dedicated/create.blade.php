@extends('layouts.admin')

@section('title')
    Create Dedicated Allocation
@endsection

@section('content-header')
    <h1>Create Dedicated Allocation<small>Assign dedicated resources to a user.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.dedicated.index') }}">Dedicated Servers</a></li>
        <li class="active">Create</li>
    </ol>
@endsection

@section('content')
    <form action="{{ route('admin.dedicated.index') }}" method="POST">
        @csrf
        <div class="row">
            <div class="col-md-6">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title">Basic Information</h3>
                    </div>
                    <div class="box-body">
                        <div class="form-group">
                            <label for="user_id" class="control-label">User *</label>
                            <select name="user_id" id="user_id" class="form-control" required>
                                <option value="">-- Select User --</option>
                                @foreach($users as $user)
                                    <option value="{{ $user->id }}" {{ old('user_id') == $user->id ? 'selected' : '' }}>
                                        {{ $user->email }} ({{ $user->name_first }} {{ $user->name_last }})
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="node_id" class="control-label">Node *</label>
                            <select name="node_id" id="node_id" class="form-control" required>
                                <option value="">-- Select Node --</option>
                                @foreach($nodes as $node)
                                    <option value="{{ $node->id }}" {{ old('node_id') == $node->id ? 'selected' : '' }}>
                                        {{ $node->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="name" class="control-label">Name (optional)</label>
                            <input type="text" name="name" id="name" class="form-control" value="{{ old('name') }}" maxlength="255">
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
                            <input type="number" name="port_range_start" id="port_range_start" class="form-control" value="{{ old('port_range_start', 25565) }}" min="1024" max="65535" required>
                        </div>
                        <div class="form-group">
                            <label for="port_range_end" class="control-label">Port Range End *</label>
                            <input type="number" name="port_range_end" id="port_range_end" class="form-control" value="{{ old('port_range_end', 25575) }}" min="1024" max="65535" required>
                            <p class="text-muted small">User can only use ports within this range.</p>
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
                            <input type="number" name="cpu" id="cpu" class="form-control" value="{{ old('cpu', 0) }}" min="0" step="1" required>
                            <p class="text-muted small">Total CPU (in percentage points) reserved. Use 0 to allow dynamic distribution.</p>
                        </div>
                        <div class="form-group">
                            <label for="memory" class="control-label">Memory (MB) *</label>
                            <input type="number" name="memory" id="memory" class="form-control" value="{{ old('memory', 8192) }}" min="128" step="128" required>
                        </div>
                        <div class="form-group">
                            <label for="disk" class="control-label">Disk (MB) *</label>
                            <input type="number" name="disk" id="disk" class="form-control" value="{{ old('disk', 20480) }}" min="512" step="512" required>
                        </div>
                        <div class="form-group">
                            <label for="swap" class="control-label">Swap (MB) *</label>
                            <input type="number" name="swap" id="swap" class="form-control" value="{{ old('swap', 0) }}" min="-1" required>
                            <p class="text-muted small">Set -1 to disable swap limits.</p>
                        </div>
                        <div class="form-group">
                            <label for="io" class="control-label">IO Weight *</label>
                            <input type="number" name="io" id="io" class="form-control" value="{{ old('io', 500) }}" min="10" max="1000" required>
                        </div>
                        <div class="form-group">
                            <label for="backup_limit" class="control-label">Backup Slots *</label>
                            <input type="number" name="backup_limit" id="backup_limit" class="form-control" value="{{ old('backup_limit', 3) }}" min="-1" required>
                            <p class="text-muted small">Use -1 for unlimited.</p>
                        </div>
                        <div class="form-group">
                            <label for="allocation_limit" class="control-label">Allocation Slots *</label>
                            <input type="number" name="allocation_limit" id="allocation_limit" class="form-control" value="{{ old('allocation_limit', 1) }}" min="-1" required>
                            <p class="text-muted small">Use -1 for unlimited.</p>
                        </div>
                        <div class="form-group">
                            <label for="database_limit" class="control-label">Database Slots *</label>
                            <input type="number" name="database_limit" id="database_limit" class="form-control" value="{{ old('database_limit', 1) }}" min="-1" required>
                            <p class="text-muted small">Use -1 for unlimited.</p>
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
                                <input type="checkbox" name="allow_memory_overallocation" value="1" {{ old('allow_memory_overallocation') ? 'checked' : '' }}>
                                Allow Memory Overallocation
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="allow_disk_overallocation" value="1" {{ old('allow_disk_overallocation') ? 'checked' : '' }}>
                                Allow Disk Overallocation
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="active" value="1" {{ old('active', true) ? 'checked' : '' }}>
                                Active
                            </label>
                        </div>
                        <p class="text-muted small">If enabled, user can create servers exceeding these limits (total resources across all servers can exceed the allocation).</p>
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
                                    <option value="{{ $nest->id }}">{{ $nest->name }}</option>
                                @endforeach
                            </select>
                            <p class="text-muted small">Leave empty to allow all nests.</p>
                        </div>
                        <div class="form-group">
                            <label for="allowed_eggs" class="control-label">Allowed Eggs (optional)</label>
                            <select name="allowed_eggs[]" id="allowed_eggs" class="form-control" multiple>
                                @foreach($eggs as $egg)
                                    <option value="{{ $egg->id }}">{{ $egg->nest->name }} - {{ $egg->name }}</option>
                                @endforeach
                            </select>
                            <p class="text-muted small">Leave empty to allow all eggs (or all eggs within allowed nests).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <div class="box">
                    <div class="box-footer">
                        <a href="{{ route('admin.dedicated.index') }}" class="btn btn-default">Cancel</a>
                        <button type="submit" class="btn btn-success pull-right">Create Allocation</button>
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
            $('#user_id, #node_id, #allowed_nests, #allowed_eggs').select2({
                placeholder: 'Select an option',
                allowClear: true
            });
        });
    </script>
@endsection
