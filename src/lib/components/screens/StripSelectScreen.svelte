<script lang="ts">
  import { onMount } from 'svelte';
  import { PRODUK, renderStripPreview } from '#lib/utils/canvas';
  import { session, goTo, setPhotoCount } from '#lib/stores/session';
  import ThemeToggle from '#lib/components/kiosk/ThemeToggle.svelte';

  /**
   * Layar "BERAPA FOTO?" — panggung pamer: kiri = rak miniatur vertikal
   * (klik = pilih), kanan = etalase carousel kertas: satu kanvas per
   * produk 1–6, snap tengah; usap etalase = memilih jumlah, klik rak =
   * etalase meluncur — sinkron dua arah, satu layar tanpa gulir.
   * Rasio & resolusi kanvas mengikuti PRODUK (ukuran cetak nyata);
   * tinggi via ResizeObserver (flex berantai tak "definite" untuk persen CSS).
   */
  const JUMLAH = [1, 2, 3, 4, 5, 6];

  let sectionEl: HTMLElement;
  let produkEl: HTMLElement;
  let etalaseEl: HTMLDivElement;
  let deckGulir: HTMLDivElement;
  /* Ref tiap item dalam each: wajib $state — bind:this ke indeks larik biasa
     tidak reaktif di Svelte 5 (peringatan binding_property_non_reactive) */
  let slideEls: (HTMLDivElement | undefined)[] = $state([]);
  let etalaseCanvases: (HTMLCanvasElement | undefined)[] = $state([]);
  let deckCanvases: (HTMLCanvasElement | undefined)[] = $state([]);
  let etalaseSig = '';
  let deckSig = '';

  /* Reaktif: tinggi viewport etalase & lebar terukur (0 sebelum ukur pertama) */
  let tinggi = $state(280);
  let lebarEtalase = $state(0);

  const produk = (n: number) => PRODUK[n] || PRODUK[4];
  const rasio = (n: number): number => produk(n).pxW / produk(n).pxH;

  /* Slot seragam: semua slide selebar ini supaya snap-tengah presisi
     sampai slide tepi (Big shot = terlebar → jadi patokan slot) */
  const slotLebar = $derived(Math.max(120, Math.min(lebarEtalase * 0.72, tinggi * rasio(1))));

  /* Ukuran kertas tiap produk di dalam slot (rasio produk sejati) */
  const ukuran = $derived(
    JUMLAH.map((n) => {
      const r = rasio(n);
      const w = Math.min(slotLebar, tinggi * r);
      return { n, w, h: w / r };
    })
  );

  /* Sisi kiri/kanan etalase: ruang agar slide pertama/terakhir bisa ke tengah */
  const padEtalase = $derived(Math.max(24, Math.round((lebarEtalase - slotLebar) / 2)));

  const gerakHalus = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

  function ukur(): void {
    if (!sectionEl) return;
    const d = getComputedStyle(sectionEl);
    const ruang =
      sectionEl.clientHeight - parseFloat(d.paddingTop) - parseFloat(d.paddingBottom);
    const sempit = window.innerWidth < 900;
    tinggi = sempit
      ? Math.max(140, Math.min(ruang * 0.21, 260))
      : Math.max(200, Math.min(ruang - 260, ruang * 0.55, 560));
    if (etalaseEl) lebarEtalase = etalaseEl.clientWidth;
  }

  onMount(() => {
    const ro = new ResizeObserver(ukur);
    ro.observe(sectionEl);
    ukur();
    // Luncur programatik selesai → pulihkan snap (posisi selalu tepat di titik snap)
    const selesaiLuncur = () => {
      if (etalaseEl && etalaseEl.style.scrollSnapType === 'none') {
        clearTimeout(waktuGulir);
        etalaseEl.style.scrollSnapType = '';
        gulirTerprogram = false;
      }
    };
    etalaseEl.addEventListener('scrollend', selesaiLuncur);
    return () => {
      ro.disconnect();
      etalaseEl.removeEventListener('scrollend', selesaiLuncur);
    };
  });

  // Kanvas etalase: satu per produk, isi ulang hanya saat template berganti
  $effect(() => {
    const template = $session.selectedTemplate;
    if (template === etalaseSig) return;
    etalaseSig = template;
    JUMLAH.forEach((n, i) => {
      const c = etalaseCanvases[i];
      if (c) renderStripPreview(c, Array(n).fill(null), template, {});
    });
  });

  // Miniatur rak: idem
  $effect(() => {
    const template = $session.selectedTemplate;
    if (template === deckSig) return;
    deckSig = template;
    JUMLAH.forEach((n, i) => {
      const c = deckCanvases[i];
      if (c) {
        const pk = produk(n);
        c.width = Math.round(pk.pxW / 6);
        c.height = Math.round(pk.pxH / 6);
        renderStripPreview(c, Array(n).fill(null), template, {});
      }
    });
  });

  // Kartu rak aktif selalu masuk pandangan (fallback layar pendek)
  $effect(() => {
    const n = $session.photoCount;
    const aktif = deckGulir && deckGulir.querySelector('.aktif');
    if (aktif && n) aktif.scrollIntoView({ block: 'nearest', inline: 'center', behavior: gerakHalus() });
  });

  /* ── Sinkron etalase ⇄ jumlah (dua arah, tanpa umpan balik liar) ── */

  let gulirTerprogram = false;
  let waktuGulir: ReturnType<typeof setTimeout> | undefined;
  let rafSinkron = 0;
  let sudahPusat = false;

  /** Luncurkan slide n ke tengah etalase (tanpa menggulir halaman).
   *  Snap dimatikan selama luncur: Chrome membatalkan smooth scroll
   *  jika scroll-snap mandatory aktif (luncur berhenti di tengah jalan).
   *  Klik beruntun (luncur masih jalan) → loncat langsung, bukan luncur
   *  baru di atas luncur lama. Pulihan snap menunggu scrollend. */
  function pusatkan(n: number, halus: boolean): void {
    const el = slideEls[n - 1];
    if (!el || !etalaseEl) return;
    const e = etalaseEl;
    const b = el.getBoundingClientRect();
    const rect = e.getBoundingClientRect();
    const target = e.scrollLeft + (b.left + b.width / 2 - (rect.left + rect.width / 2));
    const sedangLuncur = gulirTerprogram;
    gulirTerprogram = true;
    e.style.scrollSnapType = 'none';
    e.scrollTo({ left: target, behavior: halus && !sedangLuncur ? gerakHalus() : 'auto' });
    clearTimeout(waktuGulir);
    waktuGulir = setTimeout(() => {
      e.style.scrollSnapType = '';
      gulirTerprogram = false;
    }, sedangLuncur ? 150 : 1200);
  }

  /** Usap bebas → slide terdekat dari tengah = jumlah terpilih. */
  function saatGulir(): void {
    if (gulirTerprogram || rafSinkron) return;
    rafSinkron = requestAnimationFrame(() => {
      rafSinkron = 0;
      if (!etalaseEl) return;
      const rect = etalaseEl.getBoundingClientRect();
      const tengah = rect.left + rect.width / 2;
      let terbaik = 0;
      let jarak = Infinity;
      slideEls.forEach((s, i) => {
        if (!s) return;
        const b = s.getBoundingClientRect();
        const d = Math.abs(b.left + b.width / 2 - tengah);
        if (d < jarak) {
          jarak = d;
          terbaik = i + 1;
        }
      });
      if (terbaik && terbaik !== $session.photoCount) setPhotoCount(terbaik);
    });
  }

  // pusatkan slide aktif sekali saat masuk layar (pulihkan sesi).
  // Dua frame jeda: saat efek ini berlari, DOM masih memasang gaya lama
  // (slide terukur 120px) — target pusatkan jadi basi → snap balik ke 0.
  $effect(() => {
    if (!sudahPusat && etalaseEl && slideEls.length && lebarEtalase > 0) {
      sudahPusat = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => pusatkan($session.photoCount, false));
      });
    }
  });

  function pilih(n: number): void {
    setPhotoCount(n);
    pusatkan(n, true);
  }

  function handleAmbil(): void {
    goTo('camera');
  }
