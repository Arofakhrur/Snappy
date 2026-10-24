<script>
  export let size = '200';
</script>

<!-- Permission denied illustration — camera with lock overlay -->
<svg
  width={size}
  height={size}
  viewBox="0 0 200 200"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  aria-hidden="true"
>
  <!-- Camera body (muted) -->
  <rect x="20" y="68" width="160" height="108" rx="20" fill="#E5DDD5"/>

  <!-- Viewfinder bump -->
  <rect x="66" y="50" width="68" height="26" rx="10" fill="#E5DDD5"/>

  <!-- Lens outer (muted) -->
  <circle cx="100" cy="124" r="44" fill="#D1C7BC"/>
  <circle cx="100" cy="124" r="34" fill="#C4BAB0"/>
  <circle cx="100" cy="124" r="22" fill="#B0A69C"/>

  <!-- Big X overlay -->
  <circle cx="100" cy="124" r="50" fill="#F87171" opacity="0.15"/>
  <line x1="78" y1="102" x2="122" y2="146" stroke="#F87171" stroke-width="6" stroke-linecap="round"/>
  <line x1="122" y1="102" x2="78" y2="146" stroke="#F87171" stroke-width="6" stroke-linecap="round"/>

  <!-- Lock icon (top right of camera) -->
  <rect x="138" y="52" width="44" height="40" rx="10" fill="#F87171"/>
  <!-- Lock body -->
  <rect x="148" y="64" width="24" height="18" rx="4" fill="white"/>
  <!-- Lock shackle -->
  <path d="M154 64 V58 Q160 50 166 58 V64" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  <!-- Keyhole -->
  <circle cx="160" cy="71" r="3" fill="#F87171"/>
  <rect x="158.5" y="71" width="3" height="5" rx="1" fill="#F87171"/>

  <!-- Sad expression -->
  <circle cx="88" cy="118" r="4" fill="#9CA3AF"/>
  <circle cx="112" cy="118" r="4" fill="#9CA3AF"/>
  <path d="M88 136 Q100 128 112 136" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round" fill="none"/>

  <!-- Question mark hint -->
  <text x="100" y="180" text-anchor="middle" font-size="11" fill="#9CA3AF" font-family="Inter, sans-serif">camera access needed</text>
</svg>

<style>
  svg { display: block; }
</style>
