<script>
  import CameraIllus from '#lib/components/illustrations/CameraIllus.svelte';
  import { goTo, session, setPhotoCount } from '#lib/stores/session.js';


  function handleStart() {
    goTo('camera');
  }
</script>

<section class="start-screen screen-enter">
  <!-- Decorative background elements -->
  <div class="bg-decor">
    <div class="decor-blob decor-blob-1"></div>
    <div class="decor-blob decor-blob-2"></div>
    <div class="decor-blob decor-blob-3"></div>
  </div>

  <div class="start-content">
    <!-- Logo / Brand -->
    <header class="brand">
      <div class="brand-pill">
        <span class="brand-dot"></span>
        <span class="brand-name">DISTUDIO</span>
      </div>
    </header>

    <!-- Illustration -->
    <div class="illus-wrap">
      <div class="illus-shadow"></div>
      <CameraIllus size="220" />
    </div>

    <!-- Hero text -->
    <div class="hero-text">
      <h1 class="text-display">
        Strike a<br/>
        <span class="text-accent-italic">pose.</span>
      </h1>
      <p class="subtitle">
        Take a fun photo strip, pick a style,<br/>
        then print or download it instantly.
      </p>
    </div>

    <!-- Format badge -->
    <div class="format-info">
      <span class="format-badge">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="4" y1="3" x2="4" y2="9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="8" y1="3" x2="8" y2="9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        {$session.photoCount} photos · 4R print format
      </span>
    </div>

    <!-- CTA -->
    <div class="cta-area">
      <button
        id="btn-start-photobooth"
        class="btn btn-primary btn-lg btn-full"
        on:click={handleStart}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
        </svg>
        Start Photobooth
      </button>
      <p class="privacy-note">
        📷 Camera accessed only when you tap Start.<br/>
        Photos never leave your device.
      </p>
    </div>

    <!-- Photo count picker -->
    <div class="count-picker">
      <span class="count-label">Photos per strip:</span>
      <div class="count-options" role="group" aria-label="Number of photos per strip">
        {#each [3, 4] as count}
          <button
            class="count-btn"
            class:active={$session.photoCount === count}
            on:click={() => setPhotoCount(count)}
            aria-pressed={$session.photoCount === count}
          >
            {count}
          </button>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .start-screen {
    min-height: 100dvh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: var(--space-8) var(--space-5);
    gap: 0;
  }

  /* Decorative blobs */
  .bg-decor {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .decor-blob {
    position: absolute;
    border-radius: var(--radius-full);
    filter: blur(60px);
    opacity: 0.35;
  }

  .decor-blob-1 {
    width: 300px;
    height: 300px;
    background: #FCD34D;
    top: -80px;
    right: -80px;
  }

  .decor-blob-2 {
    width: 250px;
    height: 250px;
    background: #A78BFA;
    bottom: -60px;
    left: -60px;
  }

  .decor-blob-3 {
    width: 200px;
    height: 200px;
    background: #BFDBFE;
    top: 40%;
    right: -40px;
  }

  .start-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
  }

  /* Brand */
  .brand {
    width: 100%;
  }

  .brand-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--color-ink);
    color: white;
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .brand-dot {
    width: 7px;
    height: 7px;
    background: var(--color-highlight);
    border-radius: var(--radius-full);
    animation: pulse 2s ease-in-out infinite;
  }

  /* Illustration */
  .illus-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .illus-shadow {
    position: absolute;
    bottom: -12px;
    width: 140px;
    height: 18px;
    background: rgba(28, 25, 23, 0.15);
    border-radius: var(--radius-full);
    filter: blur(8px);
    animation: shadowPulse 4s ease-in-out infinite;
  }

  @keyframes shadowPulse {
    0%, 100% { transform: scaleX(1); opacity: 0.15; }
    50% { transform: scaleX(0.8); opacity: 0.08; }
  }

  /* Hero text */
  .hero-text {
    text-align: center;
  }

  .text-display {
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 8vw, 3.25rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--color-ink);
    margin-bottom: var(--space-3);
  }

  .text-accent-italic {
    font-style: italic;
    color: var(--color-accent);
  }

  .subtitle {
    color: var(--color-ink-light);
    font-size: var(--text-base);
    line-height: 1.6;
  }

  /* Format badge */
  .format-info {
    display: flex;
    justify-content: center;
  }

  .format-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    color: var(--color-ink-light);
    padding: 6px 14px;
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
  }

  /* CTA */
  .cta-area {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .privacy-note {
    font-size: var(--text-xs);
    color: var(--color-muted);
    text-align: center;
    line-height: 1.6;
  }

  /* Count picker */
  .count-picker {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-ink-light);
  }

  .count-label {
    font-weight: 500;
  }

  .count-options {
    display: flex;
    gap: var(--space-2);
  }

  .count-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-ink);
    font-size: var(--text-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-base);
    font-family: var(--font-body);
  }

  .count-btn:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  .count-btn.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
    box-shadow: var(--shadow-accent);
  }

  .count-btn:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
</style>
