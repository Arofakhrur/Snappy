# Product Requirements Document — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25  
**Status:** Approved for MVP implementation

---

## 1. Product Overview and Problem Statement

DISTUDIO Photobooth is a mobile-first web application that lets users take a sequence of photos using their device camera, compose the photos into a styled photo strip, and print or download the result on standard 4R photo paper.

**Problem:** Dedicated photobooth kiosks require expensive hardware and setup. Digital photobooth apps often require native installation, account creation, or cloud connectivity. There is no lightweight, browser-based photobooth experience that produces a physically printable photo strip without leaving a local network.

**Solution:** A self-contained progressive web application that runs entirely in the browser, uses the device camera, composes photos client-side, and outputs a print-ready or downloadable image — with zero backend requirements.

---

## 2. Target Users and Primary Usage Scenarios

### Target Users
- Event attendees at parties, weddings, and celebrations.
- Small businesses running pop-up photobooth stations.
- Individuals who want a fun, tactile photo-strip keepsake.
- Creative professionals demoing interactive print installations.

### Primary Usage Scenarios
1. **Event kiosk:** Tablet or laptop on a stand with a rear camera. Guests walk up, take photos, and print strips.
2. **Personal use:** User opens the app on their phone, takes selfies, downloads the strip.
3. **Creative studio:** Designer tests custom strip templates before printing.

---

## 3. Product Goals

- **G-001** — Deliver a complete capture-to-print workflow with no backend.
- **G-002** — Run on modern mobile and desktop browsers (Chrome, Safari, Firefox, Edge).
- **G-003** — Produce print-ready output targeting 4R (4 × 6 inch) photo paper.
- **G-004** — Provide a visually distinctive, delightful interface.
- **G-005** — Respect user privacy: no uploads, no persistent storage.

---

## 4. MVP Scope

The MVP includes:
- Camera initialization and permission handling.
- Countdown-based capture of 3 or 4 photos per session.
- Photo review with individual retake capability.
- Photo-strip composition using the Canvas API.
- A small set of visual strip design presets.
- Caption / date text overlay.
- PNG download.
- Browser print dialog with print-specific CSS.
- Session reset.

---

## 5. Explicitly Excluded Features

- User accounts and authentication.
- Cloud storage or photo upload.
- Payment processing.
- Social sharing or feeds.
- Admin dashboard.
- Native app packaging.
- Silent / automatic printing.
- Multi-user sessions.
- Video boomerang capture.
- AR filters or real-time effects.
- QR-code photo retrieval.
- Email or SMS delivery.
- Marketing landing page.

---

## 6. User Journey

1. Open the application → see the start screen immediately.
2. Tap **Start Photobooth** → camera permission requested → live preview appears.
3. Tap **Start Session** → countdown begins for each shot.
4. After all shots: transition to **Photo Review**.
5. Review photos; retake individual or all; continue when satisfied.
6. Choose a **strip design preset** in the editor.
7. Optionally add caption text.
8. Tap **Continue to Print**.
9. Preview final strip layout; tap **Print** or **Download PNG**.
10. After action, tap **New Session** to restart.

---

## 7. Functional Requirements

### Camera
- **FR-001** — The app shall request camera access only when the user taps "Start Photobooth".
- **FR-002** — The app shall display a live video preview after permission is granted.
- **FR-003** — The app shall support front camera on mobile devices.
- **FR-004** — The app shall support rear camera when available.
- **FR-005** — The app shall allow camera switching (front/rear) when hardware supports it.
- **FR-006** — The app shall handle and display a helpful error when camera permission is denied.
- **FR-007** — The app shall handle and display a helpful error when no camera is detected.
- **FR-008** — The app shall stop all camera tracks when the camera workflow is exited.

### Capture Session
- **FR-009** — The app shall capture a configurable sequence of 3 or 4 photos per session (default: 4).
- **FR-010** — A visible countdown (3-2-1) shall precede each photo capture.
- **FR-011** — Capture shall be triggered automatically at the end of each countdown.
- **FR-012** — The user shall not be able to trigger duplicate captures during a countdown.
- **FR-013** — Captured images shall be stored in application memory in capture order.
- **FR-014** — The app shall display a thumbnail flash effect on capture.

### Photo Review
- **FR-015** — All captured photos shall be displayed in a grid after a session.
- **FR-016** — The user shall be able to retake an individual photo.
- **FR-017** — The user shall be able to retake the entire session.
- **FR-018** — Retaking one photo shall not alter the positions of other photos.
- **FR-019** — The user shall proceed to composition after approving the set.

### Photo-Strip Editor
- **FR-020** — The app shall provide at least 3 visual strip design presets.
- **FR-021** — The strip preview shall reflect the actual rendered output.
- **FR-022** — The user shall be able to add a short caption text.
- **FR-023** — The user shall be able to toggle a date stamp.
- **FR-024** — The user shall be able to return to photo review from the editor.

