<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ confirm: void }>();

  let dialog: HTMLDialogElement;

  export function open(): void {
    dialog.showModal();
  }

  function yes(): void {
    dialog.close();
    dispatch('confirm');
  }
</script>

<dialog bind:this={dialog} class="confirm-modal" aria-labelledby="retake-all-title">
  <div class="confirm-box">
    <h2 id="retake-all-title" class="confirm-title font-display">Ambil Ulang Semua?</h2>
    <p class="confirm-body">
      Semua foto yang sudah diambil akan dihapus, lalu sesi jepret mulai dari awal.
    </p>
    <div class="confirm-actions">
      <form method="dialog">
        <button type="submit" class="ghost-btn font-mono">Batal</button>
      </form>
      <button type="button" class="capsule-btn font-mono" on:click={yes}>Ya, Ambil Ulang</button>
    </div>
  </div>
</dialog>

<style>
  .confirm-modal {
    border: none;
    padding: 0;
    background: transparent;
  }

  .confirm-modal::backdrop {
    background: var(--veil-mid, rgba(11, 10, 9, 0.82));
  }

  .confirm-box {
    width: min(90vw, 400px);
    padding: 28px 26px 24px;
    background: var(--bg);
    border: 1px solid var(--hairline);
    border-radius: 16px;
    color: var(--fg);
    box-shadow: 0 24px 60px rgba(11, 10, 9, 0.45);
  }

  .confirm-title {
    margin: 0 0 10px;
    color: var(--fg);
    font-size: 1.35rem;
    font-weight: 500;
  }

  .confirm-body {
    margin: 0 0 22px;
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--fg-dim);
  }

  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .confirm-actions form {
    display: contents;
  }

  /* Target sentuh minimum 44px (kios layar sentuh) */
  .ghost-btn,
  .capsule-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 120ms ease, border-color 160ms ease, background-color 200ms ease, color 200ms ease;
  }

  .ghost-btn {
    border: 1px solid transparent;
    background: transparent;
    color: var(--fg-dim);
  }

  .ghost-btn:hover {
    color: var(--fg);
    border-color: var(--hairline);
  }

  /* Kapsul berinversi: isi vs latar saling menukar nilai */
  .capsule-btn {
    border: none;
    background: var(--fg);
    color: var(--bg);
  }

  .capsule-btn:hover {
    background: transparent;
    color: var(--fg);
    box-shadow: inset 0 0 0 2px var(--fg);
  }

  .ghost-btn:active,
  .capsule-btn:active {
    transform: scale(0.97);
  }

  .ghost-btn:focus-visible,
  .capsule-btn:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }
</style>
