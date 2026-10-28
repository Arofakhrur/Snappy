<script>
  /**
   * CrocShutter — Animated crocodile jaw shutter
   *
   * Form-factors seamlessly with .croc-stage (aspect-ratio: 1095 / 757).
   * Center line is Y = 378.5px (50.0% of 757px height).
   *
   * Upper jaw height = 164px. Teeth tips at Y = 163.3px.
   * Lower jaw height = 135px. Teeth tips at Y = 0 (stage Y = 622px).
   * To meet at center (Y = 378.5px) with ~15px teeth interlocking:
   *   Upper jaw moves down by 222px (135.4% of 164px) -> tips at Y = 385.3px.
   *   Lower jaw moves up by 250px (185.2% of 135px) -> tips at Y = 372.0px.
   * Right column (green neck + dorsal spikes) height = 458px (Y = 164px to 622px).
   * Stage center 378.5px is at (378.5 - 164) / 458 = 46.83% of right column.
   * Transform origin: right 46.83% ensures it collapses symmetrically to the exact center line!
   */
  export let progress  = 0;
  export let isFlashing = false;

  $: p = Math.min(1, Math.max(0, progress));

  // Upper jaw slides down to center
  $: upperTransY = `${p * 135.4}%`;
  // Lower jaw slides up to center
  $: lowerTransY = `${-p * 185.2}%`;
  // Right body column collapses symmetrically into the center line
  $: colScale = Math.max(0.001, 1 - p);
</script>

<div class="croc-shutter" aria-hidden="true">

  <!-- ══ UPPER JAW — slides down on snap ══ -->
  <div class="jaw jaw-upper" style="transform: translateY({upperTransY});">
    <img src="/images/rahang-atas.svg" alt="" class="jaw-img" draggable="false" />
  </div>

  <!-- ══ MIDDLE BODY — green outer neck + dorsal back spikes ══ -->
  <div
    class="right-col"
    style="transform: scaleY({colScale}); transform-origin: right 46.83%;"
  >
    <!-- Green outer neck (seamlessly matches upper & lower green body) -->
    <div class="neck-green-block"></div>
    <!-- Dorsal spikes attached to outer right edge of the neck -->
    <img src="/images/duri-hitam.svg" alt="" class="col-spike-img" draggable="false" />
  </div>

  <!-- ══ LOWER JAW — slides up on snap ══ -->
  <div class="jaw jaw-lower" style="transform: translateY({lowerTransY});">
    <img src="/images/rahang-bawah.svg" alt="" class="jaw-img" draggable="false" />
  </div>

  <!-- ══ WHITE CAMERA FLASH ══ -->
  {#if isFlashing}
    <div class="flash-overlay"></div>
  {/if}

</div>

<style>
  .croc-shutter {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible; /* allows spikes on the right to extend naturally */
    z-index: 10;
  }

  /* ── Upper Jaw ────────────────────────────────────────── */
  .jaw-upper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    transform-origin: center top;
    will-change: transform;
    z-index: 4;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
  }

  /* ── Lower Jaw ────────────────────────────────────────── */
  .jaw-lower {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    transform-origin: center bottom;
    will-change: transform;
    z-index: 4;
    filter: drop-shadow(0 -4px 12px rgba(0, 0, 0, 0.4));
  }

  .jaw-img {
    width: 100%;
    height: auto;
    display: block;
  }

  /* ── Right Column (Green Neck + Spikes) ───────────────────
     Between upper jaw (164 / 757 ≈ 21.66%) and lower jaw (135 / 757 ≈ 17.83%)
     Width = 92 / 1095 ≈ 8.4% (matches green neck width perfectly)
  ──────────────────────────────────────────────────────── */
  .right-col {
    position: absolute;
    top: 21.66%;    /* 164 / 757 */
    bottom: 17.83%; /* 135 / 757 */
    right: 0;
    width: 8.4%;    /* green neck width 92 / 1095 */
    will-change: transform;
    z-index: 3;
    overflow: visible;
  }

  .neck-green-block {
    position: absolute;
    inset: 0;
    background: #2E5823; /* Exact crocodile green */
    display: block;
  }

  /* Spikes on the outer right spine of the crocodile */
  .col-spike-img {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(100% - 10px); /* connects seamlessly to right edge of neck */
    height: 100%;
    width: auto;
    display: block;
    object-fit: fill;
    pointer-events: none;
  }

  /* ── Flash Overlay ────────────────────────────────────── */
  .flash-overlay {
    position: absolute;
    inset: -30px;
    background: #FFFFFF;
    z-index: 50;
    animation: shutterFlash 320ms ease forwards;
    pointer-events: none;
  }

  @keyframes shutterFlash {
    0%   { opacity: 0; }
    20%  { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
