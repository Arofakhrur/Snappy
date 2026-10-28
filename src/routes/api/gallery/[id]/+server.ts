import { json } from '@sveltejs/kit';
import { getServerSession } from '#lib/services/galleryStore';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
	const { id } = params;
	if (!id) {
		return json({ error: 'Missing session ID' }, { status: 400 });
	}

	const session = getServerSession(id);
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	return json(session);
};
