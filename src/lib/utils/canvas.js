/**
 * Canvas Utility — composes photo strips using Canvas API
 *
 * Produk strip mengikuti PRODUK (ukuran cetak nyata per jumlah foto),
 * baik Built-in Presets (Classic, Cobalt, Darkroom, Lavender)
 * maupun Custom Templates dengan artwork overlays, slot bebas,
 * dan komposisi lembar 4R.
 */

import { getCustomTemplate } from './customTemplateStorage.js';

/** Built-in Strip templates — kertas foto-booth klasik: kertas paper,
 * garis rambut tipis di tepi, slot kosong papan catur, caption serif. */
export const TEMPLATES = {  classic: {
    id: 'classic',
    label: 'Classic',
    bg: '#FBF7F0',
    ink: '#2B2620',
    accent: '#B98A3F',
    hairline: '#C7A45C',
    checkerA: '#EDE7DB',
    checkerB: '#E1D9C8',
    slotLine: '#2B26201A',
  },
  cobalt: {
    id: 'cobalt',
    label: 'Cobalt',
    bg: '#F4F8FF',
    ink: '#1D3A6B',
    accent: '#4A6FA5',
    hairline: '#7E9EC8',
    checkerA: '#E8EEF8',
    checkerB: '#DBE4F2',
    slotLine: '#1D3A6B1A',
  },
  darkroom: {
    id: 'darkroom',
    label: 'Dark Room',
    bg: '#191715',
    ink: '#EFE9DD',
    accent: '#C2503E',
    hairline: '#6B5F53',
    checkerA: '#26221F',
    checkerB: '#1F1B18',
    slotLine: '#EFE9DD1F',
  },
  lavender: {
    id: 'lavender',
    label: 'Lavender',
    bg: '#F5F2FA',
    ink: '#443161',
    accent: '#8E77B8',
    hairline: '#B9A7D6',
    checkerA: '#EBE5F4',
    checkerB: '#DFD6F0',
    slotLine: '#44316117',
  },
};

/** Produk strip per jumlah foto — ukuran cetak nyata (300 DPI),
 * mengikuti price list "Custom Ukuran" + nama produk ala katalog booth.
 * px = cm ÷ 2,54 × 300, dibulatkan genap.
 *
 * Layout slot = baris berisi sel, px pada ruang acuan produk sendiri
 * (pxW × pxH). margin/hairline/footer juga px ruang acuan.
 */
export const PRODUK = {
  1: {
    nama: 'Big shot',
    cm: '13 × 7',
    pxW: 1536, pxH: 828,
    margin: 40, hairline: 14, gap: 20, footer: 132,
    copySheet: 1, sheetOrient: 'landscape',
    rows: [{ h: 616, cells: [{ w: 1456 }] }],
  },
  2: {
    nama: 'Two up',
    cm: '15 × 5',
    pxW: 591, pxH: 1772,
    margin: 20, hairline: 10, gap: 16, footer: 150,
    copySheet: 2, sheetOrient: 'portrait',
    rows: [{ h: 783, cells: [{ w: 551 }] }, { h: 783, cells: [{ w: 551 }] }],
  },
  3: {
    nama: 'Three up',
    cm: '15 × 6',
    pxW: 709, pxH: 1772,
    margin: 22, hairline: 10, gap: 16, footer: 150,
    copySheet: 1, sheetOrient: 'portrait',
    rows: [{ h: 515, cells: [{ w: 665 }] }, { h: 515, cells: [{ w: 665 }] }, { h: 515, cells: [{ w: 665 }] }],
  },
  4: {
    nama: 'Two by two',
    cm: '10 × 15',
    pxW: 1181, pxH: 1772,
    margin: 32, hairline: 12, gap: 24, footer: 170,
    copySheet: 1, sheetOrient: 'portrait',
    rows: [
      { h: 757, cells: [{ w: 546 }, { w: 546 }] },
      { h: 757, cells: [{ w: 546 }, { w: 546 }] },
    ],
  },
  5: {
    nama: 'Five up',
    cm: '10 × 15',
    pxW: 1181, pxH: 1772,
    margin: 32, hairline: 12, gap: 24, footer: 170,
    copySheet: 1, sheetOrient: 'portrait',
    rows: [
      { h: 620, cells: [{ w: 546 }, { w: 546 }] },
      { h: 620, cells: [{ w: 546 }, { w: 546 }] },
      { h: 250, cells: [{ w: 1117 }] },
    ],
  },
  6: {
    nama: 'Six up',
    cm: '10 × 15',
    pxW: 1181, pxH: 1772,
    margin: 32, hairline: 12, gap: 24, footer: 170,
    copySheet: 1, sheetOrient: 'portrait',
    rows: [
      { h: 498, cells: [{ w: 546 }, { w: 546 }] },
      { h: 498, cells: [{ w: 546 }, { w: 546 }] },
      { h: 498, cells: [{ w: 546 }, { w: 546 }] },
    ],
  },
};

