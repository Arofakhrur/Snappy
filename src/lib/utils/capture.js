/**
 * Capture Utility — captures a single frame from a video element
 */

/**
 * Capture a frame from a video element and return it as a data URL.
 * Optionally crops to match the visible viewport's aspect ratio so what
 * the user sees is exactly what gets captured (WYSIWYG).
 *
 * @param {HTMLVideoElement} videoEl
 * @param {number|null} [targetAspectRatio=null] width / height
 * @returns {string} PNG data URL
 */
export function captureFrame(videoEl, targetAspectRatio = null) {
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

  // Mirror for front camera (selfie mode)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, sx, sy, sw, sh, -sw, 0, sw, sh);
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
