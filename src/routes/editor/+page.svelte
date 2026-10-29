<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { session } from '#lib/stores/session';
	import EditorScreen from '#lib/page/editor/EditorScreen.svelte';

	// Guard: editor butuh set foto yang lengkap.
	onMount(() => {
		const photos = $session.photos;
		if (photos.length === 0) void goto('/', { replaceState: true });
		else if (photos.length < $session.photoCount) void goto('/review', { replaceState: true });
	});
</script>

<EditorScreen />