/** Produk bawaan bila jumlah di luar 1–6 (jaga-jaga). */
function produkUntuk(count) {
  return PRODUK[count] || PRODUK[4];
}

/**
 * Resolve a template argument to a concrete template object.
 * @param {string|object} templateOrKey
 * @returns {Promise<object>}
 */
export async function resolveTemplate(templateOrKey) {
  if (typeof templateOrKey === 'object' && templateOrKey !== null) {
    return templateOrKey;
  }
  if (TEMPLATES[templateOrKey]) {
    return TEMPLATES[templateOrKey];
  }
  const custom = await getCustomTemplate(templateOrKey);
  if (custom) return custom;
  return TEMPLATES.classic;
}

/**
 * Crop-scale-center: draw an image into a rectangle, center-cropped.
 */
function drawCroppedImage(ctx, img, dx, dy, dw, dh) {
  drawCroppedImageWithTransform(ctx, img, dx, dy, dw, dh, 1.0, 0, 0);
}

/**
 * Draw an image into a destination rectangle with cover cropping,
 * custom zoom scaling, and pan offsets.
 * 
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {number} dx destination X
 * @param {number} dy destination Y
 * @param {number} dw destination Width
 * @param {number} dh destination Height
 * @param {number} scale zoom factor (>= 1.0)
 * @param {number} offsetX -0.5 to 0.5 relative pan X
 * @param {number} offsetY -0.5 to 0.5 relative pan Y
 */
export function drawCroppedImageWithTransform(ctx, img, dx, dy, dw, dh, scale = 1.0, offsetX = 0, offsetY = 0) {
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const dstAspect = dw / dh;
  let sw, sh;

  if (srcAspect > dstAspect) {
    // Source is wider than destination -> match height, crop sides
    sh = img.naturalHeight;
    sw = sh * dstAspect;
  } else {
    // Source is taller than destination -> match width, crop top/bottom
    sw = img.naturalWidth;
    sh = sw / dstAspect;
  }

  // Zoom scale: higher scale samples smaller area of source
  const zoom = Math.max(0.5, Math.min(4.0, scale));
  sw = sw / zoom;
  sh = sh / zoom;

  // Center coordinates plus pan offset
  const maxPanX = Math.max(0, img.naturalWidth - sw);
  const maxPanY = Math.max(0, img.naturalHeight - sh);

  const cx = (img.naturalWidth - sw) / 2;
  const cy = (img.naturalHeight - sh) / 2;

  const sx = Math.max(0, Math.min(maxPanX, cx + offsetX * maxPanX));
  const sy = Math.max(0, Math.min(maxPanY, cy + offsetY * maxPanY));

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Load an image from data URL or web URL.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Empty image source'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Helper to draw a rounded rectangle path.
 */
export function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Slot kosong = papan catur (patern "tak ada foto"), alih-alih emoji.
 */
function drawEmptyBoothSlot(ctx, x, y, w, h, t) {
  ctx.fillStyle = t.checkerA;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = t.checkerB;
  const q = Math.max(7, w / 32);
  const cols = Math.ceil(w / q);
  const rows = Math.ceil(h / q);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillRect(x + c * q, y + r * q, q + 0.5, q + 0.5);
      }
    }
  }
  ctx.restore();
  ctx.strokeStyle = t.slotLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
}

/**
 * Render a built-in preset strip in the classic booth-paper look:
 * paper sheet, thin hairline frame, per-product slot layout, serif title
 * + spaced "PHOTO BOOTH" mark in the footer.
 *
 * Geometri mengikuti PRODUK[count]: ruang acuan = px cetak 300 DPI produk
 * itu, diskalakan ke stripW/pxW & stripH/pxH — pratinjau di ukuran mana pun
 * = miniatur persis hasil cetak.
 */
