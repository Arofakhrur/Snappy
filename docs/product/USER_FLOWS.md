# User Flows — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## Flow 1 — Camera Initialization

### Normal Flow
1. User taps **Start Photobooth** on the start screen.
2. App calls `navigator.mediaDevices.getUserMedia({ video: true })`.
3. Browser displays the permission prompt.
4. User grants permission.
5. App receives a `MediaStream`.
6. Video element is assigned the stream as `srcObject`.
7. App transitions to the Live Camera screen.
8. Camera loading indicator disappears; live preview is visible.

### Failure: Permission Denied
1. User taps **Start Photobooth**.
2. Permission prompt appears.
3. User denies permission (or it was previously denied).
4. `getUserMedia` rejects with `NotAllowedError`.
5. App shows the **Camera Permission Error** screen with:
   - Illustrated empty state.
   - Clear explanation.
   - Instructions to re-enable permissions in browser settings.
   - A **Try Again** button that re-attempts initialization.

### Failure: No Camera Found
1. `getUserMedia` rejects with `NotFoundError`.
2. App shows **No Camera** error screen with:
   - Friendly illustration.
   - Suggestion to check camera connection.

### Failure: Camera In Use
1. `getUserMedia` rejects with `NotReadableError` or `AbortError`.
2. App shows **Camera Busy** error screen with guidance to close other apps.

---

## Flow 2 — Capture Session

### Normal Flow
1. Live preview visible; user taps **Start Session**.
2. App begins the capture loop for N photos (default 4).
3. For each photo slot:
   a. Countdown overlay shows: 3 → 2 → 1.
   b. On "0": flash effect fires; frame captured from video element to canvas.
   c. Captured image converted to data URL and stored.
   d. Thumbnail appears in the capture progress row.
   e. If more photos remain: brief pause (0.5s) then next countdown.
4. After all photos: camera tracks stopped; app transitions to Photo Review.

### Edge Cases
- **User leaves page:** `beforeunload` listener stops camera tracks.
- **Camera disconnects:** `MediaStreamTrack.onended` triggers error state.
- **Session already running:** capture button disabled during countdown.

---

## Flow 3 — Countdown and Multi-Shot Capture

```
[START SESSION]
      │
      ▼
 Photo 1 countdown: 3 → 2 → 1 → SNAP
      │
 (thumbnail shown for slot 1)
      │
      ▼
 Photo 2 countdown: 3 → 2 → 1 → SNAP
      │  ...repeated for N photos...
      │
      ▼
 Final snap → all slots filled
      │
      ▼
 Camera stops → transition to REVIEW
```

- Countdown is synchronized with `setInterval`, not `setTimeout` chaining, to avoid drift.
- Capture is locked (disabled) during any active countdown.

---

## Flow 4 — Photo Review and Retake

### Normal Review Flow
1. Review screen shows N photo thumbnails in a grid.
2. Each thumbnail has a **Retake** button.
3. A **Retake All** button appears at the bottom.
4. A **Continue** button is available when the user is satisfied.

### Retake Individual Photo (FR-016, FR-018)
1. User taps **Retake** on photo N.
2. Camera re-initializes for one shot.
3. Countdown fires for that single shot.
4. Captured image replaces slot N in state.
5. All other slots unchanged.
6. Camera stops; user returns to review.

### Retake All
1. User taps **Retake All**.
2. All photo slots are cleared.
3. Camera initializes; full capture session restarts from photo 1.

### Continue
1. User taps **Continue**.
2. App transitions to Photo-Strip Editor.
3. Photos passed to composition engine.

---

## Flow 5 — Photo-Strip Composition and Design Selection

1. App renders the strip preview using the Canvas API.
2. Default template applied automatically.
3. User sees:
   - Large strip preview centered on screen.
   - Template picker row below (3+ presets).
   - Caption text input.
   - Date toggle.
4. Tapping a template: canvas re-renders with new design.
5. Typing a caption: canvas re-renders with updated text.
6. User taps **Continue to Print**.

---

## Flow 6 — Print Preview and Export

1. App transitions to Print & Export screen.
2. Print preview shows two strips side by side (as they will appear on 4R paper).
3. Printer setup guidance displayed.
4. **Download PNG**: triggers PNG blob download via `<a download>`.
5. **Print**: calls `window.print()`; print CSS applies correct page size.
6. After action: **New Session** button appears.

---

## Flow 7 — Reset and New Session

1. User taps **New Session** (available on Print screen or after any error).
2. All captured photo data URLs cleared from memory.
3. Any running camera tracks stopped.
4. App returns to Start screen.
5. No photos retained in any form.

---

## State Machine Summary

```
START
  └─[tap Start]──────────► CAMERA_INIT
                                │
                    ┌───────────┴──────────┐
                 [granted]            [denied/error]
                    │                     │
                    ▼                     ▼
              LIVE_PREVIEW          CAMERA_ERROR
                    │
             [tap Start Session]
                    │
                    ▼
             CAPTURE_SESSION (loop N times)
                    │
             [all shots done]
                    │
                    ▼
             PHOTO_REVIEW
                    │
         ┌──────────┴──────────┐
      [retake]            [continue]
         │                     │
         ▼                     ▼
    RETAKE_SHOT         STRIP_EDITOR
                              │
                        [continue]
                              │
                              ▼
                        PRINT_EXPORT
                              │
                        [new session]
                              │
                              ▼
                           START
```
