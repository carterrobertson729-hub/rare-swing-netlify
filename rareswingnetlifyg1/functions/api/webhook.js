// POST /api/webhook   (Stripe calls this after a payment. Only here are coins credited, never on the success page.)
// Add this URL in Stripe: Developers > Webhooks > Add endpoint, event "checkout.session.completed".
import { PACKS, json, verifyStripeSignature } from "./_shared.js";
export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (!(await verifyStripeSignature(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET))) return json({ error: "bad signature" }, 400);
  let event; try { event = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return json({ ok: true, ignored: event.type });
  const s = event.data && event.data.object;
  if (!s || s.payment_status !== "paid") return json({ ok: true, ignored: "not paid" });
  const pack = PACKS[s.metadata && s.metadata.packId], acct = s.metadata && s.metadata.acct;
  if (!pack || !/^[0-9a-f]{32}$/.test(acct || "") || s.amount_total !== pack.cents) return json({ ok: true, ignored: "does not match a pack" });   // never credit a payment that does not match
  if (await env.COINS.get("paid:" + s.id)) return json({ ok: true, duplicate: true });                                   // Stripe can send the same event twice
  await env.COINS.put("paid:" + s.id, JSON.stringify({ acct, packId: s.metadata.packId, coins: pack.coins, cents: s.amount_total, at: Date.now() }));
  const pending = JSON.parse((await env.COINS.get("pending:" + acct)) || "[]");
  pending.push({ id: s.id, packId: s.metadata.packId, coins: pack.coins });
  await env.COINS.put("pending:" + acct, JSON.stringify(pending));
  return json({ ok: true, credited: pack.coins });
}
