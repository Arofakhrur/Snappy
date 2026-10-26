<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { session, addPhoto, finishCapture, setRetakeIndex, goTo, setCameraError } from '#lib/stores/session';
  import { startCamera, stopCamera, switchCamera, attachStream, getCameraErrorMessage, hasMultipleCameras } from '#lib/utils/camera';
  import { captureFrame, runCountdown, type CountdownHandle } from '#lib/utils/capture';
  import PermissionIllus from '#lib/components/illustrations/PermissionIllus.svelte';

  let videoEl: HTMLVideoElement | undefined;

  let stream: MediaStream | null = null;

  let isLoading = true;
  let errorType: string | null = null; // 'permission_denied' | 'no_camera' | 'camera_busy' | 'unknown' | null
  let countdownValue: number | null = null; // null | 0..3
  let isSessionActive = false;
  let isFlashing = false;
  let canSwitch = false;
  let captureCancel: CountdownHandle | null = null;
  let currentPhotoNum = 0;

  // Read from session store
  $: photoCount = $session.photoCount;
  $: retakeIndex = $session.retakeIndex;

  const isSingleRetake = $session.retakeIndex !== null;

  async function initCamera(): Promise<void> {
    isLoading = true;
    errorType = null;
    try {
      stream = await startCamera('user');
      canSwitch = await hasMultipleCameras();
      if (videoEl) {
        await attachStream(videoEl, stream);
      }
      isLoading = false;

      // If we're in retake mode, start the session immediately
      if ($session.retakeIndex !== null) {
        await startCaptureSession();
      }
    } catch (err) {
      isLoading = false;
      errorType = getCameraErrorMessage(err);
      setCameraError(errorType);
    }
  }

  async function handleSwitchCamera(): Promise<void> {
    isLoading = true;
    try {
      stream = await switchCamera();
      if (videoEl) {
        await attachStream(videoEl, stream);
      }
      isLoading = false;
    } catch (err) {
      isLoading = false;
    }
  }

  async function startCaptureSession(): Promise<void> {
    if (isSessionActive) return;

    // When starting a full session (not single retake), completely wipe previous photos
    if (retakeIndex === null) {
      session.update((s) => ({
        ...s,
        photos: [],
        captureProgress: 0,
      }));
    }

    isSessionActive = true;
    currentPhotoNum = retakeIndex !== null ? retakeIndex + 1 : 1;
    const totalShots = retakeIndex !== null ? 1 : photoCount;

    for (let i = 0; i < totalShots; i++) {
      // Wait for countdown
      await new Promise<void>((resolve) => {
        captureCancel = runCountdown({
          from: 3,
          onTick: (n) => { countdownValue = n; },
          onCapture: () => {
            countdownValue = 0;
            // Flash effect
            isFlashing = true;
            setTimeout(() => { isFlashing = false; }, 320);

            // Capture frame
            if (videoEl) {
              const dataUrl = captureFrame(videoEl);
              addPhoto(dataUrl);
            }

            captureCancel = null;
            resolve();
          },
        });
      });

      countdownValue = null;

      if (i < totalShots - 1) {
        currentPhotoNum++;
        await new Promise((r) => setTimeout(r, 700));
      }
    }

    isSessionActive = false;
    stopCamera();

    // Transition
    if (retakeIndex !== null) {
      setRetakeIndex(null);
      goTo('review');
    } else {
      finishCapture();
    }
  }

  async function retryPermission(): Promise<void> {
    await initCamera();
  }

  onMount(() => {
    initCamera();
  });

  onDestroy(() => {
    if (captureCancel) captureCancel.cancel();
    stopCamera();
  });
</script>

