/**
 * Session Store — Central application state
 * All photo session data lives here.
 * Data is cleared on reset or page reload (no persistence).
 * Kios theme is persisted separately (localStorage) so a kiosk restart remembers it.
 */

import { writable, derived, get } from 'svelte/store';

/** @typedef {'start'|'strip'|'camera'|'review'|'editor'|'print'} Screen */

/** @type {import('svelte/store').Writable<{
 *   screen: Screen,
 *   photos: string[],
 *   retakeIndex: number|null,
 *   selectedTemplate: string,
 *   caption: string,
 *   showDate: boolean,
 *   cameraError: string|null,
 *   isCapturing: boolean,
 *   captureProgress: number,
 *   photoCount: number,
 *   theme: 'dark' | 'light',
 * }>} */

/** Theme persistence key: the kios choice survives page reloads via localStorage */
const THEME_KEY = 'distudio-theme';

function initialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export const session = writable({
  screen: 'start',
  photos: [],
  retakeIndex: null,
  selectedTemplate: 'classic',
  caption: '',
  showDate: true,
  cameraError: null,
  isCapturing: false,
  captureProgress: 0,
  photoCount: 4,
  customTemplateData: null,
  theme: initialTheme(),
});

/** Derived: is a photo set complete? */
export const isPhotoSetComplete = derived(
  session,
  ($s) => $s.photos.length === $s.photoCount && $s.photos.every(Boolean)
);

// ─── Action Functions ───────────────────────────────────────────────────────

/** Set the kios theme ('dark' | 'light'); persisted for the next kiosk boot */
export function setTheme(/** @type {'dark' | 'light'} */ theme) {
  session.update((s) => ({ ...s, theme }));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable — theme lasts for this session only */
    }
  }
}

/** Navigate to a specific screen */
export function goTo(/** @type {Screen} */ screen) {
  session.update((s) => ({ ...s, screen }));
}

/** Set camera error string, or null to clear */
export function setCameraError(/** @type {string|null} */ error) {
  session.update((s) => ({ ...s, cameraError: error }));
}

/** Begin a fresh capture session */
export function beginCapture() {
  session.update((s) => ({
    ...s,
    photos: [],
    retakeIndex: null,
    isCapturing: true,
    captureProgress: 0,
    cameraError: null,
    screen: 'camera',
  }));
}

/** Add a captured photo (data URL) to the session */
export function addPhoto(/** @type {string} */ dataUrl) {
  session.update((s) => {
    const photos = [...s.photos];
    if (s.retakeIndex !== null) {
      photos[s.retakeIndex] = dataUrl;
    } else {
      photos.push(dataUrl);
    }
    return {
      ...s,
      photos,
      captureProgress: s.retakeIndex !== null ? s.captureProgress : photos.length,
    };
  });
}

/** Mark a specific photo slot for retake */
export function setRetakeIndex(/** @type {number|null} */ index) {
  session.update((s) => ({ ...s, retakeIndex: index }));
}

/** Mark capturing as done, transition to review */
export function finishCapture() {
  session.update((s) => ({
    ...s,
    isCapturing: false,
    retakeIndex: null,
    screen: 'review',
  }));
}

/** Set selected strip template key */
export function setTemplate(/** @type {string} */ key) {
  session.update((s) => ({ ...s, selectedTemplate: key }));
}

/** Update caption text */
export function setCaption(/** @type {string} */ text) {
  session.update((s) => ({ ...s, caption: text }));
}

/** Toggle date stamp */
export function toggleDate() {
  session.update((s) => ({ ...s, showDate: !s.showDate }));
}

/** Set photo count (1–6) — ranges outside are guarded */
export function setPhotoCount(/** @type {number} */ count) {
  const safe = Math.min(6, Math.max(1, Math.round(count)));
  session.update((s) => ({ ...s, photoCount: safe }));
}

/** Set active custom template object */
export function setCustomTemplate(template) {
  session.update((s) => ({
    ...s,
    selectedTemplate: template ? template.id : 'classic',
    customTemplateData: template || null,
  }));
}

/** Update photo assignment for a specific slot in the active custom template */
export function updateSlotAssignment(slotId, photoIndex) {
  session.update((s) => {
    if (!s.customTemplateData || !s.customTemplateData.slots) return s;
    const slots = s.customTemplateData.slots.map((slot) => {
      if (slot.id === slotId) {
        return { ...slot, assignedPhotoIndex: photoIndex };
      }
      return slot;
    });
    return {
      ...s,
      customTemplateData: {
        ...s.customTemplateData,
        slots,
      },
    };
  });
}

/** Update crop scale and pan offsets for a specific slot */
export function updateSlotTransform(slotId, { scale, offsetX, offsetY }) {
  session.update((s) => {
    if (!s.customTemplateData || !s.customTemplateData.slots) return s;
    const slots = s.customTemplateData.slots.map((slot) => {
      if (slot.id === slotId) {
        return {
          ...slot,
          scale: scale !== undefined ? scale : slot.scale,
          offsetX: offsetX !== undefined ? offsetX : slot.offsetX,
          offsetY: offsetY !== undefined ? offsetY : slot.offsetY,
        };
      }
      return slot;
    });
    return {
      ...s,
      customTemplateData: {
        ...s.customTemplateData,
        slots,
      },
    };
  });
}

/** Full session reset — clears all photos and returns to start (keeps kios theme) */
export function resetSession() {
  const currentTheme = get(session).theme;
  session.set({
    screen: 'start',
    photos: [],
    retakeIndex: null,
    selectedTemplate: 'classic',
    caption: '',
    showDate: true,
    cameraError: null,
    isCapturing: false,
    captureProgress: 0,
    photoCount: 4,
    customTemplateData: null,
    theme: currentTheme || 'dark',
  });
}
