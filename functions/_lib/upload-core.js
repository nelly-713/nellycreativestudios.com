// Shared helpers for the private event-photo functions
// (functions/api/upload-auth.js, upload-photos.js, upload-list.js, upload-file.js).
// Nothing in here is secret; passwords come from Cloudflare environment variables.

import { EVENTS } from './events.js';

export const SESSION_SECONDS = 60 * 60 * 8; // 8 hours
const enc = new TextEncoder();

/* ---------- crypto / http helpers ---------- */

export async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison: both sides are HMAC'd first so lengths always match.
export async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([hmacHex('ncs-compare', 'cmp:' + a), hmacHex('ncs-compare', 'cmp:' + b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders }
  });
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
}

// Reject cross-site POSTs (defence in depth on top of SameSite=Strict).
export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch (e) { return false; }
}

/* ---------- events (the library lives in functions/_lib/events.js) ---------- */

export function slugify(text, fallback = '') {
  const s = String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s || fallback;
}

// Returns { name, slug } for a link, or null when it is not in the library.
export function findEvent(link) {
  const wanted = String(link || '').toLowerCase();
  if (!wanted) return null;
  for (const e of EVENTS) {
    const slug = slugify(e.link);
    if (slug && slug === wanted) return { name: String(e.name || slug).trim(), slug };
  }
  return null;
}

/* ---------- per-event password ----------
   Cloudflare secret EVENT_PASSWORDS holds one "link: password" per line.
   An event with no line there falls back to UPLOAD_PASSWORD (so the first event keeps working). */

export function passwordFor(env, slug) {
  const lines = String(env.EVENT_PASSWORDS || '').split(/\r?\n/);
  for (const line of lines) {
    const i = line.indexOf(':');
    if (i < 1) continue;
    if (slugify(line.slice(0, i)) === slug) {
      const pw = line.slice(i + 1).trim();
      if (pw) return pw;
    }
  }
  return env.UPLOAD_PASSWORD || null;
}

/* ---------- login session (one cookie per event) ----------
   The signing key includes the event and its password: changing a password signs that
   event's users out, and a session for one event is useless for any other. */

const cookieName = (slug) => 'ncs_ev_' + slug;

function signingKey(env, slug) {
  const pw = passwordFor(env, slug);
  return pw ? `${env.UPLOAD_SECRET || ''}|${slug}|${pw}` : null;
}

export async function createSession(env, slug) {
  const key = signingKey(env, slug);
  if (!key) return null;
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expires}.${await hmacHex(key, 'session:' + expires)}`;
}

export async function hasSession(request, env, slug) {
  const key = signingKey(env, slug);
  if (!key) return false;
  const token = readCookie(request, cookieName(slug));
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expires = token.slice(0, dot);
  if (!/^\d+$/.test(expires) || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return safeEqual(token.slice(dot + 1), await hmacHex(key, 'session:' + expires));
}

export function sessionCookie(slug, value, maxAge) {
  return `${cookieName(slug)}=${value}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
