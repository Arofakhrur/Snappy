<script lang="ts">
  /**
   * Rule-of-thirds overlay: 2 garis vertikal + 2 horizontal di atas feed
   * kamera. Murni bantu komposisi, tidak interaktif, tidak menerima event.
   */
  export let visible: boolean = true;
</script>

{#if visible}
  <div class="grid-third" aria-hidden="true">
    <span class="line line-v" style="left: 33.333%"></span>
    <span class="line line-v" style="left: 66.666%"></span>
    <span class="line line-h" style="top: 33.333%"></span>
    <span class="line line-h" style="top: 66.666%"></span>
  </div>
{/if}

<style>
  .grid-third {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .line {
    position: absolute;
    background: rgba(255, 255, 255, 0.38);
    /* Bayangan rambut agar garis tetap terbaca pada adegan terang */
    box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.25);
  }

  .line-v {
    top: 0;
    bottom: 0;
    width: 1px;
  }

  .line-h {
    left: 0;
    right: 0;
    height: 1px;
  }
</style>
