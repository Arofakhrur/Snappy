/**
 * Strip maskot (sementara, sebelum aset final): rasio tiap gambar dicatat
 * agar sambungan gulungan tanpa celah. Satu sumber data dipakai dua motif:
 * pita lanskap di layar mulai (StripBands) dan rak filem vertikal di
 * layar pilih strip (StripSelectScreen).
 */
export const strips = [
  { src: '/strips/strip-1.png', len: 2.700 },
  { src: '/strips/strip-2.png', len: 2.962 },
  { src: '/strips/strip-3.png', len: 2.986 },
  { src: '/strips/strip-4.png', len: 2.943 },
  { src: '/strips/strip-5.png', len: 2.823 },
  { src: '/strips/strip-6.png', len: 2.653 },
  { src: '/strips/strip-7.png', len: 2.736 },
  { src: '/strips/strip-8.png', len: 2.780 },
  { src: '/strips/strip-9.png', len: 2.714 },
  { src: '/strips/strip-10.png', len: 2.637 }
];

/** Susunan tampilkan: campuran agar tetangga tidak bersaudara terdekat */
export const order = [0, 3, 1, 4, 6, 2, 7, 5, 9, 8];
