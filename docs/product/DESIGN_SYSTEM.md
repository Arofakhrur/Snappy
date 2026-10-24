# Design System — DISTUDIO Photobooth

**Version:** 1.0  
**Date:** 2026-10-25

---

## 1. Visual Direction

**Concept:** A small digital photo studio inspired by editorial print culture, collectible photo strips, and contemporary creative stationery. Warm, tactile, and approachable — not corporate, not generic.

**Mood:** Playful warmth × modern editorial.

---

## 2. Color Palette

### Primary Colors

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-bg` | Warm Cream | `#FBF7F0` | Page background |
| `--color-ink` | Deep Ink | `#1C1917` | Primary text, borders |
| `--color-accent` | Cobalt Blue | `#2563EB` | Primary buttons, active states |
| `--color-highlight` | Butter Yellow | `#FCD34D` | Playful highlights, selection rings |
| `--color-coral` | Soft Coral | `#F87171` | Error states, retake buttons |
| `--color-lavender` | Soft Lavender | `#A78BFA` | Secondary accents, strip themes |

### Supporting Colors

| Token | Name | Hex | Usage |
|-------|------|-----|-------|
| `--color-surface` | Off-White | `#FEFCF8` | Cards, panels |
| `--color-border` | Warm Stone | `#E5DDD5` | Borders, dividers |
| `--color-muted` | Warm Gray | `#9CA3AF` | Secondary text, placeholders |
| `--color-success` | Forest Green | `#059669` | Success states |
| `--color-ink-light` | Ink 40% | `#78716C` | Subtitles, captions |

### Strip Theme Palettes (for presets)

| Preset | Background | Frame | Accent |
|--------|-----------|-------|--------|
| Classic | `#FBF7F0` | `#1C1917` | `#FCD34D` |
| Cobalt | `#EFF6FF` | `#2563EB` | `#BFDBFE` |
| Dark Room | `#1C1917` | `#FBF7F0` | `#F87171` |
| Lavender | `#F5F3FF` | `#A78BFA` | `#DDD6FE` |

---

## 3. Typography

### Font Families

```css
/* Display — Bold headings */
--font-display: 'Playfair Display', 'Georgia', serif;

/* Body — Controls and UI text */
--font-body: 'Inter', system-ui, -apple-system, sans-serif;

/* Mono — Countdown numbers */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

Import from Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
```

### Type Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--text-display` | 3rem (48px) | 900 | Hero heading on start screen |
| `--text-heading` | 1.75rem (28px) | 700 | Screen titles |
| `--text-subheading` | 1.25rem (20px) | 600 | Section labels |
| `--text-body` | 1rem (16px) | 400 | Body text |
| `--text-small` | 0.875rem (14px) | 400 | Captions, metadata |
| `--text-countdown` | 8rem (128px) | 700 | Countdown number |

---

## 4. Spacing

Uses an 8px base unit.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Micro spacing |
| `--space-2` | 8px | Component padding |
| `--space-3` | 12px | Compact spacing |
| `--space-4` | 16px | Standard spacing |
| `--space-5` | 24px | Generous spacing |
| `--space-6` | 32px | Section padding |
| `--space-8` | 48px | Major section gap |
| `--space-12` | 64px | Hero spacing |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Chips, tags |
| `--radius-md` | 12px | Buttons, inputs |
| `--radius-lg` | 20px | Cards, panels |
| `--radius-xl` | 28px | Large containers |
| `--radius-full` | 9999px | Pills, avatars |

---

## 6. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(28,25,23,0.06)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(28,25,23,0.10)` | Cards |
| `--shadow-lg` | `0 8px 32px rgba(28,25,23,0.14)` | Modals, strip preview |
| `--shadow-accent` | `0 4px 20px rgba(37,99,235,0.25)` | Accent button |

---

## 7. Components

### Primary Button

```css
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
  font: 600 var(--text-body) var(--font-body);
  box-shadow: var(--shadow-accent);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(37,99,235,0.35);
}
.btn-primary:active {
  transform: translateY(0);
}
```

### Secondary Button

```css
.btn-secondary {
  background: var(--color-surface);
  color: var(--color-ink);
  border: 1.5px solid var(--color-border);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
}
```

### Capture Button (large, circular)

```css
.btn-capture {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-full);
  background: white;
  border: 3px solid var(--color-accent);
  box-shadow: var(--shadow-lg);
}
```

### Photo Thumbnail

- Rounded corners: `--radius-md`
- 1.5px border: `--color-border`
- 3:4 aspect ratio
- Retake button overlaid on hover

### Strip Preview

- Center-aligned
- Max width: 260px on mobile
- Shadow: `--shadow-lg`
- Rounded top and bottom corners

### Template Picker

- Horizontal scroll row
- Each option: 60 × 160px thumbnail
- Selected: 3px ring in `--color-highlight`

---

## 8. Illustrations

### Required Illustrations

| ID | Usage | Description |
|----|-------|-------------|
| `illus-camera` | Start screen | Stylized camera character with a wide lens eye |
| `illus-permission` | Camera error | Camera with a "denied" icon, friendly expression |
| `illus-no-camera` | No camera error | Empty camera outline with a question mark |
| `illus-strip` | Start screen decoration | Small stack of photo strips |
| `illus-printer` | Print/success screen | Friendly printer with a strip coming out |
| `illus-flash` | Capture flash decoration | Star/sparkle motif used during countdown |

All illustrations are SVG, inline or as Svelte components.

---

## 9. Animations and Transitions

| Event | Animation | Duration |
|-------|-----------|----------|
| Screen transition | Fade + slide up | 250ms ease |
| Countdown number change | Scale up then fade | 400ms |
| Capture flash | White overlay opacity 0→1→0 | 300ms |
| Template selection | Ring fade in | 150ms |
| Button press | Scale 0.98 | 100ms |
| Thumbnail appear | Scale 0 → 1 + fade | 200ms ease-out |

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, full-width |
| Tablet | 640px–1024px | Wider content area |
| Desktop | > 1024px | Two-column where appropriate |

Camera preview fills full width on mobile. On desktop, it is constrained to a max width with the controls alongside.

---

## 11. Custom Template Builder Controls & Slot States

### Slot Wireframe States

| State | Visual Style | Handle Behavior |
|-------|--------------|-----------------|
| **Normal / Unselected** | `#10B981` (Emerald) dashed stroke (1.5px), 12% fill opacity, green badge | Draggable to move position |
| **Selected / Active** | `#2563EB` (Cobalt Blue) solid stroke (3px), 20% fill opacity, blue badge | Shows corner resize handle & vertex dots |
| **Empty Slot (Live Mode)** | `#E2E8F0` fill with centered `#64748B` typography and slot name | Indicates unassigned photograph |

### Interactive Control Targets

- **Vertex Handles:** 14–22px SVG circle handles with `#FFFFFF` inner fill and solid stroke, offering comfortable touch and mouse grab areas.
- **Resize Handles:** 32 × 32px corner squares (`cursor: nwse-resize`) for rectangular slot dimension scaling.
- **Checkerboard Alpha Grid:** 10 × 10px repeating pattern (`#CBD5E1` / transparent) for instant visual verification of frame transparency windows.
- **Workspace Canvas:** CSS scaled board (300 × 900 px visual baseline) with zoom range (70%–150%) and live toggle between wireframe editing and real canvas compositing.

