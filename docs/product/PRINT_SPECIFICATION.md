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

## 2. Photo-Strip Layout — Two Strips on One 4R Sheet

The 4R sheet is used in **portrait orientation**. Two vertical strips are placed side by side.

### Strip Dimensions (nominal)

| Property | Value |
|----------|-------|
| Strip width | ≈ 50 mm |
| Strip height | ≈ 150 mm |
| Strips per sheet | 2 |
| Gap between strips | ≈ 1.6 mm (optional perforation guide) |
| Side margins | minimal or zero for borderless |

```
┌────────────────────────────────────────┐
│  ┌──────────┐   │   ┌──────────┐       │
│  │          │   │   │          │       │
│  │ Photo 1  │   │   │ Photo 1  │       │
│  │          │   │   │          │       │
│  ├──────────┤   │   ├──────────┤       │
│  │ Photo 2  │   │   │ Photo 2  │       │
│  ├──────────┤   │   ├──────────┤       │
│  │ Photo 3  │   │   │ Photo 3  │       │
│  ├──────────┤   │   ├──────────┤       │
│  │ Photo 4  │   │   │ Photo 4  │       │
│  ├──────────┤   │   ├──────────┤       │
│  │ Caption  │   │   │ Caption  │       │
│  └──────────┘   │   └──────────┘       │
└────────────────────────────────────────┘
        4R portrait — 4 × 6 inches
```

---

## 3. Output Resolution Strategy

### Canvas Rendering

- The on-screen strip preview is rendered at **CSS pixel size** (e.g., 300 × 900 px) for responsiveness.
- The **export canvas** is rendered at a fixed print resolution target of **300 DPI equivalent**.

| Measurement | Value |
|-------------|-------|
| Strip width at 300 DPI | 50 mm × 11.81 px/mm ≈ **591 px** |
| Strip height at 300 DPI | 150 mm × 11.81 px/mm ≈ **1772 px** |
| Full 4R canvas width | 101.6 mm × 11.81 px/mm ≈ **1200 px** |
| Full 4R canvas height | 152.4 mm × 11.81 px/mm ≈ **1800 px** |

The full export canvas is **1200 × 1800 pixels**, containing both strips.

### Individual Photo Slot (within one strip, 4-photo layout)

| Property | Value |
|----------|-------|
| Photo area width | 591 px |
| Photo area height per slot | ~378 px (leaving ~128 px for header/footer) |
| Photo aspect ratio (capture) | 3:4 (portrait, matching strip shape) |

---

## 4. Safe Margins and Bleed

- **Borderless mode:** No margins required. Canvas fills the full 4R sheet.
- **Bordered mode:** Add 5 mm safe margin on all edges. Strip content moves inward.
- **Bleed:** 3 mm bleed (design extends beyond cut line) recommended for physical cutting tolerance.
- **Cutting guide:** A dashed line between the two strips is included in the printed layout.

---

## 5. Photo Cropping Behavior

- Source photos are captured from the live video stream.
- Source aspect ratio depends on the device camera (typically 4:3 or 16:9).
- Each photo slot in the strip is portrait (approximately 3:4).
- **Cropping strategy:** `object-fit: cover` equivalent — image is scaled to fill the slot, then center-cropped. No stretching.
- The user cannot adjust crop positioning in the MVP (center crop is used).

---

## 6. Image Quality Requirements

| Requirement | Value |
|-------------|-------|
| Export format | PNG (lossless) |
| Color space | sRGB |
| Export canvas size | 1200 × 1800 px |
| Per-strip size | 591 × 1800 px (within canvas) |
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
| Dimensions | 1200 × 1800 px (full 4R with both strips) |
| Color | sRGB |

---

## 11. Calibration and Testing

Since physical printer output cannot be tested in this environment:

### Calibration Procedure
1. Print the test image on 4R paper.
2. Using a ruler, measure the actual printed width of one strip.
3. Compare to target (≈ 50 mm / 2 inches).
4. If the print driver scales the output, adjust `@page` size or scale factor in print CSS.
5. Document the calibration offset per printer model.

### Test Print Checklist
- [ ] Print dialog shows correct paper size (4 × 6 in).
- [ ] Both strips appear side by side.
- [ ] No photos are cropped unexpectedly.
- [ ] Caption text is legible.
- [ ] Cutting guide line is visible.
- [ ] Cut strip measures approximately 50 mm × 150 mm.

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
| **Single Strip Guide** | 2 × 6 inches | 600 × 1800 px | `/templates/strip-template-2x6.svg` | Includes safe print boundary (5mm margin) & suggested photo slots on a separable guide layer (`id="guides-layer"`) |
| **4R Print Sheet Guide** | 4 × 6 inches | 1200 × 1800 px | `/templates/sheet-template-4r.svg` | Demonstrates two 2 × 6″ strips side-by-side with center cutting line (X = 600px) |

### Custom Composition & 4R Duplication Rules

1. **Design Once, Print Twice:** The operator creates custom artwork and slot geometry for a single 2 × 6″ strip.
2. **Automated 4R Layout:** The composition engine automatically duplicates the completed custom strip into two identical columns (Left Strip at X ≈ 6px, Right Strip at X ≈ 606px on the 1200 × 1800px 4R canvas).
3. **Center Cutting Guide:** A 1.5px dashed vertical guide line is automatically rendered at X = 600px between the two strips to assist manual physical cutting.
4. **Resolution Parity:** Both on-screen previews and final print outputs share the exact same normalized coordinate clipping pipeline, ensuring zero visual discrepancy between preview and printed result.

