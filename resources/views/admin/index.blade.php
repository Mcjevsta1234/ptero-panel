@extends('layouts.admin')

@section('title')
    @lang('admin/index.title')
@endsection

@section('content-header')
    <h1>Administrative Overview<small>A quick glance at your system.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Index</li>
    </ol>
@endsection

@section('content')
    <div class="row">
        <div class="col-xs-12">
            <div
                class="box
            @if ($version->isLatestPanel()) box-success
            @else
                box-danger @endif
        ">
                <div class="box-header with-border">
                    <h3 class="box-title">@if ($version->isLatestPanel()) @lang('admin/index.uptodate-header') @else @lang('admin/index.notuptodate-header') @endif</h3>
                </div>
                <div class="box-body">
                    @if ($version->isLatestPanel())
                        {!! __('admin/index.uptodate-body', ['version' => config('app.version')]) !!}
                    @else
                        {!! __('admin/index.notuptodate-body', ['version' => config('app.version'), 'latest' => $version->getPanel()]) !!}
                    @endif
                </div>
            </div>
        </div>
    </div>
    {{-- Removed external links and feedback/sponsor boxes per request --}}
@endsection
