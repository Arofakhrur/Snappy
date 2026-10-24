# Test Plan — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## Testing Approach

Manual testing performed in Chrome (desktop) and Chrome (mobile emulation).  
Physical hardware tests (printer) are documented as **UNVERIFIED** where not executable.

---

## Test Suite

### T-001 — Application Start
| Step | Expected | Status |
|------|----------|--------|
| Open `http://localhost:5173` | Start screen displays immediately | — |
| No camera permission requested on load | Permission prompt not shown | — |
| Start screen shows illustration, heading, button | All elements visible | — |

### T-002 — Camera Initialization
| Step | Expected | Status |
|------|----------|--------|
| Tap Start Photobooth | Camera permission prompt appears | — |
| Grant permission | Live video preview appears | — |
| Deny permission | Permission error screen with instructions | — |
| No camera device | No-camera error screen | — |

### T-003 — Capture Session
| Step | Expected | Status |
|------|----------|--------|
| Tap Start Session | Countdown 3-2-1 appears | — |
| Countdown reaches 0 | Frame captured, flash effect fires | — |
| 4 countdowns complete | 4 thumbnails visible | — |
| Session completes | Transition to review screen | — |
| Attempt double-tap during countdown | Button disabled; no duplicate capture | — |

### T-004 — Photo Review
| Step | Expected | Status |
|------|----------|--------|
| Review screen shows 4 photos | All 4 visible | — |
| Tap Retake on photo 2 | Camera opens; 1-shot countdown | — |
| Capture replacement | Only slot 2 changes | — |
| Tap Retake All | All slots clear; full session restarts | — |
| Tap Continue | Transitions to strip editor | — |

### T-005 — Strip Editor
| Step | Expected | Status |
|------|----------|--------|
| Editor opens | Strip preview renders with all 4 photos | — |
| Select Cobalt template | Strip preview updates to cobalt colors | — |
| Select Dark Room template | Strip preview updates | — |
| Type caption | Caption appears on strip | — |
| Toggle date | Date appears/disappears on strip | — |
| Tap Back | Returns to review | — |

### T-006 — Export — PNG Download
| Step | Expected | Status |
|------|----------|--------|
| Tap Download PNG | File dialog opens / file saved | — |
| Open downloaded file | PNG is 1200 × 1800 px | — |
| Inspect image | Both strips visible, photos correctly placed | — |
| Caption visible | Caption text appears on strip | — |

### T-007 — Export — Print
| Step | Expected | Status |
|------|----------|--------|
| Tap Print | Browser print dialog opens | — |
| Print preview shows | Two strips side by side, no UI chrome | — |
| Page size shows 4 × 6 or 4R | Matches CSS `@page` definition | — |
| Cancel print | Returns to app normally | — |

> **UNVERIFIED:** Physical print on 4R paper. Cannot be tested without hardware.  
> **UNVERIFIED:** Borderless print behavior varies by printer driver.

### T-008 — Session Reset
| Step | Expected | Status |
|------|----------|--------|
| Complete flow; tap New Session | Returns to start screen | — |
| Photos cleared from memory | No previous photos visible | — |
| Camera tracks stopped | Browser camera indicator off | — |

### T-009 — Responsive Layout
| Step | Expected | Status |
|------|----------|--------|
| Load at 375px width | All screens usable, no overflow | — |
| Load at 768px width | Layout adjusts, content well-spaced | — |
| Load at 1280px width | Desktop layout, camera constrained | — |

### T-010 — Keyboard and Accessibility
| Step | Expected | Status |
|------|----------|--------|
| Tab through start screen | Focus visible on all interactive elements | — |
| Press Enter on focused button | Button activates | — |
| Screen reader: button labels | Labels announced correctly | — |

### T-011 — Build
| Step | Expected | Status |
|------|----------|--------|
| `npm run build` | Exits with code 0 | ✅ Pass |
| No type/lint errors blocking build | Clean output | ✅ Pass |

### T-012 — Downloadable Template Guides
| Step | Expected | Status |
|------|----------|--------|
| Click 2 × 6″ SVG Guide download | Downloads `strip-template-2x6.svg` with 600 × 1800 viewBox & 5mm margins | ✅ Pass |
| Click 4R Print Sheet SVG Guide download | Downloads `sheet-template-4r.svg` with 1200 × 1800 viewBox & center cut line | ✅ Pass |

### T-013 — Custom Artwork Import & Validation
| Step | Expected | Status |
|------|----------|--------|
| Upload valid transparent PNG/SVG | Previews over checkerboard background | ✅ Pass |
| Upload image with < 600×1800 px | Informative warning banner displayed | ✅ Pass |
| Upload invalid file type (.txt) | Error alert displayed, file rejected | ✅ Pass |

### T-014 — Visual Photo-Slot Mapping & Geometric Clipping
| Step | Expected | Status |
|------|----------|--------|
| Add Rect, Polygon, Circle slots | Slots appear on visual workspace | ✅ Pass |
| Drag slot to move | Slot coordinates update in real time | ✅ Pass |
| Drag polygon vertex handles | Irregular polygon boundary reshapes | ✅ Pass |
| Switch to Live Composite mode | Photographs clip strictly inside non-rectangular polygons | ✅ Pass |

### T-015 — Manual Photo Assignment & Crop Control
| Step | Expected | Status |
|------|----------|--------|
| Reassign Slot 1 → Photo #3, Slot 2 → Photo #1 | Preview updates photo positions immediately | ✅ Pass |
| Adjust zoom slider and pan controls | Photo scales and moves within its clipping boundary | ✅ Pass |
| Set slot to empty | Slot displays clean fallback placeholder | ✅ Pass |

### T-016 — Template Persistence & Library
| Step | Expected | Status |
|------|----------|--------|
| Save custom template to library | Persisted in IndexedDB / localStorage | ✅ Pass |
| Reload browser page | Custom template remains in library | ✅ Pass |
| Export template package (.json) | Valid JSON file downloaded with slots & artwork | ✅ Pass |
| Import template package (.json) | Template restored with exact geometry & artwork | ✅ Pass |

### T-017 — 4R Sheet Print & PNG Export with Custom Template
| Step | Expected | Status |
|------|----------|--------|
| Proceed to Print screen with custom template | 4R sheet shows two identical custom strips side by side | ✅ Pass |
| Tap Download PNG | 1200 × 1800 px file downloaded matching preview | ✅ Pass |
| Tap Print | Browser print dialog opens with 4 × 6″ layout | ✅ Pass |

---

## Known Limitations (from ARCHITECTURE.md)

- Camera requires HTTPS or localhost (browser security).
- iOS Safari may require tap to start video.
- Physical print not tested (no hardware).
- Camera switch reliability varies on Android.
