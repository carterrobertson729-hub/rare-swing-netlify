/* ================= SETTINGS YOU CAN CHANGE ================= */
const RS_CONFIG = {
  freePlaysPerDay: 3,        /* free games per day, not counting the daily game */
  passCost: 500,             /* coins, once: free games all day, every day, forever (the Play Pass) */
  dailyBonus: 10,            /* the ONLY coins earned in the game: finishing the daily game */
  startCoins: 100,           /* every new player starts with this many */
  accounts: {
    enabled: false,          /* true on the deployed site (needs the /api functions). Players log in, and coins and progress follow them to any device. */
    api: "/api"
  },
  stripe: {
    demoMode: true,          /* true: the Buy buttons run a fake checkout and add coins on this device, no money moves (use this on the preview page).
                                false: real payments. Needs the site deployed with the /api functions. See STRIPE_SETUP.md */
    api: "/api"              /* where the payment functions live: /api/create-checkout-session, /api/webhook, /api/claim */
  }
};
/* The live site turns accounts and real payments on with a small settings.js file (it ships in the zip). The preview has no such file, so it stays in demo mode. */
{ const S = window.RS_SETTINGS || {}; if (S.accounts) RS_CONFIG.accounts.enabled = true; if (S.realPayments) RS_CONFIG.stripe.demoMode = false; }
/* Coin packs. cents is the price in US cents. Keep these in sync with the prices on your server. */
const COIN_PACKS = [
  { id: "bag", name: "Bleacher Bag", coins: 100, cents: 99, acc: "#19e3c2" },
  { id: "dugout", name: "Dugout Pack", coins: 350, cents: 299, acc: "#4f8fe0" },
  { id: "bullpen", name: "Bullpen Bundle", coins: 700, cents: 499, acc: "#e0703d", tag: "Popular" },
  { id: "clubhouse", name: "Clubhouse Chest", coins: 1700, cents: 999, acc: "#efc752", tag: "Best value" },
  { id: "hof", name: "Hall of Fame Vault", coins: 4500, cents: 1999, acc: "#ff7eb6" }
];
const CREATOR_HASH = 2186011288322691;
/* ============================================================ */

/* Rare Swing: shared by every page. Saved data, coins, the shop catalog, daily-challenge seed, nav bar. */
const JERSEYS = [
  { id: "classic", name: "Team Classic", price: 0, note: "Your team's own colors" },
  { id: "black", name: "Midnight", price: 150, c1: "#15171b", c2: "#e9e6dc", note: "Blackout alternate" },
  { id: "flame", name: "Fire Red", price: 200, c1: "#e23a22", c2: "#fff2c2", note: "Hot and loud" },
  { id: "royal", name: "Royal Purple", price: 250, c1: "#5b2a86", c2: "#f0c75e", note: "Purple and gold" },
  { id: "gold", name: "Gold Edition", price: 350, c1: "#e0b030", c2: "#15171b", note: "Champion gold" }
];
const HELMETS = [
  { id: "team", name: "Team Helmet", price: 0, note: "Trimmed in your team's color" },
  { id: "carbon", name: "Carbon Black", price: 40, color: "#16181c", note: "Matte black shell" },
  { id: "blue", name: "Royal Blue", price: 50, color: "#2f6fe0", note: "Bright royal blue" },
  { id: "flame", name: "Flame Red", price: 60, color: "#e23a22", note: "Fire-engine red" },
  { id: "chrome", name: "Gold Chrome", price: 100, color: "#f0c24a", note: "Shiny gold finish" }
];
const FIELDS = [
  { id: "grass", name: "Classic Grass", price: 0, grass: "#2c6a3e", stripe: "#337646", dirt: "#a8633b", infield: "#2f7040", stand: "#17261e", line: "#f2efe4", note: "Cut and striped" },
  { id: "autumn", name: "Autumn", price: 400, grass: "#6b7f3a", stripe: "#778b43", dirt: "#8a4b2a", infield: "#6f8340", stand: "#26301a", line: "#f2efe4", note: "Late-season turf" },
  { id: "blue", name: "Blue Turf", price: 450, grass: "#245d8f", stripe: "#2d6ca3", dirt: "#c98d56", infield: "#2a679c", stand: "#10253a", line: "#f2efe4", note: "Blue artificial turf" },
  { id: "clay", name: "Desert Clay", price: 550, grass: "#b88a4e", stripe: "#c29655", dirt: "#7c4a2c", infield: "#bb8c50", stand: "#3a2a1a", line: "#f7efdc", note: "Sun-baked outfield" },
  { id: "night", name: "Neon Turf", price: 750, grass: "#0f3a35", stripe: "#115046", dirt: "#6a2c8c", infield: "#12423a", stand: "#0a1f1c", line: "#38f0d0", note: "Arcade at midnight" }
];
const CATALOG = { jersey: JERSEYS, helmet: HELMETS, field: FIELDS };

