<script>
	import { session } from '#lib/stores/session.js';
	import StartScreen from '#lib/components/screens/StartScreen.svelte';
	import CameraScreen from '#lib/components/screens/CameraScreen.svelte';
	import ReviewScreen from '#lib/components/screens/ReviewScreen.svelte';
	import EditorScreen from '#lib/components/screens/EditorScreen.svelte';
	import PrintScreen from '#lib/components/screens/PrintScreen.svelte';

	$: screen = $session.screen;
</script>

<svelte:head>
	<title>DISTUDIO Photobooth</title>
</svelte:head>

<main class="app-shell" aria-label="DISTUDIO Photobooth application">
	{#key screen}
		{#if screen === 'start'}
			<StartScreen />
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
</main>
