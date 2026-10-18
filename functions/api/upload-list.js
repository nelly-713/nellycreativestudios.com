// Lists the photos uploaded for one event (newest first). Needs that event's session.
//
//   GET /api/upload-list?event=<link>  ->  { event: {name, slug}, count, photos: [{ key, size, uploaded, name, uploader }] }

import { json, hasSession, findEvent } from '../_lib/upload-core.js';

const MAX_LISTED = 5000;

export async function onRequestGet(context) {
  const { request, env } = context;
  const ev = findEvent(new URL(request.url).searchParams.get('event'));
  if (!ev) return json({ error: 'This link is not valid.' }, 404);
  if (!(await hasSession(request, env, ev.slug))) return json({ error: 'Please sign in again.' }, 401);
  if (!env.EVENT_PHOTOS) return json({ error: 'Photo storage is not connected yet.' }, 500);

  try {
    const prefix = `events/${ev.slug}/`;
    const photos = [];
    let cursor;
    do {
      const page = await env.EVENT_PHOTOS.list({ prefix, cursor, limit: 1000, include: ['customMetadata'] });
      for (const o of page.objects) {
        const meta = o.customMetadata || {};
        photos.push({
          key: o.key,
          size: o.size,
          uploaded: new Date(o.uploaded).toISOString(),
          name: meta.originalName || o.key.split('/').pop(),
          uploader: meta.uploader || ''
        });
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor && photos.length < MAX_LISTED);

    photos.sort((a, b) => (a.uploaded < b.uploaded ? 1 : a.uploaded > b.uploaded ? -1 : 0));
    return json({ event: ev, count: photos.length, photos });
  } catch (err) {
    return json({ error: 'Could not load photos.' }, 500);
  }
}
