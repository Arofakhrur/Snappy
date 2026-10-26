import { json } from '@sveltejs/kit';
import { setServerSession } from '#lib/server/galleryStore';
import type { GallerySession } from '#lib/types';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = (await request.json()) as GallerySession | null;
		if (!data || !data.id) {
			return json({ error: 'Missing session ID or data' }, { status: 400 });
		}

		setServerSession(data);
		return json({ ok: true, id: data.id });
	} catch (err: unknown) {
		console.error('Error in POST /api/gallery:', err);
		return json({ error: 'Failed to save session' }, { status: 500 });
	}
};

export const GET: RequestHandler = () => {
	return json({ ok: true, message: 'DISTUDIO Gallery API' });
};
