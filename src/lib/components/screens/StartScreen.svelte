<script lang="ts">
  import { goTo, session } from '#lib/stores/session';
  import StripBands from '#lib/components/kiosk/StripBands.svelte';
  import ThemeToggle from '#lib/components/kiosk/ThemeToggle.svelte';

  /**
     * Reactive state — current kiosk theme.
     * Persisted via localStorage (value: `light` | `dark`).
   */
  $: theme = $session.theme;

  /**
   * User interaction state:
   * - `isHovered`:  pointer / touch near the photo cluster.
   * - `isScrolled`: user scrolls the page (wheel / touch).
   * - `clusterEl`:  DOM reference to `.tumpuk-foto` (via `bind:this`).
   */
  let isHovered: boolean = false;
  let isScrolled: boolean = false;
  let clusterEl: HTMLElement | null = null;

  /**
     * Derived state — triggers scatter animation when user interacts.
     * Used to activate the CSS `.is-scattered` modifier, which overrides
     * the polaroid transform to the "scattered" layout.
    */
  $: isScattered = isHovered || isScrolled;

  // ── Event Handlers ────────────────────────────────────────────────────────
    /**
     * Handle page scroll.
     * @description
     * - `scrollY > 20`: user is scrolling the page → activate scatter.
     * - Property `window` is undefined during SSR (Node.js), so it returns early.
  */

  function handleWindowScroll(): void {
    if (typeof window === 'undefined') return;
    isScrolled = window.scrollY > 20;
  }

  /**
     * Handle mouse wheel / trackpad scroll.
     * @param e - WheelEvent
     * @description
     * - `deltaY > 15`: scroll down → activate scatter.
     * - `deltaY < -15` & scroll position ≤ 10 → reset.
     * - Threshold `15px` chosen as a minimum to avoid accidental triggers.
  */
  function handleWheel(e: WheelEvent): void {
    if (e.deltaY > 15) {
      isScrolled = true;
    } else if (e.deltaY < -15 && (typeof window === 'undefined' || window.scrollY <= 10)) {
      isScrolled = false;
    }
  }


  /**
    * Handle pointer movement near the photo cluster.
    * @param e - PointerEvent
    * @description
    * - Uses `getBoundingClientRect()` to get the cluster's bounding box.
    * - Calculates distance from pointer to cluster center (`Math.hypot`).
    * - Activates `isHovered` if distance < `triggerRadius`.
    *
    * @remarks
    * `triggerRadius = Math.max(rect.width * 0.1, 260)`:
    * - `0.1 * width`: adapts to cluster size (desktop: smaller).
    * - `260px`: consistent minimum distance across all screen sizes.
    */
  function handlePointerMove(e: PointerEvent): void {
    if (!clusterEl) return;
    const rect = clusterEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

    const triggerRadius = Math.max(rect.width * 0.1, 260);
    isHovered = dist < triggerRadius;
  }

  /**
   * Reset `isHovered` when pointer leaves the cluster.
   */
  function handlePointerLeave(): void {
    isHovered = false;
  }

  /**
   * Navigate to the `strip` screen (photo count selection).
   * @description
   * Trigger when user clicks the main button or presses Enter/Space.
   */
  function handleStart(): void {
    goTo('strip');
  }
</script>

<svelte:window
  on:scroll={handleWindowScroll}
  on:wheel={handleWheel}
  on:pointermove={handlePointerMove}
  on:pointerleave={handlePointerLeave}
/>

<section
  class="start-screen screen-enter kiosk-scope"
  class:theme-light={theme === 'light'}
  aria-label="DISTUDIO Photobooth"
