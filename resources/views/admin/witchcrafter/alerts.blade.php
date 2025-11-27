@extends('layouts.designify', ['sideEditor' => true])

@section('title')
    Alert Settings
@endsection

@section('content')
    <form id="designifyEditor" action="" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">Alert settings</h1>
            <p class="text-zinc-400 text-sm">Change the alert settings of Reviactyl Theme.</p>
        </div>
        <div class="flex-1 space-y-6">
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="designify:alertType">
                    Alert Type
                </label>
                <select name="designify:alertType" id="designify:alertType"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="info" {{ old('designify:alertType', config('designify.alertType')) === 'info' ? 'selected' : '' }}>
                        Info
                    </option>
                    <option value="announcement"
                        {{ old('designify:alertType', config('designify.alertType')) === 'announcement' ? 'selected' : '' }}>
                        Announcement
                    </option>
                    <option value="success" {{ old('designify:alertType', config('designify.alertType')) === 'success' ? 'selected' : '' }}>
                        Success
                    </option>
                    <option value="warning" {{ old('designify:alertType', config('designify.alertType')) === 'warning' ? 'selected' : '' }}>
                        Warning
                    </option>
                    <option value="danger" {{ old('designify:alertType', config('designify.alertType')) === 'danger' ? 'selected' : '' }}>
                        Danger
                    </option>
                    <option value="disabled" {{ old('designify:alertType', config('designify.alertType')) === 'disabled' ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
                <input type="text" id="designify:alertMessage" name="designify:alertMessage"
                    value="{{ old('designify:alertMessage', config('designify.alertMessage')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="**bold** [link](https://reviactyl.dev)" />
            </div>
        </div>
    </form>
@endsection
