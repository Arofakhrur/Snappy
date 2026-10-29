<script lang="ts">
	import { session } from '#lib/stores/session';
	import StartScreen from '#lib/page/start/StartScreen.svelte';
	import GalleryScreen from '#lib/page/gallery/GalleryScreen.svelte';
	import { onMount } from 'svelte';

	// Jalur lama untuk QR yang sudah tercetak: ?gallery=SESSION_ID (atau ?id=).
	// QR baru memakai rute /gallery/[id].
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
		<StartScreen />
	{/if}
</main>
