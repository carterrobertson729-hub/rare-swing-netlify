// Shared helpers for 1v1 matches against a friend. A match lives in storage under "duel:CODE" for 2 days.
import { randomHex } from "../_auth.js";
export const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // no 0/O/1/I/L so codes are easy to read out loud
export const TTL = 2 * 86400;
export const cleanCode = c => (typeof c === "string" ? c.toUpperCase().replace(/[^A-Z0-9]/g, "") : "").slice(0, 6);
export const cleanName = n => (typeof n === "string" ? n.replace(/[<>&"]/g, "").trim().slice(0, 20) : "") || "Player";
export const newCode = () => { const b = crypto.getRandomValues(new Uint8Array(6)); return [...b].map(x => ALPHA[x % ALPHA.length]).join(""); };
export const newToken = () => randomHex(16);
export async function load(env, code) { const raw = await env.COINS.get("duel:" + code); return raw ? JSON.parse(raw) : null; }
export const save = (env, m) => env.COINS.put("duel:" + m.code, JSON.stringify(m), { expirationTtl: TTL });
export const seatOf = (m, token) => token && m.host.token === token ? "host" : token && m.guest && m.guest.token === token ? "guest" : null;
// Each player's final score is stored under its own key, so two people finishing at the same moment cannot overwrite each other.
export async function result(env, code, seat) { const raw = await env.COINS.get("duelres:" + code + ":" + seat); return raw ? JSON.parse(raw) : null; }
export const saveResult = (env, code, seat, r) => env.COINS.put("duelres:" + code + ":" + seat, JSON.stringify(r), { expirationTtl: TTL });
// What the caller may see. The friend's score stays hidden until the caller has finished their own game.
export async function view(env, m, seat) {
  const [hr, gr] = await Promise.all([result(env, m.code, "host"), m.guest ? result(env, m.code, "guest") : null]);
  const res = { host: hr, guest: gr };
  const out = { code: m.code, host: { name: m.host.name, done: !!hr }, guest: m.guest ? { name: m.guest.name, done: !!gr } : null, you: seat };
  if (seat && res[seat]) {
    const other = res[seat === "host" ? "guest" : "host"];
    if (other) { out.mine = res[seat]; out.theirs = other; out.result = decide(res[seat], other); }
  }
  return out;
}
// most runs wins; if tied, the better (rarer) answers win; if still tied it is a draw
export function decide(a, b) { return a.runs !== b.runs ? (a.runs > b.runs ? "win" : "loss") : a.pts !== b.pts ? (a.pts > b.pts ? "win" : "loss") : "draw"; }
