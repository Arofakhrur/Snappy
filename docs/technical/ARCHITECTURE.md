# Architecture — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## 1. Framework and Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| SvelteKit | latest | Application framework + routing |
| Vite | (bundled with SvelteKit) | Dev server and bundler |
| Lucide Svelte | latest | Icon library |

No backend. No external image services. No database.

---

## 2. Application Architecture

```
src/
├── app.html                   # Root HTML shell
├── app.css                    # Global design tokens + base styles
├── routes/
│   └── +page.svelte           # Single-page app root
├── lib/
│   ├── components/            # UI components
│   │   ├── screens/           # Full-screen views
│   │   │   ├── StartScreen.svelte
│   │   │   ├── CameraScreen.svelte
│   │   │   ├── ReviewScreen.svelte
│   │   │   ├── EditorScreen.svelte
│   │   │   └── PrintScreen.svelte
│   │   ├── CameraPreview.svelte
│   │   ├── CountdownOverlay.svelte
│   │   ├── CaptureControls.svelte
│   │   ├── PhotoReviewGrid.svelte
│   │   ├── PhotoStripPreview.svelte
│   │   ├── TemplatePicker.svelte
│   │   ├── PrintPreview.svelte
│   │   ├── PrimaryButton.svelte
│   │   ├── StatusMessage.svelte
│   │   └── illustrations/
│   │       ├── CameraIllus.svelte
│   │       ├── PermissionIllus.svelte
│   │       ├── PrinterIllus.svelte
│   │       └── StripIllus.svelte
│   ├── stores/
│   │   └── session.js         # Application state store
│   └── utils/
│       ├── camera.js          # Camera lifecycle management
│       ├── capture.js         # Frame capture logic
│       ├── canvas.js          # Strip composition engine
│       └── export.js          # PNG download + print trigger
```

---

## 3. State Management

Uses Svelte's built-in `writable` stores. No Pinia, Redux, or Zustand.

### Session Store (`stores/session.js`)

```js
{
  screen: 'start',            // 'start'|'camera'|'review'|'editor'|'print'
  photos: [],                 // Array of dataURL strings, length 0-4
  retakeIndex: null,          // Index of photo being retaken, or null
  selectedTemplate: 'classic',
  caption: '',
  showDate: true,
  cameraError: null,          // Error string or null
  isCapturing: false,         // Countdown active
  photoCount: 4,              // 3 or 4 photos per session
}
```

State transitions are performed through exported action functions to keep logic out of components.

---

## 4. Camera Lifecycle

```
getUserMedia() called
      │
      ▼
MediaStream stored in module-level variable
      │
      ▼
<video> element srcObject = stream
      │
      ▼
Session running: stream active
      │
      ▼
Capture frame: drawImage(video, canvas)
      │
      ▼
Session end / screen exit:
  stream.getTracks().forEach(t => t.stop())
  video.srcObject = null
```

**Key rules:**
- Camera is started only on user intent (FR-001).
- Camera is stopped as soon as the session is complete (FR-008).
- `beforeunload` event stops tracks as a safety net.
- Track `ended` event triggers error recovery.

---

## 5. Image Processing Pipeline

```
Live Video Frame
      │
      ▼
  [capture.js]
  Offscreen canvas (video dimensions)
  ctx.drawImage(videoEl, 0, 0)
  canvas.toDataURL('image/png')
      │
      ▼
  DataURL stored in session.photos[]
      │
      ▼
  [canvas.js — preview]
  Preview canvas at CSS pixel size
  renderStrip(photos, template, options)
      │
      ▼
  [canvas.js — export]
  Export canvas at 1200 × 1800 px
  renderStrip(photos, template, options, scale)
  canvas.toBlob('image/png')
```

### renderStrip() Responsibilities
1. Fill background with template color.
2. For each photo slot: crop-scale-center the source image onto the slot rectangle.
3. Draw frame borders.
4. Draw caption text.
5. Draw date text if enabled.
6. For export: duplicate strip to right half.

---

## 6. Canvas Rendering

Preview canvas dimensions: **300 × 900 px** (1:3 ratio, matches strip shape).  
Export canvas dimensions: **1200 × 1800 px** (4R, both strips).

`imageSmoothingQuality` is set to `'high'` on all canvas contexts.

### Crop-Scale-Center Algorithm

```js
function drawCroppedImage(ctx, img, dx, dy, dw, dh) {
  const srcAspect = img.width / img.height;
  const dstAspect = dw / dh;
  let sx, sy, sw, sh;

  if (srcAspect > dstAspect) {
    // Source is wider — crop sides
    sh = img.height;
    sw = sh * dstAspect;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Source is taller — crop top/bottom
    sw = img.width;
    sh = sw / dstAspect;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}
```

---

## 7. Print Rendering

