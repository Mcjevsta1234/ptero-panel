<!-- 
Reviactyl Panel (https://reviactyl.dev/)
Copyright (c) 2025 Reviactyl™ and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-->
<!DOCTYPE html>
<html>

<head>
    <title>{{ config('app.name', 'Reviactyl') }}</title>

    @section('meta')
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="robots" content="noindex">
        <meta name="title" content="{{ $witchyworldsConfiguration['site_title'] }}" />
        <meta name="description" content="{{ $witchyworldsConfiguration['site_description'] }}" />
        <link rel="icon" type="image/x-icon" href="{{ $siteConfiguration['icon'] }}">
        @if ($siteConfiguration['pwa'])
        <link rel="manifest" href="{{ url('manifest.json') }}">
        <link rel="apple-touch-icon" href="{{ asset('favicons/android-icon-192x192.png') }}">
        <meta name="apple-mobile-web-app-capable" content="yes">
        @endif
        <meta name="theme-color" content="{{ $witchyworldsConfiguration['site_color'] }}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ config('app.url', 'https://localhost') }}" />
        <meta property="og:title" content="{{ $witchyworldsConfiguration['site_title'] }}" />
        <meta property="og:description" content="{{ $witchyworldsConfiguration['site_description'] }}" />
        <meta property="og:image" content="{{ $witchyworldsConfiguration['site_image'] }}" />
    @show

    @section('user-data')
        @if (!is_null(Auth::user()))
            <script>
                window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
            </script>
        @endif
        @if (!empty($siteConfiguration))
            <script>
                window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
            </script>
        @endif
        @if (!empty($witchyworldsConfiguration))
            <script>
                window.WitchyWorldsConfiguration = {!! json_encode($witchyworldsConfiguration) !!};
            </script>
        @endif
    @show
    @php
        function witchyworlds($hex)
        {
            $hex = str_replace('#', '', $hex);
            if (strlen($hex) === 3) {
                $r = hexdec(str_repeat($hex[0], 2));
                $g = hexdec(str_repeat($hex[1], 2));
                $b = hexdec(str_repeat($hex[2], 2));
            } else {
                $r = hexdec(substr($hex, 0, 2));
                $g = hexdec(substr($hex, 2, 2));
                $b = hexdec(substr($hex, 4, 2));
            }
            return "$r $g $b";
        }
    @endphp
    <style>
        @import url('//fonts.googleapis.com/css?family=Rubik:300,400,500&display=swap');
        @import url('//fonts.googleapis.com/css?family=IBM+Plex+Mono|IBM+Plex+Sans:500&display=swap');
        @import url('//fonts.googleapis.com/css2?family={{ $witchyworldsConfiguration['fontFamily'] }}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

        :root {
            --background: url({{ $witchyworldsConfiguration['background'] }});
            --radius: {{ $witchyworldsConfiguration['radius'] }};
            --font-family: "{{ $witchyworldsConfiguration['fontFamily'] }}", sans-serif;
            --color-primary: {{ witchyworlds($witchyworldsConfiguration['colorPrimary']) }};
            --color-success: {{ witchyworlds($witchyworldsConfiguration['colorSuccess']) }};
            --color-danger: {{ witchyworlds($witchyworldsConfiguration['colorDanger']) }};
            --color-secondary: {{ witchyworlds($witchyworldsConfiguration['colorSecondary']) }};
            --color-50: {{ witchyworlds($witchyworldsConfiguration['color50']) }};
            --color-100: {{ witchyworlds($witchyworldsConfiguration['color100']) }};
            --color-200: {{ witchyworlds($witchyworldsConfiguration['color200']) }};
            --color-300: {{ witchyworlds($witchyworldsConfiguration['color300']) }};
            --color-400: {{ witchyworlds($witchyworldsConfiguration['color400']) }};
            --color-500: {{ witchyworlds($witchyworldsConfiguration['color500']) }};
            --color-600: {{ witchyworlds($witchyworldsConfiguration['color600']) }};
            --color-700: {{ witchyworlds($witchyworldsConfiguration['color700']) }};
            --color-800: {{ witchyworlds($witchyworldsConfiguration['color800']) }};
            --color-900: {{ witchyworlds($witchyworldsConfiguration['color900']) }};
        }
    </style>

    @yield('assets')

    @include('layouts.scripts')
</head>

<body class="{{ $css['body'] ?? 'bg-neutral-50' }}">
    @section('content')
        @yield('above-container')
        @yield('container')
        @yield('below-container')
    @show
    @section('scripts')
        {!! $asset->js('main.js') !!}
    @show
</body>

</html>
