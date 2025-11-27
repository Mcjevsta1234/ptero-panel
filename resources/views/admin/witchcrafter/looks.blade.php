@extends('layouts.witchcrafter', ['sideEditor' => true])

@section('title')
    Look & Feel
@endsection

@section('content')
    <form id="witchcrafterEditor" action="" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">Look & Feel</h1>
            <p class="text-zinc-400 text-sm">Change the look & feel of Reviactyl Theme.</p>
        </div>
        <div class="flex-1 space-y-6 pb-[80px]">
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:themeSelector">
                    Reviactyl Styles <span class="bg-blue-800 rounded-xl px-2">Soon</span>
                </label>
                <div class="inline-flex gap-2">
                    <a class="bg-zinc-800/50 border border-blue-700 rounded-xl p-1">
                        <div class="relative">
                            <img class="h-15 rounded-xl" src="/styles/default/layout.svg" />
                            <span class="absolute bottom-1 left-1/2 -translate-x-1/2 bg-zinc-900/80 text-white text-xs px-2 py-0.5 rounded-md">
                                Default
                            </span>
                        </div>
                    </a>
                    <a class="bg-zinc-800/50 border border-zinc-700 rounded-xl p-1">
                        <div class="relative">
                            <img class="h-15 rounded-xl blur-sm" src="/styles/default/layout.svg" />
                        </div>
                    </a>
                </div>
            </div>
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:themeSelector">
                    Theme Selector
                </label>
                <select name="witchcrafter:themeSelector" id="witchcrafter:themeSelector"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="true"
                        {{ old('witchcrafter:themeSelector', config('witchcrafter.themeSelector')) === true ? 'selected' : '' }}>
                        Enabled
                    </option>
                    <option value="false"
                        {{ old('witchcrafter:themeSelector', config('witchcrafter.themeSelector')) === false ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
            </div>
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:fontFamily">
                    Font Family
                </label>
                <select name="witchcrafter:fontFamily" id="witchcrafter:fontFamily"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="Poppins"
                        {{ old('witchcrafter:fontFamily', config('witchcrafter.fontFamily')) === 'Poppins' ? 'selected' : '' }}>
                        Poppins
                    </option>
                    <option value="Inter"
                        {{ old('witchcrafter:fontFamily', config('witchcrafter.fontFamily')) === 'Inter' ? 'selected' : '' }}>
                        Inter
                    </option>
                    <option value="Roboto"
                        {{ old('witchcrafter:fontFamily', config('witchcrafter.fontFamily')) === 'Roboto' ? 'selected' : '' }}>
                        Roboto
                    </option>
                </select>
            </div>
            <div class="border-t border-zinc-700"></div>
            <div class="grid grid-cols-2 gap-4">
                <p class="block text-xl font-medium text-zinc-700 dark:text-zinc-300">Border Settings</p><br>
                <div class="flex flex-col">
                    <label class="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:radius">
                        Border Radius
                    </label>
                    <input type="text" name="witchcrafter:radius" id="witchcrafter:radius"
                        value="{{ old('witchcrafter:radius', config('witchcrafter.radius')) }}"
                        class="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
                </div>
            </div>
            <div class="border-t border-zinc-700"></div>
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:allocationBlur">
                    Allocation Blur
                </label>
                <select name="witchcrafter:allocationBlur" id="witchcrafter:allocationBlur"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                    <option value="true"
                        {{ old('witchcrafter:allocationBlur', config('witchcrafter.allocationBlur')) === true ? 'selected' : '' }}>
                        Enabled
                    </option>
                    <option value="false"
                        {{ old('witchcrafter:allocationBlur', config('witchcrafter.allocationBlur')) === false ? 'selected' : '' }}>
                        Disabled
                    </option>
                </select>
            </div>
            <div class="border-t border-zinc-700"></div>
            <div class="space-y-3">
                <label for="witchcrafter:background" class="block text-sm font-medium text-zinc-300">
                    Panel Background
                </label>
                <div class="relative">
                    <input type="text" id="witchcrafter:background" name="witchcrafter:background"
                        value="{{ old('witchcrafter:background', config('witchcrafter.background')) }}"
                        class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter background url or 'none' to disable" />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <i class="fas fa-image text-zinc-400 text-sm"></i>
                    </div>
                </div>
                <p class="text-xs text-zinc-500">
                    Enter the URL or file path for your panel background
                </p>
            </div>
        </div>
    </form>
@endsection
