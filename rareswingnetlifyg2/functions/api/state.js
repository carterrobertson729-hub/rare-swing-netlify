// PUT /api/state  { rev, state }  -> saves the player's whole game to their account.
// `rev` is the version the browser last saw. If another device saved in between (409), the browser gets the newer save back and merges.
import { json } from "./_shared.js";
import { currentUser, sameOriginJson, cleanState } from "./_auth.js";
export async function onRequestPut({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "bad request" }, 400);
  const u = await currentUser(request, env); if (!u) return json({ error: "not logged in" }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: "bad request" }, 400); }
  const state = cleanState(b.state); if (!state) return json({ error: "bad save" }, 400);
  const cur = JSON.parse((await env.COINS.get("acct:" + u.id)) || "null") || { rev: 0, state: null };
  if (Number(b.rev) !== cur.rev) return json({ conflict: true, rev: cur.rev, state: cur.state }, 409);
  const rev = cur.rev + 1;
  await env.COINS.put("acct:" + u.id, JSON.stringify({ rev, state, updated: Date.now() }));
  return json({ ok: true, rev });
}
