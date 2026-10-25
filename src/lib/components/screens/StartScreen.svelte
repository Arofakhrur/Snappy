<script>
  import { goTo, session } from '#lib/stores/session.js';
  import StripBands from '#lib/components/kiosk/StripBands.svelte';
  import ThemeToggle from '#lib/components/kiosk/ThemeToggle.svelte';
  import LensButton from '#lib/components/kiosk/LensButton.svelte';

  $: theme = $session.theme;

  // MULAI → halaman pemilihan strip (jumlah foto & jenis), bukan langsung kamera
  function handleStart() {
    goTo('strip');
  }
</script>

<section
  class="start-screen screen-enter kiosk-scope"
  class:theme-light={theme === 'light'}
  aria-label="DISTUDIO Photobooth"
>
  <!-- Motif identity: dua pita mentape hasil cetakan menggantung di tepi atas & bawah, meluncur pelan -->
  <StripBands />

  <!-- Wash latar tengah: pita hanya boleh hadir di tepi atas & bawah -->
  <div class="content-veil" aria-hidden="true"></div>

  <ThemeToggle />

  <div class="start-content">
    <!-- Logotype dua baris; lensa menindih irisan kedua baris -->
    <div class="brand-stack">
      <h1 class="brand-display font-display" aria-label="DISTUDIO">
        <span class="logo-row" aria-hidden="true">DI</span>
        <span class="logo-row" aria-hidden="true">STUDIO</span>
      </h1>

      <LensButton label="MULAI" on:click={handleStart} ariaLabel="Mulai sesi photobooth" />
    </div>

    <p class="tagline">KLIK MULAI UNTUK MENGABADIKAN MOMENMU</p>
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

  /* ── Konten tengah ── */
  .start-content {
    position: relative;
    z-index: 1;
    margin-block: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(18px, 4dvh, 36px);
    padding: var(--space-6) var(--space-5);
    width: 100%;
  }

  /* ── Logotype dua baris + lensa ── */
  .brand-stack {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .brand-display {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: clamp(3rem, 23.5vw, 9.6rem);
    font-weight: 900;
    line-height: 0.84;
    letter-spacing: -0.01em;
    color: var(--fg);
    margin: 0;
    transition: color 220ms ease;
  }

  .logo-row {
    display: block;
  }

  /* Cincin diagram besar: motif lensa yang mengapit logotype (referensi pemilik) */
  .brand-stack::before {
    content: '';
    position: absolute;
    inset: -12% -18%;
    border: 1.5px solid var(--ring-line);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }

  /* ── Tagline: prompt kios, caps ter-spasi (arahan referensi pemilik) ── */
  .tagline {
    font-size: clamp(0.66rem, 1.7vw, 0.85rem);
    font-weight: 600;
    letter-spacing: 0.3em;
    text-indent: 0.3em;
    line-height: 1.9;
    text-align: center;
    color: var(--fg-dim);
    max-width: 34ch;
    margin: 0;
    position: relative;
    z-index: 1;
    transition: color 220ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .start-screen,
    .brand-display,
    .tagline {
      transition: none;
    }
  }
</style>
