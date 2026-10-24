# Implementation Plan — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## Milestone 0 — Environment & Project Setup

**Goal:** SvelteKit project running locally with dev server.

- [x] Inspect Node.js / npm versions.
- [ ] Initialize SvelteKit project with `create-svelte`.
- [ ] Install Lucide Svelte.
- [ ] Confirm `npm run dev` starts successfully.
- [ ] Set up `app.css` with design tokens.
- [ ] Load Google Fonts in `app.html`.

**Completion criterion:** `http://localhost:5173` loads the SvelteKit default page.

---

## Milestone 1 — Design Tokens and Base Styles

**Goal:** All CSS variables, typography, and base component styles ready.

- [ ] Define all color tokens in `app.css`.
- [ ] Define spacing, radius, shadow tokens.
- [ ] Add button base styles.
- [ ] Add layout utility classes.

**Completion criterion:** A test page shows correct fonts, colors, and button styles.

---

## Milestone 2 — SVG Illustrations

**Goal:** Key illustrations created as Svelte components.

- [ ] `CameraIllus.svelte` — for start screen.
- [ ] `PermissionIllus.svelte` — for camera denied.
- [ ] `PrinterIllus.svelte` — for print screen.
- [ ] `StripIllus.svelte` — decorative.

**Completion criterion:** Each illustration renders without errors.

---

## Milestone 3 — Session Store

**Goal:** Application state store wired up with all actions.

- [ ] Create `stores/session.js` with initial state.
- [ ] Export `startSession`, `addPhoto`, `retakePhoto`, `resetSession`, `setTemplate`, `setCaption`.
- [ ] Write `+page.svelte` screen-routing logic.

**Completion criterion:** Store transitions work in browser console.

---

## Milestone 4 — Start Screen

**Goal:** First visible screen complete and polished.

- [ ] `StartScreen.svelte` with illustration, heading, start button.
- [ ] Matches design system palette and typography.
- [ ] "Start Photobooth" button transitions to camera screen.

**Completion criterion:** Start screen renders correctly on 375px and 1280px viewports.

---

## Milestone 5 — Camera and Live Preview

**Goal:** Camera initializes and live preview shows.

- [ ] `camera.js` utility: `startCamera()`, `stopCamera()`, `switchCamera()`.
- [ ] `CameraPreview.svelte` with video element.
- [ ] Camera permission error states wired.
- [ ] Camera switch button (if supported).
- [ ] Capture controls UI (start session button).

**Completion criterion:** Live camera preview visible on Chrome and Safari.

---

## Milestone 6 — Capture Session

**Goal:** Full countdown + multi-shot capture working.

- [ ] `capture.js`: `captureFrame(videoEl)` returns dataURL.
- [ ] `CountdownOverlay.svelte` with number animation.
- [ ] Capture loop in `CameraScreen.svelte`.
- [ ] Flash effect on capture.
- [ ] Thumbnail row showing captured photos.
- [ ] Session auto-completes and transitions to review.

**Completion criterion:** Taking 4 photos captures 4 real frames and moves to review.

---

## Milestone 7 — Photo Review

**Goal:** Review grid with retake functionality.

- [ ] `PhotoReviewGrid.svelte` showing all photos.
- [ ] Individual retake triggers single-shot re-capture.
- [ ] Retake All clears and restarts.
- [ ] Continue button proceeds to editor.

**Completion criterion:** Retaking photo 2 of 4 replaces only slot 2.

---

## Milestone 8 — Strip Editor and Templates

**Goal:** Canvas-rendered strip preview with template selection.

- [ ] `canvas.js`: `renderStrip(photos, template, options, canvas)`.
- [ ] `PhotoStripPreview.svelte` using canvas.
- [ ] `TemplatePicker.svelte` with 4 presets.
- [ ] Caption input re-renders strip.
- [ ] Date toggle re-renders strip.

**Completion criterion:** Switching templates visibly changes the strip preview.

---

## Milestone 9 — Export and Print

**Goal:** Download and print working end-to-end.

- [x] `export.js`: `downloadPNG(canvas)` triggers file download.
- [x] `export.js`: `printStrip()` calls `window.print()`.
- [x] `PrintScreen.svelte` with print preview and instructions.
- [x] Print CSS: `@page { size: 4in 6in; }`, hides app UI.
- [x] Hidden `#print-layout` div with high-res canvas.

**Completion criterion:** PNG downloads as a valid image; print dialog opens with correct paper size hint.

---

## Milestone 10 — Polish, Responsive Layout, Accessibility

**Goal:** App is fully polished and responsive.

- [x] All screen transitions animated.
- [x] All error states illustrated.
- [x] Keyboard navigation and focus styles.
- [x] ARIA labels on interactive elements.
- [x] Tested at 375px, 768px, 1280px.
- [x] Mobile camera orientation handled.

**Completion criterion:** Full flow works on iPhone SE viewport and 1280px desktop.

---

## Milestone 11 — Build Verification

**Goal:** Production build succeeds.

- [x] `npm run build` completes without errors.
- [x] `npm run preview` serves the built app.

**Completion criterion:** Build output exists in `build/` directory.

---

## Milestone 12 — Custom Photo-Strip Template Builder (Revision Add-On)

**Goal:** Operators can design, import, visually map, and print custom photo strips.

- [x] Downloadable design guides created (`strip-template-2x6.svg` & `sheet-template-4r.svg`).
- [x] Artwork import with PNG / SVG validation, resolution warning, and transparent overlay support.
- [x] Interactive visual slot mapping editor (`CustomTemplateBuilder.svelte`) with rectangular, polygon, and circular geometry.
- [x] Pointer drag-to-move, corner-resize, and polygon-vertex manipulation.
- [x] Manual photo assignment per slot with session countdown thumbnails.
- [x] Independent crop zoom (scale) and pan offset adjustments per slot.
- [x] Unified rendering engine in `canvas.js` with polygon shape-clipping and 4R automated duplication.
- [x] Local template persistence in IndexedDB / localStorage (`customTemplateStorage.js`) with sample seeding.
- [x] Template package export and import (`.json`).
- [x] Template Library manager modal (`TemplateLibraryModal.svelte`).
- [x] Integration with `EditorScreen.svelte` and `PrintScreen.svelte`.
- [x] Documentation updated (`PRD.md`, `DESIGN_SYSTEM.md`, `PRINT_SPECIFICATION.md`, `ARCHITECTURE.md`, `TEST_PLAN.md`, `OPERATOR_GUIDE.md`).

**Completion criterion:** Operator can upload custom artwork, create irregular polygon slots, map photos, save to library, and print on 4R paper with two strips side-by-side.

