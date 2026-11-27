// Rare Swing on Netlify: the account + payment API. Every /api/... address comes here.
// The handlers live in /functions/api (shared with the Cloudflare version); this file points each address at one
// and gives them a "COINS" storage made from Netlify Blobs.
import { getStore } from "@netlify/blobs";
import * as claim from "../../functions/api/claim.js";
import * as checkout from "../../functions/api/create-checkout-session.js";
import * as state from "../../functions/api/state.js";
import * as webhook from "../../functions/api/webhook.js";
import * as login from "../../functions/api/auth/login.js";
import * as logout from "../../functions/api/auth/logout.js";
import * as me from "../../functions/api/auth/me.js";
import * as signup from "../../functions/api/auth/signup.js";

const ROUTES = {
  "/api/claim": claim, "/api/create-checkout-session": checkout, "/api/state": state, "/api/webhook": webhook,
  "/api/auth/login": login, "/api/auth/logout": logout, "/api/auth/me": me, "/api/auth/signup": signup,
};
const jsonRes = (o, status) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// Same three calls the Cloudflare KV has (get, put with an optional expiry, delete), on top of Netlify Blobs.
export function makeKV(store) {
  return {
    async get(key) {
      const raw = await store.get(key, { type: "text" });
      if (raw == null) return null;
      try { const o = JSON.parse(raw); if (o && o.__rs === 1) { if (o.exp && o.exp < Date.now()) { await store.delete(key); return null; } return o.v; } } catch (e) {}
      return raw;
    },
    async put(key, value, opts) {
      const exp = opts && opts.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : 0;
      await store.set(key, exp ? JSON.stringify({ __rs: 1, v: value, exp }) : value);
    },
    async delete(key) { await store.delete(key); },
  };
}

export function makeHandler(getKV, getEnv) {
  return async function handler(request) {
    const path = new URL(request.url).pathname.replace(/\/+$/, "");
    const mod = ROUTES[path];
    if (!mod) return jsonRes({ error: "Not found" }, 404);
    const m = request.method.toUpperCase();
    const fn = mod["onRequest" + m[0] + m.slice(1).toLowerCase()] || mod.onRequest;
    if (!fn) return jsonRes({ error: "Method not allowed" }, 405);
    const env = Object.assign({ COINS: getKV() }, getEnv());
    return fn({ request, env, params: {}, waitUntil() {} });
  };
}

export default makeHandler(
  () => makeKV(getStore({ name: "rare-swing", consistency: "strong" })),
  () => ({ STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET })
);
export const config = { path: "/api/*" };
