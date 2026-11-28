import { json } from "../_shared.js";
import { sameOriginJson } from "../_auth.js";
import { cleanCode, load, seatOf, view, seatState, saveSeatState } from "./_duel.js";
// A player updates their own lobby state: the team they picked, that they are ready, or how many questions they have finished.
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "Bad request." }, 400);
  const b = await request.json().catch(() => ({}));
  const code = cleanCode(b.code), m = code.length === 6 ? await load(env, code) : null;
  if (!m) return json({ error: "That match was not found." }, 404);
  const seat = seatOf(m, typeof b.token === "string" ? b.token : "");
  if (!seat) return json({ error: "That is not your match." }, 403);
  const st = await seatState(env, code, seat);
  let changed = false;
  if (!st.ready && Number.isInteger(b.team) && b.team >= 0 && b.team < 30) { st.team = b.team; changed = true; }
  if (b.ready === true && !st.ready && st.team !== null) { st.ready = true; st.readyAt = Date.now(); changed = true; }
  if (Number.isInteger(b.round) && b.round > (st.round || 0) && b.round <= 7) { st.round = b.round; changed = true; }
  if (changed) await saveSeatState(env, code, seat, st);
  return json(await view(env, m, seat));
}
