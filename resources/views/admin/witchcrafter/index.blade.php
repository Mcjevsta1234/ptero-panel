@extends('layouts.designify', ['sideEditor' => false])

@section('title')
    Home
@endsection

@section('content')
    <div class="h-full flex flex-col">
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">Welcome to Designify</h1>
            <p class="text-zinc-400 text-sm">To begin configuring, use Sidebar to navigate between options.</p>
        </div>
        <section class="mb-8">
            <div>
                <div class="bg-zinc-600/10 border border-zinc-600 rounded-lg shadow">
                    <div class="border-b border-zinc-600 px-4 py-2">
                        <h3 class="text-lg font-semibold text-zinc-600">System Information</h3>
                    </div>
                    <div class="px-4 py-3 text-zinc-200">
                        You are running Reviactyl Panel version <code
                            class="px-1 py-0.5 border border-zinc-800 rounded text-sm">v{{ config('app.version') }}</code>.
                    </div>
                </div>
            </div>
        </section>
    </div>
@endsection
