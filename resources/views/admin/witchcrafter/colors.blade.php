@extends('layouts.witchcrafter', ['sideEditor' => true])

@section('title')
    Color Settings
@endsection

@section('content')
    <form id="witchcrafterEditor" action="{{ route('admin.witchcrafter.colors') }}" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">Color settings</h1>
            <p class="text-zinc-400 text-sm">Change the color scheme of Witchcrafter Theme.</p>
        </div>
        <div class="flex-1 space-y-6 pb-[80px]">
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-zinc-200 mb-1">Basic Colors</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-zinc-300">Primary</label>
                        <div class="flex items-center space-x-2">
                            <input type="color"
                                class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                                name="witchcrafter:colorPrimary"
                                value="{{ old('witchcrafter:colorPrimary', config('witchcrafter.colorPrimary')) }}" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label for="witchcrafter:colorSuccess" class="block text-sm font-medium text-zinc-300">Success</label>
                        <div class="flex items-center space-x-2">
                            <input type="color"
                                class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                                name="witchcrafter:colorSuccess" id="witchcrafter:colorSuccess"
                                value="{{ old('witchcrafter:colorSuccess', config('witchcrafter.colorSuccess')) }}" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label for="witchcrafter:colorDanger" class="block text-sm font-medium text-zinc-300">Danger</label>
                        <div class="flex items-center space-x-2">
                            <input type="color"
                                class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                                name="witchcrafter:colorDanger" id="witchcrafter:colorDanger"
                                value="{{ old('witchcrafter:colorDanger', config('witchcrafter.colorDanger')) }}" />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label for="witchcrafter:colorSecondary"
                            class="block text-sm font-medium text-zinc-300">Secondary</label>
                        <div class="flex items-center space-x-2">
                            <input type="color"
                                class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                                name="witchcrafter:colorSecondary" id="witchcrafter:colorSecondary"
                                value="{{ old('witchcrafter:colorSecondary', config('witchcrafter.colorSecondary')) }}" />
                        </div>
                    </div>
                </div>
                <div class="border-t border-zinc-700"></div>
                <div>
                    <h3 class="text-lg font-bold text-zinc-200 mb-1">Default colors</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        @foreach ([50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as $shade)
                            <div class="space-y-2">
                                <label for="witchcrafter:color{{ $shade }}"
                                    class="block text-sm font-medium text-zinc-300">Color {{ $shade }}</label>
                                <div class="flex items-center space-x-2">
                                    <input type="color"
                                        class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                                        name="witchcrafter:color{{ $shade }}" id="witchcrafter:color{{ $shade }}"
                                        value="{{ old('witchcrafter:color' . $shade, config('witchcrafter.color'. $shade)) }}" />
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                @foreach (range(1, 7) as $theme)
                    @php
                        $themeVar = 'theme' . $theme;
                    @endphp
                    <div class="border-t border-zinc-700"></div>
                    <div>
                        <h3 class="text-lg font-bold text-zinc-200 mb-1">Theme{{ $theme }} Settings</h3>
                        <div class="space-y-3 mb-3">
                            <label class="block text-sm font-medium text-zinc-300"
                                for="witchcrafter:theme{{ $theme }}:name">
                                Name
                            </label>
                            <input type="text" id="witchcrafter:theme{{ $theme }}:name"
                                name="witchcrafter:theme{{ $theme }}:name"
                                value="{{ old('witchcrafter:theme' . $theme . ':name', config('witchcrafter.theme' . $theme . '.name')) }}"
                                class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Theme{{ $theme }} Display name" />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="space-y-2">
                                <label class="block text-sm font-medium text-zinc-300"
                                    for="witchcrafter:theme{{ $theme }}:colorPrimary">
                                    Primary
                                </label>
                                <div class="flex items-center space-x-2">
                                    <input type="color" id="witchcrafter:theme{{ $theme }}:colorPrimary"
                                        name="witchcrafter:theme{{ $theme }}:colorPrimary"
                                        value="{{ old('witchcrafter:theme' . $theme . ':colorPrimary', config('witchcrafter.theme' . $theme . '.colorPrimary')) }}"
                                        class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer" />
                                </div>
                            </div>

                            @foreach ([50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as $shade)
                                <div class="space-y-2">
                                    <label for="witchcrafter:theme{{ $theme }}:color{{ $shade }}"
                                        class="block text-sm font-medium text-zinc-300">
                                        Color {{ $shade }}
                                    </label>
                                    <div class="flex items-center space-x-2">
                                        <input type="color"
                                            class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                                            name="witchcrafter:theme{{ $theme }}:color{{ $shade }}"
                                            id="witchcrafter:theme{{ $theme }}:color{{ $shade }}"
                                            value="{{ old('witchcrafter:theme' . $theme . ':color' . $shade, config('witchcrafter.theme' . $theme . '.color' . $shade)) }}" />
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </form>
@endsection
