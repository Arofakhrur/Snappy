/**
 * Capture Utility — captures a single frame from a video element
 */

/**
 * Capture a frame from a video element and return it as a data URL.
 * @param {HTMLVideoElement} videoEl
 * @returns {string} PNG data URL
 */
export function captureFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  // Mirror for front camera (selfie mode)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Run a countdown, calling onTick each second and onCapture when done.
 * Returns a cancel function.
 *
 * @param {object} options
 * @param {number} options.from - start number (e.g., 3)
 * @param {(n: number) => void} options.onTick - called with current countdown value
 * @param {() => void} options.onCapture - called when countdown reaches 0
 * @param {number} [options.intervalMs=1000]
 * @returns {{ cancel: () => void }}
 */
export function runCountdown({ from, onTick, onCapture, intervalMs = 1000 }) {
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
