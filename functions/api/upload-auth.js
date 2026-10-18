// Password gate for the private event-photo page.
//
//   POST   /api/upload-auth   { "event": "<link>", "password": "..." } -> sets that event's session cookie
//   GET    /api/upload-auth?event=<link>                              -> { authenticated, event }
//   DELETE /api/upload-auth?event=<link>                              -> clears that event's cookie
//
// Every event (see functions/_lib/events.js) has its own link and password.
// Environment (Cloudflare Pages -> Settings -> Variables and Secrets):
//   EVENT_PASSWORDS   one "link: password" per line, e.g.  holiday-trunk-show-2026: Tinsel#4410
//   UPLOAD_PASSWORD   fallback for any event that has no line in EVENT_PASSWORDS.
//   UPLOAD_SECRET     optional extra key mixed into session signing.
//
// Login lockout: after 8 wrong passwords from one network address, that address is blocked for
// 15 minutes. Counters are kept in the photo bucket under _system/login/ (needs EVENT_PHOTOS).

import { hmacHex, safeEqual, json, sameOrigin, hasSession, createSession, sessionCookie, SESSION_SECONDS, findEvent, passwordFor } from '../_lib/upload-core.js';

const MAX_FAILS = 8;
const LOCK_SECONDS = 15 * 60;
const WINDOW_SECONDS = 15 * 60;

/* ---------- login lockout (stored in R2, best effort) ---------- */

async function limitKey(request, env, slug, password) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  return '_system/login/' + (await hmacHex((env.UPLOAD_SECRET || '') + '|' + password, 'ip:' + ip + '|' + slug)).slice(0, 32);
}

async function readLimit(env, key) {
  if (!env.EVENT_PHOTOS) return null;
  try {
    const obj = await env.EVENT_PHOTOS.get(key);
    return obj ? await obj.json() : null;
  } catch (e) { return null; }
}

async function writeLimit(env, key, state) {
  if (!env.EVENT_PHOTOS) return;
  try { await env.EVENT_PHOTOS.put(key, JSON.stringify(state)); } catch (e) { /* best effort */ }
}

async function clearLimit(env, key) {
  if (!env.EVENT_PHOTOS) return;
  try { await env.EVENT_PHOTOS.delete(key); } catch (e) { /* best effort */ }
}

function tooMany(seconds) {
  return json(
    { error: 'Too many attempts. Please try again in ' + Math.max(1, Math.ceil(seconds / 60)) + ' minutes.' },
    429,
    { 'Retry-After': String(seconds) }
  );
}

const NOT_FOUND = () => json({ error: 'This link is not valid.' }, 404);

/* ---------- handlers ---------- */

export async function onRequestGet(context) {
  const ev = findEvent(new URL(context.request.url).searchParams.get('event'));
  if (!ev) return NOT_FOUND();
  return json((await hasSession(context.request, context.env, ev.slug)) ? { authenticated: true, event: ev } : { authenticated: false });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ error: 'Forbidden' }, 403);

  let password = '', link = '';
  try {
    const body = await request.json();
    password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';
    link = typeof body.event === 'string' ? body.event.slice(0, 100) : '';
  } catch (e) {
    return json({ error: 'Bad request' }, 400);
  }
  const ev = findEvent(link);
  if (!ev) return NOT_FOUND();
  const expected = passwordFor(env, ev.slug);
  if (!expected) return json({ error: 'Uploads are not configured yet.' }, 500);

  const now = Math.floor(Date.now() / 1000);
  const key = await limitKey(request, env, ev.slug, expected);
  const state = await readLimit(env, key);
  if (state && state.lockedUntil > now) return tooMany(state.lockedUntil - now);

  const ok = password && (await safeEqual(password, expected));
  if (!ok) {
    const inWindow = state && now - state.first < WINDOW_SECONDS;
    const fails = inWindow ? state.fails + 1 : 1;
    const next = { fails, first: inWindow ? state.first : now, lockedUntil: fails >= MAX_FAILS ? now + LOCK_SECONDS : 0 };
    await writeLimit(env, key, next);
    await new Promise((resolve) => setTimeout(resolve, 700)); // slow down guessing
    if (next.lockedUntil) return tooMany(LOCK_SECONDS);
    return json({ error: 'Incorrect password.' }, 401);
  }

  if (state) await clearLimit(env, key);
  return json({ authenticated: true, event: ev }, 200, { 'Set-Cookie': sessionCookie(ev.slug, await createSession(env, ev.slug), SESSION_SECONDS) });
}

export async function onRequestDelete(context) {
  if (!sameOrigin(context.request)) return json({ error: 'Forbidden' }, 403);
  const ev = findEvent(new URL(context.request.url).searchParams.get('event'));
  if (!ev) return NOT_FOUND();
  return json({ authenticated: false }, 200, { 'Set-Cookie': sessionCookie(ev.slug, '', 0) });
}
