<script>
	// import L from 'leaflet'; // Temporarily disabled to reduce bundle size
	// import 'leaflet/dist/leaflet.css';
	import { onMount, onDestroy } from 'svelte';

	let map;
	let mapElement;

	export let setViewLocation = [51.505, -0.09];
	export let points = [];

	export let onClick = (e) => {};

	let markerGroupLayer = null;

	const setMarkers = (points) => {
		// Map functionality temporarily disabled to reduce bundle size
		console.log('Map functionality temporarily disabled to reduce bundle size');
	};

	onMount(async () => {
		// Map functionality temporarily disabled to reduce bundle size
		console.log('Map functionality temporarily disabled to reduce bundle size');
	});

	onDestroy(async () => {
		// Map functionality temporarily disabled to reduce bundle size
	});
</script>

<div class="z-10 w-full">
	<div class="h-96 z-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
		<div class="text-center text-gray-500 dark:text-gray-400">
			<p class="text-lg font-medium">Map Functionality Temporarily Disabled</p>
			<p class="text-sm mt-2">Map features have been disabled to reduce bundle size for deployment</p>
		</div>
	</div>
</div>
