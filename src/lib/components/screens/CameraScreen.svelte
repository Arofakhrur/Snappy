<script>
  import { onMount, onDestroy } from 'svelte';
  import { session, addPhoto, finishCapture, setRetakeIndex, goTo, setCameraError } from '#lib/stores/session.js';
  import { startCamera, stopCamera, switchCamera, attachStream, getCameraErrorMessage, hasMultipleCameras } from '#lib/utils/camera.js';
  import { captureFrame, runCountdown } from '#lib/utils/capture.js';
  import PermissionIllus from '#lib/components/illustrations/PermissionIllus.svelte';
  import CrocShutter from '#lib/components/illustrations/CrocShutter.svelte';

  /** @type {HTMLVideoElement} */
  let videoEl;

  /** @type {HTMLElement} */
  let viewportEl;

  /** @type {MediaStream|null} */
  let stream = null;

  let isLoading       = true;
  let errorType       = null;   // 'permission_denied' | 'no_camera' | 'camera_busy' | 'unknown' | null
  let countdownValue  = null;   // null | 0..3
  let isSessionActive = false;
  let isFlashing      = false;
  let canSwitch       = false;
  let captureCancel   = null;
  let currentPhotoNum = 0;

  // ── Croc shutter animation progress (0 = open, 1 = snapped shut) ────
  let shutterProgress = 0;
  let shutterAnimId   = null;

  // Read session store
  $: photoCount    = $session.photoCount;
  $: retakeIndex   = $session.retakeIndex;
  const isSingleRetake = $session.retakeIndex !== null;

  // ── Animation helpers ───────────────────────────────────────────────
  function animateShutter(from, to, durationMs, easeFn = (t) => t) {
    return new Promise((resolve) => {
      if (shutterAnimId) cancelAnimationFrame(shutterAnimId);
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / durationMs);
        shutterProgress = from + (to - from) * easeFn(t);
        if (t < 1) {
          shutterAnimId = requestAnimationFrame(step);
        } else {
          shutterProgress = to;
          shutterAnimId   = null;
          resolve();
        }
      }
      shutterAnimId = requestAnimationFrame(step);
    });
  }

  function easeInQuart(t) { return t * t * t * t; }
  function easeOutBack(t) {
    const c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // ── Camera initialization ───────────────────────────────────────────
  async function initCamera() {
    isLoading  = true;
    errorType  = null;
    try {
      stream    = await startCamera('user');
      canSwitch = await hasMultipleCameras();
      if (videoEl) await attachStream(videoEl, stream);
      isLoading = false;
      if ($session.retakeIndex !== null) await startCaptureSession();
    } catch (err) {
      isLoading = false;
      errorType = getCameraErrorMessage(err);
      setCameraError(errorType);
    }
  }

  async function handleSwitchCamera() {
    isLoading = true;
    try {
      stream = await switchCamera();
      if (videoEl) await attachStream(videoEl, stream);
      isLoading = false;
    } catch { isLoading = false; }
  }

  // ── Capture session flow ────────────────────────────────────────────
  async function startCaptureSession() {
    if (isSessionActive) return;

    if (retakeIndex === null) {
      session.update((s) => ({ ...s, photos: [], captureProgress: 0 }));
    }

    isSessionActive  = true;
    currentPhotoNum  = retakeIndex !== null ? retakeIndex + 1 : 1;
    const totalShots = retakeIndex !== null ? 1 : photoCount;

    for (let i = 0; i < totalShots; i++) {
      await new Promise((resolve) => {
        captureCancel = runCountdown({
          from: 3,
          onTick: (n) => {
            countdownValue = n;
            // Anticipation jaw creep: jaws drift slightly closed during countdown
            const partial = (3 - n) / 3 * 0.28;
            animateShutter(shutterProgress, partial, 280, easeInQuart);
          },
          onCapture: () => {
            countdownValue = 0;
            // SNAP: jaws slam completely shut -> flash -> capture -> bounce open
            animateShutter(shutterProgress, 1, 200, easeInQuart).then(() => {
              if (videoEl) {
                // Calculate visible aspect ratio of the viewport for WYSIWYG capture
                const aspect = viewportEl && viewportEl.clientHeight > 0
                  ? viewportEl.clientWidth / viewportEl.clientHeight
                  : 929 / 458;
                addPhoto(captureFrame(videoEl, aspect));
              }
              isFlashing = true;
              setTimeout(() => { isFlashing = false; }, 320);
              captureCancel = null;
              // Jaws bounce open to reveal camera preview again
              animateShutter(1, 0, 480, easeOutBack).then(resolve);
            });
          },
        });
      });

      countdownValue = null;
      if (i < totalShots - 1) {
        currentPhotoNum++;
        await new Promise((r) => setTimeout(r, 650));
      }
    }

    isSessionActive = false;
    shutterProgress = 0;
    stopCamera();

    if (retakeIndex !== null) {
      setRetakeIndex(null);
      goTo('review');
    } else {
      finishCapture();
    }
  }

  async function retryPermission() { await initCamera(); }

  // ── Lifecycle ───────────────────────────────────────────────────────
  onMount(() => {
    initCamera();
  });

  onDestroy(() => {
    if (captureCancel) captureCancel.cancel();
    if (shutterAnimId) cancelAnimationFrame(shutterAnimId);
    stopCamera();
  });
</script>

<section class="camera-screen screen-enter">

  {#if errorType}
    <!-- ── Error state ─────────────────────────────────────── -->
    <div class="error-state">
      <PermissionIllus size="160" />
      <div class="error-text">
        {#if errorType === 'permission_denied'}
          <h2>Camera access denied</h2>
          <p>Allow camera access in your browser settings, then tap <strong>Try Again</strong>.</p>
          <div class="error-steps">
            <p>On Chrome: tap the 🔒 icon in the address bar → Camera → Allow</p>
            <p>On Safari: Settings → Safari → Camera → Allow</p>
          </div>
        {:else if errorType === 'no_camera'}
          <h2>No camera found</h2>
          <p>Make sure your camera is connected and not in use by another app.</p>
        {:else if errorType === 'camera_busy'}
          <h2>Camera is in use</h2>
          <p>Another app is using your camera. Close it and try again.</p>
        {:else}
          <h2>Camera error</h2>
          <p>An unexpected error occurred. Please try again.</p>
        {/if}
      </div>
      <div class="error-actions">
        <button id="btn-retry-camera" class="btn btn-primary" on:click={retryPermission}>
          Try Again
        </button>
        <button class="btn btn-ghost btn-sm" on:click={() => goTo('start')}>
          ← Back
        </button>
      </div>
    </div>
  {:else}
    <!-- ── Main Camera View (Fullscreen Studio Mode) ───────── -->

    <!-- Center: Crocodile Camera Stage -->
    <main class="stage-container">
      <div class="croc-stage">

        <!-- Camera Viewport: precisely tucked behind gums with zero gaps -->
        <div class="camera-viewport" bind:this={viewportEl}>
          <!-- svelte-ignore a11y-media-has-caption -->
          <video
            bind:this={videoEl}
            class="video-feed"
            autoplay muted playsinline
            aria-label="Live camera preview"
          ></video>

          <!-- Loading Spinner Overlay -->
          {#if isLoading}
            <div class="loading-overlay" aria-live="polite">
              <div class="spinner"></div>
              <p>Starting camera…</p>
            </div>
          {/if}

          <!-- Countdown Overlay (3, 2, 1, 📸) -->
          {#if countdownValue !== null}
            <div class="countdown-overlay" aria-live="assertive" aria-label="Countdown {countdownValue}">
              <div class="countdown-number" class:zero={countdownValue === 0}>
                {countdownValue === 0 ? '📸' : countdownValue}
              </div>
            </div>
          {/if}
        </div>

        <!-- Crocodile Animated Jaw Shutter (Upper Jaw, Lower Jaw, Green Neck, Spikes) -->
        <CrocShutter
          progress={shutterProgress}
          {isFlashing}
        />

      </div>
    </main>

    <!-- Right Side: Floating Shutter Button Panel -->
    <aside class="shutter-side-panel">
      <button
        id="btn-start-session"
        class="btn-shutter-main"
        on:click={startCaptureSession}
        disabled={isLoading || isSessionActive || !!errorType}
        aria-label={isSessionActive ? 'Capture in progress' : 'Take photo'}
      >
        <div class="shutter-outer-ring">
          <div class="shutter-inner-disc">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
        </div>
      </button>
    </aside>

  {/if}
</section>

<style>
  /* ══════════════════════════════════════════════════════════
     Camera Screen
     Dark camera studio aesthetic (#0B0F12).
     High contrast, professional layout where the crocodile
     illustration and live camera take center stage.
  ══════════════════════════════════════════════════════════ */
  .camera-screen {
    position: relative;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: #0B0F12;   /* Deep camera studio black */
    color: #F8FAFC;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Center Stage Container ────────────────────────────── */
  .stage-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Generous right padding so crocodile stays centered without colliding with right shutter button */
    padding: 16px clamp(76px, 10vw, 130px) 16px clamp(16px, 3vw, 40px);
    overflow: hidden;
    box-sizing: border-box;
  }

  /* Crocodile Stage: Maintains exact 1095 / 757 native proportion */
  .croc-stage {
    position: relative;
    /* Scaled up vertically now that header & footer are removed */
    width: min(88vw, calc(94vh * (1095 / 757)));
    aspect-ratio: 1095 / 757;
    max-width: 1140px;
    margin: 0 auto;
    filter: drop-shadow(0 16px 36px rgba(0, 0, 0, 0.6));
  }

  /* ── Camera Viewport ──────────────────────────────────────
     Tucked cleanly behind upper & lower gums with ZERO gaps:
       top: 16.5%    (above upper gums at 17.8% -> no top teeth gap)
       bottom: 11.8% (below lower gums at 13.1% -> no bottom teeth gap)
       left: 0       (covered by snout curve)
       right: 8.4%   (extends to green neck -> wider mouth to right)
  ──────────────────────────────────────────────────────── */
  .camera-viewport {
    position: absolute;
    top: 16.5%;
    bottom: 11.8%;
    left: 0;
    right: 8.4%;
    overflow: hidden;
    background: #050708;
    z-index: 1;
    border-radius: 2px;
  }

  /* Video Feed: Mirrored selfie, fills the mouth opening */
  .video-feed {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
    display: block;
    background: #000000;
  }

  /* Loading Overlay */
  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(11, 15, 18, 0.85);
    gap: 12px;
    z-index: 6;
    color: white;
    font-size: 0.9rem;
  }

  .spinner {
    width: 38px;
    height: 38px;
    border: 3.5px solid rgba(255, 255, 255, 0.2);
    border-top-color: #FCD34D;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Countdown Overlay */
  .countdown-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 8;
    pointer-events: none;
  }

  .countdown-number {
    font-family: var(--font-mono, monospace);
    font-size: clamp(4.5rem, 15vw, 8rem);
    font-weight: 800;
    color: #FFFFFF;
    text-shadow: 0 0 40px rgba(0, 0, 0, 0.9), 0 4px 20px rgba(0, 0, 0, 0.8);
    animation: countdownPulse 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    line-height: 1;
  }

  .countdown-number.zero {
    font-size: clamp(3rem, 10vw, 5.5rem);
    animation: countdownPulse 0.35s ease forwards;
  }

  /* ══════════════════════════════════════════════════════════
     Floating Right Shutter Button Panel
  ══════════════════════════════════════════════════════════ */
  .shutter-side-panel {
    position: absolute;
    right: clamp(16px, 3.5vw, 44px);
    top: 50%;
    transform: translateY(-50%);
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* ── Shutter Button ────────────────────────────────────── */
  .btn-shutter-main {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-shutter-main:hover:not(:disabled) {
    transform: scale(1.08);
  }

  .btn-shutter-main:active:not(:disabled) {
    transform: scale(0.92);
  }

  .btn-shutter-main:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  .shutter-outer-ring {
    width: 66px;
    height: 66px;
    border-radius: 50%;
    background: #FFFFFF;
    padding: 4px;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25), 0 6px 20px rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.2s ease;
  }

  .btn-shutter-main:hover:not(:disabled) .shutter-outer-ring {
    box-shadow: 0 0 0 5px rgba(252, 211, 77, 0.5), 0 8px 24px rgba(0, 0, 0, 0.7);
  }

  .shutter-inner-disc {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #111519;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .btn-shutter-main:hover:not(:disabled) .shutter-inner-disc {
    background: #1E242B;
    color: #FCD34D;
  }

  /* ── Keyframes ─────────────────────────────────────────── */
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes countdownPulse {
    0% {
      transform: scale(0.5);
      opacity: 0;
    }
    40% {
      transform: scale(1.1);
      opacity: 1;
    }
    70% {
      transform: scale(1);
    }
    100% {
      transform: scale(0.95);
      opacity: 0.9;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ── Error state ────────────────────────────────────────── */
  .error-state {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8, 32px) var(--space-6, 24px);
    gap: var(--space-5, 20px);
    background: var(--color-bg, #FAF7F2);
    color: var(--color-ink, #0F172A);
    text-align: center;
  }

  .error-text h2 {
    font-family: var(--font-display, sans-serif);
    font-size: var(--text-2xl, 1.75rem);
    font-weight: 700;
    color: var(--color-ink, #0F172A);
    margin-bottom: var(--space-3, 12px);
  }

  .error-text p {
    color: var(--color-ink-light, #475569);
    line-height: 1.6;
    font-size: var(--text-base, 1rem);
  }

  .error-steps {
    margin-top: var(--space-4, 16px);
    padding: var(--space-4, 16px);
    background: var(--color-surface, #FFFFFF);
    border: 1.5px solid var(--color-border, #E2E8F0);
    border-radius: var(--radius-md, 8px);
    text-align: left;
  }

  .error-steps p {
    font-size: var(--text-sm, 0.875rem);
    color: var(--color-ink-light, #475569);
    margin-bottom: var(--space-2, 8px);
  }

  .error-steps p:last-child { margin-bottom: 0; }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3, 12px);
    align-items: center;
  }
</style>