function renderBuiltinStrip(ctx, images, template, options, stripX, stripY, stripW, stripH, count) {
  const { caption, showDate } = options;
  const t = template;
  const p = produkUntuk(count);
  const k = stripW / p.pxW;
  const ky = stripH / p.pxH;

  // Paper
  ctx.fillStyle = t.bg;
  ctx.fillRect(stripX, stripY, stripW, stripH);

  // Hairline frame near the edge
  const inset = p.hairline * k;
  ctx.strokeStyle = t.hairline;
  ctx.lineWidth = Math.max(1, 1.6 * k);
  ctx.strokeRect(stripX + inset, stripY + inset, stripW - inset * 2, stripH - inset * 2);

  // Slot area (dalam ruang acuan): baris ditempatkan di tengah vertikal
  const areaY = p.margin * ky;
  const footerH = p.footer * ky;
  const footerY = stripY + stripH - footerH;
  const areaH = footerY - p.margin * ky - areaY;
  const usedH = p.rows.reduce((a, r) => a + r.h, 0) * ky + (p.rows.length - 1) * p.gap * ky;
  let cursorY = areaY + (areaH - usedH) / 2;
  let slotIndex = 0;
  for (const row of p.rows) {
    const rowH = row.h * ky;
    const rowW = row.cells.reduce((a, c) => a + c.w, 0) * k + (row.cells.length - 1) * p.gap * k;
    let cursorX = stripX + (stripW - rowW) / 2;
    for (const cell of row.cells) {
      const w = cell.w * k;
      const img = images[slotIndex];
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cursorX, cursorY, w, rowH);
        ctx.clip();
        drawCroppedImage(ctx, img, cursorX, cursorY, w, rowH);
        ctx.restore();
      } else {
        drawEmptyBoothSlot(ctx, cursorX, cursorY, w, rowH, t);
      }
      slotIndex++;
      cursorX += w + p.gap * k;
    }
    cursorY += rowH + p.gap * ky;
  }

  // Footer: serif title + spaced PHOTO BOOTH mark (± tanggal)
  const title = (caption || '').trim().slice(0, 30) || p.nama;
  const cx = stripX + stripW / 2;

  ctx.fillStyle = t.ink;
  ctx.font = `500 ${Math.round(0.34 * footerH)}px 'Playfair Display', 'Georgia', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, cx, footerY + 0.34 * footerH);

  try {
    ctx.letterSpacing = `${Math.round(0.3 * 0.11 * footerH * k)}px`;
  } catch { /* browser lama: tanpa letterSpacing */ }
  ctx.fillStyle = t.accent;
  ctx.font = `600 ${Math.round(0.11 * footerH)}px 'Inter', sans-serif`;
  ctx.fillText('PHOTO BOOTH', cx, footerY + 0.68 * footerH);
  try {
    ctx.letterSpacing = '0px';
  } catch { }

  if (showDate) {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillStyle = t.ink;
    try {
      ctx.letterSpacing = `${Math.round(1.5 * k)}px`;
    } catch { }
    ctx.font = `${Math.round(0.11 * footerH)}px 'Inter', sans-serif`;
    ctx.fillText(date.toUpperCase(), cx, footerY + 0.88 * footerH);
    try {
      ctx.letterSpacing = '0px';
    } catch { }
  }
}

/**
 * Render a custom template with irregular polygon or rectangular slots,
 * artwork overlays/underlays, and independent photo crop mapping.
 */
async function renderCustomStrip(ctx, images, template, options, stripX, stripY, stripW, stripH) {
  // 1. Fill base background
  ctx.fillStyle = template.backgroundColor || '#FFFFFF';
  ctx.fillRect(stripX, stripY, stripW, stripH);

  // 2. Pre-load artwork if available
  let artworkImg = null;
  if (template.artworkDataUrl) {
    try {
      artworkImg = await loadImage(template.artworkDataUrl);
    } catch (e) {
      console.warn('Could not load custom template artwork:', e);
    }
  }

  // 3. Render underlay artwork if configured
  if (artworkImg && template.artworkLayer === 'underlay') {
    ctx.drawImage(artworkImg, stripX, stripY, stripW, stripH);
  }

  // 4. Render slots and assigned photographs
  const slots = template.slots || [];
  for (let idx = 0; idx < slots.length; idx++) {
    const slot = slots[idx];
    const sx = stripX + slot.x * stripW;
    const sy = stripY + slot.y * stripH;
    const sw = slot.width * stripW;
    const sh = slot.height * stripH;

    ctx.save();

    // Setup clipping path based on slot geometry
    if (slot.type === 'polygon' && Array.isArray(slot.points) && slot.points.length >= 3) {
      ctx.beginPath();
      slot.points.forEach((pt, pIdx) => {
        const px = stripX + pt.x * stripW;
        const py = stripY + pt.y * stripH;
        if (pIdx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.clip();
    } else if (slot.type === 'circle') {
      ctx.beginPath();
      ctx.ellipse(sx + sw / 2, sy + sh / 2, sw / 2, sh / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      // Rectangle with optional radius
      const radius = (slot.borderRadius || 0) * (stripW / 600);
      roundRect(ctx, sx, sy, sw, sh, radius);
      ctx.clip();
    }

    // Determine assigned photograph
    const pIndex = slot.assignedPhotoIndex;
    const img = (pIndex !== null && pIndex !== undefined && images[pIndex]) ? images[pIndex] : null;

    if (img) {
      drawCroppedImageWithTransform(
        ctx,
        img,
        sx,
        sy,
        sw,
        sh,
        slot.scale ?? 1.0,
        slot.offsetX ?? 0,
        slot.offsetY ?? 0
      );
    } else {
      // Clear empty slot state
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(sx, sy, sw, sh);
      ctx.fillStyle = '#64748B';
      const labelSize = Math.max(12, Math.round(sw * 0.08));
      ctx.font = `600 ${labelSize}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.name || `Slot ${idx + 1}`, sx + sw / 2, sy + sh / 2);
    }

    ctx.restore();
  }

  // 5. Render overlay artwork on top of photo cutouts (standard frame behavior)
  if (artworkImg && (template.artworkLayer === 'overlay' || !template.artworkLayer)) {
    ctx.drawImage(artworkImg, stripX, stripY, stripW, stripH);
  }

  // 5.5 Render editable decorative overlay layers (ribbons, banners, stickers, logos)
  const overlays = (template.overlays || [])
    .filter((ovl) => !ovl.hidden && ovl.src)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  for (const ovl of overlays) {
    try {
      const ovlImg = await loadImage(ovl.src);
      const ox = stripX + ovl.x * stripW;
      const oy = stripY + ovl.y * stripH;
      const ow = ovl.width * stripW;
      const oh = ovl.height * stripH;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ovl.opacity ?? 1.0));

      const cx = ox + ow / 2;
      const cy = oy + oh / 2;
      ctx.translate(cx, cy);

      if (ovl.rotation) {
        ctx.rotate((ovl.rotation * Math.PI) / 180);
      }

      ctx.drawImage(ovlImg, -ow / 2, -oh / 2, ow, oh);
      ctx.restore();
    } catch (err) {
      console.warn('Could not load decorative overlay layer image:', ovl.name, err);
    }
  }

  // 6. Optional caption/date overlay if custom template leaves room and option enabled
  if (options.caption || options.showDate) {
    if (options.renderCaptionOnCustom) {
      const footerH = Math.round(stripH * 0.06);
      const footerY = stripY + stripH - footerH;
      ctx.fillStyle = '#1E293BEE';
      ctx.fillRect(stripX, footerY, stripW, footerH);

      if (options.caption) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 ${Math.round(footerH * 0.35)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.caption.slice(0, 30), stripX + stripW / 2, footerY + footerH * 0.4);
      }
      if (options.showDate) {
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        ctx.fillStyle = '#FCD34D';
        ctx.font = `${Math.round(footerH * 0.28)}px 'Inter', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(date, stripX + stripW / 2, footerY + (options.caption ? footerH * 0.75 : footerH * 0.5));
      }
    }
  }

  // 7. Visual editing wireframe overlays (when in template editor mode)
  if (options.showWireframes) {
    slots.forEach((slot, idx) => {
      const isSelected = options.selectedSlotId === slot.id;
      const strokeColor = isSelected ? '#2563EB' : '#10B981';

      ctx.save();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = strokeColor;
      ctx.setLineDash(isSelected ? [] : [6, 4]);

      const sx = stripX + slot.x * stripW;
      const sy = stripY + slot.y * stripH;
      const sw = slot.width * stripW;
      const sh = slot.height * stripH;

      if (slot.type === 'polygon' && slot.points) {
        ctx.beginPath();
        slot.points.forEach((pt, pIdx) => {
          const px = stripX + pt.x * stripW;
          const py = stripY + pt.y * stripH;
          if (pIdx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.stroke();

        // Draw vertex handles
        slot.points.forEach((pt) => {
          const px = stripX + pt.x * stripW;
          const py = stripY + pt.y * stripH;
          ctx.fillStyle = isSelected ? '#2563EB' : '#10B981';
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 6 : 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        ctx.strokeRect(sx, sy, sw, sh);
      }

      // Slot badge tag
      ctx.setLineDash([]);
      ctx.fillStyle = strokeColor;
      const tagText = `${slot.name} (#${idx + 1})`;
      ctx.font = 'bold 11px Inter, sans-serif';
      const textWidth = ctx.measureText(tagText).width;
      ctx.fillRect(sx, sy - 18, textWidth + 10, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, sx + 5, sy - 9);

      ctx.restore();
    });
  }
}

