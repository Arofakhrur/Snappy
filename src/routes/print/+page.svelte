<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { session } from '#lib/stores/session';
	import PrintScreen from '#lib/page/print/PrintScreen.svelte';

	// Guard: cetak butuh set foto yang lengkap.
	onMount(() => {
		const photos = $session.photos;
		if (photos.length === 0) void goto('/', { replaceState: true });
		else if (photos.length < $session.photoCount) void goto('/review', { replaceState: true });
	});
</script>

<PrintScreen />
