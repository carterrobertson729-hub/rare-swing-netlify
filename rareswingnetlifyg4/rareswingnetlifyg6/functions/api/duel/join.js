import { json } from "../_shared.js";
import { sameOriginJson } from "../_auth.js";
import { newToken, cleanName, cleanCode, load, save } from "./_duel.js";
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "Bad request." }, 400);
  const body = await request.json().catch(() => ({}));
  const code = cleanCode(body.code), m = code.length === 6 ? await load(env, code) : null;
  if (!m) return json({ error: "That code was not found. Check it and try again." }, 404);
  if (m.guest) return json({ error: "Someone already joined that match." }, 409);
  m.guest = { name: cleanName(body.name), token: newToken() };
  await save(env, m);
  return json({ code, token: m.guest.token, role: "guest", hostName: m.host.name });
}