/* ============ daily drops: new jerseys, helmets and fields every day ============
   Everything is generated from the date, so it is the same for every player and needs no server.
   A drop is only in the shop on its own day. Once you own one, it is yours to keep and wear. */
const DROP_ADJ = ["Crimson", "Midnight", "Sunset", "Harbor", "Electric", "Velvet", "Copper", "Glacier", "Ember", "Jade", "Neon", "Dusty", "Royal", "Arctic", "Golden", "Smoky", "Coral", "Cobalt", "Mint", "Rustic", "Lunar", "Solar", "Stormy", "Prairie", "Scarlet", "Indigo", "Amber", "Frosty", "Orchid", "Slate", "Marigold", "Plum"];
const DROP_JNOUN = ["Dawn", "Dusk", "Heritage", "Night Game", "Opening Day", "Spring", "Autumn", "Rally", "Slugger", "Closer", "Rookie", "Legend", "Skyline", "Bullpen", "Dugout", "Bleacher", "Walk-Off", "Pennant", "Doubleheader", "Clubhouse"];
const DROP_HNOUN = ["Shell", "Crown", "Dome", "Gloss", "Matte", "Chrome", "Satin", "Flash", "Lid", "Guard", "Visor", "Pro"];
const DROP_FNOUN = ["Turf", "Meadow", "Diamond", "Park", "Clay", "Grounds", "Yard", "Lawn", "Stadium", "Infield", "Outfield", "Arena"];
const RARITY = [["Common", "#aab4bd"], ["Rare", "#4f8fe0"], ["Epic", "#b27cf0"], ["Legendary", "#efc752"]];
const dropKey = n => { const t = new Date(n * 864e5), p = v => String(v).padStart(2, "0"); return t.getUTCFullYear() + "-" + p(t.getUTCMonth() + 1) + "-" + p(t.getUTCDate()); };
const dropNum = key => { const [y, m, dd] = key.split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, dd) / 864e5); };
function dropRand(str) {
  let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = (h = Math.imul(h ^ h >>> 16, 2246822507), h = Math.imul(h ^ h >>> 13, 3266489909), (h ^= h >>> 16) >>> 0);
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hslHex(h, s, l) { h = (h % 360 + 360) % 360; s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return "#" + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join(""); }
const r5 = v => Math.round(v / 5) * 5;
/* one item: kind "jersey" | "helmet" | "field", slot 0..n, forced rarity 0..3 or null */
function makeDrop(kind, dayNo, slot, force) {
  const R = dropRand("rareswing-drop|" + dayNo + "|" + kind + "|" + slot), pick = a => a[R() * a.length | 0];
  let rar = force != null ? force : (() => { const x = R(); return x < .5 ? 0 : x < .8 ? 1 : x < .955 ? 2 : 3; })();
  const rr = RARITY[rar], id = "d" + dayNo + "-" + kind[0] + slot, adj = pick(DROP_ADJ);
  const sat = [48, 62, 78, 92][rar], range = { jersey: [[70, 135], [160, 265], [300, 480], [550, 800]], helmet: [[30, 60], [70, 120], [140, 220], [260, 400]], field: [[350, 500], [550, 750], [800, 1100], [1200, 1800]] }[kind][rar];
  const price = r5(range[0] + R() * (range[1] - range[0]));
  const base = { id, drop: true, day: dropKey(dayNo), rarity: rar, price, note: "Daily drop \u00b7 " + rr[0] };
  const hue = R() * 360;
  if (kind === "jersey") {
    const c1 = hslHex(hue, sat, 28 + R() * 24), trims = ["#f4efe0", "#15171b", "#efc752", hslHex(hue + 180, 70, 70)], c2 = rar >= 2 && R() < .6 ? "#efc752" : pick(trims);
    return Object.assign(base, { name: adj + " " + pick(DROP_JNOUN), c1, c2 });
  }
  if (kind === "helmet") return Object.assign(base, { name: adj + " " + pick(DROP_HNOUN), color: hslHex(hue, sat + 6, rar === 3 ? 58 : 38 + R() * 16) });
  const exotic = rar >= 2 && R() < .6, gh = exotic ? hue : 105 + R() * 60, dh = exotic ? hue + 150 : 18 + R() * 20;
  return Object.assign(base, { name: adj + " " + pick(DROP_FNOUN), grass: hslHex(gh, sat - 8, 27), stripe: hslHex(gh, sat - 8, 31), dirt: hslHex(dh, 45 + rar * 10, 42), infield: hslHex(gh, sat - 8, 29), stand: hslHex(gh, 30, 9), line: rar >= 2 ? hslHex(hue + 40, 90, 70) : "#f2efe4" });
}
/* The shop gets new items every day, starting on DROP_LAUNCH: 1 or 2 new jerseys, 1 or 2 new helmets and 1 or 2 new fields. They stay in the shop once they arrive. Before the launch day there are none. */
const DROP_LAUNCH = "2026-11-27";
const dropCache = {};
function dropsFor(key) {   /* what arrives on this one day */
  if (dropCache[key]) return dropCache[key];
  const n = dropNum(key), out = { jersey: [], helmet: [], field: [] };
  if (n >= dropNum(DROP_LAUNCH)) ["jersey", "helmet", "field"].forEach(kind => { const cnt = dropRand("rareswing-count|" + n + "|" + kind)() < .5 ? 1 : 2; for (let s = 0; s < cnt; s++) out[kind].push(makeDrop(kind, n, s, null)); });
  return dropCache[key] = out;
}
function releasedUpTo(key) {   /* every day's arrivals from launch through this day, newest day first */
  const out = [], start = dropNum(DROP_LAUNCH);
  for (let n = dropNum(key); n >= start; n--) { const k = dropKey(n); out.push(Object.assign({ key: k }, dropsFor(k))); }
  return out;
}
const KIND_CH = { j: "jersey", h: "helmet", f: "field" };
function lookupItem(kind, id) {
  const base = CATALOG[kind].find(x => x.id === id); if (base) return base;
  const m = /^d(\d+)-([jhf])(\d)$/.exec(id || ""); if (!m || KIND_CH[m[2]] !== kind) return null;
  const list = dropsFor(dropKey(+m[1]))[kind]; return list[+m[3]] || null;
}


const RS = (() => {
  const KEY = "rareswing-site-v1";
  const fresh = () => ({ ver: 3, coins: RS_CONFIG.startCoins, owned: { jersey: ["classic"], helmet: ["team"], field: ["grass"] }, eq: { jersey: "classic", helmet: "team", field: "grass" }, team: "NYY", muted: false, plays: { day: "", used: 0 }, credits: 0, purchases: [],
    stats: { games: 0, wins: 0, losses: 0, hr: 0, hits: 0, best: 0 }, daily: {}, streak: 0, lastDaily: "" });
  let d = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) { const x = JSON.parse(raw); if (!x.ver && !(x.purchases && x.purchases.length)) x.coins = Math.min(typeof x.coins === "number" ? x.coins : RS_CONFIG.startCoins, RS_CONFIG.startCoins);   /* older saves started on 120: bring them to 100 unless they bought coins */
    const legacyUnl = !x.ver || x.ver < 3;
    d = Object.assign(fresh(), x, { owned: Object.assign(fresh().owned, x.owned), eq: Object.assign(fresh().eq, x.eq), stats: Object.assign(fresh().stats, x.stats) });
    if (legacyUnl) { if (d.unlimited && !d.passBought) d.unlimited = false; d.ver = 3; try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e2) {} }   /* a pass that came from the old creator code is taken back once */
  } } catch (e) {}

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} paintCoins(); queueSync(); };
  const pad = n => String(n).padStart(2, "0");
  const dayKey = (t = new Date()) => t.getFullYear() + "-" + pad(t.getMonth() + 1) + "-" + pad(t.getDate());
  const yesterday = () => { const t = new Date(); t.setDate(t.getDate() - 1); return dayKey(t); };
  /* seeded random numbers, so the daily game is the same for everyone */
  const hash = str => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }; };
  const seeded = str => { let a = hash(str)(); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  /* plays: a few free ones each day, then they cost coins */
  const rollDay = () => { if (!d.plays || d.plays.day !== dayKey()) d.plays = { day: dayKey(), used: 0 }; };
  const freeLeft = () => { if (d.unlimited) return 999; rollDay(); return Math.max(0, RS_CONFIG.freePlaysPerDay - d.plays.used); };
  const playsAvailable = () => freeLeft();
  const spendPlay = () => { if (d.unlimited) return true; rollDay(); if (freeLeft() > 0) { d.plays.used++; save(); return true; } return false; };
  const buyPass = () => { if (d.unlimited || d.coins < RS_CONFIG.passCost) return false; d.coins -= RS_CONFIG.passCost; d.unlimited = true; d.passBought = true; save(); return true; };
  /* demo checkout only: credits coins on this device. Real money goes through your server and Stripe. */
  const demoGrant = pack => { d.coins += pack.coins; d.purchases.push({ id: pack.id, coins: pack.coins, cents: pack.cents, at: Date.now(), demo: true }); save(); };
  const price = cents => "$" + (cents / 100).toFixed(2);
  const jersey = id => lookupItem("jersey", id) || JERSEYS[0];
  const field = id => lookupItem("field", id) || FIELDS[0];
  /* the equipped jersey recolors your team */
  const lumOf = hex => { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; };
  /* trim color: the team's own color, unless it would disappear against the jersey */
  const trim = (j, t) => j.c2 !== "@c1" ? j.c2 : (Math.abs(lumOf(t.c1) - lumOf(j.c1)) < .28 ? (Math.abs(lumOf(t.c2) - lumOf(j.c1)) < .28 ? "#15171b" : t.c2) : t.c1);
  const dress = t => { const j = jersey(d.eq.jersey); if (!j || !j.c1) return t; return Object.assign({}, t, { c1: j.c1, c2: trim(j, t) }); };
  const applyField = (f = field(d.eq.field)) => {
    const r = document.documentElement.style;
    r.setProperty("--grass", f.grass); r.setProperty("--stripe", f.stripe); r.setProperty("--dirt", f.dirt);
    r.setProperty("--infield", f.infield); r.setProperty("--stand", f.stand); r.setProperty("--line", f.line);
  };
  const helmet = id => lookupItem("helmet", id) || HELMETS[0];
  /* helmet color for a batting team: the chosen color, or the team's trim color if it stands out from the jersey */
  const helmetColor = t => { const h = helmet(d.eq.helmet); if (h.color) return h.color; return Math.abs(lumOf(t.c2) - lumOf(t.c1)) > .25 ? t.c2 : (lumOf(t.c1) > .5 ? "#15171b" : "#f2efe4"); };
  const buy = (kind, id) => {
    const item = lookupItem(kind, id);
    if (!item || d.owned[kind].includes(id) || d.coins < item.price) return false;
    d.coins -= item.price; d.owned[kind].push(id); d.eq[kind] = id; save(); return true;
  };
  const cyrb = s => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return 4294967296 * (2097151 & h2) + (h1 >>> 0); };
  const redeem = code => {
    if (cyrb("rareswing:" + String(code).trim().toLowerCase()) !== CREATOR_HASH) return "bad";
    const out = releasedUpTo(dayKey());   /* everything in the shop today, never what has not arrived yet */
    [["jersey", JERSEYS], ["helmet", HELMETS], ["field", FIELDS]].forEach(([k, list]) => [...list, ...out.flatMap(day => day[k])].forEach(i => { if (!d.owned[k].includes(i.id)) d.owned[k].push(i.id); }));
    d.unlimited = true; d.passBought = true;   /* the code includes the Play Pass: free games, forever */
    let first = !d.creatorCoins; if (first) { d.coins += 10000; d.creatorCoins = true; }
    save(); return first ? "ok" : "again";
  };
  /* real payments: coins that Stripe confirmed (through the server webhook) are waiting under this account. Add each one once. */
  const claimPurchases = async () => {
    if (RS_CONFIG.stripe.demoMode || !A.user) return 0;
    try {
      const res = await fetch(RS_CONFIG.stripe.api + "/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json(); let added = 0; const ids = [];
      d.claimed = d.claimed || [];
      for (const cr of data.credits || []) {
        ids.push(cr.id);
        if (d.claimed.includes(cr.id)) continue;   /* already added (the confirm call may have been lost) */
        d.coins += cr.coins; added += cr.coins; d.claimed.push(cr.id); d.purchases.push({ id: cr.packId, coins: cr.coins, at: Date.now(), session: cr.id });
      }
      if (added) save();
      if (ids.length) fetch(RS_CONFIG.stripe.api + "/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ack: ids }) }).catch(() => {});
      return added;
    } catch (e) { return 0; }
  };
  /* ---------- accounts: log in and everything is saved to the account, on every device ---------- */
  const ACC = RS_CONFIG.accounts || {}, A = { user: null, rev: 0, timer: null, busy: false, again: false, ready: null };
  const SYNC_KEYS = ["coins", "owned", "eq", "team", "muted", "plays", "credits", "purchases", "stats", "daily", "streak", "lastDaily", "decks", "seenQ", "creatorCoins", "unlimited", "passBought", "claimed", "layout", "dailyStarted"];
  const syncable = () => { const o = {}; SYNC_KEYS.forEach(k => { if (k in d) o[k] = d[k]; }); return o; };
  const aApi = async (path, method, body, keepalive) => { const r = await fetch(ACC.api + path, { method, headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: !!keepalive, body: body === undefined ? undefined : JSON.stringify(body) }); let j = {}; try { j = await r.json(); } catch (e) {} return Object.assign({ status: r.status }, j); };
  const localWrite = () => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  const build = st => { const f = fresh(), s = st || {}; const o = Object.assign(f, s, { owned: Object.assign(f.owned, s.owned), eq: Object.assign(f.eq, s.eq), stats: Object.assign(f.stats, s.stats) }); o.ver = 3; return o; };
  const adopt = st => { d = build(st); localWrite(); };   /* replace this device's game with the saved one */
  const mergeIn = st => {   /* a newer save from another device: keep every item either one owns, the best stats, and the lower coin count (never duplicate coins) */
    if (!st) return;
    for (const k of ["jersey", "helmet", "field"]) d.owned[k] = [...new Set([...(st.owned && st.owned[k] || []), ...d.owned[k]])];
    for (const k in (st.stats || {})) d.stats[k] = Math.max(d.stats[k] || 0, st.stats[k] || 0);
    d.coins = Math.min(d.coins, typeof st.coins === "number" ? st.coins : d.coins);
    d.claimed = [...new Set([...(st.claimed || []), ...(d.claimed || [])])];
    d.streak = Math.max(d.streak || 0, st.streak || 0);
    d.daily = Object.assign({}, st.daily || {}, d.daily || {});
    if (st.unlimited) d.unlimited = true;
  };
  const push = async () => {
    if (!A.user) return;
    if (A.busy) { A.again = true; return; }
    A.busy = true;
    try {
      let r = await aApi("/state", "PUT", { rev: A.rev, state: syncable() }, true);
      if (r.status === 409) { mergeIn(r.state); A.rev = r.rev; localWrite(); r = await aApi("/state", "PUT", { rev: A.rev, state: syncable() }, true); }
      if (r.ok) A.rev = r.rev;
    } catch (e) {} finally { A.busy = false; if (A.again) { A.again = false; queueSync(); } }
  };
  function queueSync() { if (!A.user) return; clearTimeout(A.timer); A.timer = setTimeout(push, 1200); }
  const announce = () => { try { document.dispatchEvent(new Event("rs-account")); } catch (e) {} };
  const reloadIfPlaying = () => { if (document.body && document.body.classList.contains("playing")) return; try { if (sessionStorage.getItem("rs-reloaded") === String(A.rev)) return; sessionStorage.setItem("rs-reloaded", String(A.rev)); } catch (e) {} location.reload(); };
  const boot = async () => {
    if (!ACC.enabled) return;
    try {
      const r = await aApi("/auth/me", "GET");
      if (!r.user) { announce(); return; }
      A.user = r.user; A.rev = r.rev || 0;
      if (r.state) {
        const server = build(r.state), pick = o => JSON.stringify(SYNC_KEYS.map(k => o[k]));
        const same = pick(server) === pick(d);
        if (!same) { adopt(r.state); announce(); reloadIfPlaying(); } else announce();
      } else { queueSync(); announce(); }
      claimPurchases();
    } catch (e) { announce(); }
  };
  const signIn = async (mode, email, password, name) => {   /* mode: "login" | "signup" */
    const r = await aApi("/auth/" + mode, "POST", mode === "signup" ? { email, password, name, state: syncable() } : { email, password });
    if (!r.user) return { error: r.error || "Something went wrong. Try again." };
    A.user = r.user; A.rev = r.rev || 0;
    if (mode === "login") { const local = d; adopt(r.state); for (const k of ["jersey", "helmet", "field"]) d.owned[k] = [...new Set([...d.owned[k], ...local.owned[k]])]; localWrite(); queueSync(); }
    announce(); claimPurchases(); return { user: r.user };
  };
  const signOut = async () => { try { await aApi("/auth/logout", "POST", {}); } catch (e) {} try { localStorage.removeItem(KEY); sessionStorage.removeItem("rs-reloaded"); } catch (e) {} location.reload(); };
  window.addEventListener("pagehide", () => { if (A.user && A.timer) { clearTimeout(A.timer); A.timer = null; push(); } });
  const equip = (kind, id) => { if (d.owned[kind].includes(id)) { d.eq[kind] = id; save(); } };
  return { get d() { return d; }, get account() { return { user: A.user, enabled: !!ACC.enabled, ready: A.ready }; }, signIn, signOut, boot: () => (A.ready = boot()), redeem, claimPurchases, drops: () => dropsFor(dayKey()), released: () => releasedUpTo(dayKey()), lookup: lookupItem, save, trim, helmet, helmetColor, freeLeft, playsAvailable, spendPlay, buyPass, demoGrant, price, dayKey, yesterday, seeded, jersey, field, dress, applyField, buy, equip };
})();

