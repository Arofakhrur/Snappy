/**
 * Canvas Utility — composes photo strips using Canvas API
 * 
 * Supports both Built-in Presets (Classic, Cobalt, Darkroom, Lavender)
 * and Custom Templates with user-defined artwork overlays, asymmetric/irregular
 * polygon slots, independent photo crop/pan/zoom, and 4R sheet composition.
 */

import { getCustomTemplate } from './customTemplateStorage.js';

/** Built-in Strip template definitions */
export const TEMPLATES = {
  classic: {
    id: 'classic',
    label: 'Classic',
    bg: '#FBF7F0',
    frameBg: '#1C1917',
    photoGap: 8,
    photoBorderRadius: 6,
    headerBg: '#1C1917',
    headerText: '#FCD34D',
    footerBg: '#1C1917',
    footerText: '#FBF7F0',
    accent: '#FCD34D',
  },
  cobalt: {
    id: 'cobalt',
    label: 'Cobalt',
    bg: '#EFF6FF',
    frameBg: '#2563EB',
    photoGap: 8,
    photoBorderRadius: 6,
    headerBg: '#2563EB',
    headerText: '#FFFFFF',
    footerBg: '#2563EB',
    footerText: '#BFDBFE',
    accent: '#BFDBFE',
  },
  darkroom: {
    id: 'darkroom',
    label: 'Dark Room',
    bg: '#1C1917',
    frameBg: '#1C1917',
    photoGap: 6,
    photoBorderRadius: 4,
    headerBg: '#1C1917',
    headerText: '#F87171',
    footerBg: '#1C1917',
    footerText: '#FBF7F0',
    accent: '#F87171',
  },
  lavender: {
    id: 'lavender',
    label: 'Lavender',
    bg: '#F5F3FF',
    frameBg: '#A78BFA',
    photoGap: 8,
    photoBorderRadius: 8,
    headerBg: '#A78BFA',
    headerText: '#FFFFFF',
    footerBg: '#A78BFA',
    footerText: '#F5F3FF',
    accent: '#DDD6FE',
  },
};

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
 * Render a built-in classic/preset strip.
 */
function renderBuiltinStrip(ctx, images, template, options, stripX, stripY, stripW, stripH) {
  const { caption, showDate } = options;
  const t = template;
  const pad = Math.round(stripW * 0.04);

  // Background
  ctx.fillStyle = t.bg;
  ctx.fillRect(stripX, stripY, stripW, stripH);

  // Header bar
  const headerH = Math.round(stripH * 0.065);
  ctx.fillStyle = t.headerBg;
  ctx.fillRect(stripX, stripY, stripW, headerH);

  // Header text — brand
  ctx.fillStyle = t.headerText;
  ctx.font = `bold ${Math.round(headerH * 0.48)}px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DISTUDIO', stripX + stripW / 2, stripY + headerH / 2);

  // Footer bar
  const footerH = Math.round(stripH * 0.075);
  const footerY = stripY + stripH - footerH;
  ctx.fillStyle = t.footerBg;
  ctx.fillRect(stripX, footerY, stripW, footerH);

  // Footer: caption
  if (caption) {
    ctx.fillStyle = t.footerText;
    const capFontSize = Math.round(footerH * 0.35);
    ctx.font = `600 ${capFontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const capY = showDate ? footerY + footerH * 0.35 : footerY + footerH * 0.5;
    ctx.fillText(caption.slice(0, 30), stripX + stripW / 2, capY);
  }

  // Footer: date
  if (showDate) {
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillStyle = t.accent;
    const dateFontSize = Math.round(footerH * 0.28);
    ctx.font = `${dateFontSize}px 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const dateY = caption ? footerY + footerH * 0.72 : footerY + footerH * 0.5;
    ctx.fillText(date, stripX + stripW / 2, dateY);
  }

  // Photos area
  const photoAreaY = stripY + headerH + pad;
  const photoAreaH = footerY - photoAreaY - pad;
  const photoCount = images.length || 4;
  const totalGap = (photoCount - 1) * t.photoGap;
  const photoH = (photoAreaH - totalGap) / photoCount;
  const photoW = stripW - pad * 2;
  const photoX = stripX + pad;
  const r = t.photoBorderRadius;

  images.forEach((img, i) => {
    const photoY = photoAreaY + i * (photoH + t.photoGap);

    if (img) {
      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, r);
      ctx.clip();
      drawCroppedImage(ctx, img, photoX, photoY, photoW, photoH);
      ctx.restore();
    } else {
      ctx.fillStyle = t.frameBg + '33';
      roundRect(ctx, photoX, photoY, photoW, photoH, r);
      ctx.fill();
      ctx.fillStyle = t.frameBg + '88';
      ctx.font = `${Math.round(photoH * 0.15)}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷', photoX + photoW / 2, photoY + photoH / 2);
    }

    ctx.strokeStyle = t.frameBg + '22';
    ctx.lineWidth = 1;
    roundRect(ctx, photoX, photoY, photoW, photoH, r);
    ctx.stroke();
  });

  // Header accent dots
  const dotR = Math.round(headerH * 0.15);
  const dotY = stripY + headerH / 2;
  [0.12, 0.2, 0.8, 0.88].forEach((xRatio) => {
    ctx.fillStyle = t.accent;
    ctx.beginPath();
    ctx.arc(stripX + stripW * xRatio, dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
  });
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
 * Render a single photo strip onto a canvas.
 */
export async function renderSingleStrip(ctx, images, template, options, stripX, stripY, stripW, stripH) {
  if (template.isCustom || template.slots) {
    await renderCustomStrip(ctx, images, template, options, stripX, stripY, stripW, stripH);
  } else {
    renderBuiltinStrip(ctx, images, template, options, stripX, stripY, stripW, stripH);
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
 * Render the full export canvas (1200 × 1800, two strips side by side = 4R).
 * 
 * @param {string[]} photoDataUrls
 * @param {string|object} templateOrKey
 * @param {object} options
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function renderExportCanvas(photoDataUrls, templateOrKey, options = {}) {
  const EXPORT_W = 1200;
  const EXPORT_H = 1800;
  const STRIP_W = 588;
  const GAP = 24;

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const template = await resolveTemplate(templateOrKey);

  // Fill 4R sheet background
  ctx.fillStyle = template.backgroundColor || template.bg || '#FFFFFF';
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  const images = await Promise.all(
    (photoDataUrls || []).map((url) =>
      url ? loadImage(url).catch(() => null) : Promise.resolve(null)
    )
  );

  const leftX = (EXPORT_W - STRIP_W * 2 - GAP) / 2;
  const rightX = leftX + STRIP_W + GAP;

  // Left strip (Strip 1)
  await renderSingleStrip(ctx, images, template, options, leftX, 0, STRIP_W, EXPORT_H);

  // Right strip (Strip 2 - duplicate copy)
  await renderSingleStrip(ctx, images, template, options, rightX, 0, STRIP_W, EXPORT_H);

  // Center Cutting guide line
  const centerX = leftX + STRIP_W + GAP / 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = '#00000033';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, EXPORT_H);
  ctx.stroke();
  ctx.setLineDash([]);

  return canvas;
}
