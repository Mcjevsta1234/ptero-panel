@extends('layouts.designify', ['sideEditor' => true])

@section('title')
    General Settings
@endsection

@section('content')
    <form id="designifyEditor" action="" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">General settings</h1>
            <p class="text-zinc-400 text-sm">Change the general settings of Reviactyl Theme.</p>
        </div>
        <div class="flex-1 space-y-6">
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="designify:customCopyright">
                    Custom Copyright
                </label>
                <select name="designify:customCopyright" id="designify:customCopyright"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="true"
                        {{ old('designify:customCopyright', config('designify.customCopyright')) === true ? 'selected' : '' }}>
                        Enabled
                    </option>
                    <option value="false"
                        {{ old('designify:customCopyright', config('designify.customCopyright')) === false ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
                <input type="text" id="designify:copyright" name="designify:copyright"
                    value="{{ old('designify:copyright', config('designify.copyright')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Powered by [Reviactyl](https://revix.cc)" />
            </div>
            <div class="space-y-3 !mb-20">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    for="designify:isUnderMaintenance">
                    Maintenance
                </label>
                <select name="designify:isUnderMaintenance" id="designify:isUnderMaintenance"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="true"
                        {{ old('designify:isUnderMaintenance', config('designify.isUnderMaintenance')) === true ? 'selected' : '' }}>
                        Enabled
                    </option>
                    <option value="false"
                        {{ old('designify:isUnderMaintenance', config('designify.isUnderMaintenance')) === false ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
                <input type="text" id="designify:maintenance" name="designify:maintenance"
                    value="{{ old('designify:maintenance', config('designify.maintenance')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Maintenance description." />
            </div>
        </div>
    </form>
@endsection
