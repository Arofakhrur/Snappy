<script lang="ts">
  import { goTo, session } from '#lib/stores/session';
  import StripBands from '#lib/features/strip-select/StripBands.svelte';
  import ThemeToggle from '#lib/components/ui/ThemeToggle.svelte';

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
        <img class="logo-mark" src="/landingPage/logo.svg" alt="" width="217" height="81" />
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
  @import "./_StartScreen.css";
</style>