/* a jersey drawn in the team's colors */
function jersey(t, px) {
  return '<svg viewBox="0 0 100 100" width="' + px + '" height="' + px + '" aria-hidden="true">' +
    '<path d="M31 12 L12 22 L2 48 L20 55 L27 43 L27 93 L73 93 L73 43 L80 55 L98 48 L88 22 L69 12 Q50 27 31 12 Z" fill="' + t.c1 + '" stroke="' + t.c2 + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M4 47 L19 54 M96 47 L81 54" stroke="' + t.c2 + '" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M31 12 Q50 27 69 12" fill="none" stroke="' + t.c2 + '" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M50 24 L50 93" stroke="' + t.c2 + '" stroke-width="2" opacity=".5"/>' +
    '<text x="50" y="68" text-anchor="middle" font-family="Oswald, Arial Narrow, sans-serif" font-weight="700" font-size="' + (t.abbr.length > 2 ? 21 : 26) + '" fill="' + t.c2 + '">' + t.abbr + '</text></svg>';
}


/* ---- nav bar ---- */
function paintCoins() { document.querySelectorAll("[data-coins]").forEach(el => { el.textContent = RS.d.coins; }); }
(function nav() {
  const page = (document.body && document.body.dataset.page) || "";
  const links = [["index.html", "Home", "home"], ["daily.html", "Daily", "daily"], ["play.html", "Play", "play"], ["shop.html", "Shop", "shop"]];
  const ball = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#f2efe4"/><path d="M7 6c4 4 4 16 0 20M25 6c-4 4-4 16 0 20" stroke="#e0703d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  const el = document.createElement("header");
  el.className = "site";
  el.innerHTML = '<div class="siteIn"><a class="logo" href="index.html">' + ball + '<span>Rare Swing</span></a><nav aria-label="Main">' +
    links.map(([h, t, k]) => '<a href="' + h + '"' + (k === page ? ' aria-current="page"' : "") + ">" + t + "</a>").join("") +
    '</nav><div class="navR"><a class="coins" href="coins.html" aria-label="Coins. Get more coins"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="8.5" fill="#efc752" stroke="#9a7416" stroke-width="1.5"/><text x="10" y="14" text-anchor="middle" font-size="11" font-weight="700" fill="#6b4f0a" font-family="Oswald, sans-serif">R</text></svg><span class="coinLbl">Coins</span><span data-coins>0</span><b class="plus" aria-hidden="true">+</b></a>' +
    '<button type="button" class="mute" id="mute" aria-pressed="false"></button>' + "</div></div>";
  document.body.insertBefore(el, document.body.firstChild);
  paintCoins();
  RS.applyField();
})();


