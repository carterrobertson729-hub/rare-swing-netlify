// POST /api/auth/signup  { email, password, name, state }  -> creates the account, saves the player's current progress to it, logs them in.
import { json } from "../_shared.js";
import { cleanEmail, validEmail, hashPassword, randomHex, startSession, sessionCookie, sameOriginJson, publicUser, cleanState } from "../_auth.js";
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "bad request" }, 400);
  let b; try { b = await request.json(); } catch { return json({ error: "bad request" }, 400); }
  const email = cleanEmail(b.email), name = String(b.name || "").trim().slice(0, 24) || email.split("@")[0].slice(0, 24);
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);
  if (typeof b.password !== "string" || b.password.length < 8 || b.password.length > 128) return json({ error: "Use a password of at least 8 characters." }, 400);
  if (await env.COINS.get("user:" + email)) return json({ error: "That email already has an account. Log in instead." }, 409);
  const id = randomHex(16), salt = randomHex(16), hash = await hashPassword(b.password, salt);
  const user = { id, name, email, salt, hash, created: Date.now() };
  await env.COINS.put("user:" + email, JSON.stringify(user));
  await env.COINS.put("uid:" + id, email);
  const state = cleanState(b.state);   // everything this device already earned moves into the account
  await env.COINS.put("acct:" + id, JSON.stringify({ rev: 1, state, updated: Date.now() }));
  const token = await startSession(env, id);
  const res = json({ user: publicUser(user), rev: 1, state });
  res.headers.append("set-cookie", sessionCookie(token)); return res;
}
