<script lang="ts">
  /**
   * Lensa: tombol kosakata kios — bulatan bergaya kaca lensa kamera, cincin
   * etch konsentris, dan saat kursor menyentuh: label menurun, ikon kamera
   * masuk, warna kaca berbalik nilai (gelap↔terang dalam temanya).
   * inflow = dipakai dalam alur tata letak biasa (bukan menindih logotype).
   */
  export let label: string = '';
  export let ariaLabel: string = label;
  export let inflow: boolean = false;
</script>

<button
  type="button"
  class="lens-btn"
  class:lens-inflow={inflow}
  on:click
  aria-label={ariaLabel}
>
  <span class="lens-rings" aria-hidden="true"></span>
  <span class="lens-label">{label}</span>
  <svg
    class="lens-cam"
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M4.5 9.5h4.2l2-3.4h10.6l2 3.4h4.2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-23a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2z" />
    <circle cx="16" cy="17.5" r="4.4" />
    <circle cx="16" cy="17.5" r="1.4" />
    <circle cx="24.6" cy="13" r="0.8" fill="currentColor" stroke="none" />
  </svg>
</button>

<style>
  .lens-btn {
    position: absolute;
    z-index: 2;
    left: 50%;
    top: 50%;
    width: var(--lens-size, clamp(104px, 12.5vw, 176px));
    height: var(--lens-size, clamp(104px, 12.5vw, 176px));
    transform: translate(-50%, -44%);
    border-radius: 50%;
    background: var(--fg);
    color: var(--bg);
    box-shadow: 0 0 0 3px var(--bg), 0 0 0 4.5px var(--halo);
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    transition: transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
  }

  /* Varian alur: berdiri di tata letak biasa, bukan menindih elemen lain */
  .lens-inflow {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    --lens-size: clamp(104px, 11vw, 150px);
  }

  .lens-inflow:hover {
    transform: scale(1.03);
  }

  .lens-inflow:active {
    transform: scale(0.95);
  }

  /* Cincin etching lensa: hairline konsentris berwarna latar pada kaca lensa */
  .lens-rings {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .lens-rings::before {
    content: '';
    position: absolute;
    inset: 12%;
    border: 1.5px solid var(--etch-a);
    border-radius: 50%;
    transition: border-color 160ms ease;
  }

  .lens-rings::after {
    content: '';
    position: absolute;
    inset: 28%;
    border: 1.5px solid var(--etch-b);
    border-radius: 50%;
    transition: border-color 160ms ease;
  }

  .lens-label {
    position: relative;
    z-index: 1;
    display: inline-block;
    font-size: clamp(0.78rem, 1.9vw, 1.02rem);
    font-weight: 800;
    letter-spacing: 0.22em;
    text-indent: 0.22em;
    color: inherit;
    transition: opacity 160ms ease, transform 160ms ease;
  }

  /* Saat kursor menyentuh lensa: teks menuring, ikon kamera masuk */
  .lens-cam {
    position: absolute;
    inset: 0;
    margin: auto;
    width: clamp(30px, 3.6vw, 50px);
    height: auto;
    color: inherit;
    opacity: 0;
    transform: scale(0.82);
    transition: opacity 160ms ease, transform 160ms ease;
    pointer-events: none;
  }

  .lens-btn:hover .lens-label {
    opacity: 0;
    transform: scale(0.88);
  }

  .lens-btn:hover .lens-cam {
    opacity: 1;
    transform: scale(1);
  }

  .lens-btn:hover {
    transform: translate(-50%, -44%) scale(1.03);
    background-color: var(--bg);
    color: var(--fg);
    box-shadow: 0 0 0 1.5px var(--focus), 0 0 0 5px var(--halo-h);
  }

  /* Etch ikut berbalik: hairline jadi warna lawan pada kaca yang terbalik */
  .lens-btn:hover .lens-rings::before {
    border-color: var(--inv-etch-a);
  }

  .lens-btn:hover .lens-rings::after {
    border-color: var(--inv-etch-b);
  }

  .lens-btn:active {
    transform: translate(-50%, -44%) scale(0.95);
  }

  .lens-btn:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 7px;
  }

  @media (prefers-reduced-motion: reduce) {
    .lens-btn,
    .lens-rings::before,
    .lens-rings::after,
    .lens-label,
    .lens-cam {
      transition: none;
    }
  }
</style>
