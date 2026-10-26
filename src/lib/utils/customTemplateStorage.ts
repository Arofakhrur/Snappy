/**
 * Custom Template Storage — IndexedDB & Local Persistence
 *
 * Manages reusable custom photo-strip templates with custom artwork,
 * irregular/polygon slot geometries, photo crop offsets, and layer ordering.
 */

import type { BuiltinSticker, CustomTemplate } from '#lib/types';

const DB_NAME = 'distudio_photobooth_db';
const DB_VERSION = 1;
const STORE_NAME = 'custom_templates';
const LOCAL_STORAGE_KEY = 'distudio_custom_templates_backup';

/**
 * Built-in ready-to-use decorative stickers and ornaments
 */
export const BUILTIN_STICKERS: BuiltinSticker[] = [
	{
		id: 'ribbon-vip',
		name: 'VIP Ribbon Banner',
		type: 'ribbon',
		width: 0.54,
		height: 0.08,
		aspectRatio: 3.5,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 100" width="350" height="100">
      <defs>
        <filter id="rib-shd" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/>
        </filter>
      </defs>
      <path d="M20 75 L50 50 L20 25 L330 25 L300 50 L330 75 Z" fill="#DC2626" filter="url(#rib-shd)"/>
      <rect x="50" y="20" width="250" height="60" rx="6" fill="#EF4444"/>
      <rect x="56" y="26" width="238" height="48" rx="4" fill="none" stroke="#FEF08A" stroke-width="2" stroke-dasharray="6 4"/>
      <text x="175" y="58" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="900" fill="#FEF08A" text-anchor="middle" letter-spacing="4">★ VIP GUEST ★</text>
    </svg>`,
	},
	{
		id: 'stamp-airmail',
		name: 'Airmail Postmark Stamp',
		type: 'sticker',
		width: 0.32,
		height: 0.11,
		aspectRatio: 1.0,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <circle cx="100" cy="100" r="92" fill="none" stroke="#1D4ED8" stroke-width="5" stroke-dasharray="10 5"/>
      <circle cx="100" cy="100" r="80" fill="none" stroke="#1D4ED8" stroke-width="2"/>
      <path id="curve-top" d="M 30,100 A 70,70 0 0,1 170,100" fill="none"/>
      <path id="curve-bot" d="M 170,100 A 70,70 0 0,1 30,100" fill="none"/>
      <text font-family="'JetBrains Mono', monospace" font-size="14" font-weight="800" fill="#1D4ED8">
        <textPath href="#curve-top" startOffset="50%" text-anchor="middle">DISTUDIO PHOTOBOOTH</textPath>
      </text>
      <text font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#1D4ED8">
        <textPath href="#curve-bot" startOffset="50%" text-anchor="middle">OFFICIAL ARCHIVE 2026</textPath>
      </text>
      <line x1="45" y1="90" x2="155" y2="90" stroke="#1D4ED8" stroke-width="2"/>
      <text x="100" y="108" font-family="'Inter', sans-serif" font-size="18" font-weight="800" fill="#DC2626" text-anchor="middle">VERIFIED</text>
      <line x1="45" y1="115" x2="155" y2="115" stroke="#1D4ED8" stroke-width="2"/>
    </svg>`,
	},
	{
		id: 'badge-starburst',
		name: 'Retro Gold Starburst',
		type: 'sticker',
		width: 0.28,
		height: 0.09,
		aspectRatio: 1.0,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <polygon points="80,10 97,55 145,55 106,85 122,130 80,102 38,130 54,85 15,55 63,55" fill="#FBBF24" stroke="#D97706" stroke-width="4"/>
      <circle cx="80" cy="80" r="32" fill="#FEF3C7"/>
      <text x="80" y="85" font-family="'Inter', sans-serif" font-size="14" font-weight="900" fill="#92400E" text-anchor="middle">BEST</text>
    </svg>`,
	},
	{
		id: 'sticker-heart',
		name: 'Double Heart Badge',
		type: 'sticker',
		width: 0.28,
		height: 0.08,
		aspectRatio: 1.2,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 150" width="180" height="150">
      <path d="M60 30 C40 10 10 30 10 60 C10 100 60 130 60 130 C60 130 110 100 110 60 C110 30 80 10 60 30 Z" fill="#FB7185" stroke="#E11D48" stroke-width="4"/>
      <path d="M120 40 C105 25 80 40 80 65 C80 95 120 120 120 120 C120 120 160 95 160 65 C160 40 135 25 120 40 Z" fill="#F43F5E" stroke="#BE123C" stroke-width="4"/>
      <circle cx="45" cy="45" r="8" fill="#FFFFFF" opacity="0.6"/>
      <circle cx="105" cy="55" r="7" fill="#FFFFFF" opacity="0.6"/>
    </svg>`,
	},
	{
		id: 'sticker-sparkles',
		name: 'Sparkle Cluster',
		type: 'sticker',
		width: 0.30,
		height: 0.08,
		aspectRatio: 1.3,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" width="160" height="120">
      <!-- Big star -->
      <path d="M50 10 Q50 50 10 50 Q50 50 50 90 Q50 50 90 50 Q50 50 50 10 Z" fill="#F59E0B"/>
      <!-- Mid star -->
      <path d="M115 40 Q115 65 90 65 Q115 65 115 90 Q115 65 140 65 Q115 65 115 40 Z" fill="#FBBF24"/>
      <!-- Tiny star -->
      <path d="M135 15 Q135 25 125 25 Q135 25 135 35 Q135 25 145 25 Q135 25 135 15 Z" fill="#FCD34D"/>
    </svg>`,
	},
	{
		id: 'badge-party',
		name: 'Party Time Badge',
		type: 'sticker',
		width: 0.42,
		height: 0.06,
		aspectRatio: 3.0,
		svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" width="300" height="100">
      <rect x="10" y="15" width="280" height="70" rx="35" fill="#8B5CF6" stroke="#EDE9FE" stroke-width="4"/>
      <text x="150" y="58" font-family="'Inter', sans-serif" font-size="22" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">🎉 PARTY TIME!</text>
    </svg>`,
	},
];

