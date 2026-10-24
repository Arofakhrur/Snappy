<script>
	import '../app.css';

	/** @type {{children: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

{@render children()}

<!-- Hidden print layout — shown only during print media -->
<div id="print-layout" style="display:none;" aria-hidden="true">
	<img alt="" />
</div>
