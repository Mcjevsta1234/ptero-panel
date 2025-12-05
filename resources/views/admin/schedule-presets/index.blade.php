@extends('layouts.admin')

@section('title')
    Schedule Presets
@endsection

@section('content-header')
    <h1>Schedule Presets<small>Manage reusable schedule templates.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Schedule Presets</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div class="box box-primary">
                <div class="box-header with-border">
                    <h3 class="box-title">Presets</h3>
                    <div class="box-tools">
                        <a class="btn btn-sm btn-primary" href="{{ route('admin.schedule-presets.create') }}">Create Preset</a>
                    </div>
                </div>
                <div class="box-body table-responsive no-padding">
                    <table class="table table-hover">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Tasks</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        @forelse($presets as $preset)
                            <tr>
                                <td>{{ $preset->name }}</td>
                                <td class="text-muted">{{ \Illuminate\Support\Str::limit($preset->description, 100) }}</td>
                                <td>{{ $preset->tasks_count }}</td>
                                <td class="text-right">
                                    <a class="btn btn-xs btn-default" href="{{ route('admin.schedule-presets.edit', $preset->id) }}">Edit</a>
                                    <form action="{{ route('admin.schedule-presets.destroy', $preset->id) }}" method="POST" class="inline-block" style="display:inline" onsubmit="return confirm('Delete this preset?');">
                                        @csrf
                                        @method('DELETE')
                                        <button class="btn btn-xs btn-danger">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="text-center text-muted">No presets created yet.</td>
                            </tr>
                        @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