>
	<!--
    ─── Visual Identity Layer ───────────────────────────────────────────────
    Two wrapping bands hanging on top & bottom, slowly rolling.
    Only present at the top & bottom; the center remains clean (wash).
  ──────────────────────────────────────────────────────────────────────────── -->
  <StripBands />

  <!--
      ─── Wash Layer (Background) ─────────────────────────────────────────────
      Soft grey radial gradient as the middle background, only at edges.
      `pointer-events: none` → does not block other interactions.
    ──────────────────────────────────────────────────────────────────────────── -->
  <div class="content-veil" aria-hidden="true"></div>

  <!--
      ─── 4 Corner Decorations (SVG illustrations) ────────────────────────────
      Photobooth corner decorations (Start-1..4), decorative.
      `aria-hidden="true"` because they contain no informative text.
    ──────────────────────────────────────────────────────────────────────────── -->
    <div class="corner-decorations" aria-hidden="true">
    <img class="corner-decor corner-tl" src="/landingPage/Start-2.svg" alt="" draggable="false" />
    <img class="corner-decor corner-tr" src="/landingPage/Start-3.svg" alt="" draggable="false" />
    <img class="corner-decor corner-bl" src="/landingPage/Start-4.svg" alt="" draggable="false" />
    <img class="corner-decor corner-br" src="/landingPage/Start-1.svg" alt="" draggable="false" />
  </div>

  <ThemeToggle />

  <!--
      ─── Main Content ────────────────────────────────────────────────────────
      Core screen area: brand stack (logo, tagline, serif) + the START button.
      Wraps `tumpuk-foto` and contains 10 polaroids.
    ──────────────────────────────────────────────────────────────────────────── -->
  <div class="start-content">
    <header class="brand-stack">
      <h1 class="brand">
        <img class="logo-mark" src="/landingPage/logo.svg" alt="DISTUDIO" width="217" height="81" />
      </h1>
      <p class="sub-brand">everywhere</p>
      <p class="serif-line font-display">to capture your memory</p>
    </header>

    <div
      bind:this={clusterEl}
      class="tumpuk-foto"
      class:is-scattered={isScattered}
      on:pointerenter={() => (isHovered = true)}
      on:pointerleave={() => (isHovered = false)}
      on:click={handleStart}
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleStart()}
      role="button"
      tabindex="0"
      aria-label="Mulai photobooth"
    >
      <div class="polaroid-group" aria-hidden="true">
        <img class="polaroid p1" src="/landingPage/1.svg" alt="" />
        <img class="polaroid p2" src="/landingPage/2.svg" alt="" />
        <img class="polaroid p3" src="/landingPage/3.svg" alt="" />
        <img class="polaroid p4" src="/landingPage/4.svg" alt="" />
        <img class="polaroid p9" src="/landingPage/3.svg" alt="" />
        <img class="polaroid p5" src="/landingPage/5.svg" alt="" />
        <img class="polaroid p6" src="/landingPage/6.svg" alt="" />
        <img class="polaroid p8" src="/landingPage/8.svg" alt="" />
        <img class="polaroid p7" src="/landingPage/7.svg" alt="" />
        <img class="polaroid p10" src="/landingPage/5.svg" alt="" />
      </div>
    </div>
  </div>
</section>

