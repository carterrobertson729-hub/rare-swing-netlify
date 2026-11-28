import { json } from "../_shared.js";
import { sameOriginJson } from "../_auth.js";
import { cleanCode, load, seatOf, view, result, saveResult } from "./_duel.js";
const num = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "Bad request." }, 400);
  const b = await request.json().catch(() => ({}));
  const code = cleanCode(b.code), m = code.length === 6 ? await load(env, code) : null;
  if (!m) return json({ error: "That match was not found." }, 404);
  const seat = seatOf(m, typeof b.token === "string" ? b.token : "");
  if (!seat) return json({ error: "That is not your match." }, 403);
  if (!(await result(env, code, seat))) await saveResult(env, code, seat, { runs: num(b.runs, 70), pts: num(b.pts, 100), hits: num(b.hits, 7), hr: num(b.hr, 7) });
  return json(await view(env, m, seat));
}
