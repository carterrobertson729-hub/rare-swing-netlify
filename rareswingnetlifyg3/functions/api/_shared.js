// Shared helpers for the Rare Swing payment functions (Cloudflare Pages Functions).
// KEEP `PACKS` IN SYNC with COIN_PACKS in common.js. The server never trusts a price or coin amount sent by the browser.
export const PACKS = {
  bag:       { name: "Bleacher Bag",       cents: 99,   coins: 100 },
  dugout:    { name: "Dugout Pack",        cents: 299,  coins: 350 },
  bullpen:   { name: "Bullpen Bundle",     cents: 499,  coins: 700 },
  clubhouse: { name: "Clubhouse Chest",    cents: 999,  coins: 1700 },
  hof:       { name: "Hall of Fame Vault", cents: 1999, coins: 4500 }
};
export const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export const validPid = pid => typeof pid === "string" && /^[A-Za-z0-9-]{20,64}$/.test(pid);

// Talk to Stripe's REST API with plain fetch (no SDK needed). `params` is a flat object with bracket keys.
export async function stripePost(path, params, secretKey) {
  const body = new URLSearchParams(params);
  const res = await fetch("https://api.stripe.com/v1" + path, { method: "POST", headers: { authorization: "Bearer " + secretKey, "content-type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || "Stripe error");
  return data;
}

// Verify that a webhook really came from Stripe: header "t=...,v1=..." signed with your endpoint's signing secret.
export async function verifyStripeSignature(rawBody, header, secret, toleranceSec = 300) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")));
  const t = parts.t, sigs = header.split(",").filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + rawBody));
  const expected = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
  return sigs.some(s => s.length === expected.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}
