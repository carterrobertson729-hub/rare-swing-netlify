// POST /api/auth/login  { email, password }  -> logs in and returns the saved game
import { json } from "../_shared.js";
import { cleanEmail, hashPassword, sameString, startSession, sessionCookie, sameOriginJson, publicUser } from "../_auth.js";
const MAX_FAILS = 8;   // wrong passwords allowed per 15 minutes for one email
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "bad request" }, 400);
  let b; try { b = await request.json(); } catch { return json({ error: "bad request" }, 400); }
  const email = cleanEmail(b.email), failKey = "fail:" + email;
  const fails = Number(await env.COINS.get(failKey)) || 0;
  if (fails >= MAX_FAILS) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
  const user = JSON.parse((await env.COINS.get("user:" + email)) || "null");
  const ok = user && typeof b.password === "string" && sameString(await hashPassword(b.password, user.salt), user.hash);
  if (!ok) { await env.COINS.put(failKey, String(fails + 1), { expirationTtl: 900 }); return json({ error: "Wrong email or password." }, 401); }
  await env.COINS.delete(failKey);
  const acct = JSON.parse((await env.COINS.get("acct:" + user.id)) || "null") || { rev: 0, state: null };
  const token = await startSession(env, user.id);
  const res = json({ user: publicUser(user), rev: acct.rev, state: acct.state });
  res.headers.append("set-cookie", sessionCookie(token)); return res;
}
