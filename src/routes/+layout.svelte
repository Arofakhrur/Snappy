<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

{@render children()}

<!-- Hidden print layout — shown only during print media -->
<div id="print-layout" style="display:none;" aria-hidden="true">
	<img alt="" />
</div>