</script>

<section
  class="strip-select-screen screen-enter kiosk-scope"
  class:theme-light={$session.theme === 'light'}
  data-theme={$session.theme === 'light' ? 'distudio-light' : 'distudio-dark'}
  aria-label="Pilih jumlah foto"
  bind:this={sectionEl}
>
  <button class="back-btn font-mono" onclick={() => goTo('start')} aria-label="Kembali ke halaman awal">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M14.5 5l-7 7 7 7" />
    </svg>
    KEMBALI
  </button>

  <ThemeToggle />

  <header class="kepala">
    <h2 class="judul font-display">BERAPA FOTO?</h2>
  </header>

  <div class="deck" bind:this={deckGulir}>
    {#each JUMLAH as n, i (n)}
      <button
        type="button"
        class="deck-item"
        class:aktif={$session.photoCount === n}
        onclick={() => pilih(n)}
        aria-label="Strip {n} foto"
        aria-pressed={$session.photoCount === n}
      >
        <span class="mini" aria-hidden="true">
          <canvas class="mini-kanvas" width="90" height="270" bind:this={deckCanvases[i]}></canvas>
        </span>
        <span class="mini-label font-mono" aria-hidden="true">{n}</span>
      </button>
    {/each}
  </div>

  <figure class="produk" bind:this={produkEl}>
    <div class="etalase-bingkai">
      <div
        class="etalase"
        bind:this={etalaseEl}
        onscroll={saatGulir}
        style="padding-inline:{padEtalase}px"
      >
        {#each ukuran as u, i (u.n)}
          <div
            class="slide"
            class:aktif={$session.photoCount === u.n}
            aria-hidden={$session.photoCount !== u.n}
            style="width:{Math.round(slotLebar)}px;height:{Math.round(tinggi)}px"
            bind:this={slideEls[i]}
          >
            <span
              class="kertas"
              role="img"
              aria-label="Pratinjau {produk(u.n).nama}, {u.n} foto"
              style="width:{Math.round(u.w)}px;height:{Math.round(u.h)}px"
            >
              <canvas
                class="pratinjau"
                aria-hidden="true"
                width={Math.round(produk(u.n).pxW / 2)}
                height={Math.round(produk(u.n).pxH / 2)}
                bind:this={etalaseCanvases[i]}
              ></canvas>
            </span>
          </div>
        {/each}
      </div>

      <button
        type="button"
        class="panah kiri"
        onclick={() => pilih($session.photoCount - 1)}
        disabled={$session.photoCount <= 1}
        aria-label="Produk sebelumnya"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        class="panah kanan"
        onclick={() => pilih($session.photoCount + 1)}
        disabled={$session.photoCount >= 6}
        aria-label="Produk berikutnya"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    <span
      class="pijakan"
      aria-hidden="true"
      style="width:{Math.round(ukuran[$session.photoCount - 1].w * 1.45)}px"
    ></span>

    <figcaption class="ket font-mono">{produk($session.photoCount).nama.toUpperCase()} · {$session.photoCount} FOTO</figcaption>
  </figure>

  <div class="aksi">
    <button
      type="button"
      class="btn ambil-cta font-mono"
      onclick={handleAmbil}
      aria-label="Ambil foto sekarang"
    >
      AMBIL FOTO
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 12h15" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    </button>
  </div>
</section>

<style>
  .strip-select-screen {
    position: relative;
    /* Panggung pamer = tepat satu layar: rak sampel kiri + poros produk kanan, tanpa gulir */
    height: 100dvh;
    height: 100vh;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto 1fr auto;
    align-content: center;
    padding: clamp(48px, 6.8dvh, 80px) clamp(22px, 5vw, 64px);
    background: var(--bg);
    overflow: hidden;
    transition: background-color 220ms ease;
  }

  /* anak-anak panggung berdiri di atas kabut sorotan */
  .kepala,
  .produk,
  .aksi {
    position: relative;
    z-index: 1;
  }

  /* ── Poros kanan: judul → produk → CTA, semua tengah pada porosnya ── */
  .kepala {
    grid-column: 2;
    grid-row: 1;
    text-align: center;
    justify-self: center;
    margin-bottom: clamp(14px, 2.6dvh, 34px);
  }

  .aksi {
    grid-column: 2;
    grid-row: 3;
    align-self: start;
    justify-self: center;
    margin-top: clamp(14px, 2.6dvh, 34px);
    display: flex;
    justify-content: center;
  }

  /* ── Poros tengah: kertas produk di padasan + ket ── */
  .produk {
    grid-column: 2;
    grid-row: 2;
    align-self: center;
    justify-self: center;
    /* lebar dikunci: tanpa ini, slide flex-shrink:0 membuat lebar intrinsik
       etalase membalik ke ukur() → figure membengkak tak terbatas */
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 0;
  }

  /* ── Panggung: sorotan mengangkat kertas produk, kabut gelap menepi ke tepi ──
     Sorotan condong sedikit ke kanan (poros produk). */
  .strip-select-screen::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(88% 74% at 56% 44%, rgba(251, 247, 240, 0.07), rgba(11, 10, 9, 0) 66%);
    pointer-events: none;
  }

  .strip-select-screen.theme-light::before {
    background: radial-gradient(88% 74% at 56% 44%, rgba(28, 25, 23, 0.035), rgba(28, 25, 23, 0) 66%);
  }

  /* ── Kembali: pil hairline kiri atas ── */
  .back-btn {
    position: absolute;
    top: 18px;
    left: 18px;
    z-index: 3;
    /* Target sentuh minimum 44px (kios layar sentuh) */
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 11px 18px 11px 14px;
    border: 1px solid var(--hairline);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--fg-dim);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    cursor: pointer;
    outline: none;
    transition: color 160ms ease, border-color 160ms ease, transform 160ms ease;
  }

  .back-btn:hover {
    color: var(--fg);
    border-color: var(--fg);
  }

  .back-btn:active {
    transform: scale(0.96);
  }

  .back-btn:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  .judul {
    font-size: clamp(2.6rem, 9.6dvh, 6rem);
    font-weight: 900;
    line-height: 0.92;
    letter-spacing: -0.01em;
    color: var(--fg);
    margin: 0;
    transition: color 220ms ease;
  }

  /* ── Bingkai etalase: pembungkus relatif untuk tombol panah ── */
  .etalase-bingkai {
    position: relative;
    width: 100%;
  }

  .panah {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid var(--hairline);
    border-radius: 50%;
    /* latar gelap supaya terbaca di atas kertas tetangga */
    background: rgba(11, 10, 9, 0.55);
    color: var(--fg-dim);
    cursor: pointer;
    outline: none;
    backdrop-filter: blur(6px);
    transition: color 160ms ease, border-color 160ms ease, transform 160ms ease, opacity 160ms ease;
  }

  .strip-select-screen.theme-light .panah {
    background: rgba(251, 247, 240, 0.6);
  }

  .panah:hover:not(:disabled) {
    color: var(--fg);
    border-color: var(--fg);
  }

  .panah:active:not(:disabled) {
    transform: translateY(-50%) scale(0.94);
  }

  .panah:disabled {
    opacity: 0.28;
    cursor: default;
  }

  .panah:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  .panah.kiri {
    left: clamp(4px, 1vw, 18px);
  }

  .panah.kanan {
    right: clamp(4px, 1vw, 18px);
  }

  /* ── Etalase carousel: kertas tiap produk bersanding; snap tengah ──
     Slot seragam (lebar via RO) membuat snap-tengah presisi sampai slide
     tepi; usap = pilih, klik rak/panah = meluncur. */
  .etalase {
    width: 100%;
    display: flex;
    align-items: center;
    gap: clamp(18px, 2.6vw, 40px);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    /* tepi memudar — tanda ada kertas lagi di luar pandangan */
    mask-image: linear-gradient(to right, transparent, #000 5%, #000 95%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, #000 5%, #000 95%, transparent);
  }

  .etalase::-webkit-scrollbar {
    display: none;
  }

  .slide {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    scroll-snap-align: center;
  }

  .kertas {
    display: block;
    line-height: 0;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 0 0 1.5px var(--ring-line);
    opacity: 0.38;
    transform: scale(0.94);
    transition: opacity 220ms ease, transform 220ms ease, box-shadow 220ms ease;
  }

  .slide.aktif .kertas {
    opacity: 1;
    transform: none;
    box-shadow:
      0 0 0 1.5px var(--ring-line),
      0 0 0 8px var(--halo-h),
      0 34px 70px -24px rgba(0, 0, 0, 0.6);
  }

  .strip-select-screen.theme-light .slide.aktif .kertas {
    box-shadow:
      0 0 0 1.5px var(--ring-line),
      0 0 0 8px var(--halo-h),
      0 34px 70px -24px rgba(28, 25, 23, 0.28);
  }

  .pratinjau {
    display: block;
    width: 100%;
    height: 100%;
  }

  .pijakan {
    height: clamp(10px, 1.6dvh, 18px);
    border-radius: 50%;
    background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.55), transparent 70%);
    filter: blur(10px);
    transition: width 220ms ease;
  }

  .strip-select-screen.theme-light .pijakan {
    background: radial-gradient(50% 50% at 50% 50%, rgba(28, 25, 23, 0.3), transparent 70%);
  }

  .ket {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-indent: 0.28em;
    color: var(--fg-dim);
    margin: 2px 0 0;
    transition: color 220ms ease;
  }

  /* ── Rak kertas: enam miniatur tersusun vertikal di kiri etalase ──
     Tinggi tiap kartu mengikuti rasio produk sejati; semua terlihat,
     tanpa panah. Gulir-y hanya fallback di layar pendek. */
  .deck {
    grid-column: 1;
    grid-row: 1 / 4;
    align-self: center;
    justify-self: start;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
    max-height: 100%;
    overflow-y: auto;
    scroll-snap-type: y proximity;
    scrollbar-width: none;
    padding: 6px 12px;
  }

  .deck::-webkit-scrollbar {
    display: none;
  }

  .deck-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    padding: 2px;
    background: none;
    border: none;
    cursor: pointer;
    scroll-snap-align: center;
    outline: none;
  }

  .mini {
    display: block;
    width: 64px;
    line-height: 0;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 0 0 1px var(--ring-line);
    opacity: 0.38;
    transform: scale(0.94);
    transition: opacity 200ms ease, transform 200ms ease, box-shadow 200ms ease;
  }

  .mini-kanvas {
    display: block;
    width: 100%;
    height: auto;
  }

  .deck-item.aktif .mini {
    opacity: 1;
    transform: none;
    box-shadow: 0 0 0 2px var(--fg), 0 0 0 6px var(--halo-h);
  }

  .deck-item:focus-visible .mini {
    outline: 2.5px solid var(--focus);
    outline-offset: 4px;
  }

  .mini-label {
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-indent: 0.24em;
    color: var(--fg-dim);
    transition: color 200ms ease;
  }

  .deck-item.aktif .mini-label {
    color: var(--fg);
  }

  /* ── Aksi: kapsul besar ber-class `btn` daisyUI (bentuk), warnanya token kios ── */
  .ambil-cta {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    height: clamp(46px, 6.6dvh, 62px);
    padding: 0 clamp(26px, 3vw, 44px);
    border: none;
    border-radius: var(--radius-full);
    background-color: var(--color-primary);
    color: var(--color-primary-content);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.22em;
    cursor: pointer;
    outline: none;
    transition: background-color 200ms ease, color 200ms ease, box-shadow 200ms ease, transform 160ms ease;
  }

  .ambil-cta svg {
    flex-shrink: 0;
  }

  .ambil-cta:hover {
    background-color: var(--bg);
    color: var(--fg);
    box-shadow: inset 0 0 0 2px var(--fg), 0 0 0 5px var(--halo-h);
    transform: translateY(-2px);
  }

  .ambil-cta:active {
    transform: translateY(0) scale(0.98);
  }

  .ambil-cta:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 4px;
  }

  /* ── Ponsel: tumpukan satu poros; rak kembali jadi deret horizontal ── */
  @media (max-width: 900px) {
    .strip-select-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 56px 16px 26px;
    }

    /* DOM deck lebih awal (kolom kiri di desktop) → pesan urutan tumpukan */
    .kepala {
      order: 1;
      margin-bottom: 2px;
    }

    .judul {
      font-size: clamp(2.2rem, 5dvh, 3.6rem);
    }

    .produk {
      order: 2;
    }

    .deck {
      order: 3;
      margin-top: 4px;
      flex-direction: row;
      max-height: none;
      overflow-y: hidden;
      overflow-x: auto;
      scroll-snap-type: x proximity;
      max-width: min(80vw, 430px);
      padding: 4px 10px;
      gap: 8px;
      /* tepi deck memudar — tanda ada strip lagi di luar pandangan */
      mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
      -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
    }

    .mini {
      width: 48px;
    }

    .aksi {
      order: 4;
      margin-top: 2px;
      justify-content: center;
      /* flex mobile: align-self = sumbu silang (horisontal) — wajib center */
      align-self: center;
    }
  }

  /* layar pendek-jongkok: beri jalan gulir daripada memotong CTA */
  @media (max-width: 900px) and (max-height: 640px) {
    .strip-select-screen {
      overflow-y: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .strip-select-screen,
    .back-btn,
    .judul,
    .kertas,
    .pijakan,
    .ket,
    .mini,
    .mini-label,
    .panah,
    .ambil-cta {
      transition: none;
    }
  }
</style>
