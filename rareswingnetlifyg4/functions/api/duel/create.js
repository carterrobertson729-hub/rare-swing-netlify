import { json } from "../_shared.js";
import { sameOriginJson } from "../_auth.js";
import { newCode, newToken, cleanName, load, save } from "./_duel.js";
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "Bad request." }, 400);
  const body = await request.json().catch(() => ({}));
  let code = "";
  for (let i = 0; i < 8; i++) { const c = newCode(); if (!(await load(env, c))) { code = c; break; } }
  if (!code) return json({ error: "Try again." }, 503);
  const m = { code, created: Date.now(), host: { name: cleanName(body.name), token: newToken() }, guest: null };
  await save(env, m);
  return json({ code, token: m.host.token, role: "host" });
}
