<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isPhotoSetComplete, session } from '#lib/stores/session';
	import CameraScreen from '#lib/page/camera/CameraScreen.svelte';

	// Guard: sesi foto sudah lengkap? Berarti user kembali ke kamera dari
	// review — arahkan ke review, jangan biarkan menimpa hasil.
	// Pengecualian: retake satu foto (retakeIndex terisi) memang masuk kamera.
	onMount(() => {
		if ($isPhotoSetComplete && $session.retakeIndex === null) void goto('/review', { replace: true });
	});
</script>

<CameraScreen />
