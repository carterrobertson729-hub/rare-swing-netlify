import { json } from "../_shared.js";
import { sameOriginJson } from "../_auth.js";
import { cleanCode, newCode, newToken, load, save, seatOf, result, TTL } from "./_duel.js";
// "Play again" against the same friend. One asks, the other accepts or declines. Accepting opens a fresh match with both seats ready-made.
const reKey = code => "duelre:" + code;
const info = (re, seat, m) => {
  const out = { status: re ? re.status : "none", from: re ? re.from : null, fromName: re ? m[re.from].name : null };
  if (re && re.status === "accepted") { out.newCode = re.newCode; out.token = re.tokens[seat]; out.role = seat; }
  return out;
};
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "Bad request." }, 400);
  const b = await request.json().catch(() => ({}));
  const code = cleanCode(b.code), m = code.length === 6 ? await load(env, code) : null;
  if (!m || !m.guest) return json({ error: "That match was not found." }, 404);
  const seat = seatOf(m, typeof b.token === "string" ? b.token : "");
  if (!seat) return json({ error: "That is not your match." }, 403);
  const other = seat === "host" ? "guest" : "host";
  let re = JSON.parse((await env.COINS.get(reKey(code))) || "null");
  const act = b.action;
  if (act === "request") {
    if (!(await result(env, code, seat))) return json({ error: "Finish your game first." }, 409);
    if (re && re.status === "accepted") return json(info(re, seat, m));
    if (re && re.status === "pending" && re.from === other) re.status = "accepted";   // both asked at once: that is a yes
    else if (re && re.status === "pending") { /* already asked: nothing to change */ }
    else {
      let nc = ""; for (let i = 0; i < 8; i++) { const c = newCode(); if (!(await load(env, c))) { nc = c; break; } }
      if (!nc) return json({ error: "Try again." }, 503);
      const tokens = { host: newToken(), guest: newToken() };
      await save(env, { code: nc, created: Date.now(), host: { name: m.host.name, token: tokens.host }, guest: { name: m.guest.name, token: tokens.guest } });
      re = { from: seat, status: "pending", newCode: nc, tokens };
    }
    await env.COINS.put(reKey(code), JSON.stringify(re), { expirationTtl: TTL });
  } else if (act === "accept" || act === "decline") {
    if (re && re.status === "pending" && re.from === other) { re.status = act === "accept" ? "accepted" : "declined"; await env.COINS.put(reKey(code), JSON.stringify(re), { expirationTtl: TTL }); }
  }
  return json(info(re, seat, m));
}
