@extends('layouts.witchcrafter', ['sideEditor' => true])

@section('title')
    General Settings
@endsection

@section('content')
    <form id="witchcrafterEditor" action="{{ route('admin.witchcrafter.general') }}" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">General settings</h1>
            <p class="text-zinc-400 text-sm">Change the general settings of Witchcrafter Theme.</p>
        </div>
        <div class="flex-1 space-y-6">
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:customCopyright">
                    Custom Copyright
                </label>
                <select name="witchcrafter:customCopyright" id="witchcrafter:customCopyright"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="true"
                        {{ old('witchcrafter:customCopyright', config('witchcrafter.customCopyright')) === true ? 'selected' : '' }}>
                        Enabled
                    </option>
                    <option value="false"
                        {{ old('witchcrafter:customCopyright', config('witchcrafter.customCopyright')) === false ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
                <input type="text" id="witchcrafter:copyright" name="witchcrafter:copyright"
                    value="{{ old('witchcrafter:copyright', config('witchcrafter.copyright')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Powered by [WitchyWorlds](https://witchyworlds.top)" />
            </div>
            <div class="space-y-3 !mb-20">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    for="witchcrafter:isUnderMaintenance">
                    Maintenance
                </label>
                <select name="witchcrafter:isUnderMaintenance" id="witchcrafter:isUnderMaintenance"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="true"
                        {{ old('witchcrafter:isUnderMaintenance', config('witchcrafter.isUnderMaintenance')) === true ? 'selected' : '' }}>
                        Enabled
                    </option>
                    <option value="false"
                        {{ old('witchcrafter:isUnderMaintenance', config('witchcrafter.isUnderMaintenance')) === false ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
                <input type="text" id="witchcrafter:maintenance" name="witchcrafter:maintenance"
                    value="{{ old('witchcrafter:maintenance', config('witchcrafter.maintenance')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Maintenance description." />
            </div>
        </div>
    </form>
@endsection
