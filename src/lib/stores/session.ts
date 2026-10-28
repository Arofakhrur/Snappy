/**
 * Session Store — Central application state
 * All photo session data lives here.
 * Data is cleared on reset or page reload (no persistence).
 * Kios theme is persisted separately (localStorage) so a kiosk restart remembers it.
 */

import { writable, derived, get } from 'svelte/store';
import { goto } from '$app/navigation';
import type { CameraSettings, CustomTemplate, KioskTheme, Screen, SessionState } from '#lib/types';

/** Theme persistence key: the kios choice survives page reloads via localStorage */
const THEME_KEY = 'distudio-theme';
const CAMERA_SETTINGS_KEY = 'distudio-camera-settings';

const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
	theme: 'clean',
	timer: 0,
	flash: 'off',
	filter: 'none',
	grid: 'none',
};

function initialCameraSettings(): CameraSettings {
	if (typeof window === 'undefined') return { ...DEFAULT_CAMERA_SETTINGS };
	try {
		const saved = localStorage.getItem(CAMERA_SETTINGS_KEY);
		if (saved) return { ...DEFAULT_CAMERA_SETTINGS, ...JSON.parse(saved) };
	} catch { /* proceed with defaults */ }
	return { ...DEFAULT_CAMERA_SETTINGS };
}

function initialTheme(): KioskTheme {
	if (typeof window === 'undefined') return 'light';
	try {
		// Default light; pilihan user yang tersimpan selalu menang
		return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

export const session = writable<SessionState>({
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
	cameraSettings: initialCameraSettings(),
});

/** Derived: is a photo set complete? */
export const isPhotoSetComplete = derived(
	session,
	($s) => $s.photos.length === $s.photoCount && $s.photos.every(Boolean)
);

// ─── Action Functions ───────────────────────────────────────────────────────

/** Path rute untuk tiap layar kios — satu-satunya pemetaan nama → URL */
const SCREEN_PATH: Record<Screen, string> = {
	start: '/',
	strip: '/strip',
	camera: '/camera',
	review: '/review',
	editor: '/editor',
	print: '/print',
};

/** Set the kios theme ('dark' | 'light'); persisted for the next kiosk boot */
export function setTheme(theme: KioskTheme): void {
	session.update((s) => ({ ...s, theme }));
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			/* storage unavailable — theme lasts for this session only */
		}
	}
}

/** Update camera settings (partial merge); persisted to localStorage */
export function setCameraSettings(partial: Partial<CameraSettings>): void {
	session.update((s) => {
		const cameraSettings = { ...s.cameraSettings, ...partial };
		if (typeof window !== 'undefined') {
			try { localStorage.setItem(CAMERA_SETTINGS_KEY, JSON.stringify(cameraSettings)); } catch { /* storage unavailable */ }
		}
		return { ...s, cameraSettings };
	});
}

/** Navigate to a specific screen — navigasi sungguhan via rute SvelteKit */
export function goTo(screen: Screen): void {
	session.update((s) => (s.screen === screen ? s : { ...s, screen }));
	void goto(SCREEN_PATH[screen]);
}

/** Set camera error string, or null to clear */
export function setCameraError(error: string | null): void {
	session.update((s) => ({ ...s, cameraError: error }));
}

/** Begin a fresh capture session */
export function beginCapture(): void {
	session.update((s) => ({
		...s,
		photos: [],
		retakeIndex: null,
		isCapturing: true,
		captureProgress: 0,
		cameraError: null,
		screen: 'camera',
	}));
	void goto(SCREEN_PATH.camera);
}

/** Add a captured photo (data URL) to the session */
export function addPhoto(dataUrl: string): void {
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
export function setRetakeIndex(index: number | null): void {
	session.update((s) => ({ ...s, retakeIndex: index }));
}

/** Mark capturing as done, transition to review */
export function finishCapture(): void {
	session.update((s) => ({
		...s,
		isCapturing: false,
		retakeIndex: null,
		screen: 'review',
	}));
	void goto(SCREEN_PATH.review);
}

/** Set selected strip template key */
export function setTemplate(key: string): void {
	session.update((s) => ({ ...s, selectedTemplate: key }));
}

/** Update caption text */
export function setCaption(text: string): void {
	session.update((s) => ({ ...s, caption: text }));
}

/** Toggle date stamp */
export function toggleDate(): void {
	session.update((s) => ({ ...s, showDate: !s.showDate }));
}

/** Set photo count (1–6) — ranges outside are guarded */
export function setPhotoCount(count: number): void {
	const safe = Math.min(6, Math.max(1, Math.round(count)));
	session.update((s) => ({ ...s, photoCount: safe }));
}

/** Set active custom template object */
export function setCustomTemplate(template: CustomTemplate | null): void {
	session.update((s) => ({
		...s,
		selectedTemplate: template ? template.id : 'classic',
		customTemplateData: template || null,
	}));
}

/** Update photo assignment for a specific slot in the active custom template */
export function updateSlotAssignment(slotId: string, photoIndex: number | null): void {
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

export interface SlotTransform {
	scale?: number;
	offsetX?: number;
	offsetY?: number;
}

/** Update crop scale and pan offsets for a specific slot */
export function updateSlotTransform(
	slotId: string,
	{ scale, offsetX, offsetY }: SlotTransform
): void {
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

/** Full session reset — clears all photos and returns to start (keeps kios theme + camera settings) */
export function resetSession(): void {
	const currentTheme = get(session).theme;
	const currentCameraSettings = get(session).cameraSettings;
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
		theme: currentTheme || 'light',
		cameraSettings: currentCameraSettings || { ...DEFAULT_CAMERA_SETTINGS },
	});
	void goto(SCREEN_PATH.start);
}
