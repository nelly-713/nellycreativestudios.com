// Streams one stored photo (or its thumbnail) to a signed-in user.
//
//   GET /api/upload-file?key=events/...            -> the image
//   GET /api/upload-file?key=events/...&dl=1       -> same, but as a download with its original name
//   GET /api/upload-file?key=thumbs/events/....jpg -> the small preview

import { hasSession, findEvent } from '../_lib/upload-core.js';

function plain(message, status) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.EVENT_PHOTOS) return plain('Photo storage is not connected yet.', 500);

  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  // Only event photos and their thumbnails are served (never the _system/ records), and only
  // to someone signed in to THAT event: the event is read from the key itself.
  const m = key.length <= 600 && /^(?:thumbs\/)?events\/([a-z0-9-]+)\/.+$/.exec(key);
  const ev = m && !key.includes('..') && findEvent(m[1]);
  if (!ev) return plain('Not found', 404);
  if (!(await hasSession(request, env, ev.slug))) return plain('Please sign in again.', 401);

  const obj = await env.EVENT_PHOTOS.get(key);
  if (!obj) return plain('Not found', 404);

  const type = (obj.httpMetadata && obj.httpMetadata.contentType) || '';
  const headers = new Headers({
    'Content-Type': /^image\/(jpeg|png|webp|heic)$/.test(type) ? type : 'application/octet-stream',
    'Cache-Control': 'private, max-age=3600',
    'X-Content-Type-Options': 'nosniff'
  });
  if (obj.httpEtag) headers.set('ETag', obj.httpEtag);

  if (url.searchParams.get('dl') === '1') {
    const original = (obj.customMetadata && obj.customMetadata.originalName) || key.split('/').pop();
    const safe = original.replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 150) || 'photo';
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`);
  }

  return new Response(obj.body, { status: 200, headers });
}