/* ---- stadium ambience: plays on every page except while a game is being played ---- */
window.RSAmb = (function () {
  let ac = null, gain = null, src = null, buf = null, loading = null, want = false, t0 = 0, off0 = 0;
  const LEVEL = .55, KEY = "rs-amb-pos";
  const muted = () => !!RS.d.muted;
  function savePos() { try { if (src && ac) sessionStorage.setItem(KEY, String((off0 + ac.currentTime - t0) % buf.duration)); } catch (e) {} }
  function load() {
    if (loading) return loading;
    loading = fetch("audio/stadium-ambience.mp3").then(r => r.arrayBuffer()).then(a => new Promise((ok, no) => ac.decodeAudioData(a, ok, no))).then(b => { buf = b; }).catch(e => { loading = null; console.error(e); });
    return loading;
  }
  function begin() {
    if (!want || src || !buf) return;
    let pos = 0; try { pos = parseFloat(sessionStorage.getItem(KEY)) || 0; } catch (e) {}
    src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    gain = ac.createGain(); gain.gain.value = 0; src.connect(gain); gain.connect(ac.destination);
    off0 = pos % buf.duration; t0 = ac.currentTime; src.start(0, off0);
    gain.gain.setTargetAtTime(muted() ? 0 : LEVEL, ac.currentTime, .6);
  }
  function wake() {
    if (!want) return;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    const go = () => load().then(begin);
    if (ac.state === "suspended") ac.resume().then(go, go); else go();
  }
  function arm() {
    const h = () => { document.removeEventListener("pointerdown", h, true); document.removeEventListener("keydown", h, true); wake(); };
    document.addEventListener("pointerdown", h, true); document.addEventListener("keydown", h, true);
  }
  window.addEventListener("pagehide", savePos);
  setInterval(savePos, 2000);
  return {
    start() { want = true; wake(); if (!ac || ac.state !== "running") arm(); },
    stop() { want = false; if (src) { savePos(); const s = src, g = gain; src = null; try { g.gain.setTargetAtTime(0, ac.currentTime, .15); setTimeout(() => { try { s.stop(); } catch (e) {} }, 800); } catch (e) {} } },
    sync() { if (gain) gain.gain.setTargetAtTime(muted() ? 0 : LEVEL, ac.currentTime, .15); }
  };
})();
(function ambPage() {
  const m = document.getElementById("mute");
  if (!window.RS_GAME && m) {
    const ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>', OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
    const paint = () => { m.innerHTML = RS.d.muted ? OFF : ON; m.setAttribute("aria-pressed", !!RS.d.muted); m.setAttribute("aria-label", RS.d.muted ? "Sound off. Turn sound on" : "Sound on. Turn sound off"); };
    m.addEventListener("click", () => { RS.d.muted = !RS.d.muted; RS.save(); paint(); RSAmb.sync(); });
    paint();
  }
  RSAmb.start();
})();


