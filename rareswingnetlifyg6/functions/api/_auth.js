// Accounts for Rare Swing: email + password, a session cookie, and the player's whole saved state in KV.
// KV keys:  user:<email>  { id, name, email, salt, hash, created }     acct:<id>  { rev, state, updated }
//           sess:<token>  { id, exp }                                  fail:<email>  login-failure counter (expires on its own)
import { json } from "./_shared.js";
export const SESSION_DAYS = 30;
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
export const randomHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
export async function hashPassword(password, saltHex) {   // PBKDF2-SHA256, 100,000 rounds (the most Cloudflare Workers allow)
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256));
}
export const sameString = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
export const cleanEmail = e => (typeof e === "string" ? e.trim().toLowerCase() : "");
export const validEmail = e => e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
export function cookieOf(request, name) {
  const m = (request.headers.get("cookie") || "").split(/;\s*/).map(c => c.split("=")).find(([k]) => k === name);
  return m ? m[1] : null;
}
export const sessionCookie = (token, maxAge = SESSION_DAYS * 86400) => `rs_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
// Only accept real JSON posts from our own pages (blocks forged cross-site form posts).
export function sameOriginJson(request) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) return false;
  const o = request.headers.get("origin"); return !o || o === new URL(request.url).origin;
}
export async function startSession(env, id) {
  const token = randomHex(32);
  await env.COINS.put("sess:" + token, JSON.stringify({ id, exp: Date.now() + SESSION_DAYS * 86400000 }), { expirationTtl: SESSION_DAYS * 86400 });
  return token;
}
// Who is calling? Returns { id, token } or null.
export async function currentUser(request, env) {
  const token = cookieOf(request, "rs_session"); if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const s = JSON.parse((await env.COINS.get("sess:" + token)) || "null");
  return s && s.exp > Date.now() ? { id: s.id, token } : null;
}
export const publicUser = u => ({ id: u.id, name: u.name, email: u.email });
export const MAX_STATE_BYTES = 400000;
// Keep only what a saved game may contain; never trust the browser's blob for anything else.
const KEEP = ["coins", "owned", "eq", "team", "muted", "plays", "credits", "purchases", "stats", "daily", "streak", "lastDaily", "decks", "seenQ", "creatorCoins", "unlimited", "passBought", "claimed", "layout", "dailyStarted"];
export function cleanState(s) {
  if (!s || typeof s !== "object" || Array.isArray(s)) return null;
  const out = {}; for (const k of KEEP) if (k in s) out[k] = s[k];
  if (typeof out.coins !== "number" || !isFinite(out.coins) || out.coins < 0) out.coins = 0;
  out.coins = Math.floor(out.coins);
  const str = JSON.stringify(out); return str.length > MAX_STATE_BYTES ? null : out;
}
export { json };