export const SAMPLE_TEMPLATES: CustomTemplate[] = [
	{
		id: 'sample-editorial-slanted',
		name: 'Slanted Editorial (3 Slots)',
		isCustom: true,
		backgroundColor: '#F8FAFC',
		artworkLayer: 'overlay',
		width: 600,
		height: 1800,
		createdAt: Date.now() - 100000,
		updatedAt: Date.now() - 100000,
		overlays: [
			{
				id: 'ovl-1',
				name: 'VIP Ribbon',
				type: 'ribbon',
				src: `data:image/svg+xml;utf8,${encodeURIComponent(BUILTIN_STICKERS[0].svg)}`,
				x: 0.23,
				y: 0.03,
				width: 0.54,
				height: 0.08,
				rotation: -4,
				opacity: 1.0,
				zIndex: 1,
				locked: false,
				hidden: false,
				aspectRatioLocked: true,
				aspectRatio: 3.5,
			},
			{
				id: 'ovl-2',
				name: 'Sparkle Ornament',
				type: 'sticker',
				src: `data:image/svg+xml;utf8,${encodeURIComponent(BUILTIN_STICKERS[4].svg)}`,
				x: 0.65,
				y: 0.62,
				width: 0.26,
				height: 0.07,
				rotation: 12,
				opacity: 0.9,
				zIndex: 2,
				locked: false,
				hidden: false,
				aspectRatioLocked: true,
				aspectRatio: 1.3,
			},
		],
		slots: [
			{
				id: 'slot-1',
				name: 'Top Slanted Frame',
				type: 'polygon',
				x: 0.08,
				y: 0.08,
				width: 0.84,
				height: 0.26,
				points: [
					{ x: 0.08, y: 0.08 },
					{ x: 0.92, y: 0.11 },
					{ x: 0.92, y: 0.35 },
					{ x: 0.08, y: 0.32 },
				],
				assignedPhotoIndex: 0,
				scale: 1.0,
				offsetX: 0,
				offsetY: 0,
			},
			{
				id: 'slot-2',
				name: 'Center Diamond/Hexagon',
				type: 'polygon',
				x: 0.08,
				y: 0.38,
				width: 0.84,
				height: 0.28,
				points: [
					{ x: 0.50, y: 0.37 },
					{ x: 0.92, y: 0.44 },
					{ x: 0.92, y: 0.60 },
					{ x: 0.50, y: 0.67 },
					{ x: 0.08, y: 0.60 },
					{ x: 0.08, y: 0.44 },
				],
				assignedPhotoIndex: 1,
				scale: 1.1,
				offsetX: 0,
				offsetY: 0,
			},
			{
				id: 'slot-3',
				name: 'Bottom Angled Frame',
				type: 'polygon',
				x: 0.08,
				y: 0.70,
				width: 0.84,
				height: 0.24,
				points: [
					{ x: 0.08, y: 0.70 },
					{ x: 0.92, y: 0.67 },
					{ x: 0.92, y: 0.93 },
					{ x: 0.08, y: 0.96 },
				],
				assignedPhotoIndex: 2,
				scale: 1.0,
				offsetX: 0,
				offsetY: 0,
			},
		],
		// Clean SVG border overlay with stylish brand typography and cut guide
		artworkDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1800" width="600" height="1800">
      <defs>
        <style>
          .brand { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 800; fill: %231E293B; letter-spacing: 0.15em; }
          .sub { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; fill: %2364748B; letter-spacing: 0.2em; }
          .poly-border { fill: none; stroke: %231E293B; stroke-width: 8; stroke-linejoin: round; }
        </style>
      </defs>
      <!-- Top Brand -->
      <text x="300" y="80" class="brand" text-anchor="middle">DISTUDIO // EDITORIAL</text>
      <!-- Slot 1 outline -->
      <polygon points="48,144 552,198 552,630 48,576" class="poly-border"/>
      <!-- Slot 2 outline -->
      <polygon points="300,666 552,792 552,1080 300,1206 48,1080 48,792" class="poly-border"/>
      <!-- Slot 3 outline -->
      <polygon points="48,1260 552,1206 552,1674 48,1728" class="poly-border"/>
      <!-- Bottom tag -->
      <text x="300" y="1770" class="sub" text-anchor="middle">LIMITED EDITION ARCHIVE</text>
    </svg>`,
	},
	{
		id: 'sample-asymmetric-duo',
		name: 'Asymmetric Collage (4 Slots)',
		isCustom: true,
		backgroundColor: '#18181B',
		artworkLayer: 'overlay',
		width: 600,
		height: 1800,
		createdAt: Date.now() - 50000,
		updatedAt: Date.now() - 50000,
		slots: [
			{
				id: 'slot-1',
				name: 'Top Big Hero Slot',
				type: 'rect',
				x: 0.08,
				y: 0.08,
				width: 0.84,
				height: 0.32,
				borderRadius: 8,
				assignedPhotoIndex: 0,
				scale: 1.0,
				offsetX: 0,
				offsetY: 0,
			},
			{
				id: 'slot-2',
				name: 'Mid Left Square',
				type: 'rect',
				x: 0.08,
				y: 0.42,
				width: 0.40,
				height: 0.24,
				borderRadius: 6,
				assignedPhotoIndex: 1,
				scale: 1.0,
				offsetX: 0,
				offsetY: 0,
			},
			{
				id: 'slot-3',
				name: 'Mid Right Square',
				type: 'rect',
				x: 0.52,
				y: 0.42,
				width: 0.40,
				height: 0.24,
				borderRadius: 6,
				assignedPhotoIndex: 2,
				scale: 1.0,
				offsetX: 0,
				offsetY: 0,
			},
			{
				id: 'slot-4',
				name: 'Bottom Landscape Slot',
				type: 'rect',
				x: 0.08,
				y: 0.68,
				width: 0.84,
				height: 0.26,
				borderRadius: 8,
				assignedPhotoIndex: 3,
				scale: 1.0,
				offsetX: 0,
				offsetY: 0,
			},
		],
		artworkDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 1800" width="600" height="1800">
      <defs>
        <style>
          .dark-brand { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; fill: %23F43F5E; letter-spacing: 0.2em; }
          .frame-line { fill: none; stroke: %23FAFAF9; stroke-width: 6; }
        </style>
      </defs>
      <text x="300" y="80" class="dark-brand" text-anchor="middle">STUDIO NOIR</text>
      <rect x="48" y="144" width="504" height="576" rx="8" class="frame-line"/>
      <rect x="48" y="756" width="240" height="432" rx="6" class="frame-line"/>
      <rect x="312" y="756" width="240" height="432" rx="6" class="frame-line"/>
      <rect x="48" y="1224" width="504" height="468" rx="8" class="frame-line"/>
      <text x="300" y="1740" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="%23A1A1AA" text-anchor="middle">COLLECTOR STRIP</text>
    </svg>`,
	},
];

