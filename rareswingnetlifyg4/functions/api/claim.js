// POST /api/claim  body {}            -> { credits: [{ id, packId, coins }] }   coins that were paid for and are waiting for this account
// POST /api/claim  body { ack: [ids] }  -> removes those credits once the browser has added them   (player must be logged in)
import { json } from "./_shared.js";
import { currentUser, sameOriginJson } from "./_auth.js";
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "bad request" }, 400);
  const user = await currentUser(request, env); if (!user) return json({ credits: [], loggedOut: true });
  let b; try { b = await request.json(); } catch { b = {}; }
  const key = "pending:" + user.id;
  let pending = JSON.parse((await env.COINS.get(key)) || "[]");
  if (Array.isArray(b.ack) && b.ack.length) {
    pending = pending.filter(c => !b.ack.includes(c.id));
    if (pending.length) await env.COINS.put(key, JSON.stringify(pending)); else await env.COINS.delete(key);
  }
  return json({ credits: pending });
}