/**
 * Render a single photo strip onto a canvas. count = jumlah foto
 * (menentukan produk & layout built-in).
 */
export async function renderSingleStrip(ctx, images, template, options, stripX, stripY, stripW, stripH) {
  const count = images.length || 4;
  if (template.isCustom || template.slots) {
    await renderCustomStrip(ctx, images, template, options, stripX, stripY, stripW, stripH);
  } else {
    renderBuiltinStrip(ctx, images, template, options, stripX, stripY, stripW, stripH, count);
  }
}

/**
 * Render the strip preview on a given canvas element.
 * 
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} photoDataUrls
 * @param {string|object} templateOrKey
 * @param {object} options
 */
export async function renderStripPreview(canvas, photoDataUrls, templateOrKey, options = {}) {
  const template = await resolveTemplate(templateOrKey);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const images = await Promise.all(
    (photoDataUrls || []).map((url) =>
      url ? loadImage(url).catch(() => null) : Promise.resolve(null)
    )
  );

  await renderSingleStrip(
    ctx, images, template, options,
    0, 0, canvas.width, canvas.height
  );
}

/**
 * Render the full print sheet (4R = 10,2 × 15,2 cm @ 300 DPI = 1200 × 1800,
 * diputar menyamping untuk produk landscape).
 *
 * Isi lembar mengikuti PRODUK: salinan berukuran sejati di tengah lembar;
 * Two up = 2 salinan berdampingan + garis potong; produk lain 1 salinan.
 *
 * @param {string[]} photoDataUrls
 * @param {string|object} templateOrKey
 * @param {object} options
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderExportCanvas(photoDataUrls, templateOrKey, options = {}) {
  const count = (photoDataUrls || []).length || 4;
  const p = produkUntuk(count);
  const landscape = p.sheetOrient === 'landscape';

  const SHEET_W = landscape ? 1800 : 1200;
  const SHEET_H = landscape ? 1200 : 1800;
  const copies = p.copySheet;

  // Semua salinan dicetak UKURAN SEJATI (px 300 DPI = cm asli), di tengah
  // lembar. Gap 16 px hanya antar 2 salinan Two up (591×2 + 16 = 1198 ≤ 1200).
  const GAP_SALIN = 16;
  const stripW = p.pxW;
  const stripH = p.pxH;
  const startY = Math.round((SHEET_H - stripH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const template = await resolveTemplate(templateOrKey);

  // Fill 4R sheet background
  ctx.fillStyle = template.backgroundColor || template.bg || '#FFFFFF';
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);

  const images = await Promise.all(
    (photoDataUrls || []).map((url) =>
      url ? loadImage(url).catch(() => null) : Promise.resolve(null)
    )
  );

  const startX = Math.round((SHEET_W - stripW * copies - (copies - 1) * GAP_SALIN) / 2);
  for (let i = 0; i < copies; i++) {
    await renderSingleStrip(ctx, images, template, options, startX + i * (stripW + GAP_SALIN), startY, stripW, stripH);
  }

  // Cutting guide line between copies
  if (copies > 1) {
    const centerX = startX + stripW + GAP_SALIN / 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = '#00000033';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, SHEET_H);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  return canvas;
}
