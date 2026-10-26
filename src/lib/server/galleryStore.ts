import fs from 'fs';
import path from 'path';
import type { GallerySession } from '#lib/types';

/**
 * Server-side Gallery Session Storage
 * Persists session JSONs in memory and locally in .gallery_cache/
 * so mobile devices connecting over Wi-Fi can retrieve them.
 */

const CACHE_DIR = path.resolve('.gallery_cache');

// Ensure cache directory exists
try {
	if (!fs.existsSync(CACHE_DIR)) {
		fs.mkdirSync(CACHE_DIR, { recursive: true });
	}
} catch (e: unknown) {
	console.warn('Could not create .gallery_cache directory:', e);
}

const inMemorySessions = new Map<string, GallerySession>();

/** Save a session to server storage */
export function setServerSession(session: GallerySession): void {
	if (!session || !session.id) return;
	inMemorySessions.set(session.id, session);

	try {
		const filePath = path.join(CACHE_DIR, `${session.id}.json`);
		fs.writeFileSync(filePath, JSON.stringify(session), 'utf8');
	} catch (err: unknown) {
		console.error('Failed to write session to disk cache:', err);
	}
}

/** Get a session by ID */
export function getServerSession(id: string): GallerySession | null {
	if (!id) return null;
	if (inMemorySessions.has(id)) {
		return inMemorySessions.get(id) ?? null;
	}

	try {
		const filePath = path.join(CACHE_DIR, `${id}.json`);
		if (fs.existsSync(filePath)) {
			const raw = fs.readFileSync(filePath, 'utf8');
			const data = JSON.parse(raw) as GallerySession;
			inMemorySessions.set(id, data);
			return data;
		}
	} catch (err: unknown) {
		console.error('Failed to read session from disk cache:', err);
	}

	return null;
}