<style>
  .start-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg);
    position: relative;
    overflow: hidden;
    transition: background-color 220ms ease;
  }

  /* ── Wash latar: tengah bersih, pita pita di tepi tetap berpendar ── */
  .content-veil {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 70% 62% at 50% 46%,
      var(--veil-solid) 22%,
      var(--veil-mid) 58%,
      var(--veil-edge) 100%
    );
    pointer-events: none;
  }

  /* ── 4 Hiasan sudut photobooth (Start-1..4) ── */
  .corner-decorations {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 2;
  }

  .corner-decor {
    position: absolute;
    pointer-events: none;
    user-select: none;
    opacity: 1;
    filter: none;
    transition: opacity 240ms ease, filter 240ms ease;
  }

  /* Kiri Atas: Start-2.svg */
  .corner-tl {
    top: 0;
    left: 0;
    width: clamp(140px, 17vw, 245px);
    height: auto;
  }

  /* Kanan Atas: Start-3.svg (lingkaran lensa, dihaluskan agar senada dengan kertas) */
  .corner-tr {
    top: 0;
    right: 0;
    width: clamp(160px, 20vw, 280px);
    height: auto;
  }



  /* Kiri Bawah: Start-4.svg */
  .corner-bl {
    bottom: 0;
    left: 0;
    width: clamp(150px, 19vw, 270px);
    height: auto;
  }

  /* Kanan Bawah: Start-1.svg */
  .corner-br {
    bottom: 0;
    right: 0;
    width: clamp(150px, 19vw, 260px);
    height: auto;
  }

  /* ── Konten tengah ── */
  .start-content {
    position: relative;
    z-index: 1;
    margin-block: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(10px, 2.6dvh, 28px);
    padding: var(--space-6) var(--space-5);
    width: 100%;
  }

  /* ── Brand: logo tangan + everywhere + serif ── */
  .brand-stack {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(2px, 0.8dvh, 8px);
    padding: clamp(6px, 1.5dvh, 18px) clamp(24px, 5vw, 64px);
    z-index: 30;
    pointer-events: auto;
  }

  .brand {
    margin: 0;
    line-height: 0;
  }

  .logo-mark {
    width: clamp(160px, 26vw, 290px);
    height: auto;
    /* Wordmark aset berwarna hitam → dibalik terang di tema gelap */
    filter: invert(1);
    transition: filter 220ms ease;
  }

  .theme-light .logo-mark {
    filter: none;
  }

  .sub-brand {
    font-size: clamp(0.8rem, 1.6vw, 1rem);
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--fg-dim);
    margin: 0;
    transition: color 220ms ease;
  }

  .serif-line {
    font-size: clamp(1.4rem, 3.8vw, 2.9rem);
    font-weight: 600;
    line-height: 1.15;
    text-align: center;
    color: var(--fg);
    margin: 0;
    transition: color 220ms ease;
  }

  /* ── Kumpulan foto acak dengan tombol MULAI di tengahnya ── */
  .tumpuk-foto {
    position: relative;
    width: min(94vw, 1020px);
    height: clamp(340px, 46vh, 500px);
    margin-top: clamp(18px, 4.5vh, 52px);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
    --scatter-scale: 1;
    --cluster-scale: 1;
    outline: none;
  }

  .tumpuk-foto:focus-visible {
    outline: 2px solid var(--fg);
    outline-offset: 6px;
    border-radius: 20px;
  }

  .polaroid-group {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .polaroid {
    position: absolute;
    left: 50%;
    top: 50%;
    width: clamp(125px, 17vw, 195px);
    height: auto;
    transform-origin: center center;
    will-change: transform;
    transition: transform 620ms cubic-bezier(0.34, 1.25, 0.64, 1), opacity 400ms ease;
    filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.24));
  }

  /* ── Keadaan default: 10 foto tersusun rileks, bersih dari teks brand di atas ── */
  .p1 {
    z-index: 1;
    transform: translate(-50%, -50%)
      translate(calc(-185px * var(--cluster-scale)), calc(-10px * var(--cluster-scale)))
      rotate(-15deg) scale(0.92);
  }

  .p2 {
    z-index: 2;
    transform: translate(-50%, -50%)
      translate(calc(-130px * var(--cluster-scale)), calc(-48px * var(--cluster-scale)))
      rotate(-9deg) scale(0.95);
  }

  .p3 {
    z-index: 3;
    transform: translate(-50%, -50%)
      translate(calc(-45px * var(--cluster-scale)), calc(-58px * var(--cluster-scale)))
      rotate(-3deg) scale(0.96);
  }

  .p4 {
    z-index: 4;
    transform: translate(-50%, -50%)
      translate(calc(45px * var(--cluster-scale)), calc(-58px * var(--cluster-scale)))
      rotate(3deg) scale(0.96);
  }

  .p9 {
    z-index: 4;
    transform: translate(-50%, -50%)
      translate(calc(130px * var(--cluster-scale)), calc(-48px * var(--cluster-scale)))
      rotate(9deg) scale(0.95);
  }

  .p5 {
    z-index: 3;
    transform: translate(-50%, -50%)
      translate(calc(185px * var(--cluster-scale)), calc(-10px * var(--cluster-scale)))
      rotate(15deg) scale(0.92);
  }

  .p6 {
    z-index: 2;
    transform: translate(-50%, -50%)
      translate(calc(170px * var(--cluster-scale)), calc(65px * var(--cluster-scale)))
      rotate(11deg) scale(0.92);
  }

  .p8 {
    z-index: 6;
    transform: translate(-50%, -50%)
      translate(calc(75px * var(--cluster-scale)), calc(85px * var(--cluster-scale)))
      rotate(6deg) scale(0.95);
  }

  .p7 {
    z-index: 5;
    transform: translate(-50%, -50%)
      translate(calc(-75px * var(--cluster-scale)), calc(85px * var(--cluster-scale)))
      rotate(-6deg) scale(0.95);
  }

  .p10 {
    z-index: 2;
    transform: translate(-50%, -50%)
      translate(calc(-170px * var(--cluster-scale)), calc(65px * var(--cluster-scale)))
      rotate(-11deg) scale(0.92);
  }

  /* ── Keadaan aktif: TERSEBAR LEBAR 360 DERAJAT (ke samping & bawah, bebas tabrakan header) ── */
  .tumpuk-foto:hover .p1,
  .tumpuk-foto.is-scattered .p1 {
    transform: translate(-50%, -50%)
      translate(calc(-380px * var(--scatter-scale)), calc(-15px * var(--scatter-scale)))
      rotate(-20deg) scale(1.02);
  }

  .tumpuk-foto:hover .p2,
  .tumpuk-foto.is-scattered .p2 {
    transform: translate(-50%, -50%)
      translate(calc(-265px * var(--scatter-scale)), calc(-80px * var(--scatter-scale)))
      rotate(-12deg) scale(1.05);
  }

  .tumpuk-foto:hover .p3,
  .tumpuk-foto.is-scattered .p3 {
    transform: translate(-50%, -50%)
      translate(calc(-90px * var(--scatter-scale)), calc(-98px * var(--scatter-scale)))
      rotate(-4deg) scale(1.07);
  }

  .tumpuk-foto:hover .p4,
  .tumpuk-foto.is-scattered .p4 {
    transform: translate(-50%, -50%)
      translate(calc(90px * var(--scatter-scale)), calc(-98px * var(--scatter-scale)))
      rotate(4deg) scale(1.07);
  }

  .tumpuk-foto:hover .p9,
  .tumpuk-foto.is-scattered .p9 {
    transform: translate(-50%, -50%)
      translate(calc(265px * var(--scatter-scale)), calc(-80px * var(--scatter-scale)))
      rotate(12deg) scale(1.05);
  }

  .tumpuk-foto:hover .p5,
  .tumpuk-foto.is-scattered .p5 {
    transform: translate(-50%, -50%)
      translate(calc(380px * var(--scatter-scale)), calc(-15px * var(--scatter-scale)))
      rotate(20deg) scale(1.02);
  }

  .tumpuk-foto:hover .p6,
  .tumpuk-foto.is-scattered .p6 {
    transform: translate(-50%, -50%)
      translate(calc(340px * var(--scatter-scale)), calc(105px * var(--scatter-scale)))
      rotate(13deg) scale(1);
  }

  .tumpuk-foto:hover .p8,
  .tumpuk-foto.is-scattered .p8 {
    transform: translate(-50%, -50%)
      translate(calc(150px * var(--scatter-scale)), calc(145px * var(--scatter-scale)))
      rotate(8deg) scale(1.04);
  }

  .tumpuk-foto:hover .p7,
  .tumpuk-foto.is-scattered .p7 {
    transform: translate(-50%, -50%)
      translate(calc(-150px * var(--scatter-scale)), calc(145px * var(--scatter-scale)))
      rotate(-8deg) scale(1.04);
  }

  .tumpuk-foto:hover .p10,
  .tumpuk-foto.is-scattered .p10 {
    transform: translate(-50%, -50%)
      translate(calc(-340px * var(--scatter-scale)), calc(105px * var(--scatter-scale)))
      rotate(-13deg) scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .start-screen,
    .logo-mark,
    .sub-brand,
    .serif-line,
    .polaroid {
      transition: none;
    }
  }

  /* ── Layar sedang / Tablet ── */
  @media (max-width: 1024px) {
    .tumpuk-foto {
      --scatter-scale: 0.68;
      --cluster-scale: 0.82;
      height: clamp(300px, 44vh, 440px);
      margin-top: clamp(16px, 3vh, 36px);
    }

    .polaroid {
      width: clamp(110px, 15vw, 160px);
    }
  }

  /* ── Ponsel / Mobile: foto menyebar proporsional & bebas overlap tulisan ── */
  @media (max-width: 640px) {
    .start-screen {
      overflow-x: hidden;
      overflow-y: auto;
      justify-content: flex-start;
    }

    .start-content {
      gap: 10px;
      padding: clamp(16px, 5vh, 28px) var(--space-3) 24px;
      margin-block: auto;
    }

    .brand-stack {
      padding: 0 10px;
      gap: 3px;
    }

    .logo-mark {
      width: clamp(135px, 42vw, 190px);
    }

    .sub-brand {
      font-size: 0.72rem;
    }

    .serif-line {
      font-size: clamp(1.15rem, 4.8vw, 1.6rem);
      line-height: 1.2;
    }

    .tumpuk-foto {
      width: 100%;
      max-width: 100vw;
      height: clamp(260px, 40vh, 320px);
      margin-top: clamp(12px, 3vh, 28px);
      --scatter-scale: 0.40;
      --cluster-scale: 0.52;
    }

    .polaroid {
      width: clamp(74px, 20vw, 102px);
    }

    .corner-tl {
      width: clamp(80px, 22vw, 120px);
    }
    .corner-tr {
      width: clamp(90px, 24vw, 135px);
    }
    .corner-bl {
      width: clamp(85px, 23vw, 125px);
    }
    .corner-br {
      width: clamp(85px, 23vw, 125px);
    }
  }

  /* Layar pendek: beri ruang scroll alami agar tidak terhimpit */
  @media (max-height: 680px) {
    .start-screen {
      overflow-y: auto;
    }
    .start-content {
      padding-top: 20px;
      padding-bottom: 24px;
    }
  }
</style>
