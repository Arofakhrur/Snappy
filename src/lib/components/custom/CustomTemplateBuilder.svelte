<script>
  import { onMount, onDestroy } from 'svelte';
  import { session, setCustomTemplate } from '#lib/stores/session.js';
  import { saveCustomTemplate, exportTemplateFile, BUILTIN_STICKERS } from '#lib/utils/customTemplateStorage.js';
  import { renderSingleStrip, loadImage } from '#lib/utils/canvas.js';

  export let initialTemplate = null;
  export let onClose = () => {};
  export let onSaveAndApply = (template) => {};

  // Template editable state
  let templateId = initialTemplate ? initialTemplate.id : `custom-${Date.now()}`;
  let templateName = initialTemplate ? initialTemplate.name : 'My Custom Strip';
  let backgroundColor = initialTemplate ? initialTemplate.backgroundColor || '#FFFFFF' : '#FFFFFF';
  let artworkLayer = initialTemplate ? initialTemplate.artworkLayer || 'overlay' : 'overlay';
  let artworkDataUrl = initialTemplate ? initialTemplate.artworkDataUrl || '' : '';

  /** @type {Array<import('#lib/utils/customTemplateStorage.js').CustomSlot>} */
  let slots = initialTemplate && initialTemplate.slots
    ? JSON.parse(JSON.stringify(initialTemplate.slots))
    : [
        {
          id: 'slot-1',
          name: 'Slot 1',
          type: 'rect',
          x: 0.08,
          y: 0.10,
          width: 0.84,
          height: 0.24,
          borderRadius: 6,
          assignedPhotoIndex: 0,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0
        },
        {
          id: 'slot-2',
          name: 'Slot 2',
          type: 'rect',
          x: 0.08,
          y: 0.38,
          width: 0.84,
          height: 0.24,
          borderRadius: 6,
          assignedPhotoIndex: 1,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0
        },
        {
          id: 'slot-3',
          name: 'Slot 3',
          type: 'rect',
          x: 0.08,
          y: 0.66,
          width: 0.84,
          height: 0.24,
          borderRadius: 6,
          assignedPhotoIndex: 2,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0
        }
      ];

  /** @type {Array<import('#lib/utils/customTemplateStorage.js').DecorativeLayer>} */
  let overlays = initialTemplate && initialTemplate.overlays
    ? JSON.parse(JSON.stringify(initialTemplate.overlays))
    : [];

  // Editor interaction state
  let selectedSlotId = slots.length > 0 ? slots[0].id : null;
  let selectedOverlayId = overlays.length > 0 ? overlays[0].id : null;
  let selectedKind = 'slot'; // 'slot' | 'overlay'
  let activeTab = 'slots'; // 'slots' | 'overlays' | 'artwork' | 'assignment' | 'guides'
  let viewMode = 'wireframe'; // 'wireframe' | 'live'
  let editorZoom = 1.0; // 0.8, 1.0, 1.25, 1.5

  // Dragging state
  let draggingMode = null; // 'slot-move' | 'slot-resize' | 'slot-point' | 'overlay-move' | 'overlay-resize' | 'overlay-rotate'
  let dragSlotId = null;
  let dragOverlayId = null;
  let dragPointIdx = null;
  let dragResizeHandle = null; // 'se' | 'sw' | 'ne' | 'nw'
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartSlot = null;
  let dragStartOverlay = null;

  // Validation / notices
  let artworkWarning = null;
  let artworkInfo = null;
  let saveFeedback = '';

  // Canvas ref for live composite preview
  /** @type {HTMLCanvasElement} */
  let liveCanvas;

  $: activeSlot = slots.find((s) => s.id === selectedSlotId) || slots[0] || null;
  $: activeOverlay = overlays.find((o) => o.id === selectedOverlayId) || overlays[0] || null;
  $: capturedPhotos = $session.photos || [];

  // Redraw live composite preview whenever state changes
  $: if (viewMode === 'live' && liveCanvas) {
    drawLivePreview();
  }

  async function drawLivePreview() {
    if (!liveCanvas) return;
    const ctx = liveCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
    const images = await Promise.all(
      capturedPhotos.map((url) => (url ? loadImage(url).catch(() => null) : Promise.resolve(null)))
    );

    const tmplObj = {
      id: templateId,
      name: templateName,
      isCustom: true,
      backgroundColor,
      artworkLayer,
      artworkDataUrl,
      slots,
      overlays,
    };

    await renderSingleStrip(ctx, images, tmplObj, {}, 0, 0, liveCanvas.width, liveCanvas.height);
  }

  // File import for custom artwork frame
  function handleArtworkUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    artworkWarning = null;
    artworkInfo = null;

    if (!file.type.includes('image/png') && !file.type.includes('image/svg')) {
      artworkWarning = 'Please upload a PNG or SVG image file.';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        artworkInfo = `Dimensions: ${img.width} × ${img.height}px (${aspect.toFixed(2)}:1)`;

        if (img.width < 600 || img.height < 1800) {
          artworkWarning = `Notice: Image resolution (${img.width}×${img.height}px) is lower than the recommended 600×1800px (300 DPI target). Print quality may be reduced.`;
        } else if (Math.abs(aspect - (600 / 1800)) > 0.05) {
          artworkWarning = `Notice: Aspect ratio (${aspect.toFixed(2)}) deviates from 1:3 standard strip proportions. The frame will be scaled to fill 2 × 6″.`;
        }

        artworkDataUrl = dataUrl;
        if (viewMode === 'live') drawLivePreview();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function removeArtwork() {
    artworkDataUrl = '';
    artworkWarning = null;
    artworkInfo = null;
    if (viewMode === 'live') drawLivePreview();
  }

  // ==========================================
  // Slot Management
  // ==========================================
  function addRectSlot() {
    const newIdx = slots.length + 1;
    const newSlot = {
      id: `slot-${Date.now()}`,
      name: `Slot ${newIdx}`,
      type: 'rect',
      x: 0.1,
      y: 0.15 + (newIdx % 3) * 0.1,
      width: 0.8,
      height: 0.22,
      borderRadius: 6,
      assignedPhotoIndex: Math.min(newIdx - 1, capturedPhotos.length - 1),
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
    };
    slots = [...slots, newSlot];
    selectedSlotId = newSlot.id;
    selectedKind = 'slot';
  }

  function addPolygonSlot(preset = 'slanted') {
    const newIdx = slots.length + 1;
    let points = [];

    if (preset === 'slanted') {
      points = [
        { x: 0.08, y: 0.10 },
        { x: 0.92, y: 0.13 },
        { x: 0.92, y: 0.35 },
        { x: 0.08, y: 0.32 },
      ];
    } else if (preset === 'diamond') {
      points = [
        { x: 0.50, y: 0.40 },
        { x: 0.92, y: 0.52 },
        { x: 0.50, y: 0.64 },
        { x: 0.08, y: 0.52 },
      ];
    } else if (preset === 'arch') {
      points = [
        { x: 0.10, y: 0.20 },
        { x: 0.30, y: 0.12 },
        { x: 0.70, y: 0.12 },
        { x: 0.90, y: 0.20 },
        { x: 0.90, y: 0.40 },
        { x: 0.10, y: 0.40 },
      ];
    } else {
      points = [
        { x: 0.10, y: 0.10 },
        { x: 0.90, y: 0.10 },
        { x: 0.80, y: 0.35 },
        { x: 0.20, y: 0.35 },
      ];
    }

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    const newSlot = {
      id: `slot-${Date.now()}`,
      name: `Irregular Slot ${newIdx}`,
      type: 'polygon',
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      points,
      assignedPhotoIndex: Math.min(newIdx - 1, capturedPhotos.length - 1),
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
    };

    slots = [...slots, newSlot];
    selectedSlotId = newSlot.id;
    selectedKind = 'slot';
  }

  function addCircleSlot() {
    const newIdx = slots.length + 1;
    const newSlot = {
      id: `slot-${Date.now()}`,
      name: `Circle Slot ${newIdx}`,
      type: 'circle',
      x: 0.15,
      y: 0.25,
      width: 0.70,
      height: 0.23,
      assignedPhotoIndex: Math.min(newIdx - 1, capturedPhotos.length - 1),
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
    };
    slots = [...slots, newSlot];
    selectedSlotId = newSlot.id;
    selectedKind = 'slot';
  }

  function deleteSlot(id) {
    if (slots.length <= 1) return;
    slots = slots.filter((s) => s.id !== id);
    if (selectedSlotId === id) {
      selectedSlotId = slots[0]?.id || null;
    }
  }

  function moveSlotOrder(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= slots.length) return;
    const temp = slots[index];
    slots[index] = slots[targetIdx];
    slots[targetIdx] = temp;
    slots = [...slots];
  }

  // ==========================================
  // Decorative Overlay Layers Management
  // ==========================================
  function addBuiltinSticker(sticker) {
    const newIdx = overlays.length + 1;
    const newOverlay = {
      id: `overlay-${Date.now()}`,
      name: sticker.name,
      type: sticker.type || 'sticker',
      src: `data:image/svg+xml;utf8,${encodeURIComponent(sticker.svg)}`,
      x: 0.25,
      y: 0.10 + (overlays.length % 5) * 0.12,
      width: sticker.width || 0.35,
      height: sticker.height || 0.10,
      rotation: 0,
      opacity: 1.0,
      zIndex: overlays.length + 1,
      locked: false,
      hidden: false,
      aspectRatioLocked: true,
      aspectRatio: sticker.aspectRatio || 1.0,
    };

    overlays = [...overlays, newOverlay];
    selectedOverlayId = newOverlay.id;
    selectedKind = 'overlay';
    activeTab = 'overlays';
    if (viewMode === 'live') drawLivePreview();
  }

  function handleCustomOverlayUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.includes('image/png') && !file.type.includes('image/svg')) {
      alert('Please upload a PNG or SVG image with transparency.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const defaultW = 0.35;
        const defaultH = defaultW / aspect;

        const newOverlay = {
          id: `overlay-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 20) || 'Custom Layer',
          type: 'image',
          src,
          x: 0.32,
          y: 0.22,
          width: defaultW,
          height: Math.min(0.4, defaultH),
          rotation: 0,
          opacity: 1.0,
          zIndex: overlays.length + 1,
          locked: false,
          hidden: false,
          aspectRatioLocked: true,
          aspectRatio: aspect,
        };

        overlays = [...overlays, newOverlay];
        selectedOverlayId = newOverlay.id;
        selectedKind = 'overlay';
        activeTab = 'overlays';
        if (viewMode === 'live') drawLivePreview();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function deleteOverlay(id) {
    overlays = overlays.filter((o) => o.id !== id);
    if (selectedOverlayId === id) {
      selectedOverlayId = overlays[0]?.id || null;
    }
    if (viewMode === 'live') drawLivePreview();
  }

  function duplicateOverlay(id) {
    const target = overlays.find((o) => o.id === id);
    if (!target) return;
    const copy = {
      ...JSON.parse(JSON.stringify(target)),
      id: `overlay-${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: Math.min(0.8, target.x + 0.04),
      y: Math.min(0.8, target.y + 0.04),
      zIndex: overlays.length + 1,
    };
    overlays = [...overlays, copy];
    selectedOverlayId = copy.id;
    selectedKind = 'overlay';
    if (viewMode === 'live') drawLivePreview();
  }

  function toggleOverlayLock(id) {
    overlays = overlays.map((o) => (o.id === id ? { ...o, locked: !o.locked } : o));
  }

  function toggleOverlayHide(id) {
    overlays = overlays.map((o) => (o.id === id ? { ...o, hidden: !o.hidden } : o));
    if (viewMode === 'live') drawLivePreview();
  }

  function bringToFront(id) {
    const maxZ = Math.max(...overlays.map((o) => o.zIndex || 0), 0);
    overlays = overlays.map((o) => (o.id === id ? { ...o, zIndex: maxZ + 1 } : o));
    if (viewMode === 'live') drawLivePreview();
  }

  function sendToBack(id) {
    const minZ = Math.min(...overlays.map((o) => o.zIndex || 0), 0);
    overlays = overlays.map((o) => (o.id === id ? { ...o, zIndex: minZ - 1 } : o));
    if (viewMode === 'live') drawLivePreview();
  }

  function moveOverlayOrder(index, direction) {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= overlays.length) return;
    const temp = overlays[index];
    overlays[index] = overlays[targetIdx];
    overlays[targetIdx] = temp;
    // sync zIndex
    overlays = overlays.map((o, idx) => ({ ...o, zIndex: idx + 1 }));
    if (viewMode === 'live') drawLivePreview();
  }

  // ==========================================
  // Pointer Drag & Transform Handlers
  // ==========================================
  function onSlotPointerDown(e, mode, slotId, pointIdx = null, handle = null) {
    e.stopPropagation();
    e.preventDefault();

    selectedSlotId = slotId;
    selectedKind = 'slot';
    draggingMode = mode;
    dragSlotId = slotId;
    dragPointIdx = pointIdx;
    dragResizeHandle = handle;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const targetSlot = slots.find((s) => s.id === slotId);
    dragStartSlot = targetSlot ? JSON.parse(JSON.stringify(targetSlot)) : null;

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function onOverlayPointerDown(e, mode, overlayId, handle = null) {
    e.stopPropagation();
    e.preventDefault();

    const target = overlays.find((o) => o.id === overlayId);
    if (!target) return;
    if (target.locked && mode === 'overlay-move') return;

    selectedOverlayId = overlayId;
    selectedKind = 'overlay';
    activeTab = 'overlays';
    draggingMode = mode;
    dragOverlayId = overlayId;
    dragResizeHandle = handle;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOverlay = JSON.parse(JSON.stringify(target));

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function onPointerMove(e) {
    if (!draggingMode) return;

    // Viewport dimensions (300 x 900 base visual size)
    const viewW = 300 * editorZoom;
    const viewH = 900 * editorZoom;

    const deltaX = (e.clientX - dragStartX) / viewW;
    const deltaY = (e.clientY - dragStartY) / viewH;

    // A. Slot Transformations
    if (dragStartSlot && (draggingMode === 'slot-move' || draggingMode === 'slot-resize' || draggingMode === 'slot-point')) {
      slots = slots.map((s) => {
        if (s.id !== dragSlotId) return s;

        if (draggingMode === 'slot-move') {
          const newX = Math.max(0, Math.min(1 - s.width, dragStartSlot.x + deltaX));
          const newY = Math.max(0, Math.min(1 - s.height, dragStartSlot.y + deltaY));

          let updatedPoints = s.points;
          if (s.type === 'polygon' && dragStartSlot.points) {
            const shiftX = newX - dragStartSlot.x;
            const shiftY = newY - dragStartSlot.y;
            updatedPoints = dragStartSlot.points.map((pt) => ({
              x: Math.max(0, Math.min(1, pt.x + shiftX)),
              y: Math.max(0, Math.min(1, pt.y + shiftY)),
            }));
          }

          return { ...s, x: newX, y: newY, points: updatedPoints };
        }

        if (draggingMode === 'slot-resize') {
          let newX = dragStartSlot.x;
          let newY = dragStartSlot.y;
          let newW = dragStartSlot.width;
          let newH = dragStartSlot.height;

          if (dragResizeHandle === 'se') {
            newW = Math.max(0.1, Math.min(1 - newX, dragStartSlot.width + deltaX));
            newH = Math.max(0.06, Math.min(1 - newY, dragStartSlot.height + deltaY));
          }

          return { ...s, x: newX, y: newY, width: newW, height: newH };
        }

        if (draggingMode === 'slot-point' && s.type === 'polygon' && dragPointIdx !== null) {
          const points = [...(s.points || [])];
          const origPt = dragStartSlot.points[dragPointIdx];
          if (origPt) {
            points[dragPointIdx] = {
              x: Math.max(0, Math.min(1, origPt.x + deltaX)),
              y: Math.max(0, Math.min(1, origPt.y + deltaY)),
            };
            const minX = Math.min(...points.map((p) => p.x));
            const maxX = Math.max(...points.map((p) => p.x));
            const minY = Math.min(...points.map((p) => p.y));
            const maxY = Math.max(...points.map((p) => p.y));

            return { ...s, points, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
          }
        }

        return s;
      });
    }

    // B. Overlay Transformations
    if (dragStartOverlay && (draggingMode === 'overlay-move' || draggingMode === 'overlay-resize' || draggingMode === 'overlay-rotate')) {
      overlays = overlays.map((o) => {
        if (o.id !== dragOverlayId) return o;

        if (draggingMode === 'overlay-move') {
          const newX = Math.max(-0.2, Math.min(1.0, dragStartOverlay.x + deltaX));
          const newY = Math.max(-0.2, Math.min(1.0, dragStartOverlay.y + deltaY));
          return { ...o, x: newX, y: newY };
        }

        if (draggingMode === 'overlay-resize') {
          let newW = Math.max(0.05, Math.min(1.2, dragStartOverlay.width + deltaX));
          let newH = dragStartOverlay.height;
          if (o.aspectRatioLocked && o.aspectRatio) {
            newH = newW / o.aspectRatio;
          } else {
            newH = Math.max(0.02, Math.min(1.0, dragStartOverlay.height + deltaY));
          }
          return { ...o, width: newW, height: newH };
        }

        if (draggingMode === 'overlay-rotate') {
          // Angle from overlay center to cursor
          const cx = (dragStartOverlay.x + dragStartOverlay.width / 2) * viewW;
          const cy = (dragStartOverlay.y + dragStartOverlay.height / 2) * viewH;
          const rect = liveCanvas ? liveCanvas.getBoundingClientRect() : e.target.getBoundingClientRect();
          const curX = e.clientX - rect.left;
          const curY = e.clientY - rect.top;
          const angleRad = Math.atan2(curY - cy, curX - cx);
          let deg = Math.round(angleRad * (180 / Math.PI)) + 90;
          if (deg > 180) deg -= 360;
          return { ...o, rotation: deg };
        }

        return o;
      });
    }
  }

  function onPointerUp() {
    draggingMode = null;
    dragSlotId = null;
    dragOverlayId = null;
    dragPointIdx = null;
    dragResizeHandle = null;
    dragStartSlot = null;
    dragStartOverlay = null;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);

    if (viewMode === 'live') drawLivePreview();
  }

  // Save template action
  async function handleSave() {
    const templateData = {
      id: templateId,
      name: templateName.trim() || 'Custom Photo Strip',
      isCustom: true,
      backgroundColor,
      artworkLayer,
      artworkDataUrl,
      width: 600,
      height: 1800,
      slots,
      overlays,
      updatedAt: Date.now(),
    };

    const saved = await saveCustomTemplate(templateData);
    setCustomTemplate(saved);

    saveFeedback = 'Template saved to library!';
    setTimeout(() => {
      saveFeedback = '';
    }, 3000);

    onSaveAndApply(saved);
  }

  function handleExportPackage() {
    const templateData = {
      id: templateId,
      name: templateName.trim() || 'Custom Photo Strip',
      isCustom: true,
      backgroundColor,
      artworkLayer,
      artworkDataUrl,
      width: 600,
      height: 1800,
      slots,
      overlays,
    };
    exportTemplateFile(templateData);
  }

  onDestroy(() => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  });
</script>

<div class="custom-builder-overlay" role="dialog" aria-modal="true" aria-label="Custom Photo-Strip Template Builder">
  <div class="custom-builder-container">
    <!-- Header -->
    <header class="builder-header">
      <div class="header-left">
        <button class="btn btn-ghost btn-sm" on:click={onClose} aria-label="Close builder">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Close
        </button>
        <div class="title-group">
          <input
            type="text"
            class="template-title-input"
            bind:value={templateName}
            placeholder="Template Name…"
            aria-label="Custom template name"
          />
          <span class="dim-badge">2 × 6″ Strip (600 × 1800)</span>
        </div>
      </div>

      <div class="header-actions">
        {#if saveFeedback}
          <span class="save-toast animate-fadeIn">{saveFeedback}</span>
        {/if}
        <button class="btn btn-secondary btn-sm" on:click={handleExportPackage} title="Export reusable JSON package">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export JSON
        </button>
        <button id="btn-save-custom-template" class="btn btn-primary btn-sm" on:click={handleSave}>
          Save &amp; Apply Strip
        </button>
      </div>
    </header>

    <!-- Main Builder Layout -->
    <div class="builder-content">
      <!-- Left Column: Visual Canvas Workspace -->
      <div class="canvas-workspace">
        <div class="workspace-toolbar">
          <div class="view-mode-toggle">
            <button
              class="toggle-btn"
              class:active={viewMode === 'wireframe'}
              on:click={() => { viewMode = 'wireframe'; }}
            >
              📐 Design &amp; Layers
            </button>
            <button
              class="toggle-btn"
              class:active={viewMode === 'live'}
              on:click={() => { viewMode = 'live'; drawLivePreview(); }}
            >
              ✨ Live Composite
            </button>
          </div>

          <div class="zoom-controls">
            <button class="zoom-btn" on:click={() => { editorZoom = Math.max(0.7, editorZoom - 0.15); }} aria-label="Zoom out">−</button>
            <span class="zoom-label">{Math.round(editorZoom * 100)}%</span>
            <button class="zoom-btn" on:click={() => { editorZoom = Math.min(1.5, editorZoom + 0.15); }} aria-label="Zoom in">+</button>
          </div>
        </div>

        <!-- The 2x6 Strip Board -->
        <div class="strip-board-scroller">
          <div
            class="strip-board"
            style="width: {300 * editorZoom}px; height: {900 * editorZoom}px; background-color: {backgroundColor};"
          >
            <!-- Mode A: Wireframe & Interactive Layers Mode -->
            {#if viewMode === 'wireframe'}
              <!-- Artwork background if underlay -->
              {#if artworkDataUrl && artworkLayer === 'underlay'}
                <img src={artworkDataUrl} class="artwork-layer" alt="Custom underlay artwork" />
              {/if}

              <!-- Interactive SVG Overlay for Slots & Geometry Handles -->
              <svg
                class="slot-svg-canvas"
                viewBox="0 0 1000 3000"
                preserveAspectRatio="none"
              >
                <!-- Outer safe boundary indicator (5mm / 60px equivalent) -->
                <rect x="60" y="60" width="880" height="2880" fill="none" stroke="#10B98133" stroke-width="3" stroke-dasharray="10 6"/>

                <!-- 1. Photo Slots -->
                {#each slots as slot, i (slot.id)}
                  {@const isSel = selectedKind === 'slot' && slot.id === selectedSlotId}
                  {@const slotColor = isSel ? '#2563EB' : '#059669'}
                  {@const pX = slot.x * 1000}
                  {@const pY = slot.y * 3000}
                  {@const pW = slot.width * 1000}
                  {@const pH = slot.height * 3000}

                  {#if slot.type === 'polygon' && slot.points}
                    <!-- Polygon Slot -->
                    <polygon
                      points={slot.points.map((pt) => `${pt.x * 1000},${pt.y * 3000}`).join(' ')}
                      fill={isSel ? '#2563EB33' : '#10B98122'}
                      stroke={slotColor}
                      stroke-width={isSel ? 8 : 4}
                      stroke-linejoin="round"
                      role="button"
                      tabindex="0"
                      aria-label="Drag {slot.name}"
                      on:pointerdown={(e) => onSlotPointerDown(e, 'slot-move', slot.id)}
                      class="draggable-slot"
                    />

                    <!-- Polygon Vertex Handles (draggable points) -->
                    {#each slot.points as pt, ptIdx}
                      <circle
                        cx={pt.x * 1000}
                        cy={pt.y * 3000}
                        r={isSel ? 22 : 14}
                        fill={isSel ? '#2563EB' : '#FFFFFF'}
                        stroke={isSel ? '#FFFFFF' : '#059669'}
                        stroke-width="5"
                        role="button"
                        tabindex="0"
                        aria-label="Adjust point {ptIdx + 1}"
                        on:pointerdown={(e) => onSlotPointerDown(e, 'slot-point', slot.id, ptIdx)}
                        class="vertex-handle"
                      />
                    {/each}
                  {:else if slot.type === 'circle'}
                    <!-- Ellipse / Circle Slot -->
                    <ellipse
                      cx={pX + pW / 2}
                      cy={pY + pH / 2}
                      rx={pW / 2}
                      ry={pH / 2}
                      fill={isSel ? '#2563EB33' : '#10B98122'}
                      stroke={slotColor}
                      stroke-width={isSel ? 8 : 4}
                      role="button"
                      tabindex="0"
                      aria-label="Drag {slot.name}"
                      on:pointerdown={(e) => onSlotPointerDown(e, 'slot-move', slot.id)}
                      class="draggable-slot"
                    />
                  {:else}
                    <!-- Rectangular Slot -->
                    <rect
                      x={pX}
                      y={pY}
                      width={pW}
                      height={pH}
                      rx={(slot.borderRadius || 6) * 1.6}
                      fill={isSel ? '#2563EB33' : '#10B98122'}
                      stroke={slotColor}
                      stroke-width={isSel ? 8 : 4}
                      role="button"
                      tabindex="0"
                      aria-label="Drag {slot.name}"
                      on:pointerdown={(e) => onSlotPointerDown(e, 'slot-move', slot.id)}
                      class="draggable-slot"
                    />

                    <!-- Corner Resize Handle for selected rect -->
                    {#if isSel}
                      <rect
                        x={pX + pW - 24}
                        y={pY + pH - 24}
                        width="32"
                        height="32"
                        rx="4"
                        fill="#2563EB"
                        stroke="#FFFFFF"
                        stroke-width="4"
                        role="button"
                        tabindex="0"
                        aria-label="Resize {slot.name}"
                        on:pointerdown={(e) => onSlotPointerDown(e, 'slot-resize', slot.id, null, 'se')}
                        class="resize-handle"
                      />
                    {/if}
                  {/if}

                  <!-- Slot Label Badge -->
                  <g transform="translate({pX + 8}, {pY - 26})">
                    <rect x="0" y="0" width="160" height="42" rx="6" fill={slotColor}/>
                    <text x="10" y="27" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">
                      #{i + 1} {slot.name}
                    </text>
                  </g>
                {/each}

                <!-- 2. Interactive Decorative Overlay Elements in SVG coordinates -->
                {#each overlays as ovl, oIdx (ovl.id)}
                  {@const isOvlSel = selectedKind === 'overlay' && ovl.id === selectedOverlayId}
                  {@const oX = ovl.x * 1000}
                  {@const oY = ovl.y * 3000}
                  {@const oW = ovl.width * 1000}
                  {@const oH = ovl.height * 3000}
                  {@const cx = oX + oW / 2}
                  {@const cy = oY + oH / 2}

                  {#if !ovl.hidden}
                    <g transform="rotate({ovl.rotation || 0}, {cx}, {cy})" opacity={ovl.opacity ?? 1.0}>
                      <!-- Render the overlay graphic -->
                      <image
                        href={ovl.src}
                        x={oX}
                        y={oY}
                        width={oW}
                        height={oH}
                        preserveAspectRatio="none"
                        role="button"
                        tabindex="0"
                        aria-label="{ovl.name}"
                        on:pointerdown={(e) => onOverlayPointerDown(e, 'overlay-move', ovl.id)}
                        class="draggable-overlay"
                        class:locked={ovl.locked}
                      />

                      <!-- Selection box & transform handles -->
                      {#if isOvlSel}
                        <rect
                          x={oX}
                          y={oY}
                          width={oW}
                          height={oH}
                          fill="none"
                          stroke="#EC4899"
                          stroke-width="6"
                          stroke-dasharray="12 8"
                        />

                        <!-- Corner Resize Handle (Bottom-Right) -->
                        <rect
                          x={oX + oW - 20}
                          y={oY + oH - 20}
                          width="28"
                          height="28"
                          rx="4"
                          fill="#EC4899"
                          stroke="#FFFFFF"
                          stroke-width="4"
                          role="button"
                          tabindex="0"
                          aria-label="Resize overlay"
                          on:pointerdown={(e) => onOverlayPointerDown(e, 'overlay-resize', ovl.id, 'se')}
                          class="resize-handle"
                        />

                        <!-- Rotation Handle & Stem -->
                        <line x1={cx} y1={oY} x2={cx} y2={oY - 40} stroke="#EC4899" stroke-width="4"/>
                        <circle
                          cx={cx}
                          cy={oY - 40}
                          r="18"
                          fill="#EC4899"
                          stroke="#FFFFFF"
                          stroke-width="4"
                          role="button"
                          tabindex="0"
                          aria-label="Rotate overlay"
                          on:pointerdown={(e) => onOverlayPointerDown(e, 'overlay-rotate', ovl.id)}
                          class="rotate-handle"
                        />

                        <!-- Overlay Tag -->
                        <g transform="translate({oX}, {oY - 30})">
                          <rect x="0" y="0" width="140" height="36" rx="6" fill="#EC4899"/>
                          <text x="10" y="23" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#FFFFFF">
                            🎀 {ovl.name}
                          </text>
                        </g>
                      {/if}
                    </g>
                  {/if}
                {/each}
              </svg>

              <!-- Artwork foreground if overlay -->
              {#if artworkDataUrl && (artworkLayer === 'overlay' || !artworkLayer)}
                <img src={artworkDataUrl} class="artwork-layer overlay-mode" alt="Custom overlay artwork" />
              {/if}
            {:else}
              <!-- Mode B: Real Canvas Live Composite Preview -->
              <canvas
                bind:this={liveCanvas}
                width="600"
                height="1800"
                class="live-composite-canvas"
                style="width: {300 * editorZoom}px; height: {900 * editorZoom}px;"
              ></canvas>
            {/if}
          </div>
        </div>

        <div class="workspace-footer">
          <span>💡 Click slot or overlay to select • Drag to move • Corner handle to resize • Top circle to rotate</span>
        </div>
      </div>

      <!-- Right Column: Inspector and Controls -->
      <aside class="builder-inspector">
        <!-- Inspector Navigation Tabs -->
        <nav class="inspector-tabs" aria-label="Builder tabs">
          <button
            class="tab-btn"
            class:active={activeTab === 'slots'}
            on:click={() => { activeTab = 'slots'; }}
          >
            🧩 Slots ({slots.length})
          </button>
          <button
            id="tab-overlays"
            class="tab-btn"
            class:active={activeTab === 'overlays'}
            on:click={() => { activeTab = 'overlays'; }}
          >
            🎀 Overlays ({overlays.length})
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'artwork'}
            on:click={() => { activeTab = 'artwork'; }}
          >
            🎨 Frame Art
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'assignment'}
            on:click={() => { activeTab = 'assignment'; }}
          >
            📷 Mapping
          </button>
          <button
            class="tab-btn"
            class:active={activeTab === 'guides'}
            on:click={() => { activeTab = 'guides'; }}
          >
            📥 Guides
          </button>
        </nav>

        <div class="inspector-panel-content">
          <!-- TAB 1: SLOTS & GEOMETRY -->
          {#if activeTab === 'slots'}
            <div class="tab-pane">
              <div class="pane-section">
                <h3 class="pane-heading">Add Photo Slot</h3>
                <div class="slot-add-actions">
                  <button class="btn btn-secondary btn-sm" on:click={addRectSlot}>
                    + Rectangle
                  </button>
                  <button class="btn btn-secondary btn-sm" on:click={() => addPolygonSlot('slanted')}>
                    + Slanted Polygon
                  </button>
                  <button class="btn btn-secondary btn-sm" on:click={() => addPolygonSlot('diamond')}>
                    + Diamond
                  </button>
                  <button class="btn btn-secondary btn-sm" on:click={addCircleSlot}>
                    + Circle / Oval
                  </button>
                </div>
              </div>

              <!-- Slot List -->
              <div class="pane-section">
                <h3 class="pane-heading">Defined Slots</h3>
                <div class="slot-cards-list">
                  {#each slots as slot, i (slot.id)}
                    <div
                      class="slot-card"
                      class:selected={selectedKind === 'slot' && slot.id === selectedSlotId}
                      role="button"
                      tabindex="0"
                      on:click={() => { selectedSlotId = slot.id; selectedKind = 'slot'; }}
                      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (selectedSlotId = slot.id)}
                    >
                      <div class="slot-card-header">
                        <span class="slot-num-badge">#{i + 1}</span>
                        <input
                          type="text"
                          class="slot-inline-input"
                          bind:value={slot.name}
                          on:click|stopPropagation
                        />
                        <span class="slot-type-tag">{slot.type}</span>
                      </div>

                      <div class="slot-card-meta">
                        <span>Assigned: <strong>{slot.assignedPhotoIndex !== null ? `Photo #${slot.assignedPhotoIndex + 1}` : 'None'}</strong></span>
                        <div class="slot-card-buttons">
                          <button
                            class="icon-btn"
                            disabled={i === 0}
                            on:click|stopPropagation={() => moveSlotOrder(i, -1)}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            class="icon-btn"
                            disabled={i === slots.length - 1}
                            on:click|stopPropagation={() => moveSlotOrder(i, 1)}
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            class="icon-btn danger"
                            disabled={slots.length <= 1}
                            on:click|stopPropagation={() => deleteSlot(slot.id)}
                            title="Delete slot"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>

              <!-- Selected Slot Parameters -->
              {#if activeSlot && selectedKind === 'slot'}
                <div class="pane-section selected-slot-params">
                  <h3 class="pane-heading">Edit Selected: {activeSlot.name}</h3>

                  <div class="param-row">
                    <label for="slot-type-sel">Shape Type:</label>
                    <select id="slot-type-sel" class="select-input" bind:value={activeSlot.type}>
                      <option value="rect">Rectangle</option>
                      <option value="polygon">Irregular Polygon</option>
                      <option value="circle">Circle / Oval</option>
                    </select>
                  </div>

                  {#if activeSlot.type === 'rect'}
                    <div class="param-row">
                      <label for="corner-rad">Corner Radius:</label>
                      <input
                        id="corner-rad"
                        type="range"
                        min="0"
                        max="32"
                        bind:value={activeSlot.borderRadius}
                      />
                      <span>{activeSlot.borderRadius || 0}px</span>
                    </div>
                  {/if}

                  <div class="param-row">
                    <label for="crop-zoom">Photo Zoom:</label>
                    <input
                      id="crop-zoom"
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      bind:value={activeSlot.scale}
                      on:input={() => { if (viewMode === 'live') drawLivePreview(); }}
                    />
                    <span>{activeSlot.scale?.toFixed(2)}x</span>
                  </div>

                  <div class="param-row">
                    <label for="pan-x">Pan X:</label>
                    <input
                      id="pan-x"
                      type="range"
                      min="-0.5"
                      max="0.5"
                      step="0.02"
                      bind:value={activeSlot.offsetX}
                      on:input={() => { if (viewMode === 'live') drawLivePreview(); }}
                    />
                    <span>{Math.round((activeSlot.offsetX || 0) * 100)}%</span>
                  </div>

                  <div class="param-row">
                    <label for="pan-y">Pan Y:</label>
                    <input
                      id="pan-y"
                      type="range"
                      min="-0.5"
                      max="0.5"
                      step="0.02"
                      bind:value={activeSlot.offsetY}
                      on:input={() => { if (viewMode === 'live') drawLivePreview(); }}
                    />
                    <span>{Math.round((activeSlot.offsetY || 0) * 100)}%</span>
                  </div>
                </div>
              {/if}
            </div>

          <!-- TAB 2: EDITABLE DECORATIVE OVERLAY LAYERS -->
          {:else if activeTab === 'overlays'}
            <div class="tab-pane">
              <!-- Upload Custom Decorative Overlay -->
              <div class="pane-section">
                <h3 class="pane-heading">Add Decorative Element</h3>
                <p class="pane-desc">
                  Add stickers, ribbons, event badges, transparent logos, or decorative borders around or over photo slots.
                </p>

                <div class="overlay-upload-row">
                  <input
                    type="file"
                    id="custom-overlay-upload-input"
                    accept="image/png,image/svg+xml"
                    on:change={handleCustomOverlayUpload}
                    class="file-input-hidden"
                  />
                  <label for="custom-overlay-upload-input" class="btn btn-primary btn-sm upload-overlay-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload Transparent PNG / SVG
                  </label>
                </div>

                <!-- Quick-Add Built-in Stickers -->
                <div class="stickers-gallery">
                  <span class="gallery-label">Or Pick a Decorative Sticker:</span>
                  <div class="sticker-buttons-grid">
                    {#each BUILTIN_STICKERS as sticker}
                      <button
                        class="sticker-pill-btn"
                        on:click={() => addBuiltinSticker(sticker)}
                        title="Add {sticker.name}"
                      >
                        {sticker.name}
                      </button>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Overlays Stacking List -->
              <div class="pane-section">
                <h3 class="pane-heading">Decorative Layers ({overlays.length})</h3>

                {#if overlays.length === 0}
                  <div class="empty-layers-hint">
                    <span>No decorative overlays added yet. Upload an asset or pick a sticker above.</span>
                  </div>
                {:else}
                  <div class="overlay-cards-list">
                    {#each overlays as ovl, idx (ovl.id)}
                      <div
                        class="overlay-card"
                        class:selected={selectedKind === 'overlay' && ovl.id === selectedOverlayId}
                        class:is-hidden={ovl.hidden}
                        role="button"
                        tabindex="0"
                        on:click={() => { selectedOverlayId = ovl.id; selectedKind = 'overlay'; }}
                        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (selectedOverlayId = ovl.id, selectedKind = 'overlay')}
                      >
                        <div class="ovl-card-header">
                          <div class="ovl-thumb-preview">
                            <img src={ovl.src} alt="{ovl.name} thumbnail" />
                          </div>
                          <input
                            type="text"
                            class="ovl-name-input"
                            bind:value={ovl.name}
                            on:click|stopPropagation
                          />
                        </div>

                        <div class="ovl-card-actions">
                          <!-- Hide / Show -->
                          <button
                            class="icon-btn"
                            class:active-icon={ovl.hidden}
                            on:click|stopPropagation={() => toggleOverlayHide(ovl.id)}
                            title={ovl.hidden ? 'Show layer' : 'Hide layer'}
                          >
                            {ovl.hidden ? '🕶️' : '👁️'}
                          </button>

                          <!-- Lock / Unlock -->
                          <button
                            class="icon-btn"
                            class:active-icon={ovl.locked}
                            on:click|stopPropagation={() => toggleOverlayLock(ovl.id)}
                            title={ovl.locked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {ovl.locked ? '🔒' : '🔓'}
                          </button>

                          <!-- Layer Order -->
                          <button
                            class="icon-btn"
                            on:click|stopPropagation={() => bringToFront(ovl.id)}
                            title="Bring to Front"
                          >
                            ⏫
                          </button>
                          <button
                            class="icon-btn"
                            on:click|stopPropagation={() => sendToBack(ovl.id)}
                            title="Send to Back"
                          >
                            ⏬
                          </button>
                          <button
                            class="icon-btn"
                            disabled={idx === 0}
                            on:click|stopPropagation={() => moveOverlayOrder(idx, -1)}
                            title="Move Up"
                          >
                            ↑
                          </button>
                          <button
                            class="icon-btn"
                            disabled={idx === overlays.length - 1}
                            on:click|stopPropagation={() => moveOverlayOrder(idx, 1)}
                            title="Move Down"
                          >
                            ↓
                          </button>

                          <!-- Duplicate -->
                          <button
                            class="icon-btn"
                            on:click|stopPropagation={() => duplicateOverlay(ovl.id)}
                            title="Duplicate"
                          >
                            📄
                          </button>

                          <!-- Delete -->
                          <button
                            class="icon-btn danger"
                            on:click|stopPropagation={() => deleteOverlay(ovl.id)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Selected Overlay Parameters -->
              {#if activeOverlay && selectedKind === 'overlay'}
                <div class="pane-section selected-overlay-params">
                  <h3 class="pane-heading">Edit Selected: {activeOverlay.name}</h3>

                  <div class="param-row">
                    <label for="ovl-opacity">Opacity:</label>
                    <input
                      id="ovl-opacity"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      bind:value={activeOverlay.opacity}
                      on:input={() => { if (viewMode === 'live') drawLivePreview(); }}
                    />
                    <span>{Math.round((activeOverlay.opacity ?? 1.0) * 100)}%</span>
                  </div>

                  <div class="param-row">
                    <label for="ovl-rotation">Rotation:</label>
                    <input
                      id="ovl-rotation"
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      bind:value={activeOverlay.rotation}
                      on:input={() => { if (viewMode === 'live') drawLivePreview(); }}
                    />
                    <span>{activeOverlay.rotation || 0}°</span>
                  </div>

                  <div class="param-row">
                    <label for="ovl-width">Scale / Width:</label>
                    <input
                      id="ovl-width"
                      type="range"
                      min="0.08"
                      max="1.0"
                      step="0.02"
                      bind:value={activeOverlay.width}
                      on:input={() => {
                        if (activeOverlay.aspectRatioLocked && activeOverlay.aspectRatio) {
                          activeOverlay.height = activeOverlay.width / activeOverlay.aspectRatio;
                        }
                        if (viewMode === 'live') drawLivePreview();
                      }}
                    />
                    <span>{Math.round((activeOverlay.width || 0.3) * 100)}%</span>
                  </div>

                  <div class="param-row">
                    <label for="ovl-lock-aspect">Lock Aspect Ratio:</label>
                    <input
                      id="ovl-lock-aspect"
                      type="checkbox"
                      bind:checked={activeOverlay.aspectRatioLocked}
                    />
                    <span>{activeOverlay.aspectRatioLocked ? 'Locked' : 'Free'}</span>
                  </div>
                </div>
              {/if}
            </div>

          <!-- TAB 3: CUSTOM ARTWORK FRAME -->
          {:else if activeTab === 'artwork'}
            <div class="tab-pane">
              <div class="pane-section">
                <h3 class="pane-heading">Import Complete Frame Artwork</h3>
                <p class="pane-desc">
                  Upload an SVG or transparent PNG created in Figma, Photoshop, or Illustrator.
                  Target dimensions: <strong>600 × 1800 px (1:3 ratio)</strong>.
                </p>

                <div class="upload-dropzone">
                  <input
                    type="file"
                    id="artwork-file-input"
                    accept="image/png,image/svg+xml"
                    on:change={handleArtworkUpload}
                    class="file-input-hidden"
                  />
                  <label for="artwork-file-input" class="upload-label">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Click to Upload Complete Frame (PNG/SVG)</span>
                    <small>Transparent cutouts recommend for photo slots</small>
                  </label>
                </div>

                {#if artworkWarning}
                  <div class="alert alert-warning" role="alert">
                    <span>⚠️ {artworkWarning}</span>
                  </div>
                {/if}

                {#if artworkInfo}
                  <div class="alert alert-info" role="status">
                    <span>ℹ️ {artworkInfo}</span>
                  </div>
                {/if}

                {#if artworkDataUrl}
                  <div class="artwork-preview-card">
                    <div class="card-thumb-checkerboard">
                      <img src={artworkDataUrl} alt="Loaded frame artwork preview" />
                    </div>
                    <div class="card-details">
                      <span class="file-status">✓ Custom Artwork Loaded</span>
                      <button class="btn btn-danger btn-sm" on:click={removeArtwork}>Remove</button>
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Layer & Background Options -->
              <div class="pane-section">
                <h3 class="pane-heading">Layering &amp; Background</h3>

                <div class="param-row">
                  <label for="artwork-layer-mode">Artwork Layer:</label>
                  <select id="artwork-layer-mode" class="select-input" bind:value={artworkLayer}>
                    <option value="overlay">Overlay (Drawn on top of photos with cutouts)</option>
                    <option value="underlay">Underlay (Drawn behind photos)</option>
                  </select>
                </div>

                <div class="param-row">
                  <label for="bg-color-picker">Base Background Color:</label>
                  <input
                    id="bg-color-picker"
                    type="color"
                    bind:value={backgroundColor}
                    class="color-picker-input"
                  />
                  <span>{backgroundColor}</span>
                </div>
              </div>
            </div>

          <!-- TAB 4: PHOTO ASSIGNMENT -->
          {:else if activeTab === 'assignment'}
            <div class="tab-pane">
              <div class="pane-section">
                <h3 class="pane-heading">Map Photos to Slots</h3>
                <p class="pane-desc">
                  Assign captured countdown photos to individual slots in any order.
                </p>

                {#if capturedPhotos.length === 0}
                  <div class="alert alert-info">
                    <span>No session photos captured yet. A placeholder preview is displayed.</span>
                  </div>
                {/if}

                <div class="assignment-list">
                  {#each slots as slot, i (slot.id)}
                    <div class="assignment-row">
                      <div class="slot-info">
                        <span class="slot-num-badge">#{i + 1}</span>
                        <strong>{slot.name}</strong>
                      </div>

                      <div class="photo-select-wrapper">
                        <select
                          class="select-input assignment-select"
                          bind:value={slot.assignedPhotoIndex}
                          on:change={() => { if (viewMode === 'live') drawLivePreview(); }}
                        >
                          <option value={null}>— No photo (Empty) —</option>
                          {#each capturedPhotos as photoUrl, pIdx}
                            <option value={pIdx}>
                              Countdown Photo #{pIdx + 1}
                            </option>
                          {/each}
                          {#if capturedPhotos.length === 0}
                            <option value={0}>Sample Photo #1</option>
                            <option value={1}>Sample Photo #2</option>
                            <option value={2}>Sample Photo #3</option>
                            <option value={3}>Sample Photo #4</option>
                          {/if}
                        </select>

                        <!-- Thumbnail Preview -->
                        {#if slot.assignedPhotoIndex !== null && capturedPhotos[slot.assignedPhotoIndex]}
                          <div class="assign-thumb">
                            <img src={capturedPhotos[slot.assignedPhotoIndex]} alt="Assigned preview" />
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

          <!-- TAB 5: DOWNLOADABLE GUIDES -->
          {:else if activeTab === 'guides'}
            <div class="tab-pane">
              <div class="pane-section">
                <h3 class="pane-heading">Design Templates &amp; Guides</h3>
                <p class="pane-desc">
                  Download physical-scale templates to design custom photo-strip frames in your favorite design tool:
                </p>

                <div class="guides-cards">
                  <div class="guide-download-card">
                    <div class="guide-card-icon">📏</div>
                    <div class="guide-card-info">
                      <h4>2 × 6″ Individual Strip (SVG)</h4>
                      <p>600 × 1800 px @ 300 DPI. Includes safe margins and 4 suggested photo slots on a separate guide layer.</p>
                      <a
                        href="/templates/strip-template-2x6.svg"
                        download="distudio-strip-template-2x6.svg"
                        class="btn btn-secondary btn-sm"
                      >
                        Download SVG Strip Guide
                      </a>
                    </div>
                  </div>

                  <div class="guide-download-card">
                    <div class="guide-card-icon">🖨️</div>
                    <div class="guide-card-info">
                      <h4>4 × 6″ 4R Print Sheet (SVG)</h4>
                      <p>1200 × 1800 px @ 300 DPI. Guide for two 2 × 6″ strips side-by-side with center cutting line.</p>
                      <a
                        href="/templates/sheet-template-4r.svg"
                        download="distudio-sheet-4r-guide.svg"
                        class="btn btn-secondary btn-sm"
                      >
                        Download SVG 4R Guide
                      </a>
                    </div>
                  </div>
                </div>

                <div class="workflow-steps-card">
                  <h4>Workflow for Custom Overlays &amp; Frames:</h4>
                  <ol>
                    <li>Download the <strong>2 × 6″ Strip SVG Guide</strong> above.</li>
                    <li>Open in Figma, Photoshop, or Illustrator.</li>
                    <li>Design your custom banners, graphics, stamps, or full frames.</li>
                    <li>Export individual elements or whole frames as transparent PNG/SVG.</li>
                    <li>In this editor, add slots and overlay layers with full drag, resize, and rotation control!</li>
                  </ol>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </aside>
    </div>
  </div>
</div>

<style>
  .custom-builder-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3);
  }

  .custom-builder-container {
    background: var(--color-bg);
    width: 100%;
    max-width: 1200px;
    height: 92vh;
    border-radius: var(--radius-xl);
    border: 1.5px solid var(--color-border);
    box-shadow: var(--shadow-2xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Header */
  .builder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-5);
    background: var(--color-surface);
    border-bottom: 1.5px solid var(--color-border);
    gap: var(--space-4);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  .title-group {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .template-title-input {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-ink);
    background: transparent;
    border: 1px dashed transparent;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
  }

  .template-title-input:hover,
  .template-title-input:focus {
    border-color: var(--color-accent);
    background: var(--color-bg);
  }

  .dim-badge {
    font-size: var(--text-xs);
    color: var(--color-ink-light);
    background: var(--color-bg);
    padding: 3px 8px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .save-toast {
    font-size: var(--text-xs);
    color: #047857;
    font-weight: 600;
  }

  /* Content Layout */
  .builder-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  @media (max-width: 840px) {
    .builder-content {
      flex-direction: column;
    }
  }

  /* Left Canvas Workspace */
  .canvas-workspace {
    flex: 1.2;
    background: #e2e8f0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .workspace-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    background: rgba(255, 255, 255, 0.9);
    border-bottom: 1px solid var(--color-border);
    z-index: 5;
  }

  .view-mode-toggle {
    display: flex;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .toggle-btn {
    padding: 6px 14px;
    font-size: var(--text-xs);
    font-weight: 600;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--color-ink-light);
  }

  .toggle-btn.active {
    background: var(--color-accent);
    color: white;
  }

  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .zoom-btn {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-weight: 700;
  }

  .zoom-label {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    min-width: 40px;
    text-align: center;
  }

  .strip-board-scroller {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-6);
  }

  .strip-board {
    position: relative;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
    border-radius: var(--radius-md);
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }

  .artwork-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    pointer-events: none;
  }

  .artwork-layer.overlay-mode {
    z-index: 2;
  }

  .slot-svg-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
  }

  .draggable-slot {
    cursor: move;
  }

  .draggable-overlay {
    cursor: move;
  }

  .draggable-overlay.locked {
    cursor: not-allowed;
  }

  .vertex-handle {
    cursor: crosshair;
  }

  .resize-handle {
    cursor: nwse-resize;
  }

  .rotate-handle {
    cursor: grab;
  }

  .live-composite-canvas {
    display: block;
    object-fit: contain;
  }

  .workspace-footer {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 11px;
    color: var(--color-ink-light);
    text-align: center;
    border-top: 1px solid var(--color-border);
  }

  /* Right Inspector */
  .builder-inspector {
    flex: 1;
    background: var(--color-surface);
    border-left: 1.5px solid var(--color-border);
    display: flex;
    flex-direction: column;
    min-width: 320px;
  }

  .inspector-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .tab-btn {
    flex: 1;
    padding: var(--space-3) 4px;
    font-size: 11px;
    font-weight: 700;
    color: var(--color-ink-light);
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    text-align: center;
  }

  .tab-btn.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
    background: var(--color-surface);
  }

  .inspector-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-5);
  }

  .tab-pane {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  .pane-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .pane-heading {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-ink);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .pane-desc {
    font-size: var(--text-xs);
    color: var(--color-ink-light);
    margin: 0;
    line-height: 1.4;
  }

  .slot-add-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }

  .slot-cards-list,
  .overlay-cards-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-height: 220px;
    overflow-y: auto;
  }

  .slot-card,
  .overlay-card {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background: var(--color-bg);
    border: 1.5px solid var(--color-border);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .slot-card.selected {
    border-color: var(--color-accent);
    background: #EFF6FF;
  }

  .overlay-card.selected {
    border-color: #EC4899;
    background: #FDF2F8;
  }

  .overlay-card.is-hidden {
    opacity: 0.6;
    background: #F3F4F6;
  }

  .slot-card-header,
  .ovl-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .slot-num-badge {
    font-size: 11px;
    font-weight: 700;
    background: var(--color-accent);
    color: white;
    padding: 1px 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
  }

  .slot-inline-input,
  .ovl-name-input {
    flex: 1;
    font-size: var(--text-xs);
    font-weight: 600;
    border: none;
    background: transparent;
    color: var(--color-ink);
  }

  .ovl-thumb-preview {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background: #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
  }

  .ovl-thumb-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .slot-type-tag {
    font-size: 10px;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .slot-card-meta,
  .ovl-card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
    font-size: 11px;
    color: var(--color-ink-light);
  }

  .ovl-card-actions {
    gap: 4px;
    justify-content: flex-end;
  }

  .slot-card-buttons {
    display: flex;
    gap: 4px;
  }

  .icon-btn {
    border: 1px solid var(--color-border);
    background: white;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    cursor: pointer;
  }

  .icon-btn.active-icon {
    background: #FEE2E2;
    border-color: #F87171;
  }

  .icon-btn.danger {
    color: #DC2626;
  }

  .param-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    font-size: var(--text-xs);
    color: var(--color-ink);
  }

  .param-row label {
    font-weight: 600;
    flex: 1;
  }

  .select-input {
    padding: 6px 10px;
    font-size: var(--text-xs);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: white;
  }

  .color-picker-input {
    width: 36px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Overlay Upload & Gallery */
  .overlay-upload-row {
    display: flex;
  }

  .upload-overlay-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    width: 100%;
    justify-content: center;
    padding: var(--space-3);
  }

  .stickers-gallery {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .gallery-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-ink-light);
    text-transform: uppercase;
  }

  .sticker-buttons-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }

  .sticker-pill-btn {
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: white;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sticker-pill-btn:hover {
    border-color: #EC4899;
    color: #DB2777;
    background: #FDF2F8;
  }

  .empty-layers-hint {
    padding: var(--space-4);
    background: var(--color-bg);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-md);
    text-align: center;
    font-size: var(--text-xs);
    color: var(--color-muted);
  }

  /* Artwork Upload */
  .upload-dropzone {
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    text-align: center;
    background: var(--color-bg);
  }

  .file-input-hidden {
    display: none;
  }

  .upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-accent);
  }

  .upload-label small {
    color: var(--color-muted);
    font-weight: 400;
  }

  .artwork-preview-card {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .card-thumb-checkerboard {
    width: 48px;
    height: 90px;
    background-image: linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    overflow: hidden;
  }

  .card-thumb-checkerboard img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .card-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .file-status {
    font-size: 11px;
    font-weight: 700;
    color: #047857;
  }

  /* Photo Assignment List */
  .assignment-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .assignment-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    gap: var(--space-3);
  }

  .slot-info {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
  }

  .photo-select-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .assignment-select {
    min-width: 160px;
  }

  .assign-thumb {
    width: 32px;
    height: 42px;
    border-radius: 3px;
    overflow: hidden;
    border: 1px solid var(--color-border);
  }

  .assign-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Guides Card */
  .guides-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .guide-download-card {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg);
    border-radius: var(--radius-md);
    border: 1.5px solid var(--color-border);
  }

  .guide-card-icon {
    font-size: 24px;
  }

  .guide-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .guide-card-info h4 {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-ink);
  }

  .guide-card-info p {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-ink-light);
    line-height: 1.4;
  }

  .workflow-steps-card {
    background: #FFFBEB;
    border: 1px solid #FCD34D;
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .workflow-steps-card h4 {
    margin: 0 0 var(--space-2) 0;
    font-size: var(--text-xs);
    text-transform: uppercase;
    color: #92400E;
  }

  .workflow-steps-card ol {
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--text-xs);
    color: #78350F;
    line-height: 1.6;
  }

  .alert {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: 11px;
    line-height: 1.4;
  }

  .alert-warning {
    background: #FFFBEB;
    color: #B45309;
    border: 1px solid #FDE68A;
  }

  .alert-info {
    background: #EFF6FF;
    color: #1D4ED8;
    border: 1px solid #BFDBFE;
  }
</style>