### Export and Printing
- **FR-025** — The app shall render the final strip to a PNG at print resolution.
- **FR-026** — The app shall provide a Download PNG button.
- **FR-027** — The app shall provide a Print button that opens the browser print dialog.
- **FR-028** — The print layout shall target a 4 × 6 inch page; copy count and orientation follow the active product (Two up = 2 copies side by side, Big shot = landscape sheet, others = 1 true-size copy).
- **FR-029** — Non-print UI shall be hidden during printing.
- **FR-030** — The app shall display setup guidance for the user before printing.

### Custom Template Builder (Revision Add-On)
- **FR-033** — The app shall provide downloadable product-size strip guides (SVG, 300 DPI) — Big shot 13×7 cm, Two up 15×5 cm, Three up 15×6 cm, Two by two / Five up / Six up 10×15 cm — plus a 4 × 6″ 4R print-sheet (1200 × 1800 px, 300 DPI) design template with safe margins and cutting guides.
- **FR-034** — The app shall support importing custom frame artwork in PNG and SVG formats with validation for resolution, aspect ratio, and transparency.
- **FR-035** — The app shall provide an interactive visual photo-slot editor supporting rectangular, irregular polygon, and circular slot geometries with drag-to-move, corner resize, and vertex handle manipulation.
- **FR-036** — The app shall allow manual assignment of each defined slot to any available captured photo in the current session.
- **FR-037** — The app shall support independent photo zoom scaling and pan offsets per slot, clipping images accurately to non-rectangular polygons.
- **FR-038** — The app shall persist custom templates locally (IndexedDB / localStorage) with capabilities to save, duplicate, rename, delete, export, and import reusable template packages.
- **FR-039** — The app shall apply unified composition rules across on-screen preview, PNG export, and 4R physical print (2 identical custom strips side-by-side with cutting guide).

### Session Management
- **FR-031** — The user shall be able to start a new session after completing the flow.
- **FR-032** — Starting a new session shall clear all captured photos from memory.

---

## 8. Non-Functional Requirements

- **NFR-001** — The app shall function without any backend server.
- **NFR-002** — Camera permission shall only be requested in a secure context (HTTPS or localhost).
- **NFR-003** — The app shall be responsive and usable on viewport widths from 375px to 1440px.
- **NFR-004** — The UI shall be keyboard navigable with visible focus states.
- **NFR-005** — The app shall use semantic HTML and ARIA labels where appropriate.
- **NFR-006** — Photo data shall never leave the device without explicit user action (download/print).
- **NFR-007** — Session data shall not persist across page reloads by default.
- **NFR-008** — The development build shall start with a single npm command.
- **NFR-009** — The production build shall succeed without errors.
- **NFR-010** — Captured photos shall not be uploaded to any third-party service.

---

## 9. User Stories and Acceptance Criteria

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-001 | As a user, I want to see the app open directly into a photobooth experience so I don't navigate a marketing page. | Start screen loads without routing to a landing page. |
| US-002 | As a user, I want to grant camera access only when I choose to start. | Camera permission prompt appears only after tapping "Start Photobooth". |
| US-003 | As a user, I want a live preview so I can position myself. | Video stream appears within 2 seconds of granting permission on a fast connection. |
| US-004 | As a user, I want a countdown before each shot so I can pose. | "3", "2", "1" appear on screen before each capture fires. |
| US-005 | As a user, I want to retake an individual photo without starting over. | Tapping retake on photo N re-opens the camera for that slot only. |
| US-006 | As a user, I want to see my photos in a strip template. | After review, photos appear in the selected template in the correct order. |
| US-007 | As a user, I want to download the strip as a PNG. | Tapping Download saves a PNG file to my device. |
| US-008 | As a user, I want to print the strip. | Tapping Print opens the browser print dialog with the correct layout. |
| US-009 | As a user, I want to start a new session after printing. | A "New Session" button resets all state and returns to the start screen. |

---

## 10. Error States and Edge Cases

- Camera permission denied: show illustrated error with instructions to re-enable.
- No camera device found: show illustrated error.
- Camera accessed by another app: show helpful message to close other apps.
- Camera disconnected mid-session: show error and offer to restart.
- Canvas rendering failure: show error; do not allow export of blank image.
- User leaves mid-session: camera tracks stopped on page unload.
- Multiple retake attempts: ensure state does not desync.

---

## 11. Privacy Considerations

- All photo processing occurs entirely on-device.
- No photos are uploaded to servers.
- No analytics or tracking that touches photo data.
- Photos in memory are cleared on session reset or page reload.
- Downloaded files are the user's responsibility after leaving the app.

---

## 12. MVP Success Criteria

The MVP is considered complete when:
1. The app starts and opens without a login page.
2. Camera preview works in Chrome and Safari on desktop and mobile.
3. A user can complete the full journey: start → capture → review → design → export.
4. PNG download produces a valid, visually correct image.
5. Print layout targets the 4 × 6 page size.
6. No acceptance criterion from Section 10 of the master prompt is marked "broken".