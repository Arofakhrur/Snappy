<script lang="ts">
	import { session } from '#lib/stores/session';
	import StartScreen from '#lib/features/start/StartScreen.svelte';
	import StripSelectScreen from '#lib/features/strip-select/StripSelectScreen.svelte';
	import CameraScreen from '#lib/features/camera/CameraScreen.svelte';
	import ReviewScreen from '#lib/features/review/ReviewScreen.svelte';
	import EditorScreen from '#lib/features/editor/EditorScreen.svelte';
	import PrintScreen from '#lib/features/print/PrintScreen.svelte';
	import GalleryScreen from '#lib/features/gallery/GalleryScreen.svelte';
	import { onMount } from 'svelte';

	$: screen = $session.screen;

	// Check for gallery QR-code scan: ?gallery=SESSION_ID
	let gallerySessionId: string | null = null;

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const id = params.get('gallery') || params.get('id');
		if (id) gallerySessionId = id;
	});
</script>

<svelte:head>
	<title>DISTUDIO Photobooth</title>
</svelte:head>

<main class="app-shell" aria-label="DISTUDIO Photobooth application">
	{#if gallerySessionId}
		<!-- QR-code gallery view for mobile users -->
		<GalleryScreen sessionId={gallerySessionId} />
	{:else}
		{#key screen}
			{#if screen === 'start'}
				<StartScreen />
			{:else if screen === 'strip'}
				<StripSelectScreen />
			{:else if screen === 'camera'}
				<CameraScreen />
			{:else if screen === 'review'}
				<ReviewScreen />
			{:else if screen === 'editor'}
				<EditorScreen />
			{:else if screen === 'print'}
				<PrintScreen />
			{/if}
		{/key}
	{/if}
</main>
