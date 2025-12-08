{{-- Inject compiled frontend assets (Webpack bundle) for client-facing pages only --}}
@if (!request()->is('admin') && !request()->is('admin/*'))
    @php
        // Use webpack manifest for reliable asset loading
        $manifestPath = public_path('assets/manifest.json');
        $bundle = null;
        $debugInfo = [];
        
        if (file_exists($manifestPath)) {
            $manifest = json_decode(file_get_contents($manifestPath), true);
            $debugInfo['manifest_exists'] = true;
            $debugInfo['manifest_keys'] = array_keys($manifest ?? []);
            
            if (isset($manifest['bundle.js'])) {
                $bundle = $manifest['bundle.js'];
                $debugInfo['using_manifest'] = true;
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
                        $debugInfo['using_fallback'] = true;
                        $debugInfo['fallback_file'] = $file;
                        break;
                    }
                }
            }
        }
        
        $debugInfo['final_bundle'] = $bundle;
    @endphp

    {{-- Debug comment visible in page source --}}
    <!-- Bundle Debug: {{ json_encode($debugInfo) }} -->

    @if ($bundle)
        <script src="{{ $bundle }}" crossorigin="anonymous"></script>
    @else
        {{-- Final fallback for development builds --}}
        <script src="/assets/bundle.js" crossorigin="anonymous"></script>
    @endif
@endif