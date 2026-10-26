# Print Specification — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## 1. Media Preset — 4R Photo Paper

| Property | Value |
|----------|-------|
| Paper name | 4R |
| Nominal width | 101.6 mm (4 inches) |
| Nominal height | 152.4 mm (6 inches) |
| Aspect ratio | 2 : 3 |
| Default print orientation | Landscape (rotated) or Portrait |

> **Note:** Physical printable area varies by printer and driver. Typical borderless printers support full bleed; most inkjets leave a 3–5 mm margin on each edge in bordered mode. All dimensions stated here are nominal targets.

---

## 2. Produk Strip — Ukuran Nyata per Jumlah Foto

Setiap jumlah foto memetakan ke **satu produk cetak berukuran nyata** (mengikuti price list "Custom Ukuran"). Semua produk dicetak di kertas **4R (10,2 × 15,2 cm)**; orientasi dan jumlah salinan mengikuti produk.

| # | Produk | Ukuran cetak | Opsi foto | Salinan per lembar 4R | Orientasi lembar |
|---|--------|--------------|-----------|----------------------|------------------|
| 1 | **Big shot** | 13 × 7 cm | 1 foto menyamping | 1 | Landscape (1800 × 1200 px) |
| 2 | **Two up** | 15 × 5 cm | 2 foto potret tumpuk | 2 berdampingan | Portrait (1200 × 1800 px) |
| 3 | **Three up** | 15 × 6 cm | 3 foto menyamping tumpuk | 1 | Portrait |
| 4 | **Two by two** | 10 × 15 cm | grid 2 × 2 | 1 | Portrait |
| 5 | **Five up** | 10 × 15 cm | 2 × 2 + 1 lebar | 1 | Portrait |
| 6 | **Six up** | 10 × 15 cm | grid 2 × 3 | 1 | Portrait |

Aturan lembar:

- Semua salinan dicetak **ukuran sejati** (px 300 DPI = cm asli) dan **di tengah lembar** — tidak ada peregangan agar mengisi kertas.
- **Two up** = satu-satunya produk 2 salinan: 591 × 2 + gap 16 px = 1198 ≤ 1200 px, dengan garis potong putus-putus di tengah (X = 600 px).
- Produk lain = 1 salinan; sisa lembar berupa margin kertas satu warna dengan kertas strip.

```
┌──────────────────────────┐    ┌──────────────────────┐
│  ┌────────┐  ┌────────┐  │    │   ┌──────────────┐   │
│  │ Foto 1 │  │ Foto 1 │  │    │   │    Foto 1    │   │
│  ├────────┤  ├────────┤  │    │   └──────────────┘   │
│  │ Foto 2 │  │ Foto 2 │  │    │   ┌──────────────┐   │
│  └────────┘  └────────┘  │    │   │    Foto 2    │   │
│  (Two up, 2 salinan)     │    │   └──────────────┘   │
└──────────────────────────┘    └──────────────────────┘
   4R portrait 1200×1800           4R landscape 1800×1200
        dengan garis potong              (Big shot 13×7)
```

---

## 3. Output Resolution Strategy

### Canvas Rendering

- The on-screen strip preview is rendered at **CSS pixel size** (e.g., 300 × 900 px) for responsiveness.
- The **export canvas** is rendered at a fixed print resolution target of **300 DPI equivalent**.

| Measurement | Value |
|-------------|-------|
| Lembar 4R portrait | 101,6 × 152,4 mm × 11,81 px/mm ≈ **1200 × 1800 px** |
| Lembar 4R landscape (Big shot) | **1800 × 1200 px** |
| Big shot | 130 × 70 mm ≈ **1536 × 828 px** |
| Two up | 50 × 150 mm ≈ **591 × 1772 px** |
| Three up | 60 × 150 mm ≈ **709 × 1772 px** |
| Two by two / Five up / Six up | 100 × 150 mm ≈ **1181 × 1772 px** |

Px = cm ÷ 2,54 × 300, dibulatkan. **Pratinjau di layar selalu miniatur persis** — geometri slot dihitung di ruang acuan produk lalu diskalakan seragam ke ukuran kanvas apa pun.

### Slot Foto per Produk

Ukuran slot mengikuti `PRODUK[count].rows` di `canvas.js` (px ruang acuan 300 DPI). Contoh slot per produk:

| Produk | Slot |
|--------|------|
| Big shot | 1 slot menyamping 1456 × 616 px |
| Two up | 2 slot potret 551 × 783 px |
| Three up | 3 slot menyamping 665 × 515 px |
| Two by two | 4 slot 546 × 757 px (grid 2×2) |
| Five up | 4 slot 546 × 620 px + 1 slot lebar 1117 × 250 px |
| Six up | 6 slot 546 × 498 px (grid 2×3) |

---

## 4. Safe Margins and Bleed

- **Borderless mode:** No margins required. Canvas fills the full 4R sheet.
- **Bordered mode:** Add 5 mm safe margin on all edges. Strip content moves inward.
- **Bleed:** 3 mm bleed (design extends beyond cut line) recommended for physical cutting tolerance.
- **Cutting guide:** hanya untuk Two up (2 salinan) — garis putus-putus di antara dua salinan.

---

## 5. Photo Cropping Behavior

