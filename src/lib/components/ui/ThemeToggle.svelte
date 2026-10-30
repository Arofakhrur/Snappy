<script lang="ts">
  /**
   * Sulih tema kios: bulat kecil di pojok kanan atas. Konfigurasi operator,
   * bukan bagian alur pengunjung; nilainya tetap hidup lewat localStorage
   * (disimpan oleh setTheme di session store).
   */
  import { session, setTheme } from '#lib/stores/session';
	import { Moon, Sun } from '@lucide/svelte';

  $: theme = $session.theme;
  
  function toggleTheme(): void {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }
</script>

<button
  type="button"
  class="theme-toggle"
  on:click={toggleTheme}
  aria-label={theme === 'dark' ? 'light' : 'dark'}
  title="change theme"
>
  {#if theme === 'dark'}
    <Moon />
  {:else}
    <Sun />
  {/if}
</button>

<style>
  .theme-toggle {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 50;
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border: 1px solid var(--hairline);
    border-radius: 50%;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--fg-dim);
    cursor: pointer;
    outline: none;
    transition: border-color 160ms ease, color 160ms ease, transform 160ms ease;
  }

  .theme-toggle:hover {
    color: var(--fg);
    border-color: var(--fg);
  }

  .theme-toggle:active {
    transform: scale(0.94);
  }

  .theme-toggle:focus-visible {
    outline: 2.5px solid var(--focus);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .theme-toggle {
      transition: none;
    }
  }
</style>
