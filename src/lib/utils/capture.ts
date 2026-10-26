/**
 * Capture Utility — captures a single frame from a video element
 */

/** Capture a frame from a video element and return it as a data URL. */
export function captureFrame(videoEl: HTMLVideoElement): string {
	const canvas = document.createElement('canvas');
	canvas.width = videoEl.videoWidth || 640;
	canvas.height = videoEl.videoHeight || 480;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		// 2D context unavailable — surface an empty frame instead of throwing mid-capture
		return canvas.toDataURL('image/png');
	}

	// Mirror for front camera (selfie mode)
	ctx.save();
	ctx.scale(-1, 1);
	ctx.drawImage(videoEl, -canvas.width, 0, canvas.width, canvas.height);
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
