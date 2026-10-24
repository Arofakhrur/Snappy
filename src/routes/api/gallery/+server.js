import { json } from '@sveltejs/kit';
import { setServerSession } from '#lib/server/galleryStore.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const data = await request.json();
    if (!data || !data.id) {
      return json({ error: 'Missing session ID or data' }, { status: 400 });
    }

    setServerSession(data);
    return json({ ok: true, id: data.id });
  } catch (err) {
    console.error('Error in POST /api/gallery:', err);
    return json({ error: 'Failed to save session' }, { status: 500 });
  }
}

/** @type {import('./$types').RequestHandler} */
export function GET() {
  return json({ ok: true, message: 'DISTUDIO Gallery API' });
}