- Source photos are captured from the live video stream.
- Source aspect ratio depends on the device camera (typically 4:3 or 16:9).
- Bentuk slot mengikuti produk: potret (Two up), menyamping (Big shot, Three up), potret & lebar (Two by two, Five up, Six up).
- **Cropping strategy:** `object-fit: cover` equivalent — image is scaled to fill the slot, then center-cropped. No stretching.
- The user cannot adjust crop positioning in the MVP (center crop is used).

---

## 6. Image Quality Requirements

| Requirement | Value |
|-------------|-------|
| Export format | PNG (lossless) |
| Color space | sRGB |
| Export canvas size | per produk: 1200 × 1800 px (portrait) atau 1800 × 1200 px (Big shot) |
| Per-strip size | ukuran sejati produk (mis. 591 × 1772 px untuk Two up) di tengah lembar |
| Minimum camera capture | 640 × 480 px (wider accepted) |
| Canvas rendering quality | `imageSmoothingQuality: 'high'` |

---

## 7. Print CSS

```css
@media print {
  @page {
    size: 4in 6in;
    margin: 0;
  }

  body * {
    visibility: hidden;
  }

  #print-layout,
  #print-layout * {
    visibility: visible;
  }

  #print-layout {
    position: fixed;
    left: 0;
    top: 0;
    width: 4in;
    height: 6in;
    display: flex;
    flex-direction: row;
  }
}
```

> **Note:** Browser print dialog may override `@page` size depending on the OS and printer driver. Users must confirm paper size is set to "4 × 6" or "4R" in the print dialog.

---

## 8. Printer Settings Instructions (shown to user)

Before printing, set the following in the browser print dialog:

1. **Paper size:** 4 × 6 inches (4R).
2. **Orientation:** Portrait.
3. **Margins:** None (if printer supports borderless).
4. **Scale:** 100% — do not scale to fit.
5. **Background graphics:** Enabled (to preserve strip backgrounds).

If your printer does not support borderless printing, set a small margin and expect thin white borders on the edges of the sheet.

---

## 9. Cutting Guidance

After printing:
- Cut along the vertical center line to separate the two strips.
- Each strip should be approximately 2 inches wide and 6 inches tall.
- A printed dashed guide line between strips assists cutting.

---

## 10. Download Format

| Property | Value |
|----------|-------|
| Format | PNG |
| Filename pattern | `distudio-strip-YYYYMMDD-HHMMSS.png` |
| Dimensions | per produk: 1200 × 1800 px, atau 1800 × 1200 px (Big shot) |
| Color | sRGB |

---

## 11. Calibration and Testing

Since physical printer output cannot be tested in this environment:

### Calibration Procedure
1. Print the test image on 4R paper.
2. Using a ruler, measure the actual printed width of one strip.
3. Compare to target — ukuran produk aktif (tabel seksi 2; mis. Two up ≈ 50 × 150 mm).
4. If the print driver scales the output, adjust `@page` size or scale factor in print CSS.
5. Document the calibration offset per printer model.

### Test Print Checklist
- [ ] Print dialog shows correct paper size (4 × 6 in).
- [ ] Both strips appear side by side.
- [ ] No photos are cropped unexpectedly.
- [ ] Caption text is legible.
- [ ] Cutting guide line is visible.
- [ ] Cut strip measures the product's true size (mis. Two up ≈ 50 × 150 mm; Big shot ≈ 130 × 70 mm).

---

## 12. MVP Limitations

- The browser print dialog is used; silent printing is not implemented.
- Physical print dimensions depend on the printer driver's scaling behavior.
- Borderless printing requires a printer that supports it; the app cannot enforce this.
- Physical test prints were not performed in this environment (documented as unverified).
- Future presets: Letter paper, A6, sticker paper.

---

## 13. Custom Template Specifications & 4R Sheet Composition

### Downloadable Template Assets

| Asset | Physical Dimensions | Raster Dimensions (300 DPI) | File Path / Format | Notes |
|-------|---------------------|-----------------------------|-------------------|-------|
| **Product Strip Guides (1–6 foto)** | Ukuran nyata per produk: Big shot 13×7 cm (1536×828 px), Two up 15×5 cm (591×1772 px), Three up 15×6 cm (709×1772 px), Two by two / Five up / Six up 10×15 cm (1181×1772 px) | sesuai produk | `/templates/strip-template-{bigshot,twoup,threeup,twobytwo,fiveup,sixup}.svg` | Margin aman cetak + susunan slot di lapisan panduan terpisah (`id="guides-layer"`), geometri = persis `PRODUK[count].rows` |
| **4R Print Sheet Guide** | 4 × 6 inches | 1200 × 1800 px | `/templates/sheet-template-4r.svg` | Demonstrates two 2 × 6″ strips side-by-side with center cutting line (X = 600px) |

### Custom Composition & 4R Duplication Rules

1. **Design Once, Print Per Product:** Operator mendesain artwork + slot geometri untuk satu produk; panduan SVG kini tersedia per ukuran produk (1–6 foto), bukan hanya 2 × 6″.
2. **Automated 4R Layout:** Salinan ditempatkan **ukuran sejati di tengah lembar** — Two up: dua salinan di X ≈ 1 px dan X ≈ 608 px pada kanvas 1200 × 1800; produk lain: satu salinan.
3. **Center Cutting Guide:** Garis putus 1,5 px (alpha 0,2) otomatis di X = 600 px hanya saat 2 salinan, untuk bantuan pemotongan fisik.
4. **Resolution Parity:** Both on-screen previews and final print outputs share the exact same normalized coordinate clipping pipeline, ensuring zero visual discrepancy between preview and printed result.

