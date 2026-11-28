// POST /api/auth/logout
import { json } from "../_shared.js";
import { currentUser, sessionCookie, sameOriginJson } from "../_auth.js";
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "bad request" }, 400);
  const u = await currentUser(request, env); if (u) await env.COINS.delete("sess:" + u.token);
  const res = json({ ok: true }); res.headers.append("set-cookie", sessionCookie("", 0)); return res;
}
