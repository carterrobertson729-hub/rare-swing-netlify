// GET /api/auth/me  -> the logged-in player and their saved game (or { user: null })
import { json } from "../_shared.js";
import { currentUser, publicUser } from "../_auth.js";
export async function onRequestGet({ request, env }) {
  const u = await currentUser(request, env); if (!u) return json({ user: null });
  const email = await env.COINS.get("uid:" + u.id), user = email ? JSON.parse((await env.COINS.get("user:" + email)) || "null") : null;
  const acct = JSON.parse((await env.COINS.get("acct:" + u.id)) || "null") || { rev: 0, state: null };
  return json({ user: user ? publicUser(user) : { id: u.id }, rev: acct.rev, state: acct.state });
}
