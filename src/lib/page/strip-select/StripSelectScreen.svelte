<script lang="ts">
  import { onMount } from 'svelte';
  import { PRODUK, renderStripPreview } from '#lib/utils/canvas';
  import { session, goTo, setPhotoCount } from '#lib/stores/session';
  import ThemeToggle from '#lib/components/ui/ThemeToggle.svelte';

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
  @import "./_StripSelectScreen.css";
</style>