/* ---- coin pack cards, used on the Coins page and at the bottom of the Shop ---- */
function coinStack(n, acc) {
  let s = '<svg viewBox="0 0 120 80" aria-hidden="true">';
  for (let i = 0; i < n; i++) { const x = 60 - (Math.min(n, 3) - 1) * 13 + (i % 3) * 26, y = 58 - Math.floor(i / 3) * 14 - (i % 3) * 3; s += '<ellipse cx="' + x + '" cy="' + (y + 5) + '" rx="22" ry="8" fill="#6b4f0a"/><ellipse cx="' + x + '" cy="' + y + '" rx="22" ry="8" fill="#efc752" stroke="' + acc + '" stroke-width="2"/><text x="' + x + '" y="' + (y + 3.5) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#6b4f0a" font-family="Oswald, sans-serif">R</text>'; }
  return s + '</svg>';
}
function coinPackCards(asLink) {
  const base = COIN_PACKS[0].coins / COIN_PACKS[0].cents, e = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  return COIN_PACKS.map((p, i) => {
    const bonus = Math.round((p.coins / p.cents / base - 1) * 100);
    return '<div class="pack" style="--acc:' + p.acc + '">' + (p.tag ? '<span class="badge">' + e(p.tag) + '</span>' : '') + '<div class="pv">' + coinStack(i + 1, p.acc) + '</div><h3>' + e(p.name) + '</h3><div class="amt">' + p.coins.toLocaleString() + ' <small>coins</small></div><div class="bonus">' + (bonus > 0 ? '+' + bonus + '% more per dollar' : 'Starter pack') + '</div>' +
      (asLink ? '<a class="btn" href="coins.html?buy=' + p.id + '">Buy \u00b7 ' + RS.price(p.cents) + '</a>' : '<button type="button" data-pack="' + p.id + '">Buy \u00b7 ' + RS.price(p.cents) + '</button>') + '</div>';
  }).join("");
}


/* ---- creator code: a quiet link at the bottom of the pages ---- */
(function creator() {
  const link = document.getElementById("creatorLink"); if (!link) return;
  const ov = document.createElement("div"); ov.className = "overlay"; ov.hidden = true;
  ov.innerHTML = '<div class="modal" role="dialog" aria-labelledby="crH" style="width:min(92vw,400px)"><h2 id="crH">Creator access</h2><p id="crP" style="margin:0 0 12px;color:var(--muted)">Know the secret code? Enter it to open up the whole clubhouse.</p><form id="crForm" autocomplete="off" style="display:grid;gap:10px"><input id="crIn" type="text" placeholder="Secret code" aria-label="Secret code" autocapitalize="off" spellcheck="false" style="padding:12px;border-radius:8px;border:1px solid var(--line);background:#0d1211;color:var(--chalk);font-size:16px"><div class="pwBtns"><button type="submit">Unlock</button><button type="button" class="ghost" id="crX">Close</button></div></form><div id="crMsg" aria-live="polite" style="margin-top:10px;color:var(--gold)"></div></div>';
  document.body.appendChild(ov);
  const close = () => { ov.hidden = true; };
  link.addEventListener("click", e => { e.preventDefault(); ov.hidden = false; document.getElementById("crMsg").textContent = ""; document.getElementById("crIn").value = ""; document.getElementById("crIn").focus(); });
  document.getElementById("crX").addEventListener("click", close);
  ov.addEventListener("click", e => { if (e.target === ov) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  document.getElementById("crForm").addEventListener("submit", e => {
    e.preventDefault();
    const r = RS.redeem(document.getElementById("crIn").value), m = document.getElementById("crMsg");
    if (r === "bad") { m.textContent = "That's not the code."; document.getElementById("crIn").select(); return; }
    m.textContent = r === "ok" ? "Unlocked. Every item in the shop is yours, plus 10,000 coins and unlimited free games." : "Everything is unlocked on this device, including unlimited free games.";
    if (typeof render === "function") try { render(); } catch (x) {}
  });
})();




/* ---- the account button and the log in / create account box ---- */
(function accountUI() {
  const nav = document.querySelector("header.site .navR"); if (!nav) { RS.boot(); return; }
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "acctBtn"; btn.id = "acctBtn";
  const mute = nav.querySelector("#mute"); nav.insertBefore(btn, mute || null);
  const paint = () => { const u = RS.account.user; btn.textContent = u ? (u.name || "Account") : "Log in"; btn.classList.toggle("on", !!u); btn.setAttribute("aria-label", u ? "Account: " + u.name : "Log in or create an account"); };
  const ov = document.createElement("div"); ov.className = "overlay"; ov.hidden = true; document.body.appendChild(ov);
  const esc = t => String(t).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  let mode = "login", note = "";
  const input = "padding:12px;border-radius:8px;border:1px solid var(--line);background:#0d1211;color:var(--chalk);font-size:16px;width:100%;box-sizing:border-box";
  function render() {
    const u = RS.account.user, acc = RS.account.enabled;
    let h = '<div class="modal" role="dialog" aria-labelledby="acH" style="width:min(92vw,420px)">';
    if (!acc) h += '<h2 id="acH">Accounts</h2><p style="margin:0 0 12px;color:var(--muted)">Accounts switch on when the site is live on its own address. Until then your progress is saved on this device only.</p><div class="pwBtns"><button type="button" class="ghost" id="acX">Close</button></div>';
    else if (u) h += '<h2 id="acH">' + esc(u.name) + '</h2><p style="margin:0 0 6px;color:var(--muted)">' + esc(u.email || "") + '</p><p style="margin:0 0 14px">Your coins, shop items, stats and daily streak are saved to this account. Log in on any device and they are there.</p><div class="pwBtns"><button type="button" id="acOut">Log out</button><button type="button" class="ghost" id="acX">Close</button></div>';
    else h += '<h2 id="acH">' + (mode === "login" ? "Log in" : "Create your account") + '</h2><p style="margin:0 0 12px;color:var(--muted)">' + (mode === "login" ? "Welcome back. Your coins and progress load right away." : "Save your coins and everything you have earned so far, and play on any device.") + '</p>' +
      '<form id="acForm" style="display:grid;gap:10px" autocomplete="on">' + (mode === "signup" ? '<input id="acName" type="text" placeholder="Name" maxlength="24" autocomplete="nickname" style="' + input + '" aria-label="Name">' : "") +
      '<input id="acEmail" type="email" placeholder="Email" autocomplete="email" required style="' + input + '" aria-label="Email"><input id="acPass" type="password" placeholder="Password' + (mode === "signup" ? " (8 or more characters)" : "") + '" autocomplete="' + (mode === "login" ? "current-password" : "new-password") + '" required minlength="8" style="' + input + '" aria-label="Password">' +
      '<div id="acMsg" aria-live="polite" style="min-height:1.3em;color:var(--gold)">' + esc(note) + '</div><div class="pwBtns"><button type="submit" id="acGo">' + (mode === "login" ? "Log in" : "Create account") + '</button><button type="button" class="ghost" id="acX">Close</button></div></form>' +
      '<p style="margin:12px 0 0;color:var(--muted);font-size:14px">' + (mode === "login" ? 'New here? <a href="#" id="acSwap">Create an account</a>' : 'Already have one? <a href="#" id="acSwap">Log in</a>') + '</p>';
    h += '</div>'; ov.innerHTML = h;
    const q = id => ov.querySelector("#" + id);
    if (q("acX")) q("acX").onclick = close;
    if (q("acOut")) q("acOut").onclick = () => RS.signOut();
    if (q("acSwap")) q("acSwap").onclick = e => { e.preventDefault(); mode = mode === "login" ? "signup" : "login"; note = ""; render(); };
    if (q("acForm")) { q("acForm").onsubmit = async e => { e.preventDefault(); q("acGo").disabled = true; q("acMsg").textContent = "One moment\u2026"; const r = await RS.signIn(mode, q("acEmail").value, q("acPass").value, q("acName") && q("acName").value); if (r.error) { note = r.error; q("acGo").disabled = false; q("acMsg").textContent = note; return; } close(); if (mode === "login") location.reload(); }; (q("acEmail") || {}).focus && q("acEmail").focus(); }
  }
  function close() { ov.hidden = true; }
  window.RSAccount = { open(m, msg) { mode = m || "login"; note = msg || ""; render(); ov.hidden = false; } };
  btn.onclick = () => window.RSAccount.open("login");
  ov.addEventListener("click", e => { if (e.target === ov) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  document.addEventListener("rs-account", paint); paint();
  RS.boot();
})();
