<!DOCTYPE html>
<html class="dark">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Witchcrafter Editor - @yield('title')</title>
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <meta name="_token" content="{{ csrf_token() }}">
    <link rel="shortcut icon" href="/witchyworlds/Witchcrafter.png">
    <meta name="msapplication-config" content="/favicons/browserconfig.xml">


    @include('layouts.scripts')

    @section('scripts')
        {!! Theme::css('vendor/select2/select2.min.css?t={cache-version}') !!}
        {!! Theme::css('vendor/sweetalert/sweetalert.min.css?t={cache-version}') !!}
        {!! Theme::css('vendor/animate/animate.min.css?t={cache-version}') !!}
        {!! Theme::js('vendor/tailwindcss/tailwind.min.js?t={cache-version}') !!}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
        <!--[if lt IE 9]>
                    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
                    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
                    <![endif]-->
    @show
</head>

<body id="app" class="bg-zinc-950 text-zinc-100 h-screen overflow-hidden">
    <nav
        class="fixed top-0 left-0 right-0 h-20 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 p-3 md:p-4 z-50">
        <a href="{{ route('index') }}/admin" class="flex items-center space-x-2 md:space-x-3 group">
            <div class="flex flex-col">
                <span
                    class="font-bold text-lg md:text-xl bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">Witchcrafter</span>
                <span class="text-xs text-zinc-400 -mt-1 hidden md:block">Release v{{ config('app.version') }}</span>
            </div>
        </a>

        <div class="flex items-center space-x-2 md:space-x-6">
            <a href="{{ route('account') }}"
                class="flex items-center space-x-2 md:space-x-3 px-2 md:px-4 py-1.5 md:py-2 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg transition-all duration-200 group">
                <img src="https://www.gravatar.com/avatar/{{ md5(strtolower(Auth::user()->email)) }}?s=160"
                    class="h-6 w-6 md:h-8 md:w-8 rounded-full ring-2 ring-zinc-600 group-hover:ring-sky-500 transition-colors duration-200"
                    alt="User Image">
                <div class="flex flex-col hidden md:block">
                    <span class="text-sm font-medium text-zinc-200">{{ Auth::user()->name_first }}
                        {{ Auth::user()->name_last }}</span>
                </div>
            </a>
        </div>
    </nav>

    <div class="fixed top-20 left-0 right-0 bottom-6 flex">
        <aside
            class="w-16 bg-zinc-900/30 backdrop-blur-md border-r border-zinc-800 flex flex-col justify-between py-4 md:py-6 flex-shrink-0 z-40">
            <div class="flex flex-col space-y-3 md:space-y-4">
                <nav class="flex flex-col space-y-2 px-2">
                    <a href="{{ route('admin.witchcrafter.general') }}"
                        class="{{ Route::currentRouteName() !== 'admin.witchcrafter.general' ?: 'bg-sky-600/20 border border-sky-500/30 ring-2 ring-sky-500 bg-sky-600/30' }} group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl text-sky-500 hover:bg-sky-600/30 hover:text-sky-300 transition-all duration-200">
                        <i class="fa-solid fa-bolt"></i>
                        <span
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-100 pointer-events-none hidden md:block">
                            General Options
                        </span>
                    </a>
                    <a href="{{ route('admin.witchcrafter.colors') }}"
                        class="{{ !starts_with(Route::currentRouteName(), 'admin.witchcrafter.colors') ?: 'bg-sky-600/20 border border-sky-500/30 ring-2 ring-sky-500 bg-sky-600/30' }} group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl text-sky-500 hover:bg-sky-600/30 hover:text-sky-300 transition-all duration-200">
                        <i class="fa-solid fa-palette"></i>
                        <span
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-100 pointer-events-none hidden md:block">
                            Color Options
                        </span>
                    </a>
                    <a href="{{ route('admin.witchcrafter.looks') }}"
                        class="{{ !starts_with(Route::currentRouteName(), 'admin.witchcrafter.looks') ?: 'bg-sky-600/20 border border-sky-500/30 ring-2 ring-sky-500 bg-sky-600/30' }} group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl text-sky-500 hover:bg-sky-600/30 hover:text-sky-300 transition-all duration-200">
                        <i class="fa-solid fa-swatchbook"></i>
                        <span
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-100 pointer-events-none hidden md:block">
                            Look 'N Feel
                        </span>
                    </a>
                    <a href="{{ route('admin.witchcrafter.alerts') }}"
                        class="{{ !starts_with(Route::currentRouteName(), 'admin.witchcrafter.alerts') ?: 'bg-sky-600/20 border border-sky-500/30 ring-2 ring-sky-500 bg-sky-600/30' }} group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl text-sky-500 hover:bg-sky-600/30 hover:text-sky-300 transition-all duration-200">
                        <i class="fa-solid fa-bullhorn"></i>
                        <span
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-100 pointer-events-none hidden md:block">
                            Alerts
                        </span>
                    </a>
                    <a href="{{ route('admin.witchcrafter.site') }}"
                        class="{{ !starts_with(Route::currentRouteName(), 'admin.witchcrafter.site') ?: 'bg-sky-600/20 border border-sky-500/30 ring-2 ring-sky-500 bg-sky-600/30' }} group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl text-sky-500 hover:bg-sky-600/30 hover:text-sky-300 transition-all duration-200">
                        <i class="fa-solid fa-gear"></i>
                        <span
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-100 pointer-events-none hidden md:block">
                            Site Meta Settings
                        </span>
                    </a>
                    <a href="{{ route('admin.witchcrafter.socials') }}"
                        class="{{ !starts_with(Route::currentRouteName(), 'admin.witchcrafter.socials') ?: 'bg-sky-600/20 border border-sky-500/30 ring-2 ring-sky-500 bg-sky-600/30' }} group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl text-sky-500 hover:bg-sky-600/30 hover:text-sky-300 transition-all duration-200">
                        <i class="fa-solid fa-link"></i>
                        <span
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-100 pointer-events-none hidden md:block">
                            Quick Links
                        </span>
                    </a>
                </nav>
            </div>

            <div class="flex flex-col space-y-2 px-2">
                @include('partials/admin.witchcrafter.save')
                <form action="{{ route('admin.witchcrafter.reset') }}" method="POST"
                    onsubmit="return confirm('Are you sure you want to reset Witchcrafter settings to default?');">
                    @csrf
                    <button type="submit"
                        class="group relative flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-red-800/50 border border-red-700 text-red-400 hover:bg-red-700/50 hover:text-red-300 transition-all duration-200">
                        <i class="fa-solid fa-trash-can"></i>
                        <div
                            class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none hidden md:block">
                            Reset Witchcrafter to Defaults
                        </div>
                    </button>
                </form>
            </div>
        </aside>

        <main class="flex-1 flex overflow-hidden">
            <div class="flex-1 bg-zinc-900/30 backdrop-blur-md border-r border-zinc-800 flex flex-col">
                <div class="flex-1 overflow-y-auto p-4 lg:p-6">
                    @if (count($errors) > 0)
                        <div
                            class="mb-4 lg:mb-6 bg-blue-900/20 border border-blue-800 text-blue-300 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl backdrop-blur-sm">
                            <div class="flex items-center space-x-2 mb-2">
                                <i class="fas fa-exclamation-triangle text-blue-400 text-sm lg:text-base"></i>
                                <p class="font-medium text-sm lg:text-base">Error</p>
                            </div>
                            <ul class="list-disc ml-5 lg:ml-6 space-y-1 text-xs lg:text-sm">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    @yield('content')
                </div>
            </div>
            @if (!empty($sideEditor))
                <div
                    class="hidden sm:block w-auto bg-zinc-900/30 backdrop-blur-md border-l border-zinc-800 p-4 flex items-start justify-end">
                    <div class="bg-white rounded-lg shadow-2xl resize-left overflow-hidden"
                        style="width: 800px; height: calc(100vh - 140px);">
                        <iframe src="/" class="w-full h-full border-0" title="Preview"></iframe>
                    </div>
                </div>
            @elseif(!empty($sideContent))
                <div
                    class="hidden sm:flex w-auto bg-zinc-900/30 backdrop-blur-md border-l border-zinc-800 p-4 items-center justify-center">
                    <div class="shadow-2xl overflow-hidden"
                        style="width: 375px; height: calc(100vh - 140px); min-width: 280px; max-width: 800px;">
                        <div class="w-full h-full bg-zinc-800/80 border border-zinc-600 rounded-xl p-10">
                            @yield('sidecontent')
                        </div>
                    </div>
                </div>
            @else
                <div
                    class="hidden sm:flex w-auto bg-zinc-900/30 backdrop-blur-md border-l border-zinc-800 p-4 items-center justify-center">
                    <div class="shadow-2xl overflow-hidden"
                        style="width: 375px; height: calc(100vh - 140px); min-width: 280px; max-width: 800px;">
                        <div
                            class="w-full h-full bg-zinc-800/80 border border-zinc-600 rounded-xl text-center p-10 flex flex-col items-center justify-center">
                            <div class="flex items-center justify-center space-x-2 mb-2">
                                <img src="/witchyworlds/Witchcrafter.png" class="h-10" alt="logo" />
                                <h1 class="text-white text-3xl font-semibold">Witchcrafter</h1>
                            </div>
                            <p class="text-gray-400 text-sm mb-8">v{{ config('app.version') }}</p>
                        </div>
                    </div>
                </div>
            @endif
        </main>
    </div>

    <div class="fixed top-4 right-4 z-50 space-y-3">
        @foreach (Alert::getMessages() as $type => $messages)
            @foreach ($messages as $message)
                @php
                    $alertClass = match ($type) {
                        'danger' => 'bg-red-900/80 border-red-700 text-red-200',
                        'success' => 'bg-green-900/80 border-green-700 text-green-200',
                        default => 'bg-blue-900/80 border-blue-700 text-blue-200',
                    };
                    $iconClass = match ($type) {
                        'danger' => 'fas fa-times-circle text-red-300',
                        'success' => 'fas fa-check-circle text-green-300',
                        default => 'fas fa-info-circle text-blue-300',
                    };
                @endphp
                <div
                    class="w-72 border px-4 py-3 rounded-xl shadow-lg backdrop-blur-md animate-fade-in-up {{ $alertClass }}">
                    <div class="flex items-start space-x-2">
                        <i class="{{ $iconClass }} mt-1 text-sm"></i>
                        <div class="text-sm">{!! $message !!}</div>
                    </div>
                </div>
            @endforeach
        @endforeach
    </div>

    <footer
        class="fixed bottom-0 left-0 right-0 h-6 flex bg-zinc-950 border-t border-zinc-800 items-center justify-center text-xs text-zinc-400 z-40">
        <span>&copy; WitchyWorlds</span>
    </footer>

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        lucide.createIcons();
    </script>

    <style>
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.1);
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(100, 116, 139, 0.4);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(100, 116, 139, 0.6);
        }

        .resize-left {
            resize: horizontal;
            overflow: auto;
            direction: rtl;
        }

        .resize-left iframe {
            direction: ltr;
        }

        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(10px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out;
        }
    </style>
</body>

</html>
