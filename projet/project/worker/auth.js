const COOKIE = 'admin_session';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function bytesToB64url(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlEncodeJson(obj) {
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));
}

function b64urlDecodeJson(s) {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bytesToB64url(new Uint8Array(sig));
}

export async function createSessionToken(secret) {
  const payload = b64urlEncodeJson({ exp: Date.now() + TTL_MS });
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(secret, token) {
  if (!secret || !token) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(secret, payload);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return false;
  try {
    const data = b64urlDecodeJson(payload);
    return typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function readSessionCookie(request) {
  const header = request.headers.get('Cookie') || '';
  const parts = header.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function setSessionCookie(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(TTL_MS / 1000)}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export async function requireAdmin(request, env) {
  if (!env.ADMIN_SECRET || !env.ADMIN_PASSWORD) {
    throw new Response(JSON.stringify({ error: 'Admin non configuré (ADMIN_PASSWORD / ADMIN_SECRET).' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const token = readSessionCookie(request);
  const ok = await verifySessionToken(env.ADMIN_SECRET, token);
  if (!ok) {
    throw new Response(JSON.stringify({ error: 'Non authentifié.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
