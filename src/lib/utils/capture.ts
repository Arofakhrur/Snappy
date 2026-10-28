/**
 * Capture Utility — captures a single frame from a video element
 */

/**
 * Capture a frame from a video element and return it as a data URL.
 * Optionally crops to match the visible viewport's aspect ratio so what
 * the user sees is exactly what gets captured (WYSIWYG).
 * If filterString is provided (a CSS filter value), the same visual
 * treatment is baked into the captured image.
 */
export function captureFrame(
	videoEl: HTMLVideoElement,
	targetAspectRatio: number | null = null,
	filterString: string = 'none'
): string {
	const vw = videoEl.videoWidth || 640;
	const vh = videoEl.videoHeight || 480;
	const videoAspect = vw / vh;

	let sx = 0;
	let sy = 0;
	let sw = vw;
	let sh = vh;

	if (targetAspectRatio && targetAspectRatio > 0) {
		if (videoAspect > targetAspectRatio) {
			// Video is wider than target: crop sides
			sw = Math.round(vh * targetAspectRatio);
			sx = Math.round((vw - sw) / 2);
		} else {
			// Video is taller than target: crop top/bottom
			sh = Math.round(vw / targetAspectRatio);
			sy = Math.round((vh - sh) / 2);
		}
	}

	const canvas = document.createElement('canvas');
	canvas.width = sw;
	canvas.height = sh;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		// 2D context unavailable — surface an empty frame instead of throwing mid-capture
		return canvas.toDataURL('image/png');
	}

	if (filterString && filterString !== 'none') {
		ctx.filter = filterString;
	}

	// Mirror for front camera (selfie mode)
	ctx.save();
	ctx.scale(-1, 1);
	ctx.drawImage(videoEl, sx, sy, sw, sh, -sw, 0, sw, sh);
	ctx.restore();

	return canvas.toDataURL('image/png');
}

export interface CountdownOptions {
	/** Start number (e.g., 3) */
	from: number;
	/** Called with the current countdown value */
	onTick: (n: number) => void;
	/** Called when the countdown reaches 0 */
	onCapture: () => void;
	/** Milliseconds per tick (default 1000) */
	intervalMs?: number;
}

export interface CountdownHandle {
	cancel: () => void;
}

/**
 * Run a countdown, calling onTick each second and onCapture when done.
 * Returns a cancel function.
 */
export function runCountdown({
	from,
	onTick,
	onCapture,
	intervalMs = 1000,
}: CountdownOptions): CountdownHandle {
	let current = from;
	let cancelled = false;

	onTick(current);

	const id = setInterval(() => {
		if (cancelled) return;
		current--;
		if (current > 0) {
			onTick(current);
		} else {
			clearInterval(id);
			onTick(0);
			setTimeout(() => {
				if (!cancelled) onCapture();
			}, 200);
		}
	}, intervalMs);

	return {
		cancel() {
			cancelled = true;
			clearInterval(id);
		},
	};
}
