<script>
  export let size = '200';
</script>

<!-- Friendly printer illustration -->
<svg
  width={size}
  height={size}
  viewBox="0 0 200 200"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <!-- Printer body -->
  <rect x="20" y="80" width="160" height="80" rx="18" fill="#1C1917"/>

  <!-- Printer top slot opening -->
  <rect x="50" y="76" width="100" height="12" rx="4" fill="#3C3430"/>

  <!-- Paper coming out (photo strip!) -->
  <rect x="68" y="20" width="64" height="72" rx="6" fill="white"/>
  <!-- Photo strip content on paper -->
  <rect x="76" y="28" width="48" height="14" rx="3" fill="#E5DDD5"/>
  <rect x="76" y="46" width="48" height="14" rx="3" fill="#BFDBFE"/>
  <rect x="76" y="64" width="48" height="14" rx="3" fill="#FCD34D" opacity="0.6"/>
  <!-- Paper shadow -->
  <rect x="68" y="86" width="64" height="6" rx="0" fill="#E5DDD5"/>

  <!-- Paper output slot -->
  <rect x="50" y="132" width="100" height="10" rx="3" fill="#3C3430"/>

  <!-- Printer display -->
  <rect x="36" y="92" width="56" height="34" rx="8" fill="#2563EB"/>
  <!-- Display screen -->
  <rect x="40" y="96" width="48" height="26" rx="6" fill="#EFF6FF"/>
  <!-- Green ready light -->
  <circle cx="52" cy="107" r="5" fill="#059669"/>
  <circle cx="52" cy="107" r="3" fill="#34D399"/>
  <!-- Check mark on screen -->
  <path d="M62 107 L68 113 L80 101" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Print button -->
  <rect x="104" y="92" width="64" height="34" rx="8" fill="#3C3430"/>
  <rect x="116" y="103" width="40" height="12" rx="6" fill="#FCD34D"/>
  <text x="136" y="112" text-anchor="middle" font-size="8" fill="#1C1917" font-family="Inter, sans-serif" font-weight="700">PRINT</text>

  <!-- Printer feet -->
  <rect x="36" y="155" width="28" height="12" rx="6" fill="#3C3430"/>
  <rect x="136" y="155" width="28" height="12" rx="6" fill="#3C3430"/>

  <!-- Sparkle on printed paper -->
  <g opacity="0.9">
    <line x1="148" y1="30" x2="148" y2="42" stroke="#FCD34D" stroke-width="2" stroke-linecap="round"/>
    <line x1="142" y1="36" x2="154" y2="36" stroke="#FCD34D" stroke-width="2" stroke-linecap="round"/>
    <line x1="143.5" y1="31.5" x2="152.5" y2="40.5" stroke="#FCD34D" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="152.5" y1="31.5" x2="143.5" y2="40.5" stroke="#FCD34D" stroke-width="1.2" stroke-linecap="round"/>
  </g>
  <circle cx="40" cy="35" r="4" fill="#A78BFA" opacity="0.6"/>
  <circle cx="34" cy="52" r="3" fill="#F87171" opacity="0.5"/>
</svg>

<style>
  svg { display: block; }
</style>
