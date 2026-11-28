import { json } from "../_shared.js";
import { cleanCode, load, seatOf, view } from "./_duel.js";
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), code = cleanCode(u.searchParams.get("code")), m = code.length === 6 ? await load(env, code) : null;
  if (!m) return json({ error: "That code was not found. Check it and try again." }, 404);
  const seat = seatOf(m, u.searchParams.get("t") || "");
  return json(await view(env, m, seat));
}
