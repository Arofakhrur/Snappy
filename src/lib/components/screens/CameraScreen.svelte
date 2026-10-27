<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { session, addPhoto, finishCapture, setRetakeIndex, goTo, setCameraError, setCameraSettings } from '#lib/stores/session';
  import { startCamera, stopCamera, switchCamera, attachStream, getCameraErrorMessage, hasMultipleCameras } from '#lib/utils/camera';
  import { captureFrame, runCountdown, type CountdownHandle } from '#lib/utils/capture';
  import PermissionIllus from '#lib/components/illustrations/PermissionIllus.svelte';
  import CrocShutter from '#lib/components/illustrations/CrocShutter.svelte';
  import ThemePicker from '#lib/components/kiosk/ThemePicker.svelte';
  import GridOverlayLayer from '#lib/components/kiosk/GridOverlayLayer.svelte';
  import type { CameraFilter, CameraTheme, FlashMode, GridOverlay, TimerDuration } from '#lib/types';

  // ── Kosakata settings toolbar: siklus + label ────────────────────────
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

  /**
   * Filter CSS per look. String yang sama dipakai <video> untuk pratinjau
   * dan dibakar ke frame saat capture (WYSIWYG: yang terlihat = hasil).
   */
  const FILTER_CSS: Record<CameraFilter, string> = {
    none: 'none',
    grayscale: 'grayscale(1)',
    sepia: 'sepia(0.8) saturate(1.2)',
    'high-contrast': 'contrast(1.4) brightness(1.05)',
    warm: 'sepia(0.25) saturate(1.3) brightness(1.05)',
    cool: 'saturate(0.85) brightness(1.05) hue-rotate(10deg)',
  };

  /** Maju satu langkah dalam siklus, membungkus ke item pertama. */
  function cycle<T extends string | number>(current: T, steps: T[]): T {
    const index = steps.indexOf(current);
    return steps[(index + 1) % steps.length];
  }

  let videoEl: HTMLVideoElement | undefined;
  let cameraFrameEl: HTMLElement | undefined;
  let themeBtnEl: HTMLButtonElement | undefined;
  let stream: MediaStream | null = null;

  let isLoading = true;
  let errorType: string | null = null; // 'permission_denied' | 'no_camera' | 'camera_busy' | 'unknown' | null
  let countdownValue: number | null = null; // null | 0..timer
  let isSessionActive = false;
  let isFlashing = false;   // kilat putih (veil / rahang buaya)
  let isEjecting = false;   // slide keluar ala polaroid setelah jepret
  let themePickerOpen = false;
  let canSwitch = false;
  let captureCancel: CountdownHandle | null = null;
  let currentPhotoNum = 0;

  // ── Progres rahang buaya (0 = terbuka, 1 = menjepit). Hanya tema croc. ──
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

  // ── Animasi rahang ──────────────────────────────────────────────────
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

  // ── Inisialisasi kamera ─────────────────────────────────────────────
  async function initCamera(): Promise<void> {
    isLoading = true;
    errorType = null;
    try {
      stream = await startCamera('user');
      canSwitch = await hasMultipleCameras();
      if (videoEl) await attachStream(videoEl, stream);
      isLoading = false;
      // Sesi retake otomatis jalan begitu kamera siap
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

  // ── Flash ───────────────────────────────────────────────────────────
  /** Auto-flash: berkedip hanya saat adegan gelap, diukur dari frame live. */
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

  /** Slide keluar singkat ala foto polaroid yang tercetak. */
  function ejectPolaroid(): void {
    if (isEjecting) return;
    isEjecting = true;
    setTimeout(() => { isEjecting = false; }, 500);
  }

  // ── Sesi capture ────────────────────────────────────────────────────

  /** Satu jepretan: (rahang menjepit) → jepang → kilat/keluar → selesai. */
  function snapOne(): Promise<void> {
    return new Promise((resolve) => {
      const isCroc = activeTheme === 'croc';
      const flashNow = useFlashNow();

      const finishFrame = (): void => {
        if (videoEl) {
          // Rasio kotak frame yang kasat mata (WYSIWYG), fallback rasio artboard croc
          const aspect = cameraFrameEl && cameraFrameEl.clientHeight > 0
            ? cameraFrameEl.clientWidth / cameraFrameEl.clientHeight
            : 929 / 458;
          const shot = captureFrame(videoEl, aspect, filterCss);
          addPhoto(shot);
          lastPhotoUrl = shot; // thumbnail hasil langsung tampil di layar kamera
        }
        captureCancel = null;
        if (flashNow) {
          isFlashing = true;
          setTimeout(() => { isFlashing = false; }, 160);
        }
        if (activeTheme === 'polaroid') ejectPolaroid();
      };

      if (isCroc) {
        // SNAP: rahang menutup total → jepret → memantul terbuka lagi
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

    if (get(session).retakeIndex === null) {
      session.update((s) => ({ ...s, photos: [], captureProgress: 0 }));
    }

    isSessionActive = true;
    currentPhotoNum = retakeIndex !== null ? retakeIndex + 1 : 1;
    const totalShots = retakeIndex !== null ? 1 : photoCount;
    // Timer dibekukan di awal sesi; toolbar memang terkunci selama sesi
    const waitSec = get(session).cameraSettings.timer;

    for (let i = 0; i < totalShots; i++) {
      if (waitSec > 0) {
        await new Promise<void>((resolve) => {
          captureCancel = runCountdown({
            from: waitSec,
            onTick: (n) => {
              countdownValue = n;
              // Antisipasi croc: rahang merambat menutup selama hitungan
              if (activeTheme === 'croc') {
                const partial = ((waitSec - n) / waitSec) * 0.28;
                animateShutter(shutterProgress, partial, 280, easeInQuart);
              }
            },
            onCapture: () => {
              countdownValue = 0;
              snapOne().then(resolve);
            },
          });
        });
      } else {
        await snapOne(); // timer off: jepret langsung
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

  // ── Toolbar settings (siklus nilai + persist via store) ─────────────
  function cycleTimer(): void { setCameraSettings({ timer: cycle(cam.timer, TIMER_STEPS) }); }
  function cycleFlash(): void { setCameraSettings({ flash: cycle(cam.flash, FLASH_STEPS) }); }
  function cycleFilter(): void { setCameraSettings({ filter: cycle(cam.filter, FILTER_STEPS) }); }
  function cycleGrid(): void { setCameraSettings({ grid: cycle(cam.grid, GRID_STEPS) }); }

  function openThemePicker(): void { themePickerOpen = true; }

  function closeThemePicker(): void {
    themePickerOpen = false;
    themeBtnEl?.focus(); // kembalikan fokus ke tombol pembuka (R-32)
  }

  function selectTheme(theme: CameraTheme): void {
    setCameraSettings({ theme });
    closeThemePicker();
  }

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
    <!-- ── Kondisi error ───────────────────────────────────── -->
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
    <!-- ── Top bar: back · penghitung jepret · pemilih tema ── -->
    <header class="camera-top-bar">
      <button
        id="btn-back"
        class="bar-btn"
        on:click={() => goTo('strip')}
        disabled={isSessionActive}
        aria-label="Kembali ke pilih strip"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 7h-9" />
              <path d="M14 17H5" />
              <circle cx="17" cy="17" r="3" />
              <circle cx="7" cy="7" r="3" />
            </svg>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
          {THEME_LABELS[activeTheme]}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
    </header>

    {#if themePickerOpen}
      <ThemePicker activeTheme={activeTheme} onSelect={selectTheme} onClose={closeThemePicker} />
    {/if}

    <!-- ── Permukaan kamera: perlakuan frame mengikuti tema ── -->
    <main class="camera-surface theme-{activeTheme}">
      {#if activeTheme === 'croc'}
        <!-- Rahang buaya: menutupi seluruh artboard saat tema croc -->
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
          <!-- Veil kilat untuk tema non-croc (croc punya kilatnya sendiri) -->
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

    <!-- ── Toolbar bawah: settings · shutter · status sesi ── -->
    <footer class="camera-bottom-bar">
      <div class="settings-row" role="group" aria-label="Pengaturan kamera">
        <button class="setting-btn" class:on={cam.timer > 0} on:click={cycleTimer} disabled={isSessionActive} aria-label="Timer {timerLabel}">
          <span class="setting-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <span class="setting-name">Timer <em>{timerLabel}</em></span>
        </button>

        <button class="setting-btn" class:on={cam.flash !== 'off'} on:click={cycleFlash} disabled={isSessionActive} aria-label="Flash {flashLabel}">
          <span class="setting-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          <span class="setting-name">Flash <em>{flashLabel}</em></span>
        </button>

        <button class="setting-btn" class:on={cam.filter !== 'none'} on:click={cycleFilter} disabled={isSessionActive} aria-label="Filter {filterLabel}">
          <span class="setting-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2.7s6 6.3 6 10.3a6 6 0 0 1-12 0c0-4 6-10.3 6-10.3z" />
            </svg>
          </span>
          <span class="setting-name">Filter <em>{filterLabel}</em></span>
        </button>

        <button class="setting-btn" class:on={cam.grid === 'thirds'} on:click={cycleGrid} disabled={isSessionActive} aria-label="Grid {gridLabel}">
          <span class="setting-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
          </span>
          <span class="setting-name">Grid <em>{gridLabel}</em></span>
        </button>
      </div>

      <button
        id="btn-start-session"
        class="btn-shutter-main"
        on:click={startCaptureSession}
        disabled={isLoading || isSessionActive || !!errorType}
        aria-label={isSessionActive ? 'Capture in progress' : 'Take photo'}
      >
        <span class="shutter-outer-ring">
          <span class="shutter-inner-disc">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
        </span>
      </button>

      <p class="session-hint" role="status" aria-live="polite">
        {#if isSessionActive && countdownValue === null}
          #{currentPhotoNum} / {isSingleRetake ? 1 : photoCount}
        {/if}
      </p>
    </footer>

    {#if lastPhotoUrl && activeTheme !== 'croc'}
      <!-- Thumbnail hasil jepretan terakhir: muncul ulang tiap foto baru -->
      {#key lastPhotoUrl}
        <div class="last-shot" role="img" aria-label="Hasil foto terakhir">
          <img src={lastPhotoUrl} alt="" />
        </div>
      {/key}
    {/if}
  {/if}
</section>

<style>
  /* ══════════════════════════════════════════════════════════
     Camera Screen — fullscreen, studio gelap (#0B0F12).
     Feed penuh layar; top bar & toolbar overlay di atasnya;
     perlakuan frame (bingkai/gutter) mengikuti tema.
  ══════════════════════════════════════════════════════════ */
  .camera-screen {
    position: relative;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
    background: #0b0f12; /* studio kamera gelap, ikut kios */
    color: #f8fafc;
  }

  /* ── Permukaan kamera ─────────────────────────────────── */
  .camera-surface {
    position: absolute;
    inset: 0;
  }

  .camera-frame {
    position: absolute;
    inset: 0;
    background: #05080a;
    overflow: hidden;
    transition: transform 180ms ease;
  }

  .video-feed {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1); /* pratinjau selfie tercermin */
  }

  /* ── Tema croc: viewfinder terbenam di artboard buaya ── */
  .camera-surface.theme-croc {
    inset: auto;
    left: 50%;
    top: calc(50% - 2vh);
    transform: translate(-50%, -50%);
    /* Muat antara top bar (~64px) dan toolbar bawah (~190px) */
    width: min(100%, calc((100dvh - clamp(190px, 27vh, 250px)) * 1095 / 757));
    aspect-ratio: 1095 / 757;
  }

  /*
   * Viewfinder croc: geometri warisan artboard (1095×757).
   *   Left   = 0%     (ujung moncong)
   *   Top    = 21.66% (di balik gusi atas, Y=164/757)
   *   Width  = 84.84% (di belakang gigi belakang, sampai X=929)
   *   Height = 60.50% (Y=164 sampai Y=622)
   */
  .camera-surface.theme-croc .camera-frame {
    left: 0;
    top: 21.66%;
    width: 84.84%;
    height: 60.5%;
  }

  /* ── Tema polaroid: bingkai putih + band bawah tebal ── */
  .camera-surface.theme-polaroid {
    --frame-edge: clamp(10px, 1.4vh, 18px);
    --frame-bottom: clamp(64px, 15vh, 140px);
  }

  .camera-surface.theme-polaroid .camera-frame {
    left: var(--frame-edge);
    right: var(--frame-edge);
    top: var(--frame-edge);
    bottom: var(--frame-bottom);
  }

  .camera-surface.theme-polaroid::before {
    /* Band putih khas foto instan, membawa bayangan elevasi frame */
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--frame-bottom);
    background: #fbf7f0;
  }

  .camera-surface.theme-polaroid::after {
    /* Bingkai sisi & atas yang menumpang tepi frame besar */
    content: '';
    position: absolute;
    inset: 0;
    border: var(--frame-edge) solid #fbf7f0;
    border-bottom: none;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  /* ── Tema film: gutter perforasyon kiri–kanan ── */
  .camera-surface.theme-film {
    --gutter: clamp(34px, 5.5vw, 76px);
  }

  .camera-surface.theme-film .camera-frame {
    left: var(--gutter);
    right: var(--gutter);
    top: 0;
    bottom: 0;
  }

  .camera-surface.theme-film::before,
  .camera-surface.theme-film::after {
    /* Dinding seluloid: lubang bulat berulang di sisi gelap (perforasi) */
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--gutter);
    background-color: #0b0b0b;
    background-image: radial-gradient(circle, rgba(244, 241, 236, 0.92) 5px, transparent 5.6px);
    background-size: 100% clamp(26px, 4.2vh, 44px);
    background-repeat: repeat-y;
    background-position: center;
    pointer-events: none;
  }

  .camera-surface.theme-film::before {
    left: 0;
  }

  .camera-surface.theme-film::after {
    right: 0;
  }

  /* ── Veil kilat (tema non-croc) ── */
  .flash-veil {
    position: absolute;
    inset: 0;
    z-index: 7;
    background: #ffffff;
    animation: flashFade 3s ease forwards;
    pointer-events: none;
  }

  /* ── Slide keluar polaroid setelah jepret ── */
  .camera-frame.is-ejecting {
    animation: polaroidEject 480ms ease;
  }

  /* ── Overlay loading ─────────────────────────────────── */
  .loading-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    background: rgba(11, 15, 18, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: #94a3b8;
    font-size: 0.95rem;
    letter-spacing: 0.02em;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: #fcd34d;
    border-radius: 50%;
    animation: spin 0.75s linear infinite;
  }

  /* ── Overlay hitungan mundur ─────────────────────────── */
  .countdown-overlay {
    position: absolute;
    inset: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 70%);
  }

  .countdown-number {
    font-family: var(--font-display, 'Outfit', -apple-system, sans-serif);
    font-size: clamp(5rem, 16vw, 10rem);
    font-weight: 800;
    line-height: 1;
    color: #ffffff;
    text-shadow: 0 0 40px rgba(0, 0, 0, 0.9), 0 4px 20px rgba(0, 0, 0, 0.8);
    animation: countdownPulse 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .countdown-number.zero {
    font-size: clamp(3rem, 10vw, 5.5rem);
    animation: countdownPulse 0.35s ease forwards;
  }

  /* ══════════════════════════════════════════════════════════
     Top bar — back · penghitung · tema (swap kamera opsional)
  ══════════════════════════════════════════════════════════ */
  .camera-top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: clamp(10px, 1.6vh, 16px) clamp(14px, 2vw, 24px);
    pointer-events: none; /* anak-anak aktifkan lagi */
  }

  .camera-top-bar > * {
    pointer-events: auto;
  }

  .bar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 44px; /* selalu ≥ ukuran tap (R-03) */
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 12px;
    background: rgba(11, 15, 18, 0.55);
    backdrop-filter: blur(6px); /* aksen kaca tunggal pada bar overlay */
    color: #f8fafc;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: background 0.18s ease;
  }

  .bar-btn:hover:not(:disabled) {
    background: rgba(30, 36, 43, 0.72);
  }

  .bar-btn:focus-visible {
    outline: 2px solid #fcd34d;
    outline-offset: 2px;
  }

  .bar-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .bar-right {
    margin-left: auto;
    display: flex;
    gap: 10px;
  }

  .shot-counter {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    padding: 9px 14px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    background: rgba(11, 15, 18, 0.55);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(248, 250, 252, 0.85);
  }

  /* ══════════════════════════════════════════════════════════
     Toolbar bawah — settings · shutter · status
  ══════════════════════════════════════════════════════════ */
  .camera-bottom-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 14px clamp(14px, 2vw, 24px) calc(14px + env(safe-area-inset-bottom, 0px));
    pointer-events: none;
  }

  .settings-row,
  .btn-shutter-main,
  .session-hint {
    pointer-events: auto;
  }

  .settings-row {
    display: flex;
    gap: clamp(18px, 3.5vw, 30px);
  }

  .setting-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 52px;
    min-height: 56px;
    padding: 2px 6px;
    background: none;
    border: none;
    color: #f8fafc;
    font: inherit;
    cursor: pointer;
  }

  .setting-btn:focus-visible {
    outline: 2px solid #fcd34d;
    outline-offset: 3px;
    border-radius: 12px;
  }

  .setting-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .setting-icon {
    display: grid;
    place-items: center;
    width: 44px; /* target tap ≥44px (R-03) */
    height: 44px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    background: rgba(11, 15, 18, 0.55);
    transition: color 0.18s ease, border-color 0.18s ease;
  }

  /* Nilai non-default: cincin emas menandai setting aktif */
  .setting-btn.on .setting-icon {
    border-color: #fcd34d;
    color: #fcd34d;
  }

  .setting-name {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.62rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(248, 250, 252, 0.66);
  }

  .setting-name em {
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #fcd34d;
  }

  /* ── Tombol shutter ──────────────────────────────────── */
  /* Mengapung di tengah viewport (non-croc); croc mengembalikannya
     ke toolbar bawah agar tidak menutup rahang buaya. */
  .btn-shutter-main {
    position: fixed; /* mengacu viewport, bukan footer */
    left: 0;
    right: 0;
    top: 50%;
    z-index: 31;
    margin-inline: auto; /* simetris horizontal tanpa transform */
    width: fit-content;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    transform: translateY(-50%);
    transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-shutter-main:hover:not(:disabled) {
    transform: translateY(-50%) scale(1.08);
  }

  .btn-shutter-main:active:not(:disabled) {
    transform: translateY(-50%) scale(0.92);
  }

  .btn-shutter-main:focus-visible {
    outline: 2px solid #fcd34d;
    outline-offset: 4px;
  }

  .btn-shutter-main:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: translateY(-50%);
  }

  /* Croc: shutter kembali mengalir di dalam toolbar bawah */
  .camera-surface.theme-croc ~ .camera-bottom-bar .btn-shutter-main {
    position: static;
    transform: none;
  }

  .camera-surface.theme-croc ~ .camera-bottom-bar .btn-shutter-main:hover:not(:disabled) {
    transform: scale(1.08);
  }

  .camera-surface.theme-croc ~ .camera-bottom-bar .btn-shutter-main:active:not(:disabled) {
    transform: scale(0.92);
  }

  .shutter-outer-ring {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    padding: 4px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.25), 0 6px 20px rgba(0, 0, 0, 0.6);
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
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .btn-shutter-main:hover:not(:disabled) .shutter-inner-disc {
    background: #1e242b;
    color: #fcd34d;
  }

  .session-hint {
    min-height: 1.2em; /* slot stabil: hint tak menggeser toolbar */
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    text-align: center;
    white-space: nowrap;
    color: #94a3b8;
  }

  /* ── Keyframes ───────────────────────────────────────── */
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

  @keyframes flashFade {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  @keyframes polaroidEject {
    0% { transform: translateY(-3%); }
    55% { transform: translateY(1.2%); }
    100% { transform: translateY(0); }
  }

  /* ── Thumbnail hasil jepretan ────────────────────────── */
  .last-shot {
    position: fixed;
    left: clamp(12px, 1.8vw, 26px);
    bottom: clamp(120px, 19vh, 190px);
    z-index: 26;
    width: clamp(150px, 19vw, 250px);
    padding: 5px 5px 20px;
    background: #fbf7f0;
    border-radius: 4px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
    pointer-events: none;
    animation: shotIn 380ms cubic-bezier(0.2, 1.2, 0.3, 1) forwards;
  }

  .last-shot img {
    display: block;
    width: 100%;
    border-radius: 2px;
  }

  @keyframes shotIn {
    from {
      transform: rotate(-4deg) translate(-18px, 26px);
      opacity: 0;
    }
    to {
      transform: rotate(-4deg) translate(0, 0);
      opacity: 1;
    }
  }

  /* ── Gerak dikurangi ─────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .last-shot {
      animation: none;
    }

    .btn-shutter-main,
    .bar-btn,
    .camera-frame {
      transition: none;
    }

    .flash-veil,
    .camera-frame.is-ejecting,
    .countdown-number,
    .spinner {
      animation: none;
    }
  }

  /* ── Kondisi error ────────────────────────────────────── */
  .error-state {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8, 32px) var(--space-6, 24px);
    gap: var(--space-5, 20px);
    background: var(--color-bg, #faf7f2);
    color: var(--color-ink, #0f172a);
    text-align: center;
  }

  .error-text h2 {
    font-family: var(--font-display, sans-serif);
    font-size: var(--text-2xl, 1.75rem);
    font-weight: 700;
    color: var(--color-ink, #0f172a);
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
    background: var(--color-surface, #ffffff);
    border: 1.5px solid var(--color-border, #e2e8f0);
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

  /* ── Ponsel: rapatkan bar agar feed tetap dominan ────── */
  @media (max-width: 640px) {
    .camera-top-bar {
      gap: 8px;
      padding-inline: 10px;
    }

    .bar-btn-wide {
      min-width: 0;
      padding: 0 10px;
    }

    .shot-counter {
      display: none; /* summary jepret sudah ada di hint bawah */
    }

    .settings-row {
      gap: 16px;
    }

    .session-hint {
      font-size: 0.68rem;
    }
  }
</style>
