<script lang="ts">
  // Dialog perbesar foto. `open()` menyimpan pemicunya — saat dialog
  // ditutup fokus dikembalikannya ke sana (R-32).
  export let ariaLabel = 'Perbesar foto';

  let dialog: HTMLDialogElement;
  let url: string | null = null;
  let opener: HTMLElement | null = null;

  export function open(photoUrl: string): void {
    url = photoUrl;
    opener = document.activeElement as HTMLElement | null;
    dialog.showModal();
  }

  function handleClose(): void {
    opener?.focus();
    opener = null;
  }
</script>

<dialog bind:this={dialog} class="zoom-modal" aria-label={ariaLabel} on:close={handleClose}>
  <div class="zoom-box">
    {#if url}
      <img src={url} alt="Perbesar foto terpilih" />
    {/if}
    <form method="dialog">
      <button type="submit" class="zoom-close" aria-label="Tutup">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </form>
  </div>
</dialog>

<style>
  .zoom-modal {
    border: none;
    padding: 0;
    background: transparent;
    overflow: visible;
  }

  .zoom-modal::backdrop {
    background: var(--veil-mid, rgba(11, 10, 9, 0.82));
  }

  .zoom-box {
    position: relative;
    width: min(88vw, 560px);
    padding: 10px;
    background: var(--bg);
    border: 1px solid var(--hairline);
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(11, 10, 9, 0.45);
  }

  .zoom-box img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
  }

  /* Target sentuh minimum 44px (kios layar sentuh) */
  .zoom-close {
    position: absolute;
    top: -18px;
    right: -18px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--hairline);
    border-radius: 999px;
    background: var(--bg);
    color: var(--fg);
    cursor: pointer;
    transition: transform 120ms ease, border-color 160ms ease;
  }

  .zoom-close:hover {
    border-color: var(--fg-dim);
  }

  .zoom-close:active {
    transform: scale(0.94);
  }

  .zoom-close:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  @media (max-width: 640px) {
    .zoom-box {
      width: min(94vw, 560px);
    }
    .zoom-close {
      top: 8px;
      right: 8px;
    }
  }
</style>
