<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { session, addPhoto, finishCapture, setRetakeIndex, goTo, setCameraError, setCameraSettings } from '#lib/stores/session';
  import { startCamera, stopCamera, switchCamera, attachStream, getCameraErrorMessage, hasMultipleCameras } from '#lib/services/camera';
  import { captureFrame, runCountdown, type CountdownHandle } from '#lib/utils/capture';
  import PermissionIllus from '../../features/camera/PermissionIllus.svelte';
  import CrocShutter from '../../features/camera/CrocShutter.svelte';
  import ThemePicker from '../../features/camera/ThemePicker.svelte';
  import GridOverlayLayer from '../../features/camera/GridOverlayLayer.svelte';
  import { Camera, Clock, Zap, Droplet, Grid, Wallpaper, SwitchCamera, ArrowLeft } from '@lucide/svelte';
  import type { CameraFilter, CameraTheme, FlashMode, GridOverlay, TimerDuration } from '#lib/types';

  // ── Import Utilitas Audio ──────────────────────────────────────────
  import { initAudio, playSound } from '#lib/utils/audio';

  // ── Kosakata settings toolbar ──────────────────────────────────────
  const TIMER_STEPS: TimerDuration[] = [0, 3, 5, 10];
  const FLASH_STEPS: FlashMode[] = ['off', 'on', 'auto'];
  const FILTER_STEPS: CameraFilter[] = ['none', 'grayscale', 'sepia', 'high-contrast', 'warm', 'cool'];
  const GRID_STEPS: GridOverlay[] = ['none', 'thirds'];

  const TIMER_LABELS: Record<TimerDuration, string> = { 0: 'Off', 3: '3s', 5: '5s', 10: '10s' };
  const FLASH_LABELS: Record<FlashMode, string> = { off: 'Off', on: 'On', auto: 'Auto' };
  const FILTER_LABELS: Record<CameraFilter, string> = {
    none: 'None',
    grayscale: 'B/W',
    sepia: 'Sepia',
    'high-contrast': 'Punch',
    warm: 'Warm',
    cool: 'Cool',
  };
  const THEME_LABELS: Record<CameraTheme, string> = { clean: 'Clean', croc: 'Croc', polaroid: 'Polaroid', film: 'Film' };

  const FILTER_CSS: Record<CameraFilter, string> = {
    none: 'none',
    grayscale: 'grayscale(1)',
    sepia: 'sepia(0.8) saturate(1.2)',
    'high-contrast': 'contrast(1.4) brightness(1.05)',
    warm: 'sepia(0.25) saturate(1.3) brightness(1.05)',
    cool: 'saturate(0.85) brightness(1.05) hue-rotate(10deg)',
  };

  function cycle<T extends string | number>(current: T, steps: T[]): T {
    const index = steps.indexOf(current);
    return steps[(index + 1) % steps.length];
  }

  let videoEl: HTMLVideoElement | undefined;
  let cameraFrameEl: HTMLElement | undefined;
  let themeBtnEl: HTMLButtonElement | undefined;
  let stream: MediaStream | null = null;

  let isLoading = true;
  let errorType: string | null = null;
  let countdownValue: number | null = null;
  let isSessionActive = false;
  let isFlashing = false;
  let isEjecting = false;
  let themePickerOpen = false;
  let canSwitch = false;
  let captureCancel: CountdownHandle | null = null;
  let currentPhotoNum = 0;

  let shutterProgress = 0;
  let shutterAnimId: number | null = null;
  let lastPhotoUrl: string | null = null;

  $: photoCount = $session.photoCount;
  $: retakeIndex = $session.retakeIndex;
  $: isSingleRetake = $session.retakeIndex !== null;
  $: cam = $session.cameraSettings;
  $: activeTheme = cam.theme;
  $: filterCss = FILTER_CSS[cam.filter];

  $: timerLabel = TIMER_LABELS[cam.timer];
  $: flashLabel = FLASH_LABELS[cam.flash];
  $: filterLabel = FILTER_LABELS[cam.filter];
  $: gridLabel = cam.grid === 'thirds' ? '3×3' : 'Off';

  function animateShutter(
    from: number,
    to: number,
    durationMs: number,
    easeFn: (t: number) => number = (t) => t
  ): Promise<void> {
    return new Promise((resolve) => {
      if (shutterAnimId) cancelAnimationFrame(shutterAnimId);
      const start = performance.now();
      function step(now: number) {
        const t = Math.min(1, (now - start) / durationMs);
        shutterProgress = from + (to - from) * easeFn(t);
        if (t < 1) {
          shutterAnimId = requestAnimationFrame(step);
        } else {
          shutterProgress = to;
          shutterAnimId = null;
          resolve();
        }
      }
      shutterAnimId = requestAnimationFrame(step);
    });
  }

  function easeInQuart(t: number): number { return t * t * t * t; }
  function easeOutBack(t: number): number {
    const c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  async function initCamera(): Promise<void> {
    isLoading = true;
    errorType = null;
    try {
      stream = await startCamera('user');
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

  async function handleSwitchCamera(): Promise<void> {
    isLoading = true;
    try {
      stream = await switchCamera();
      if (videoEl) await attachStream(videoEl, stream);
      isLoading = false;
    } catch { isLoading = false; }
  }

  function sceneIsDark(video: HTMLVideoElement): boolean {
    const probe = document.createElement('canvas');
    probe.width = 32;
    probe.height = 18;
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(video, 0, 0, probe.width, probe.height);
    const data = ctx.getImageData(0, 0, probe.width, probe.height).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return sum / (data.length / 4) < 80;
  }

  function useFlashNow(): boolean {
    if (cam.flash === 'on') return true;
    if (cam.flash === 'auto') return !!(videoEl && videoEl.readyState >= 2 && sceneIsDark(videoEl));
    return false;
  }

  function ejectPolaroid(): void {
    if (isEjecting) return;
    isEjecting = true;
    setTimeout(() => { isEjecting = false; }, 500);
  }

  function snapOne(): Promise<void> {
    return new Promise((resolve) => {
      const isCroc = activeTheme === 'croc';
      const flashNow = useFlashNow();

      const finishFrame = (): void => {
        if (videoEl) {
          const aspect = cameraFrameEl && cameraFrameEl.clientHeight > 0
            ? cameraFrameEl.clientWidth / cameraFrameEl.clientHeight
            : 929 / 458;
          const shot = captureFrame(videoEl, aspect, filterCss);
          addPhoto(shot);
          lastPhotoUrl = shot;
        }
        captureCancel = null;
        if (flashNow) {
          isFlashing = true;
          setTimeout(() => { isFlashing = false; }, 160);
        }
        if (activeTheme === 'polaroid') ejectPolaroid();
      };

      if (isCroc) {
        animateShutter(shutterProgress, 1, 200, easeInQuart).then(() => {
          finishFrame();
          animateShutter(1, 0, 480, easeOutBack).then(resolve);
        });
      } else {
        finishFrame();
        setTimeout(resolve, flashNow || activeTheme === 'polaroid' ? 260 : 120);
      }
    });
  }

  async function startCaptureSession(): Promise<void> {
    if (isSessionActive) return;

    initAudio();

    if (get(session).retakeIndex === null) {
      session.update((s) => ({ ...s, photos: [], captureProgress: 0 }));
    }

    isSessionActive = true;
    currentPhotoNum = retakeIndex !== null ? retakeIndex + 1 : 1;
    const totalShots = retakeIndex !== null ? 1 : photoCount;
    const waitSec = get(session).cameraSettings.timer;

    for (let i = 0; i < totalShots; i++) {
      if (waitSec > 0) {
        await new Promise<void>((resolve) => {
          captureCancel = runCountdown({
            from: waitSec,
            onTick: (n) => {
              countdownValue = n;
              playSound('count');

              if (activeTheme === 'croc') {
                const partial = ((waitSec - n) / waitSec) * 0.28;
                animateShutter(shutterProgress, partial, 280, easeInQuart);
              }
            },
            onCapture: () => {
              countdownValue = 0;
              playSound('shutter');
              snapOne().then(resolve);
            },
          });
        });
      } else {
        playSound('shutter');
        await snapOne();
      }

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

  async function retryPermission(): Promise<void> {
    await initCamera();
  }

  function cycleTimer(): void { setCameraSettings({ timer: cycle(cam.timer, TIMER_STEPS) }); }
  function cycleFlash(): void { setCameraSettings({ flash: cycle(cam.flash, FLASH_STEPS) }); }
  function cycleFilter(): void { setCameraSettings({ filter: cycle(cam.filter, FILTER_STEPS) }); }
  function cycleGrid(): void { setCameraSettings({ grid: cycle(cam.grid, GRID_STEPS) }); }

  function openThemePicker(): void { themePickerOpen = true; }

  function closeThemePicker(): void {
    themePickerOpen = false;
    themeBtnEl?.focus();
  }

  function selectTheme(theme: CameraTheme): void {
    setCameraSettings({ theme });
    closeThemePicker();
  }

  onMount(() => {
    initCamera();
    initAudio();
  });

  onDestroy(() => {
    if (captureCancel) captureCancel.cancel();
    if (shutterAnimId) cancelAnimationFrame(shutterAnimId);
    stopCamera();
  });
</script>

<section class="camera-screen screen-enter">
  {#if errorType}
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
        <button id="btn-error-back" class="btn btn-ghost btn-sm" on:click={() => goTo('start')} aria-label="Kembali ke layar mulai">
          ← Back
        </button>
      </div>
    </div>
  {:else}
    <header class="camera-top-bar">
      <button
        id="btn-back"
        class="bar-btn"
        on:click={() => goTo('strip')}
        disabled={isSessionActive}
        aria-label="Kembali ke pilih strip"
      >
        <ArrowLeft size={20}/>
      </button>

      <span class="shot-counter" role="status">
        {#if isSessionActive}
          #{currentPhotoNum} / {isSingleRetake ? 1 : photoCount}
        {:else if isSingleRetake}
          Retake #{(retakeIndex ?? 0) + 1}
        {:else}
          {photoCount} Shots
        {/if}
      </span>

      <div class="bar-right">
        {#if canSwitch}
          <button
            id="btn-switch-camera"
            class="bar-btn"
            on:click={handleSwitchCamera}
            disabled={isLoading || isSessionActive}
            aria-label="Switch camera"
          >
            <SwitchCamera size={20}/>
          </button>
        {/if}

        <button
          bind:this={themeBtnEl}
          id="btn-theme"
          class="bar-btn bar-btn-wide"
          on:click={openThemePicker}
          disabled={isSessionActive}
          aria-haspopup="dialog"
          aria-expanded={themePickerOpen}
        >
          <Wallpaper size={20}/>
          {THEME_LABELS[activeTheme]}
        </button>
      </div>
    </header>

    {#if themePickerOpen}
      <ThemePicker activeTheme={activeTheme} onSelect={selectTheme} onClose={closeThemePicker} />
    {/if}

    <main class="camera-surface theme-{activeTheme}">
      {#if activeTheme === 'croc'}
        <CrocShutter progress={shutterProgress} {isFlashing} />
      {/if}

      <div class="camera-frame" bind:this={cameraFrameEl} class:is-ejecting={isEjecting}>
        <!-- svelte-ignore a11y-media-has-caption -->
        <video
          bind:this={videoEl}
          class="video-feed"
          style:filter={filterCss}
          autoplay muted playsinline
          aria-label="Live camera preview"
        ></video>

        <GridOverlayLayer visible={cam.grid === 'thirds'} />

        {#if activeTheme !== 'croc' && isFlashing}
          <div class="flash-veil" aria-hidden="true"></div>
        {/if}

        {#if isLoading}
          <div class="loading-overlay" aria-live="polite">
            <div class="spinner"></div>
            <p>Starting camera…</p>
          </div>
        {/if}

        {#if countdownValue !== null}
          <div class="countdown-overlay" aria-live="assertive" aria-label="Countdown {countdownValue}">
            {#if countdownValue !== 0}
              <div class="countdown-number" class:zero={countdownValue === 0}>
                {countdownValue}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </main>

    <footer class="camera-bottom-bar">
      <div class="settings-row" role="group" aria-label="Pengaturan kamera">
        <button class="setting-btn" class:on={cam.timer > 0} on:click={cycleTimer} disabled={isSessionActive} aria-label="Timer {timerLabel}">
          <span class="setting-icon">
            <Clock size={20}/>
          </span>
          <span class="setting-name">Timer <em>{timerLabel}</em></span>
        </button>

        <button class="setting-btn" class:on={cam.flash !== 'off'} on:click={cycleFlash} disabled={isSessionActive} aria-label="Flash {flashLabel}">
          <span class="setting-icon">
            <Zap size={20}/>
          </span>
          <span class="setting-name">Flash <em>{flashLabel}</em></span>
        </button>

        <button class="setting-btn" class:on={cam.filter !== 'none'} on:click={cycleFilter} disabled={isSessionActive} aria-label="Filter {filterLabel}">
          <span class="setting-icon">
            <Droplet size={20}/>
          </span>
          <span class="setting-name">Filter <em>{filterLabel}</em></span>
        </button>

        <button class="setting-btn" class:on={cam.grid === 'thirds'} on:click={cycleGrid} disabled={isSessionActive} aria-label="Grid {gridLabel}">
          <span class="setting-icon">
            <Grid size={20}/>
          </span>
          <span class="setting-name">Grid <em>{gridLabel}</em></span>
        </button>
      </div>

      {#if !isLoading}
        <button
          id="btn-start-session"
          class="btn-shutter-main"
          on:click={startCaptureSession}
          disabled={isSessionActive || !!errorType}
          aria-label={isSessionActive ? 'Capture in progress' : 'Take photo'}
        >
          <span class="shutter-outer-ring">
            <span class="shutter-inner-disc">
              <Camera size={48} />
            </span>
          </span>
        </button>
      {/if}

      <p class="session-hint" role="status" aria-live="polite">
        {#if isSessionActive && countdownValue === null}
          #{currentPhotoNum} / {isSingleRetake ? 1 : photoCount}
        {/if}
      </p>
    </footer>

    {#if lastPhotoUrl && activeTheme !== 'croc'}
      {#key lastPhotoUrl}
        <div class="last-shot" role="img" aria-label="Hasil foto terakhir">
          <img src={lastPhotoUrl} alt="" />
        </div>
      {/key}
    {/if}
  {/if}
</section>

<style>
  @import "_CameraScreen.css";
</style>