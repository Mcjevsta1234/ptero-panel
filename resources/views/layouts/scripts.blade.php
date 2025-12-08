{{-- Inject compiled frontend assets (Webpack bundle) for client-facing pages only --}}
@if (!request()->is('admin') && !request()->is('admin/*'))
    @php
        // Use webpack manifest for reliable asset loading
        $manifestPath = public_path('assets/manifest.json');
        $bundle = null;
        
        if (file_exists($manifestPath)) {
            $manifest = json_decode(file_get_contents($manifestPath), true);
            if (isset($manifest['bundle.js'])) {
                $bundle = $manifest['bundle.js'];
            }
        }
        
        // Fallback: scan directory if manifest not found
        if (!$bundle) {
            $assetDir = public_path('assets');
            if (is_dir($assetDir)) {
                $files = scandir($assetDir);
                foreach ($files as $file) {
                    if (preg_match('/^bundle\..+\.js$/', $file)) {
                        $bundle = '/assets/' . $file;
                        break;
                    }
                }
            }
        }
    @endphp

    @if ($bundle)
        <script src="{{ $bundle }}" crossorigin="anonymous"></script>
    @else
        {{-- Final fallback for development builds --}}
        <script src="/assets/bundle.js" crossorigin="anonymous"></script>
    @endif
@endif