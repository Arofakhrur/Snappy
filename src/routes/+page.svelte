<script lang="ts">
	import { session } from '#lib/stores/session';
	import StartScreen from '#lib/components/screens/StartScreen.svelte';
	import StripSelectScreen from '#lib/components/screens/StripSelectScreen.svelte';
	import CameraScreen from '#lib/components/screens/CameraScreen.svelte';
	import ReviewScreen from '#lib/components/screens/ReviewScreen.svelte';
	import EditorScreen from '#lib/components/screens/EditorScreen.svelte';
	import PrintScreen from '#lib/components/screens/PrintScreen.svelte';
	import GalleryScreen from '#lib/components/screens/GalleryScreen.svelte';
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
