/**
 * Camera Utility — manages MediaStream lifecycle
 * All camera track management is centralized here.
 */

/** @type {MediaStream|null} */
let activeStream = null;

/** @type {string} Current facing mode */
let currentFacingMode = 'user';

/**
 * Start the camera with a given facing mode.
 * @param {'user'|'environment'} facingMode
 * @returns {Promise<MediaStream>}
 */
export async function startCamera(facingMode = 'user') {
  // Stop any existing stream first
  stopCamera();
  currentFacingMode = facingMode;

  const constraints = {
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
  } catch (err) {
    activeStream = null;
    throw err;
  }
}

/**
 * Stop all active camera tracks.
 */
export function stopCamera() {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
}

/**
 * Switch between front and rear camera.
 * @returns {Promise<MediaStream>}
 */
export async function switchCamera() {
  const next = currentFacingMode === 'user' ? 'environment' : 'user';
  return startCamera(next);
}

/**
 * Check if the device supports multiple cameras.
 * @returns {Promise<boolean>}
 */
export async function hasMultipleCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoCams = devices.filter((d) => d.kind === 'videoinput');
    return videoCams.length > 1;
  } catch {
    return false;
  }
}

/**
 * Get the current facing mode.
 * @returns {'user'|'environment'}
 */
export function getCurrentFacingMode() {
  return currentFacingMode;
}

/**
 * Attach stream to a video element.
 * @param {HTMLVideoElement} videoEl
 * @param {MediaStream} stream
 */
export function attachStream(videoEl, stream) {
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  return videoEl.play().catch(() => {
    // Safari may require user interaction — handled in component
  });
}

/**
 * Map MediaError name to a user-friendly message.
 * @param {Error} err
 * @returns {string}
 */
export function getCameraErrorMessage(err) {
  switch (err.name) {
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
