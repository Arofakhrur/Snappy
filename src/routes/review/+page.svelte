<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { session } from '#lib/stores/session';
	import ReviewScreen from '#lib/features/review/ReviewScreen.svelte';

	// Guard: tidak ada foto apa pun berarti alur kios belum dijalani.
	onMount(() => {
		if ($session.photos.length === 0) void goto('/', { replaceState: true });
	});
</script>

<ReviewScreen />
