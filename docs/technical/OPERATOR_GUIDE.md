# Operator Guide — Custom Photo-Strip Template Builder

**DISTUDIO Photobooth**  
**Version:** 1.0  
**Target:** Event Operators, Photobooth Kiosk Managers, and Studio Designers  

---

## Overview

The Custom Photo-Strip Template Builder allows you to design custom event frames in your favorite graphic design software (Figma, Photoshop, Illustrator), import them into DISTUDIO Photobooth, and visually map captured photos to custom-shaped photo slots (including angled, irregular polygons, diamonds, and polaroid collages).

The application automatically handles **4R (4 × 6 inch) print duplication**, placing two identical copies side-by-side with a center cutting guide.

---

## Step-by-Step Workflow

```
1. Download Guide Template (SVG)
             │
             ▼
2. Design Artwork in Figma / Photoshop
   - Leave transparent windows for photos
   - Hide/delete "guides-layer"
             │
             ▼
3. Export Artwork as PNG (with transparency) or SVG at 600 × 1800 px
             │
             ▼
4. In DISTUDIO Photobooth:
   - Go to Strip Editor -> "Custom Frames" -> "+ Create Custom Template"
   - Import your artwork file
   - Visually add & drag photo slots to align with cutouts
             │
             ▼
5. Map Photos to Slots (e.g. Slot 1 -> Photo #3, Slot 2 -> Photo #1)
             │
             ▼
6. Save & Apply Template (Persisted in local library for future sessions)
             │
             ▼
7. Print on 4R Paper or Download 300 DPI PNG (Two strips on 4 × 6″ sheet)
```

---

## Detailed Instructions

### 1. Download the Design Template Guide

1. In the app, navigate to the **Design Strip** screen.
2. Select the **Custom Frames** tab and click **+ Create Custom Template** or **Browse Library**.
3. Under the **Guides** tab, download the template:
   - **`strip-template-2x6.svg`**: Individual 2 × 6″ strip guide (600 × 1800 px @ 300 DPI target).
   - **`sheet-template-4r.svg`**: 4 × 6″ 4R print sheet guide showing two strips side-by-side with the center cut line.

### 2. Design Your Custom Frame

Open the SVG in Figma, Photoshop, Illustrator, or Affinity Designer.

- **Canvas Size:** 600 × 1800 px (exact 1:3 aspect ratio).
- **Physical Size:** 2 × 6 inches at 300 DPI.
- **Safe Margin:** Keep essential logos, event titles, and guest text at least 36–60 px (5 mm) away from all outer edges.
- **Photo Windows:** Cut out the areas where photos should show through and ensure the background inside those cutouts is **100% transparent (alpha = 0)**.
- **Guide Layer:** The template contains a group named `guides-layer`. Make sure to **hide or delete** this group before exporting your artwork.
- **Export Format:** Export as **32-bit PNG (with transparency)** or **SVG**.

---

### 3. Import and Map Photo Slots

1. In the **Custom Template Builder**, switch to the **Frame Art** tab.
2. Drag & drop or browse to upload your exported PNG/SVG artwork.
   - The app will validate dimensions and warn if resolution is below 600 × 1800 px.
   - Choose **Overlay** (recommended) so your frame artwork and decorative borders sit cleanly on top of the photographs.
3. Switch to the **Slots** tab to define your photo slots:
   - Click **+ Rectangle** for standard photo windows.
   - Click **+ Slanted Polygon**, **+ Diamond**, or custom polygon for irregular or angled cutouts.
   - Click **+ Circle / Oval** for circular frames.
4. **Interactive Editing:**
   - Click and drag any slot to position it directly over your frame cutout.
   - Drag the bottom-right corner handle to resize rectangular slots.
   - Drag individual vertex circle handles to reshape polygon slots into any asymmetric angle.

---

### 4. Photo Assignment & Cropping

1. Switch to the **Photo Mapping** tab (or use the inline assignment panel on the main Editor screen).
2. For each slot, choose which countdown photo to display:
   - *Example:* Slot 1 → Photo #2, Slot 2 → Photo #1, Slot 3 → Photo #4.
3. Use the **Photo Zoom** slider (0.8x to 2.5x) and **Pan X / Pan Y** sliders to adjust the crop and positioning of the subject inside the slot.
4. Toggle to **✨ Live Composite** mode in the workspace toolbar to see the final rendered output with actual photos clipped inside your custom shapes!

---

### 5. Save and Reuse

1. Enter a descriptive template name (e.g., *"Summer Wedding 2026"*).
2. Click **Save & Apply Strip**.
   - The template is saved to your browser's local database (IndexedDB) and will persist across browser restarts and reloads.
   - It is immediately applied to the current photobooth session.
3. To share the template with another photobooth station, click **Export JSON** to download a portable `.json` package containing all slot coordinates, photo-fit settings, and embedded artwork.
4. On another station, click **Import JSON** in the template library to load it instantly.

---

### 6. Printing on 4R Photo Paper

1. Tap **Print →** to proceed to the print screen.
2. The print screen displays the completed **4R (4 × 6 inch)** sheet featuring two identical copies of your custom strip separated by a dashed cutting line.
3. Tap **Print 4R Photo Strip**:
   - Ensure the printer paper size is set to **4 × 6 inches (4R)**.
   - Set orientation to **Portrait**.
   - Set scale to **100% (Actual Size)**.
   - Enable **Background Graphics**.
4. After printing, cut along the center dashed line to separate into two 2 × 6″ souvenir photo strips!
