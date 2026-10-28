/**
 * Camera Utility — manages MediaStream lifecycle
 * All camera track management is centralized here.
 */

type FacingMode = 'user' | 'environment';

let activeStream: MediaStream | null = null;

/** Current facing mode */
let currentFacingMode: FacingMode = 'user';

/** Start the camera with a given facing mode. */
export async function startCamera(facingMode: FacingMode = 'user'): Promise<MediaStream> {
	// Stop any existing stream first
	stopCamera();
	currentFacingMode = facingMode;

	const constraints: MediaStreamConstraints = {
		video: {
			facingMode,
			width: { ideal: 1280 },
			height: { ideal: 960 },
		},
		audio: false,
	};

	try {
		const stream = await navigator.mediaDevices.getUserMedia(constraints);
		activeStream = stream;
		return stream;
	} catch (err: unknown) {
		activeStream = null;
		throw err;
	}
}

/** Stop all active camera tracks. */
export function stopCamera(): void {
	if (activeStream) {
		activeStream.getTracks().forEach((track) => track.stop());
		activeStream = null;
	}
}

/** Switch between front and rear camera. */
export async function switchCamera(): Promise<MediaStream> {
	const next: FacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
	return startCamera(next);
}

/** Check if the device supports multiple cameras. */
export async function hasMultipleCameras(): Promise<boolean> {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const videoCams = devices.filter((d) => d.kind === 'videoinput');
		return videoCams.length > 1;
	} catch {
		return false;
	}
}

/** Get the current facing mode. */
export function getCurrentFacingMode(): FacingMode {
	return currentFacingMode;
}

/** Attach stream to a video element. */
export function attachStream(videoEl: HTMLVideoElement, stream: MediaStream): Promise<void> {
	videoEl.srcObject = stream;
	videoEl.muted = true;
	videoEl.playsInline = true;
	return videoEl.play().catch(() => {
		// Safari may require user interaction — handled in component
	});
}

/**
 * Map a media error to a user-facing key. Works for Error and DOMException
 * (getUserMedia throws DOMException, which does not inherit from Error).
 */
export function getCameraErrorMessage(err: unknown): string {
	const name =
		typeof err === 'object' && err !== null ? ((err as { name?: string }).name ?? '') : '';

	switch (name) {
		case 'NotAllowedError':
		case 'PermissionDeniedError':
			return 'permission_denied';
		case 'NotFoundError':
		case 'DevicesNotFoundError':
			return 'no_camera';
		case 'NotReadableError':
		case 'TrackStartError':
			return 'camera_busy';
		case 'OverconstrainedError':
			return 'overconstrained';
		default:
			return 'unknown';
	}
}

// Safety net: stop camera on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', stopCamera);
}
