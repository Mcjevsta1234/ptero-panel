@extends('layouts.admin')

@section('title')
    View Dedicated Allocation
@endsection

@section('content-header')
    <h1>{{ $allocation->user->email }}<small>View dedicated allocation details and usage.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li><a href="{{ route('admin.dedicated.index') }}">Dedicated Servers</a></li>
        <li class="active">{{ $allocation->user->email }}</li>
    </ol>
@endsection

@section('content')
    @php
        $used = $allocation->used_resources;
        $available = $allocation->available_resources;
    @endphp

    <div class="row">
        <div class="col-md-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Allocation Information</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <td>User</td>
                                <td><a href="{{ route('admin.users.view', $allocation->user_id) }}">{{ $allocation->user->email }}</a></td>
                            </tr>
                            <tr>
                                <td>Node</td>
                                <td><a href="{{ route('admin.nodes.view', $allocation->node_id) }}">{{ $allocation->node->name }}</a></td>
                            </tr>
                            <tr>
                                <td>Maximum Servers</td>
                                <td>{{ $allocation->max_servers }}</td>
                            </tr>
                            <tr>
                                <td>Port Range</td>
                                <td>{{ $allocation->port_range_start }} - {{ $allocation->port_range_end }}</td>
                            </tr>
                            <tr>
                                <td>Created</td>
                                <td>{{ $allocation->created_at->diffForHumans() }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Resource Usage</h3>
                </div>
                <div class="box-body">
                    <div class="row">
                        <div class="col-xs-6 text-center">
                            <p class="text-muted">CPU</p>
                            <h3>{{ $used['cpu'] }}% / {{ $allocation->cpu === 0 ? 'Unlimited' : ($allocation->cpu . '%') }}</h3>
                            <p class="small">{{ ($allocation->cpu === 0 || $available['cpu'] === -1) ? 'Unlimited' : ($available['cpu'] . '%') }} available</p>
                        </div>
                        <div class="col-xs-6 text-center">
                            <p class="text-muted">Memory</p>
                            <h3>{{ $used['memory'] }} / {{ $allocation->allow_memory_overallocation ? 'Unlimited' : ($allocation->memory . ' MB') }}</h3>
                            <p class="small">{{ $available['memory'] === -1 ? 'Unlimited' : ($available['memory'] . ' MB') }} available</p>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-xs-6 text-center">
                            <p class="text-muted">Disk</p>
                            <h3>{{ $used['disk'] }} / {{ $allocation->allow_disk_overallocation ? 'Unlimited' : ($allocation->disk . ' MB') }}</h3>
                            <p class="small">{{ $available['disk'] === -1 ? 'Unlimited' : ($available['disk'] . ' MB') }} available</p>
                        </div>
                        <div class="col-xs-6 text-center">
                            <p class="text-muted">Servers</p>
                            <h3>{{ $allocation->servers()->count() }} / {{ $allocation->max_servers }}</h3>
                            <p class="small">{{ $allocation->max_servers - $allocation->servers()->count() }} slots remaining</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Resource Limits</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <td>CPU</td>
                                <td>{{ $allocation->cpu === 0 ? 'Unlimited' : ($allocation->cpu . '%') }}</td>
                                <td>
                                    @if($allocation->allow_cpu_overallocation)
                                        <span class="label label-info">Overallocation Allowed</span>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>Memory</td>
                                <td>{{ $allocation->allow_memory_overallocation ? 'Unlimited' : ($allocation->memory . ' MB') }}</td>
                                <td>
                                    @if($allocation->allow_memory_overallocation)
                                        <span class="label label-info">Overallocation Allowed</span>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>Disk</td>
                                <td>{{ $allocation->allow_disk_overallocation ? 'Unlimited' : ($allocation->disk . ' MB') }}</td>
                                <td>
                                    @if($allocation->allow_disk_overallocation)
                                        <span class="label label-info">Overallocation Allowed</span>
                                    @endif
                                </td>
                            </tr>
                            <tr>
                                <td>Backups</td>
                                <td>{{ $allocation->backup_limit }}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Allocations</td>
                                <td>{{ $allocation->allocation_limit }}</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>Databases</td>
                                <td>{{ $allocation->database_limit }}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Restrictions</h3>
                </div>
                <div class="box-body">
                    <p><strong>Allowed Nests:</strong></p>
                    @if($allocation->allowed_nests && count($allocation->allowed_nests) > 0)
                        <ul>
                            @foreach($allocation->allowed_nests as $nestId)
                                @php
                                    $nest = \Pterodactyl\Models\Nest::find($nestId);
                                @endphp
                                @if($nest)
                                    <li>{{ $nest->name }}</li>
                                @endif
                            @endforeach
                        </ul>
                    @else
                        <p class="text-muted">All nests allowed</p>
                    @endif

                    <p><strong>Allowed Eggs:</strong></p>
                    @if($allocation->allowed_eggs && count($allocation->allowed_eggs) > 0)
                        <ul>
                            @foreach($allocation->allowed_eggs as $eggId)
                                @php
                                    $egg = \Pterodactyl\Models\Egg::find($eggId);
                                @endphp
                                @if($egg)
                                    <li>{{ $egg->name }}</li>
                                @endif
                            @endforeach
                        </ul>
                    @else
                        <p class="text-muted">All eggs allowed (within allowed nests)</p>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Servers Using This Allocation</h3>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>Name</th>
                                <th>UUID</th>
                                <th>CPU</th>
                                <th>Memory</th>
                                <th>Disk</th>
                                <th>Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                            @forelse($allocation->servers as $server)
                                <tr>
                                    <td>
                                        <a href="{{ route('admin.servers.view', $server->id) }}">{{ $server->name }}</a>
                                    </td>
                                    <td><code>{{ $server->uuid }}</code></td>
                                    <td>{{ $server->cpu }}%</td>
                                    <td>{{ $server->memory }} MB</td>
                                    <td>{{ $server->disk }} MB</td>
                                    <td>
                                        @if($server->status)
                                            <span class="label label-success">Installed</span>
                                        @else
                                            <span class="label label-warning">Installing</span>
                                        @endif
                                    </td>
                                    <td class="text-center">
                                        <a href="{{ route('admin.servers.view', $server->id) }}" class="btn btn-xs btn-primary">Manage</a>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="text-center text-muted">No servers created yet</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-12">
            <div class="box box-danger">
                <div class="box-header with-border">
                    <h3 class="box-title">Delete Allocation</h3>
                </div>
                <div class="box-body">
                    <p>Deleting this allocation will prevent the user from creating new servers, but will not delete existing servers.</p>
                    @if($allocation->servers()->count() > 0)
                        <p class="text-danger"><strong>Warning:</strong> This allocation has {{ $allocation->servers()->count() }} active server(s). Consider deleting or reassigning them first.</p>
                    @endif
                </div>
                <div class="box-footer">
                    <form action="{{ route('admin.dedicated.destroy', $allocation->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this allocation?');">
                        @csrf
                        @method('DELETE')
                        <a href="{{ route('admin.dedicated.edit', $allocation->id) }}" class="btn btn-primary">Edit Allocation</a>
                        <button type="submit" class="btn btn-danger pull-right" @if($allocation->servers()->count() > 0) disabled @endif>Delete Allocation</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
