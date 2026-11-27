// POST /api/create-checkout-session   body: { packId }   (player must be logged in)   ->   { url }   (send the player to this Stripe-hosted page)
import { PACKS, json, stripePost } from "./_shared.js";
import { currentUser, sameOriginJson } from "./_auth.js";
export async function onRequestPost({ request, env }) {
  if (!sameOriginJson(request)) return json({ error: "bad request" }, 400);
  const user = await currentUser(request, env); if (!user) return json({ error: "Log in to buy coins." }, 401);
  let b; try { b = await request.json(); } catch { return json({ error: "bad request" }, 400); }
  const pack = PACKS[b.packId];
  if (!pack) return json({ error: "bad request" }, 400);
  const origin = new URL(request.url).origin;
  try {
    const s = await stripePost("/checkout/sessions", {
      mode: "payment",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(pack.cents),
      "line_items[0][price_data][product_data][name]": pack.coins.toLocaleString("en-US") + " Rare Swing coins (" + pack.name + ")",
      "metadata[acct]": user.id,
      "metadata[packId]": b.packId,
      client_reference_id: user.id,
      success_url: origin + "/coins.html?paid=1",
      cancel_url: origin + "/coins.html"
    }, env.STRIPE_SECRET_KEY);
    return json({ url: s.url });
  } catch (e) { return json({ error: "could not start checkout" }, 502); }
}
