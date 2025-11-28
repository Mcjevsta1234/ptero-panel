{{-- Inject compiled frontend assets (Webpack bundle) --}}
@php
	$assetDir = public_path('assets');
	$bundle = null;
	if (is_dir($assetDir)) {
		$files = scandir($assetDir);
		foreach ($files as $file) {
			if (preg_match('/^bundle\..+\.js$/', $file)) {
				$bundle = '/assets/' . $file;
				break;
			}
		}
	}
@endphp

@if ($bundle)
	<script src="{{ $bundle }}" crossorigin="anonymous"></script>
@else
	{{-- Fallback for development builds or missing assets --}}
	<script src="/assets/bundle.js" crossorigin="anonymous"></script>
@endif
