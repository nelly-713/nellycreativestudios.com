// Receives ONE photo per request from the private event-photo page and stores it in R2.
//
//   POST /api/upload-photos?event=<link>   multipart/form-data: file, thumb (optional small JPEG), uploader (optional)
//
// Requires a valid session cookie from /api/upload-auth, plus the EVENT_PHOTOS R2 bucket binding.
//
// The `event` query value is the event's link; it must be in functions/_lib/events.js AND the session cookie must be
// for that same event (each event has its own password).
//
// Stored at:  events/<event-slug>/<YYYY-MM-DD>/<timestamp>-<random>-<clean-name>.<ext>
// Thumbnail:  thumbs/<that same key>.jpg

import { json, sameOrigin, hasSession, findEvent, slugify } from '../_lib/upload-core.js';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per photo
const MAX_THUMB_BYTES = 2 * 1024 * 1024;

// Identify the real file type from its first bytes (never trust the filename or browser MIME).
function sniffImage(b) {
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return { mime: 'image/png', ext: 'png' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'].includes(brand)) {
      return { mime: 'image/heic', ext: 'heic' };
    }
  }
  return null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!sameOrigin(request)) return json({ error: 'Forbidden' }, 403);
  const ev = findEvent(new URL(request.url).searchParams.get('event'));
  if (!ev) return json({ error: 'This link is not valid.' }, 404);
  if (!(await hasSession(request, env, ev.slug))) return json({ error: 'Please sign in again.' }, 401);
  if (!env.EVENT_PHOTOS) return json({ error: 'Photo storage is not connected yet.' }, 500);

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_BYTES + MAX_THUMB_BYTES + 1024 * 1024) return json({ error: 'File is too large (max 25 MB).' }, 413);

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return json({ error: 'No file received.' }, 400);
    if (file.size === 0) return json({ error: 'File is empty.' }, 400);
    if (file.size > MAX_BYTES) return json({ error: 'File is too large (max 25 MB).' }, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(bytes);
    if (!kind) return json({ error: 'Only JPG, PNG, WebP or HEIC photos are accepted.' }, 415);

    const uploader = String(form.get('uploader') || '').trim().slice(0, 80);
    const originalName = String(file.name || 'photo').slice(0, 200);
    const baseName = slugify(originalName.replace(/\.[^.]+$/, ''), 'photo').slice(0, 40);
    const day = new Date().toISOString().slice(0, 10);
    const rand = crypto.randomUUID().slice(0, 8);
    const key = `events/${ev.slug}/${day}/${Date.now()}-${rand}-${baseName}.${kind.ext}`;

    await env.EVENT_PHOTOS.put(key, bytes, {
      httpMetadata: { contentType: kind.mime },
      customMetadata: { originalName, uploader, event: ev.name }
    });

    // Optional small preview used by the "View photos" grid. Never fails the upload.
    const thumb = form.get('thumb');
    if (thumb && typeof thumb !== 'string' && thumb.size > 0 && thumb.size <= MAX_THUMB_BYTES) {
      try {
        const tb = new Uint8Array(await thumb.arrayBuffer());
        const tk = sniffImage(tb);
        if (tk && tk.mime === 'image/jpeg') {
          await env.EVENT_PHOTOS.put(`thumbs/${key}.jpg`, tb, { httpMetadata: { contentType: 'image/jpeg' } });
        }
      } catch (e) { /* ignore */ }
    }

    return json({ success: true, key, size: bytes.byteLength });
  } catch (err) {
    return json({ error: 'Upload failed. Please try again.' }, 500);
  }
}