A dedicated `#print-layout` `<div>` contains the export canvas or a full-resolution `<img>` tag.

Print CSS hides all other content and sets `@page { size: 4in 6in; margin: 0; }`.

`window.print()` is called by the app; the browser print dialog handles driver interaction.

---

## 8. Privacy and Local Data

- Photo DataURLs are stored only in Svelte reactive store variables (JavaScript heap memory).
- No `localStorage`, `IndexedDB`, or `sessionStorage` writes.
- Data is cleared on `session.reset()` and on page unload.
- The app makes no network requests after initial load (no analytics, no CDN image upload).
- Fonts are loaded from Google Fonts CDN on first load (standard web behavior).

---

## 9. Error Handling

| Error | Source | Recovery |
|-------|--------|----------|
| `NotAllowedError` | getUserMedia | Show permission error screen |
| `NotFoundError` | getUserMedia | Show no-camera screen |
| `NotReadableError` | getUserMedia | Show camera-busy screen |
| Track ended mid-session | MediaStreamTrack | Stop session, show error |
| Canvas render failure | canvas.js | Catch and set error state |
| Download failure | export.js | Show error message |

---

## 10. Technical Limitations

- Camera access requires HTTPS or localhost (browser security requirement).
- Safari on iOS may require user interaction to start video playback.
- Some Android browsers do not support `facingMode: 'user'` camera switch reliably.
- Physical print output not verifiable without hardware.
- No PWA manifest or service worker in MVP (offline support is a future enhancement).

---

## 11. Key Decisions

| Decision | Rationale |
|----------|-----------|
| SvelteKit over plain Svelte | File-based routing, SSR for initial load performance |
| Svelte stores over Zustand/Pinia | Built-in, no extra dependency |
| Canvas API over CSS grid for strip | Exact pixel control needed for print output |
| PNG over JPEG for export | Lossless; no quality degradation from canvas.toDataURL |
| Browser print dialog over custom PDF | No backend required; sufficient for MVP |
| DataURLs over Blob URLs | Simplicity; blobs require explicit revocation management |

---

## 12. Custom Template Architecture & Rendering Pipeline

### Custom Template Schema

```typescript
interface CustomSlot {
  id: string;
  name: string;
  type: 'rect' | 'polygon' | 'circle';
  x: number;               // Normalized [0..1]
  y: number;               // Normalized [0..1]
  width: number;           // Normalized [0..1]
  height: number;          // Normalized [0..1]
  borderRadius?: number;   // Corner radius in px
  points?: Array<{ x: number; y: number }>; // Normalized points for polygon clipping
  assignedPhotoIndex: number | null;        // Mapped index into session.photos[]
  scale: number;           // Zoom factor (default 1.0)
  offsetX: number;         // Pan X (-0.5 .. 0.5)
  offsetY: number;         // Pan Y (-0.5 .. 0.5)
}

interface CustomTemplate {
  id: string;
  name: string;
  isCustom: true;
  backgroundColor: string;
  artworkLayer: 'overlay' | 'underlay';
  artworkDataUrl?: string; // PNG or SVG data URL
  width: 600;
  height: 1800;
  slots: CustomSlot[];
  createdAt: number;
  updatedAt: number;
}
```

### Persistence Engine (`customTemplateStorage.js`)

- **Primary Storage:** IndexedDB (`distudio_photobooth_db`, store `custom_templates`).
- **Graceful Fallback:** `localStorage` (`distudio_custom_templates_backup`) if IndexedDB is blocked or unavailable.
- **Portability:** Export and import standalone `.json` template packages containing slot definitions and base64 artwork.
- **Pre-seeded Samples:** "Slanted Editorial" (irregular polygon slots) and "Asymmetric Collage" (multi-aspect ratio slots) are auto-seeded on initial launch.

### Unified Rendering & Clipping Pipeline (`canvas.js`)

```
CustomTemplate Object + Captured Photos[]
            │
            ▼
    Fill Background Color
            │
            ▼
[Underlay Artwork? Yes -> drawImage(artwork)]
            │
            ▼
For each CustomSlot:
  1. Calculate destination (stripX + slot.x * stripW, etc.)
  2. ctx.save()
  3. Set clipping path:
     - rect -> roundRect(sx, sy, sw, sh, r) -> clip()
     - polygon -> beginPath() -> lineTo(points) -> closePath() -> clip()
     - circle -> beginPath() -> ellipse() -> clip()
  4. Lookup assignedPhotoIndex -> get loaded HTMLImageElement
  5. drawCroppedImageWithTransform(ctx, img, dx, dy, dw, dh, scale, offsetX, offsetY)
  6. ctx.restore()
            │
            ▼
[Overlay Artwork? Yes -> drawImage(artwork onto canvas)]
            │
            ▼
Duplicate on 4R Export Canvas (Left: X=6, Right: X=606, Cut: X=600)
```

