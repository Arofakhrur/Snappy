<script lang="ts">
  /**
   * Pita lanskap di tepi atas & bawah (motif layar mulai): strip portrait
   * diputar 90 derajat jadi gulung mentape menyamping, lalu berjajar dan
   * meluncur horizontal. Opasitasnya rendah — nilai ikut tema lewat
   * --strip-ghost dari .kiosk-scope. Data rasio strip dibaca dari
   * stripAssets.ts (dipakai juga oleh layar pilih strip).
   */
  import { strips, order } from './stripAssets';

  // 4 gulung per setengah pita: panjang tape lanskap ~2.7-2.97 × tinggi,
  // sehingga 4 × pitch cukup menutup lebar kios hingga ~1920px. Karena
  // setiap setengah identik, geser -50% menjadi loop tanpa jeda terlihat.
  // Pita bawah diputar 5 posisi agar tidak mengulang susunan pita atas.
  const stripOrder = order.map((i) => strips[i]);

  function lineImages(start: number) {
    return Array.from({ length: 4 }, (_, k) => stripOrder[(start + k) % 10]);
  }

</script>

<div class="strips-bg" aria-hidden="true">
  <div class="strip-band band-top">
    <div class="strip-line">
      {#each [...lineImages(0), ...lineImages(0)] as im, i (i)}
        <span class="strip-cell" style="--len: {im.len};">
          <img class="strip-img" src={im.src} alt="" draggable="false" />
        </span>
      {/each}
    </div>
  </div>

  <div class="strip-band band-bottom">
    <div class="strip-line">
      {#each [...lineImages(5), ...lineImages(5)] as im, i (i)}
        <span class="strip-cell" style="--len: {im.len};">
          <img class="strip-img" src={im.src} alt="" draggable="false" />
        </span>
      {/each}
    </div>
  </div>
</div>

<style>
  /* ── Latar: dua pita tape lanskap di tepi atas & bawah, meluncur horizontal ── */
  .strips-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .strip-band {
    position: absolute;
    left: 0;
    right: 0;
    height: calc(var(--strip-h) * 1.16);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    --strip-h: clamp(180px, 28vh, 340px);
    --strip-gap: clamp(26px, 3vw, 64px);
  }

  .band-top {
    top: 4px;
  }

  .band-bottom {
    bottom: 4px;
  }

  .strip-line {
    display: flex;
    gap: var(--strip-gap);
    width: max-content;
    animation-duration: 46s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    will-change: transform;
  }

  .band-top .strip-line {
    animation-name: driftLeft;
  }

  .band-bottom .strip-line {
    animation-name: driftRight;
    animation-duration: 54s;
  }

  @keyframes driftLeft {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  @keyframes driftRight {
    from { transform: translateX(-50%); }
    to   { transform: translateX(0); }
  }

  /* Sel tape: bingkai landscape yang pas dengan hasil pemutaran 90 derajat.
     Panjang mengikuti rasio gambar masing-masing lewat --len, sehingga ujung
     tape menempel tanpa celah maupun pemotongan. */
  .strip-cell {
    position: relative;
    width: calc(var(--strip-h) * var(--len));
    height: var(--strip-h);
    overflow: hidden;
    flex-shrink: 0;
    border-radius: 6px;
    opacity: var(--strip-ghost);
    transition: opacity 220ms ease;
  }

  .strip-img {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--strip-h);
    height: auto;
    transform: translate(-50%, -50%) rotate(90deg);
    pointer-events: none;
    user-select: none;
  }

  /* Gulungan bawah dibalik arah, biar terasa keluar dari spul berbeda */
  .band-bottom .strip-img {
    transform: translate(-50%, -50%) rotate(-90deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .strip-line {
      animation: none;
    }
    .strip-cell {
      transition: none;
    }
  }
</style>