/** Open or initialize the IndexedDB */
function openDB(): Promise<IDBDatabase | null> {
	return new Promise((resolve, reject) => {
		if (typeof window === 'undefined' || !window.indexedDB) {
			resolve(null);
			return;
		}
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};

		request.onsuccess = (event: Event) => resolve((event.target as IDBOpenDBRequest).result);
		request.onerror = (event: Event) => {
			console.warn(
				'IndexedDB open error, falling back to localStorage:',
				(event.target as IDBOpenDBRequest).error
			);
			resolve(null);
		};
	});
}

/** Get fallback storage from localStorage */
function getLocalStorageTemplates(): CustomTemplate[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as CustomTemplate[];
	} catch (e: unknown) {
		return [];
	}
}

/** Set fallback storage in localStorage */
function setLocalStorageTemplates(templates: CustomTemplate[]): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
	} catch (e: unknown) {
		console.warn('Failed to save to localStorage:', e);
	}
}

/** Fetch all custom templates, seeding with defaults if empty. */
export async function getAllCustomTemplates(): Promise<CustomTemplate[]> {
	const db = await openDB();

	if (!db) {
		let list = getLocalStorageTemplates();
		if (list.length === 0) {
			list = [...SAMPLE_TEMPLATES];
			setLocalStorageTemplates(list);
		}
		return list;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const req = store.getAll();

			req.onsuccess = async () => {
				let results = (req.result || []) as CustomTemplate[];
				if (results.length === 0) {
					// Seed with samples
					for (const tmpl of SAMPLE_TEMPLATES) {
						await saveCustomTemplate(tmpl);
					}
					results = [...SAMPLE_TEMPLATES];
				}
				resolve(results);
			};

			req.onerror = () => {
				resolve(getLocalStorageTemplates());
			};
		} catch (e: unknown) {
			resolve(getLocalStorageTemplates());
		}
	});
}

