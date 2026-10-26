<script lang="ts">
  export let size: string = '220';
</script>

<!-- Stylized camera character for start screen -->
<svg
  width={size}
  height={size}
  viewBox="0 0 220 220"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
  role="img"
>
  <!-- Camera body -->
  <rect x="28" y="72" width="164" height="116" rx="22" fill="#1C1917"/>

  <!-- Viewfinder bump on top -->
  <rect x="76" y="52" width="68" height="28" rx="10" fill="#1C1917"/>

  <!-- Shutter button on top -->
  <circle cx="160" cy="65" r="10" fill="#FCD34D"/>
  <circle cx="160" cy="65" r="6" fill="#E5B50A"/>

  <!-- Lens outer ring -->
  <circle cx="110" cy="132" r="46" fill="#2563EB"/>
  <!-- Lens inner ring -->
  <circle cx="110" cy="132" r="36" fill="#1D4ED8"/>
  <!-- Lens center — the "eye" -->
  <circle cx="110" cy="132" r="24" fill="#BFDBFE"/>
  <!-- Lens iris -->
  <circle cx="110" cy="132" r="16" fill="#2563EB"/>
  <!-- Lens pupil -->
  <circle cx="110" cy="132" r="9" fill="#1C1917"/>
  <!-- Lens highlight -->
  <circle cx="117" cy="125" r="4" fill="white" opacity="0.7"/>
  <!-- Lens small highlight -->
  <circle cx="104" cy="138" r="2" fill="white" opacity="0.4"/>

  <!-- Flash compartment -->
  <rect x="36" y="82" width="32" height="20" rx="6" fill="#2563EB"/>
  <!-- Flash bolt -->
  <path d="M50 88 L44 98 L49 98 L45 108 L56 95 L50 95 Z" fill="#FCD34D"/>

  <!-- Mode indicator dots -->
  <circle cx="170" cy="90" r="4" fill="#FCD34D"/>
  <circle cx="182" cy="90" r="4" fill="#059669"/>
  <circle cx="170" cy="105" r="4" fill="#E5DDD5"/>
  <circle cx="182" cy="105" r="4" fill="#E5DDD5"/>

  <!-- Camera grip texture lines -->
  <rect x="156" y="118" width="24" height="3" rx="2" fill="#3C3430"/>
  <rect x="156" y="126" width="24" height="3" rx="2" fill="#3C3430"/>
  <rect x="156" y="134" width="24" height="3" rx="2" fill="#3C3430"/>
  <rect x="156" y="142" width="24" height="3" rx="2" fill="#3C3430"/>

  <!-- Strap lug left -->
  <rect x="22" y="88" width="12" height="16" rx="4" fill="#3C3430"/>
  <!-- Strap lug right -->
  <rect x="186" y="88" width="12" height="16" rx="4" fill="#3C3430"/>

  <!-- Camera bottom strip -->
  <rect x="28" y="170" width="164" height="18" rx="0" fill="#3C3430"/>
  <rect x="28" y="170" width="164" height="18" rx="0" fill="url(#bottomGrad)"/>

  <!-- Film advance wheel -->
  <circle cx="172" cy="160" r="8" fill="#3C3430"/>
  <circle cx="172" cy="160" r="5" fill="#FCD34D"/>

  <!-- Sparkle decorations -->
  <g opacity="0.8">
    <!-- Sparkle top-right -->
    <line x1="194" y1="54" x2="194" y2="66" stroke="#FCD34D" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="188" y1="60" x2="200" y2="60" stroke="#FCD34D" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="190" y1="56" x2="198" y2="64" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="198" y1="56" x2="190" y2="64" stroke="#FCD34D" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g opacity="0.6">
    <!-- Small sparkle top-left -->
    <line x1="30" y1="50" x2="30" y2="58" stroke="#A78BFA" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="54" x2="34" y2="54" stroke="#A78BFA" stroke-width="2" stroke-linecap="round"/>
  </g>

  <defs>
    <linearGradient id="bottomGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>
</svg>

<style>
  svg {
    display: block;
  }
</style>
