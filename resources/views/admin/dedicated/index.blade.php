@extends('layouts.admin')

@section('title')
    Dedicated Server Allocations
@endsection

@section('content-header')
    <h1>Dedicated Server Allocations<small>Manage user-specific server allocations.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Dedicated Servers</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Allocation List</h3>
                    <div class="box-tools">
                        <a href="{{ route('admin.dedicated.create') }}">
                            <button type="button" class="btn btn-sm btn-primary">Create New</button>
                        </a>
                    </div>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <tbody>
                            <tr>
                                <th>User</th>
                                <th>Node</th>
                                <th>CPU (cores)</th>
                                <th>Memory (MB)</th>
                                <th>Disk (MB)</th>
                                <th>Servers</th>
                                <th>Status</th>
                                <th class="text-center">Actions</th>
                            </tr>
                            @foreach ($allocations as $allocation)
                                <tr>
                                    <td>
                                        <a href="{{ route('admin.users.view', $allocation->user_id) }}">
                                            {{ $allocation->user->email }}
                                        </a>
                                    </td>
                                    <td>
                                        <a href="{{ route('admin.nodes.view', $allocation->node_id) }}">
                                            {{ $allocation->node->name }}
                                        </a>
                                    </td>
                                    <td>{{ $allocation->cpu_limit }}</td>
                                    <td>{{ $allocation->memory_limit }}</td>
                                    <td>{{ $allocation->disk_limit }}</td>
                                    <td>
                                        {{ $allocation->servers()->count() }} / {{ $allocation->max_servers }}
                                    </td>
                                    <td>
                                        @php
                                            $used = $allocation->used_resources();
                                            $limits = [
                                                'cpu' => $allocation->cpu_limit,
                                                'memory' => $allocation->memory_limit,
                                                'disk' => $allocation->disk_limit,
                                            ];
                                            $overallocated = false;
                                            foreach(['cpu', 'memory', 'disk'] as $resource) {
                                                if (!$allocation->{"allow_{$resource}_overallocation"} && $used[$resource] > $limits[$resource]) {
                                                    $overallocated = true;
                                                    break;
                                                }
                                            }
                                        @endphp
                                        <span class="label label-{{ $overallocated ? 'danger' : 'success' }}">
                                            {{ $overallocated ? 'Over Limit' : 'Active' }}
                                        </span>
                                    </td>
                                    <td class="text-center">
                                        <a href="{{ route('admin.dedicated.show', $allocation->id) }}" class="btn btn-xs btn-primary">View</a>
                                        <a href="{{ route('admin.dedicated.edit', $allocation->id) }}" class="btn btn-xs btn-default">Edit</a>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
                @if ($allocations->hasPages())
                    <div class="box-footer with-border">
                        <div class="col-md-12 text-center">{!! $allocations->render() !!}</div>
                    </div>
                @endif
            </div>
        </div>
    </div>
@endsection
