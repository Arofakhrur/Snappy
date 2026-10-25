# DESIGN.md — DISTUDIO Photobooth

Arah desain disusun dari jawaban dan referensi visual yang diberikan pemilik proyek (pemilik = sumbernya; file ini transkripsinya). Referensi terakhir: layar mulai kios gelap dramatis (mood Funcam), diadaptasi, bukan diklona.

## Identity

Kios foto cetak dramatis dalam dua suasana: gelap total (bawaan) atau ivory terang, pilihannya milik operator. Layar mulai: pita mentape samar di tepi atas dan bawah, logotype turgid di tengah, dan lensa kamera sebagai tombol. MULAI membuka layar "BERAPA FOTO?" — panggung pamer dua kolom, isinya hanya jumlah foto 1–6; setiap jumlah = satu produk cetak berukuran nyata (Big shot 13×7, Two up 15×5, Three up 15×6, 4–6 foto kertas 10×15 cm — nama produk ala katalog booth); jenis/gaya strip dipilih di editor setelah jepret — lalu kamera. Aplikasi = layar sentuh kios.

## Personality

Tenang, percaya diri, monokrom. Nada dibuat dari kontras hitam-putih, bukan warna.

## Palette

Dua tema, satu kosakata — hanya inversi nilai, bukan warna baru:

- Gelap (bawaan): latar #0B0A09 (hitam hangat), kertas/logo/lensa #FBF7F0, teks sekunder #B3ACA2 (terukur 8.80:1, bukan perkiraan), etch lensa rgba(11,10,9,.10-.14), strip hantu 18%.
- Terang: latar #FBF7F0 (token --color-bg), tinta #1C1917 (16.38:1), teks sekunder #57534E (7.14:1), etch rgba(251,247,240,.12-.18), lensa jadi bulat TINTA dengan label kertas; strip hantu diperdalam ke 32% supaya tetap tampak di atas kertas.
- Aksen berbasis nilai, bukan nada: lingkaran lensa adalah satu-satunya objek besar berlawanan latar; tidak ada warna tambahan.
- Sulih tema bulat kecil di pojok kanan atas layar mulai; pilihan tersimpan di localStorage agar restart kios tidak mengulang setting.

## Typography

- Display: Playfair Display 900, dua baris "DI / STUDIO" (pun Bahasa Indonesia: "di studio")
- Body: Inter
- Mono: JetBrains Mono untuk angka dan label kecil layar lain

## Mood

Lampu studio mati, tungku siap. Senyum dulu, baru jepret.

## Motif identity

Lensa bundar (button start + cincin etch + ring besar yang mengapit logotype) dan strip foto yang dipasang lanskap menggantung dalam dua pita di tepi atas dan bawah layar mulai, meluncur horizontal berlawanan arah: semuanya kosakata kamera yang sama, tidak ada yang lepas.

Layar "BERAPA FOTO?" dibangun sebagai panggung pamer, bukan cermin layar mulai: dua kolom tak setara — kiri **rak kertas**: enam miniatur tersusun vertikal, tinggi masing-masing mengikuti rasio produk sejatinya (ala rak sampel strip di counter booth), semuanya selalu terlihat, klik = pilih; kanan **poros produk**: judul satu baris besar BERAPA FOTO?, lalu etalase **carousel kertas** — satu kanvas per produk 1–6, snap tengah, kertas aktif berhalo di atas pijakan sementara yang lain meredup; pilih lewat usap, tombol panah prev/next di sisi bingkai, atau kartu rak — ketiganya sinkron dua arah; caption mono nama produk; ditutup CTA kapsul berinversi saat kursor. Sorotan radial tepat di poros produk; kertas = material cetakan warna identik kedua suasana; kata besar, target besar; tanpa garis pembatas per seksi; di ponsel rak kembali jadi deret horizontal di bawah kertas; hormati prefers-reduced-motion.

## Dials

ENERGY 2 / RHYTHM 2 / MOTION 2

- Motion: strip latar drift lambat (penanda produk yang dihasilkan booth), kursor di lensa membalik warna tombol saja (gelap↔terang di dalam temanya, berlaku dua arah di kedua tema), press pada lensa, entrance sederhana. Tanpa loop tanpa tujuan; hormati prefers-reduced-motion.
- Tema: gelap bawaan karena arah referensi pemilik; terang ivory sebagai pilihan operator. Layar mulai & BERAPA FOTO mengikuti tema lewat palet bersama `.kiosk-scope` plus tema daisyUI kustom `distudio-dark`/`distudio-light` yang dipasang terlindung (`data-theme` pada seksi kios saja — warna semantik daisyUI tiap layar lain tidak ikut berubah). Layar lain tetap ivory apapun temanya; jika nanti semua layar ikut tema, angkat kedua tema kustom menjadi default global, bukan warna liar.