/** Get a single custom template by ID. */
export async function getCustomTemplate(id: string): Promise<CustomTemplate | null> {
	const templates = await getAllCustomTemplates();
	return templates.find((t) => t.id === id) || null;
}

/** Save or update a custom template. */
export async function saveCustomTemplate(template: CustomTemplate): Promise<CustomTemplate> {
	const now = Date.now();
	const toSave: CustomTemplate = {
		...template,
		isCustom: true,
		updatedAt: now,
		createdAt: template.createdAt || now,
		slots: (template.slots || []).map((s, idx) => ({
			...s,
			id: s.id || `slot-${idx + 1}`,
			name: s.name || `Slot ${idx + 1}`,
			scale: s.scale ?? 1.0,
			offsetX: s.offsetX ?? 0,
			offsetY: s.offsetY ?? 0,
		})),
		overlays: (template.overlays || []).map((o, idx) => ({
			...o,
			id: o.id || `overlay-${idx + 1}`,
			name: o.name || `Overlay ${idx + 1}`,
			rotation: o.rotation ?? 0,
			opacity: o.opacity ?? 1.0,
			zIndex: o.zIndex ?? idx,
			locked: o.locked ?? false,
			hidden: o.hidden ?? false,
			aspectRatioLocked: o.aspectRatioLocked ?? true,
		})),
	};

	const db = await openDB();
	if (db) {
		await new Promise<void>((resolve, reject) => {
			try {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				const req = store.put(toSave);
				req.onsuccess = () => resolve();
				req.onerror = (e: Event) => reject(e);
			} catch (err: unknown) {
				reject(err);
			}
		});
	}

	// Also sync localStorage
	const current = getLocalStorageTemplates().filter((t) => t.id !== toSave.id);
	current.unshift(toSave);
	setLocalStorageTemplates(current);

	return toSave;
}

/** Delete a custom template. */
export async function deleteCustomTemplate(id: string): Promise<void> {
	const db = await openDB();
	if (db) {
		await new Promise<void>((resolve) => {
			try {
				const tx = db.transaction(STORE_NAME, 'readwrite');
				const store = tx.objectStore(STORE_NAME);
				const req = store.delete(id);
				req.onsuccess = () => resolve();
				req.onerror = () => resolve();
			} catch (e: unknown) {
				resolve();
			}
		});
	}

	const current = getLocalStorageTemplates().filter((t) => t.id !== id);
	setLocalStorageTemplates(current);
}

/** Duplicate a custom template with a new name and ID. */
export async function duplicateCustomTemplate(id: string): Promise<CustomTemplate | null> {
	const original = await getCustomTemplate(id);
	if (!original) return null;

	const copy: CustomTemplate = {
		...original,
		id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		name: `${original.name} (Copy)`,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};

	return await saveCustomTemplate(copy);
}

/** Export a template package file (.json) for sharing/importing into other devices. */
export function exportTemplateFile(template: CustomTemplate): void {
	const exportData = {
		app: 'DISTUDIO Photobooth',
		schemaVersion: 1,
		exportedAt: new Date().toISOString(),
		template: {
			...template,
			id: undefined, // allow new ID upon import
		},
	};

	const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	const safeName = (template.name || 'custom-template').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
	a.download = `distudio-template-${safeName}.json`;
	a.href = url;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/** Import a template package from JSON text or File object. */
export async function importTemplateFile(fileOrJson: File | string): Promise<CustomTemplate> {
	let content = '';
	if (typeof fileOrJson === 'string') {
		content = fileOrJson;
	} else {
		content = await fileOrJson.text();
	}

	const data = JSON.parse(content) as { template?: Partial<CustomTemplate> } & Partial<CustomTemplate>;
	const tmpl = (data.template || data) as CustomTemplate;

	if (!tmpl.name || !Array.isArray(tmpl.slots)) {
		throw new Error('Invalid template package format: missing name or slots array');
	}

	const newTemplate: CustomTemplate = {
		...tmpl,
		id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		name: tmpl.name.includes('(Imported)') ? tmpl.name : `${tmpl.name} (Imported)`,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};

	return await saveCustomTemplate(newTemplate);
}
