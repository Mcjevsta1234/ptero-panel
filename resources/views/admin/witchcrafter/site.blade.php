@extends('layouts.witchcrafter', ['sideContent' => true])

@section('title')
    Site Settings
@endsection

@section('content')
    <form id="witchcrafterEditor" action="" method="POST" class="h-full flex flex-col">
        @csrf
        @method('PATCH')
        <div class="mb-8">
            <h1 class="text-2xl font-bold text-white mb-2">Site settings</h1>
            <p class="text-zinc-400 text-sm">Change the meta content of your panel.</p>
        </div>
        <div class="flex-1 space-y-6 pb-[80px]">
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:site_title">
                    Site Title
                </label>
                <input type="text" id="witchcrafter:site_title" name="witchcrafter:site_title"
                    value="{{ old('witchcrafter:site_title', config('witchcrafter.site_title')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Site name to be shown on embed" />
            </div>
            <div class="space-y-3">
                <label class="block text-sm font-medium text-zinc-700 dark:text-zinc-300" for="witchcrafter:site_description">
                    Site Description
                </label>
                <input type="text" id="witchcrafter:site_description" name="witchcrafter:site_description"
                    value="{{ old('witchcrafter:site_description', config('witchcrafter.site_description')) }}"
                    class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Site description to be shown on embed" />
            </div>
            <div class="space-y-3">
                <label for="witchcrafter:site_image" class="block text-sm font-medium text-zinc-300">
                    Site Image
                </label>
                <div class="relative">
                    <input type="text" id="witchcrafter:site_image" name="witchcrafter:site_image"
                        value="{{ old('witchcrafter:site_image', config('witchcrafter.site_image')) }}"
                        class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter Site Image URL or path" />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <i class="fas fa-image text-zinc-400 text-sm"></i>
                    </div>
                </div>
            </div>
            <div class="space-y-3">
                <label for="witchcrafter:site_favicon" class="block text-sm font-medium text-zinc-300">
                    Site Favicon
                </label>
                <div class="relative">
                    <input type="text" id="witchcrafter:site_favicon" name="witchcrafter:site_favicon"
                        value="{{ old('witchcrafter:site_favicon', config('witchcrafter.site_favicon')) }}"
                        class="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter Site Favicon URL or path" />
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                        <i class="fas fa-image text-zinc-400 text-sm"></i>
                    </div>
                </div>
            </div>
            <div class="space-y-2">
                <label for="witchcrafter:site_color" class="block text-sm font-medium text-zinc-300">Site Color</label>
                <div class="flex items-center space-x-2">
                    <input type="color" class="h-10 w-16 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
                        name="witchcrafter:site_color" id="witchcrafter:site_color"
                        value="{{ old('witchcrafter:site_color', config('witchcrafter.site_color')) }}" />
                </div>
            </div>
        </div>
    </form>
@endsection
@section('sidecontent')
    <span class="font-bold">Discord Preview:</span>
    <div class="border border-zinc-600 p-4 max-w-xl rounded-lg text-white font-sans">

        <p class="text-sky-400 hover:underline text-sm block mb-2">
            {{ config('app.url') }}/auth/login
        </p>

        <div
            class="bg-[#2b2d31] rounded-md border-l-4 border-[{{ old('witchcrafter:site_color', config('witchcrafter.site_color')) }}] rounded-r-md p-3">
            <h2 class="text-sky-400 text-sm font-semibold mb-1">{{ old('witchcrafter:site_title', config('witchcrafter.site_title')) }}</h2>
            <p class="text-sm text-gray-200 mb-3">{{ old('witchcrafter:site_description', config('witchcrafter.site_description')) }}</p>
            <div class="flex items-center space-x-3">
                <img src="{{ old('witchcrafter:site_image', config('witchcrafter.site_image')) }}" alt="site image"
                    class="w-auto h-20 rounded-md" />
            </div>
        </div>
    </div>
@endsection
