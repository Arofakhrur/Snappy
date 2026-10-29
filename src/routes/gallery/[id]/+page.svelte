<script lang="ts">
	/**
	 * /gallery/[id] — galeri publik untuk tamu via QR code (dibuka dari ponsel,
	 * perangkat lain di jaringan yang sama). Session id datang dari path, bukan
	 * query param, agar URL-nya rapi.
	 */
	import GalleryScreen from '#lib/page/gallery/GalleryScreen.svelte';

	let { data }: { data: { sessionId: string } } = $props();
</script>

<svelte:head>
	<title>Galeri Foto — DISTUDIO Photobooth</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="app-shell" aria-label="Galeri foto DISTUDIO">
	<GalleryScreen sessionId={data.sessionId} />
</main>

<style>
	.app-shell {
		min-height: 100dvh;
	}
</style>