<section class="camera-screen screen-enter">
  <!-- Error States -->
  {#if errorType}
    <div class="error-state">
      <PermissionIllus size="160" />
      <div class="error-text">
        {#if errorType === 'permission_denied'}
          <h2>Camera access denied</h2>
          <p>
            To use the photobooth, allow camera access in your browser settings,
            then tap <strong>Try Again</strong>.
          </p>
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
    <!-- Camera Preview Area -->
    <div class="preview-area">
      <!-- Loading overlay -->
      {#if isLoading}
        <div class="loading-overlay" aria-live="polite" aria-label="Initializing camera">
          <div class="spinner"></div>
          <p>Starting camera…</p>
        </div>
      {/if}

      <!-- Flash effect -->
      {#if isFlashing}
        <div class="flash-overlay" aria-hidden="true"></div>
      {/if}

      <!-- Video feed -->
      <!-- svelte-ignore a11y-media-has-caption -->
      <video
        bind:this={videoEl}
        class="video-feed"
        autoplay
        muted
        playsinline
        aria-label="Live camera preview"
      ></video>

      <!-- Countdown overlay -->
      {#if countdownValue !== null}
        <div class="countdown-overlay" aria-live="assertive" aria-label="Countdown: {countdownValue}">
          <div class="countdown-number" class:zero={countdownValue === 0}>
            {countdownValue === 0 ? '📸' : countdownValue}
          </div>
        </div>
      {/if}

      <!-- Progress dots -->
      <div class="progress-dots" aria-label="Photo {currentPhotoNum} of {isSingleRetake ? 1 : photoCount}">
        {#each Array(photoCount) as _, i}
          <div
            class="progress-dot"
            class:filled={$session.photos[i]}
            class:active={isSingleRetake
              ? i === retakeIndex
              : !isSessionActive
                ? false
                : i === currentPhotoNum - 1}
          ></div>
        {/each}
      </div>
    </div>

    <!-- Controls bar -->
    <div class="controls-bar">
      <!-- Back button -->
      <button
        id="btn-camera-back"
        class="btn btn-ghost btn-sm control-side"
        on:click={() => { stopCamera(); goTo('start'); }}
        aria-label="Go back to start"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <!-- Capture button -->
      <button
        id="btn-start-session"
        class="btn-capture"
        on:click={startCaptureSession}
        disabled={isLoading || isSessionActive || !!errorType}
        aria-label={isSessionActive ? 'Capture in progress' : 'Start photo session'}
      ></button>

      <!-- Camera switch -->
      {#if canSwitch}
        <button
          id="btn-switch-camera"
          class="btn btn-ghost btn-sm control-side"
          on:click={handleSwitchCamera}
          disabled={isLoading || isSessionActive}
          aria-label="Switch camera"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 7h-9"/>
            <path d="M14 17H5"/>
            <circle cx="17" cy="17" r="3"/>
            <circle cx="7" cy="7" r="3"/>
          </svg>
          Flip
        </button>
      {:else}
        <div class="control-side"></div>
      {/if}
    </div>

    <!-- Session hint -->
    {#if !isSessionActive && !isLoading}
      <p class="session-hint" role="status">
        {#if isSingleRetake}
          Tap the button to retake photo {(retakeIndex ?? 0) + 1}
        {:else}
          Tap the button to start — {photoCount} photos with countdown
        {/if}
      </p>
    {:else if isSessionActive}
      <p class="session-hint active" role="status" aria-live="polite">
        {#if countdownValue !== null && countdownValue > 0}
          Get ready… smile! 📸
        {:else if countdownValue === 0}
          Snap!
        {:else}
          Photo {currentPhotoNum} of {isSingleRetake ? 1 : photoCount} — hold still!
        {/if}
      </p>
    {/if}
  {/if}
</section>

<style>
  .camera-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #0A0A0A;
    color: white;
    position: relative;
  }

  /* ── Preview Area ──────────────────────────────── */
  .preview-area {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #111;
    min-height: 0;
  }

  .video-feed {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* Mirror for selfie mode */
    display: block;
    background: #111;
  }

  /* Loading overlay */
  .loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    gap: var(--space-4);
    z-index: 5;
    color: white;
    font-size: var(--text-sm);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: var(--radius-full);
    animation: spin 0.8s linear infinite;
  }

  /* Flash overlay */
  .flash-overlay {
    position: absolute;
    inset: 0;
    background: white;
    z-index: 10;
    animation: flashEffect 320ms ease forwards;
    pointer-events: none;
  }

  /* Countdown overlay */
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
    font-family: var(--font-mono);
    font-size: clamp(6rem, 20vw, 10rem);
    font-weight: 700;
    color: white;
    text-shadow: 0 0 40px rgba(0,0,0,0.8), 0 4px 16px rgba(0,0,0,0.6);
    animation: countdownPulse 0.9s ease forwards;
    line-height: 1;
  }

  .countdown-number.zero {
    font-size: clamp(4rem, 14vw, 7rem);
    animation: countdownPulse 0.4s ease forwards;
  }

  /* Progress dots */
  .progress-dots {
    position: absolute;
    bottom: var(--space-4);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: var(--space-2);
    z-index: 6;
  }

  .progress-dot {
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    border: 2px solid rgba(255, 255, 255, 0.6);
    background: transparent;
    transition: all var(--transition-base);
  }

  .progress-dot.filled {
    background: white;
    border-color: white;
  }

  .progress-dot.active {
    border-color: var(--color-highlight);
    box-shadow: 0 0 8px var(--color-highlight);
    animation: pulse 1s ease-in-out infinite;
  }

  /* ── Controls Bar ──────────────────────────────── */
  .controls-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    background: #0A0A0A;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .control-side {
    min-width: 64px;
  }

  .session-hint {
    text-align: center;
    font-size: var(--text-sm);
    color: rgba(255, 255, 255, 0.5);
    padding: var(--space-2) var(--space-4) var(--space-4);
    background: #0A0A0A;
    margin: 0;
  }

  .session-hint.active {
    color: rgba(255, 255, 255, 0.8);
  }

  /* ── Error State ───────────────────────────────── */
  .error-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8) var(--space-6);
    gap: var(--space-5);
    background: var(--color-bg);
    text-align: center;
  }

  .error-text h2 {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-ink);
    margin-bottom: var(--space-3);
  }

  .error-text p {
    color: var(--color-ink-light);
    line-height: 1.6;
    font-size: var(--text-base);
  }

  .error-steps {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    text-align: left;
  }

  .error-steps p {
    font-size: var(--text-sm);
    color: var(--color-ink-light);
    margin-bottom: var(--space-2);
  }

  .error-steps p:last-child {
    margin-bottom: 0;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    align-items: center;
  }

  /* ── Desktop layout ────────────────────────────── */
  @media (min-width: 768px) {
    .camera-screen {
      flex-direction: row;
    }

    .preview-area {
      flex: 1;
      height: 100dvh;
      height: 100vh;
    }

    .video-feed {
      max-height: 100%;
    }

    .controls-bar {
      flex-direction: column;
      justify-content: center;
      width: 200px;
      height: 100dvh;
      height: 100vh;
      border-top: none;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      padding: var(--space-6);
      gap: var(--space-5);
    }

    .control-side {
      min-width: auto;
    }

    .session-hint {
      display: none;
    }
  }
</style>
