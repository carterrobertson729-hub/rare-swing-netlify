/* ---------- parse + matching ---------- */
const SUFFIX = new Set(["jr", "sr", "ii", "iii", "iv"]);
const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[.'\u2019]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(t => t && !SUFFIX.has(t)).join(" ");
function lev(a, b) {
  const m = a.length, n = b.length; if (Math.abs(m - n) > 3) return 9;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
let QID = 0;

/* --- which short forms count --- */
/* last name alone: only for players nearly everyone knows */
const FAMOUS_LAST = new Set("ruth bonds mays jeter pujols ohtani judge trout kershaw scherzer verlander degrom betts harper soto acuna altuve freeman mantle gehrig dimaggio koufax maddux clemens ripken griffey ichiro ortiz mcgwire sosa pedroia posey molina strasburg bregman correa lindor tatis arenado goldschmidt votto mauer skenes skubal rizzo bellinger seager alonso stanton yelich cobb mussina halladay jackie robinson rivera hoffman biggio brett gwynn puckett thome piazza glavine smoltz lincecum kimbrel chapman darvish nomo yamamoto bumgarner mccutchen sandoval nomar varitek youkilis lester degrom wheeler nola utley howard rollins hamels werth bautista donaldson encarnacion tulowitzki canseco cabrera ohtani ramirez".split(" ").filter(x => x !== "ramirez" && x !== "howard" && x !== "robinson" && x !== "jackie"));
/* first name alone: only when it is rare; very common first names never count */
const COMMON_FIRST = new Set("john james mike michael david chris christopher matt matthew mark steve steven tom thomas tim jim joe joseph bob robert bill william dave dan daniel jack jeff jose juan luis carlos miguel pedro manny tony ryan kevin brian eric jason adam aaron alex andrew anthony ben billy brandon bruce charlie craig derek don ed frank fred george greg jake jay jon kyle larry lou max nick pete phil ray rick roger ron ross sam scott sean ted todd tyler will willie bobby johnny jimmy roberto hank cal nolan paul justin josh jacob jared zack zach cole travis dustin garrett ken harold carl eddie tommy andy joey eugenio edgar rafael fernando francisco victor vladimir wade ryne ron rod ozzie".split(" "));
/* nicknames and short forms */
const NICK_RAW = "alex rodriguez=a-rod,arod;david ortiz=big papi,papi;pete crow-armstrong=pca,crow armstrong,crow;vladimir guerrero=vlad,vlad sr;vladimir guerrero jr.=vlad jr,vladdy,vladdy jr;ken griffey jr.=junior,the kid,griffey jr;ken griffey sr.=griffey sr;javier baez=el mago;fernando tatis jr.=tatis jr;yadier molina=yadi;andrew mccutchen=cutch;paul goldschmidt=goldy;justin verlander=jv;max scherzer=mad max;jacob degrom=de grom,jake degrom;madison bumgarner=mad bum,madbum;felix hernandez=king felix;dwight gooden=doc gooden,doc;darryl strawberry=straw;lenny dykstra=nails;howard johnson=hojo;willie mays=say hey,say hey kid;reggie jackson=mr october;yogi berra=yogi;joe dimaggio=joltin joe,joe d;lou gehrig=iron horse;ty cobb=georgia peach;ted williams=teddy ballgame,the splendid splinter;cal ripken jr.=iron man;mariano rivera=mo;ichiro suzuki=ichiro;hideki matsui=godzilla;ivan rodriguez=pudge,i-rod,irod;francisco rodriguez=k-rod,krod;bartolo colon=big sexy;randy johnson=the big unit,big unit;rickey henderson=rickey;mark mcgwire=big mac;tony gwynn=mr padre;ozzie smith=the wizard,wizard;willie mccovey=stretch;carl yastrzemski=yaz;catfish hunter=catfish;manny ramirez=manny;juan soto=juan;xander bogaerts=xander;jose bautista=joey bats;edwin encarnacion=e5;troy tulowitzki=tulo;nomar garciaparra=nomar;kevin youkilis=youk;kyle schwarber=schwarbs;julio rodriguez=j-rod,jrod;cal raleigh=big dumper;elly de la cruz=elly,de la cruz;pablo sandoval=kung fu panda,panda;mike mussina=moose;roy halladay=doc halladay;jimmy rollins=j-roll,jroll;trea turner=trea;dansby swanson=dansby;bobby witt jr.=bobby witt,witt jr;yordan alvarez=yordan;aaron judge=judge;mike trout=trout;nolan arenado=nolo;corey seager=seager;craig biggio=biggio;george springer=springer;jackie robinson=jackie;babe ruth=the babe,babe;lance berkman=big puma;jim edmonds=jimmy baseball;john smoltz=smoltzie;rafael devers=devers;gerrit cole=gerrit;chipper jones=chipper;kenley jansen=kenley;aroldis chapman=aroldis;jose altuve=altuve;carlos correa=correa;shohei ohtani=shohei;bryce harper=bryce;giancarlo stanton=giancarlo;mookie betts=mookie;buster posey=buster";
const COMMON_LAST = new Set("smith johnson williams brown jones davis miller wilson moore taylor anderson thomas jackson white harris martin thompson garcia martinez robinson clark rodriguez lewis lee walker hall allen young hernandez king wright lopez hill scott green adams baker gonzalez nelson carter mitchell perez roberts turner phillips campbell parker evans edwards collins stewart sanchez morris rogers reed cook morgan bell murphy bailey rivera cooper richardson cox howard ward torres peterson gray ramirez james watson brooks kelly sanders price bennett wood barnes ross henderson coleman jenkins perry powell long patterson hughes flores washington butler simmons foster gonzales bryant alexander russell griffin diaz hayes myers ford hamilton graham sullivan wallace woods cole west jordan owens reynolds fisher ellis harrison gibson cruz marshall ortiz gomez murray freeman wells webb simpson stevens tucker porter hunter hicks crawford henry boyd mason morales kennedy warren dixon ramos reyes burns gordon shaw holmes rice robertson hunt black daniels palmer mills nichols grant knight ferguson rose stone hawkins dunn perkins hudson spencer gardner stephens payne pierce berry matthews arnold wagner willis ray watkins olson carroll duncan snyder hart cunningham bradley lane andrews ruiz harper fox riley armstrong carpenter weaver greene lawrence elliott chavez sims austin peters kelley franklin lawson".split(" "));
const NICK = {};
NICK_RAW.split(";").forEach(r => { const [n, al] = r.split("="); NICK[norm(n)] = al.split(",").map(norm); });
/* "Mike" <-> "Michael" style swaps on the first name */
const FIRST_GROUPS = ["cam cameron", "nate nathan nathaniel", "dan daniel danny", "jake jacob", "tommy thomas", "kenny kenneth ken", "joey joe joseph", "stevie steve", "jimmy jim james", "davey dave david", "al albert alfred", "hank henry", "lou louis lewis", "sammy sam samuel", "larry lawrence", "terry terrence", "vic victor", "harry harold hal", "nicky nick nicholas", "ricky rick richard", "eddie ed edward", "will willie william billy bill", "bobby bob robert rob", "johnny john jon", "mikey mike michael", "mike michael", "chris christopher", "matt matthew", "alex alexander", "nick nicholas", "tony anthony", "ben benjamin", "dave david", "dan daniel", "joe joseph", "jim james jimmy", "bob robert rob bobby", "bill william billy will", "tom thomas", "tim timothy", "steve steven stephen", "ken kenneth", "jeff jeffrey", "greg gregory", "ed edward eddie", "ron ronald", "don donald", "rick richard rich", "charlie charles chuck", "andy andrew", "sam samuel", "josh joshua", "zach zack zachary", "jon jonathan", "johnny john", "phil phillip philip", "fred frederick freddie", "pat patrick", "pete peter", "ray raymond", "vlad vladimir", "manny manuel", "fernando fernando", "ozzie osborne"].map(g => g.split(" "));
const FIRST_SWAP = {};
FIRST_GROUPS.forEach(g => g.forEach(x => { FIRST_SWAP[x] = [...new Set([...(FIRST_SWAP[x] || []), ...g.filter(y => y !== x)])]; }));

/* first names that belong to exactly one player in the whole question bank */
const RARE_FIRST = (() => {
  const by = {};
  const scan = raw => raw.split(";").forEach(item => {
    const head = item.split("=")[0]; const nm = norm(head.slice(0, head.lastIndexOf(":")));
    const f = nm.split(" ")[0]; (by[f] = by[f] || new Set()).add(nm);
  });
  Q.concat(Q2, Q3).forEach(q => scan(q[2])); TEAMS.forEach(t => scan(t.players));
  return new Set(Object.keys(by).filter(f => by[f].size === 1 && f.length >= 4 && !COMMON_FIRST.has(f)));
})();

function buildQ(text, diff, raw, team) {
  const seenNames = new Set();
  const answers = raw.split(";").map(item => {
    const [head, al = ""] = item.split("=");
    const k = head.lastIndexOf(":");
    const name = head.slice(0, k), tier = +head.slice(k + 1);
    return { name, tier, full: norm(name), aliases: al ? al.split(",").map(norm) : [] };
  }).filter(a => !seenNames.has(a.name) && seenNames.add(a.name));
  const FM = typeof FAME !== "undefined" ? FAME : {};
  answers.forEach(a => {
    a.fame = FM[a.full] || 0;
    if (a.fame >= 1600 && a.tier > 1) a.tier = 1;   /* the biggest names everyone knows are always a common answer */
    const parts = a.full.split(" "), first = parts[0], last = parts[parts.length - 1], rest = parts.slice(1).join(" ");
    const keys = new Set([a.full, ...a.aliases, ...(NICK[a.full] || [])]);
    (FIRST_SWAP[first] || []).forEach(v => keys.add(v + " " + rest));
    if (a.name.indexOf("-") >= 0) keys.add(norm(a.name.replace(/-/g, "")));   /* Hyun-Jin Ryu: "hyun jin ryu" already works and so does "hyunjin ryu" */
    if (parts.length > 1 && FAMOUS_LAST.has(last)) keys.add(last);
    if (parts.length > 1 && RARE_FIRST.has(first)) keys.add(first);
    a.keys = [...keys]; a.first = first; a.last = last;
  });
  return { id: QID++, text, diff, answers, team };
}
/* every player who has appeared for each team (replaces the short hand-written lists), and complete lists for questions the database can answer in full */
TEAMS.forEach(t => { if (typeof ROSTERS !== "undefined" && ROSTERS[t.abbr]) t.players = ROSTERS[t.abbr]; });
const OVERRIDES = typeof QUESTION_OVERRIDES !== "undefined" ? QUESTION_OVERRIDES : {};
const GEN_DEFS = [...Q, ...Q2, ...Q3, ...(typeof EXTRA_Q !== "undefined" ? EXTRA_Q : []), ...(typeof EXTRA_Q2 !== "undefined" ? EXTRA_Q2 : [])];
let ALLP = null;
function allPlayers() {   /* every player on any team list: normalized name -> [name, rarity] */
  if (ALLP) return ALLP; ALLP = new Map();
  TEAMS.forEach(t => t.players.split(";").forEach(item => { const h = item.split("=")[0], c = h.lastIndexOf(":"), nm = h.slice(0, c), k = norm(nm), tr = +h.slice(c + 1), p = ALLP.get(k); if (!p || tr < p[1]) ALLP.set(k, [nm, tr]); }));
  return ALLP;
}
function genRaw(def) {
  const raw = OVERRIDES[def[0]] || def[2];
  if (raw.indexOf("@first:") !== 0) return raw;
  const tok = raw.slice(7), out = []; allPlayers().forEach(([nm, tr], k) => { if (k.split(" ")[0] === tok) out.push(nm + ":" + tr); });
  return out.join(";");
}
const GENERAL = [];
GEN_DEFS.forEach((def, i) => { let q = null; Object.defineProperty(GENERAL, i, { enumerable: true, get() { return q || (q = buildQ(def[0], def[1], genRaw(def))); } }); });
const TEAMQ = [];
TEAMS.forEach((t, i) => { let q = null; Object.defineProperty(TEAMQ, i, { enumerable: true, get() { if (!q) { q = buildQ("Name a player who has played for the " + t.name, "medium", t.players, i); q.recent = true; } return q; } }); });
/* players who debuted after 2021: the database has no team histories for them, so on a team question they are accepted, as a double */
const RECENT_MAP = new Map();
if (typeof RECENT_DEBUTS !== "undefined") RECENT_DEBUTS.forEach(nm => { const f = norm(nm), parts = f.split(" "); if (!RECENT_MAP.has(f)) RECENT_MAP.set(f, nm); (FIRST_SWAP[parts[0]] || []).forEach(v => { const k = v + " " + parts.slice(1).join(" "); if (!RECENT_MAP.has(k)) RECENT_MAP.set(k, nm); }); });

/* exact short forms are accepted; anything else close gets a choice list, never a guess */
function findAnswer(q, input) {
  const n = norm(input);
  if (!n) return { none: true };
  const hits = q.answers.filter(a => a.keys.includes(n));
  const exact = hits.filter(a => a.full === n);   /* someone's exact name beats another person's nickname */
  if (exact.length === 1) return { a: exact[0] };
  if (hits.length === 1) return { a: hits[0] };
  if (hits.length > 1) return { suggest: hits.slice(0, 4), ambiguous: true };
  if (q.recent && RECENT_MAP.has(n)) return { a: { name: RECENT_MAP.get(n), tier: 3, full: n, keys: [n], unverified: true } };
  /* a last name alone: only big players (common to less common answers) are ever offered, so a typed surname can never hand out a rare hit. Obscure players with that name are not offered. */
  const byLast = q.answers.filter(a => a.last === n && a.full !== n);
  if (byLast.length) {
    const big = byLast.filter(a => a.tier >= 1 && a.tier <= 3).sort((x, y) => x.tier - y.tier).slice(0, 4);
    return big.length ? { suggest: big, ambiguous: big.length > 1 } : { none: true };
  }
  if (q.answers.some(a => a.first === n && a.full !== n)) return { none: true };   /* a first name alone is never guessed at */
  const scored = [];   /* spelling slips only: one or two letters off a full name, or a big player's last name */
  if (n.length >= 5) for (const a of q.answers) {
    let d = 9;
    for (const k of a.keys) if (k.length >= 5) d = Math.min(d, lev(n, k));
    if (n.indexOf(" ") < 0 && a.tier >= 1 && a.tier <= 3 && a.last.length >= 5) d = Math.min(d, lev(n, a.last));
    const lim = n.length >= 11 ? 2 : 1;
    if (d <= lim) scored.push([d, a]);
  }
  scored.sort((x, y) => x[0] - y[0]);
  return scored.length ? { suggest: scored.slice(0, 3).map(s => s[1]) } : { none: true };
}

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const TIER_LABEL = ["Not valid", "Common", "Less common", "Rare", "Very rare", "Extremely rare"];   /* 1 single, 2-3 double, 4 triple, 5 home run */
const ROUNDS = 7, TIME = 25;
const DAILY = window.RS_MODE === "daily";
const rnd = (a, b) => a + Math.random() * (b - a);
function shuffle(a, rand = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = rand() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------- start page ---------- */
const idx = ab => TEAMS.findIndex(t => t.abbr === ab);
const sel = { mode: "cpu", a: Math.max(0, idx(RS.d.team)), b: null };
let DUEL = null;   /* a match against a friend: { code, token, role, name } while it is being set up or played */
function rollOpp() { do { sel.b = Math.random() * TEAMS.length | 0; } while (sel.b === sel.a); }
function renderStart() {
  document.querySelectorAll("#modeSeg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.m === sel.mode));
  $("pickHint").textContent = DAILY ? "Scroll to see all 30 teams, then tap yours. Everyone gets the same seven questions today." : sel.mode === "solo" ? "Scroll to see all 30 teams, then tap yours." : "Scroll to see all 30 teams, then tap yours. The computer's team is a surprise.";
  $("gridA").innerHTML = TEAMS.map((t, i) => '<button type="button" class="tile" data-i="' + i + '" aria-pressed="' + (sel.a === i) + '" aria-label="' + esc(t.name) + '">' + jersey(sel.a === i ? RS.dress(t) : t, 46) + "<span>" + esc(t.name) + "</span></button>").join("");
  $("gridA").querySelectorAll(".tile").forEach(btn => btn.addEventListener("click", () => { sel.a = +btn.dataset.i; RS.d.team = TEAMS[sel.a].abbr; RS.save(); renderStart(); }));
  const A = RS.dress(TEAMS[sel.a]);
  $("matchup").innerHTML = '<span class="mu">' + jersey(A, 46) + "<span>" + esc(A.name) + "</span><small>Your team</small></span>";
}
document.querySelectorAll("#modeSeg button").forEach(b => b.addEventListener("click", () => { sel.mode = b.dataset.m; renderStart(); }));

/* ---------- the field: dots ---------- */
const NS = "http://www.w3.org/2000/svg";
function mkDot(x, y, r) {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("r", r); c.setAttribute("stroke-width", 2); c._h = [x, y]; setPos(c, x, y);
  $("dots").appendChild(c); return c;
}
function setPos(c, x, y) {
  if (c._g) c.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
  else { c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); }
}
/* a batter or runner: the jersey-colored dot with a batting helmet on top */
function mkRunner(x, y) {
  const g = document.createElementNS(NS, "g"), el = (tag, a) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); g.appendChild(e); return e; };
  const body = el("circle", { r: 6.5, "stroke-width": 2 });
  const dome = el("path", { d: "M-7 0.8 A7 7 0 0 1 7 0.8 Z", stroke: "rgba(0,0,0,.55)", "stroke-width": .8 });
  const brim = el("path", { d: "M3.5 -2.2 L11 0.2 L3.5 1.8 Z", stroke: "rgba(0,0,0,.55)", "stroke-width": .8 });
  const flap = el("circle", { cx: -5.2, cy: 2.2, r: 2.4, stroke: "rgba(0,0,0,.55)", "stroke-width": .8 });
  g._g = true; g._h = [x, y]; g._body = body; g._helm = [dome, brim, flap];
  $("dots").appendChild(g); setPos(g, x, y); return g;
}
const FIELD_POS = { P: [200, 240], C: [200, 288], B1: [254, 222], B2: [226, 196], SS: [174, 196], B3: [146, 222], LF: [108, 160], CF: [200, 114], RF: [292, 160] };
const FIELDERS = Object.entries(FIELD_POS).map(([k, [x, y]]) => { const c = mkDot(x, y, 5.5); c._k = k; return c; });
const BATTER = mkRunner(176, 266);
const RUN = [[250, 224], [200, 181], [150, 224]].map(([x, y]) => { const c = mkRunner(x, y); c.setAttribute("opacity", 0); return c; });
function paint(c, fill, stroke) { const t = c._body || c; t.setAttribute("fill", fill); t.setAttribute("stroke", stroke); }
function setColors(bat, field) {
  FIELDERS.forEach(c => paint(c, field ? field.c1 : "#aebdb4", field ? field.c2 : "#0b1711"));
  [BATTER, ...RUN].forEach(c => { paint(c, bat.c1, bat.c2); const hc = RS.helmetColor(bat); c._helm.forEach(e => e.setAttribute("fill", hc)); });
}
function resetField() { $("shadow").setAttribute("opacity", 0); FIELDERS.forEach(c => setPos(c, c._h[0], c._h[1])); BATTER.setAttribute("opacity", 1); $("bat").setAttribute("opacity", 1); $("bat").setAttribute("transform", "translate(181 262) rotate(-40)"); $("pop").setAttribute("opacity", 0); }

/* ---------- fans in the stands, in the two teams' colors ---------- */
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (0.2126 * (n >> 16 & 255) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; }
function lift(hex) { if (lum(hex) > .2) return hex; const n = parseInt(hex.slice(1), 16), m = c => Math.round(c + (255 - c) * .42); return "#" + [n >> 16 & 255, n >> 8 & 255, n & 255].map(m).map(v => v.toString(16).padStart(2, "0")).join(""); }
function buildFans(A, B) {
  const g = $("fans"); g.innerHTML = "";
  const colA = [lift(A.c1), lift(A.c1), lift(A.c2)], colB = B ? [lift(B.c1), lift(B.c1), lift(B.c2)] : ["#aab7b0", "#8fa097", "#c9d2cc"];
  let k = 0;
  const add = (x, y, left, bp) => {
    const c = document.createElementNS(NS, "circle");
    const mixed = Math.random() < .22, useA = mixed ? Math.random() < .5 : left;
    const pal = useA ? colA : colB;
    c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); c.setAttribute("r", 2.5);
    c.setAttribute("fill", pal[Math.random() * pal.length | 0]);
    c.style.setProperty("--d", (Math.random() * -2).toFixed(2) + "s"); c.style.setProperty("--h", (2 + Math.random() * 2.2).toFixed(1) + "px");
    if (bp) c.setAttribute("class", "bp");
    g.appendChild(c); k++;
  };
  /* outfield stands: four rows past the wall, team A down the left side, team B down the right */
  for (let row = 0; row < 4; row++) {
    const r = 209 + row * 8.2, n = Math.round(r * 1.75 / 6.2);
    for (let i = 0; i < n; i++) { const deg = -50 + 100 * (i + (row % 2) * .5) / n; const [x, y] = polar(r, deg); add(x, y, deg < 0); }
  }
  /* behind the plate: three curved rows */
  for (let row = 0; row < 3; row++) {
    const r = 33 + row * 8.4, n = Math.round(r * 2.2 / 6.2);
    for (let i = 0; i < n; i++) { const deg = 180 - 62 + 124 * (i + (row % 2) * .5) / n; const [x, y] = polar(r, deg); add(x, y + 2, deg > 180, true); }
  }
}
let roarId = null;
function fansCalm() { $("fans").classList.remove("roar"); }
function fansRoar(level) {
  $("fans").classList.add("roar"); clearTimeout(roarId);   /* stays up until the next question */
}

/* ---------- sound (all synthesized, nothing to download) ---------- */
const MASTER_LEVEL = 1.0;
let AC = null, MASTER = null, LIM = null, OUT = null, REV = null, NBUF = null, AMB = null, muted = !!RS.d.muted;
function audio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      MASTER = AC.createGain(); MASTER.gain.value = muted ? 0 : MASTER_LEVEL;
      LIM = AC.createDynamicsCompressor(); LIM.threshold.value = -7; LIM.knee.value = 6; LIM.ratio.value = 5; LIM.attack.value = .003; LIM.release.value = .15;
      /* a soft clipper at the very end, so even the biggest roar can never distort or exceed the speaker's range */
      OUT = AC.createWaveShaper(); const cv = new Float32Array(2048); for (let i = 0; i < cv.length; i++) { const x = i / (cv.length - 1) * 2 - 1; cv[i] = Math.tanh(1.4 * x) / Math.tanh(1.4); } OUT.curve = cv; OUT.oversample = "2x";
      const fin = AC.createGain(); fin.gain.value = .9;   /* headroom after the clipper */
      MASTER.connect(LIM); LIM.connect(OUT); OUT.connect(fin); fin.connect(AC.destination);
      /* the stadium: a big echoing space that the crowd and the hits ring through */
      const secs = 2.8, len = AC.sampleRate * secs, ir = AC.createBuffer(2, len, AC.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
      REV = AC.createConvolver(); REV.buffer = ir; const rg = AC.createGain(); rg.gain.value = .55; REV.connect(rg); rg.connect(MASTER);
      NBUF = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const d = NBUF.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      makeSmackSounds(); loadCrowd();
    } catch (e) { AC = null; }
  }
  if (AC && AC.state === "suspended") AC.resume();
  return AC;
}
function toRoom(node, amount) { if (!REV || !amount) return; const s = AC.createGain(); s.gain.value = amount; node.connect(s); s.connect(REV); }
/* a shaped burst of filtered noise */
function burst({ dur = .2, type = "bandpass", f = 1000, fEnd, q = 1, peak = .3, attack = .005, delay = 0, room = .3 }) {
  if (!audio()) return;
  const t = AC.currentTime + delay, src = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = NBUF; src.loop = true;
  fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t);
  if (fEnd) fl.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl); fl.connect(g); g.connect(MASTER); toRoom(g, room);
  src.start(t, Math.random()); src.stop(t + dur + .05);
}
function tone({ f = 200, fEnd, dur = .15, type = "sine", peak = .4, delay = 0, room = .25 }) {
  if (!audio()) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (fEnd) o.frequency.exponentialRampToValueAtTime(fEnd, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(MASTER); toRoom(g, room); o.start(t); o.stop(t + dur + .05);
}
const sfx = {
  whoosh() { burst({ dur: .4, f: 500, fEnd: 2200, q: 1.2, peak: .08, attack: .25 }); },
  crack() {   /* the real recording (brightened and tightened), with a sharp synthesized wood crack laid on top of it */
    if (CROWD_BUF && CROWD_BUF.bat) playBuf(CROWD_BUF.bat, { gain: BAT_GAIN, room: .15 });
  },
  thud() { burst({ dur: .09, type: "lowpass", f: 700, q: .8, peak: .35 }); tone({ f: 110, fEnd: 70, dur: .09, peak: .35 }); },
  pop() { playBuf(GLOVE_BUF, { gain: 1.3, room: .25 }); },
  cheer() { },
  groan() { },
  tick(alt, v = .4) { burst({ dur: .03, type: "highpass", f: 3200, q: .6, peak: Math.min(v * 1.2, 1) }); tone({ f: alt ? 700 : 980, fEnd: alt ? 620 : 860, dur: .08, type: "triangle", peak: Math.min(v, .9) }); },
  sad() {   /* womp womp */
    if (!audio()) return;
    let d = 0.05;
    [[247, .34], [208, 1.05]].forEach(([f, dur], i) => {
      const t = AC.currentTime + d, o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(f, t);
      if (i === 1) {
        o.frequency.linearRampToValueAtTime(f * .93, t + dur);
        const v = AC.createOscillator(), vg = AC.createGain(); v.frequency.value = 5.5; vg.gain.value = 3.5; v.connect(vg); vg.connect(o.frequency); v.start(t + .3); v.stop(t + dur);
      }
      fl.type = "lowpass"; fl.Q.value = 3; fl.frequency.setValueAtTime(380, t); fl.frequency.linearRampToValueAtTime(i === 1 ? 520 : 1100, t + dur * .35); fl.frequency.linearRampToValueAtTime(300, t + dur);
      g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.2, t + .04); g.gain.setValueAtTime(.2, t + dur - .08); g.gain.linearRampToValueAtTime(.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + .05);
      d += dur + (i === 1 ? 0 : .06);
    });
  }
};
function playBuf(buf, { gain = 1, rate = 1, room = .4, delay = 0, loop = false, offset = 0, pan = 0 } = {}) {
  if (!audio() || !buf) return null;
  const src = AC.createBufferSource(), g = AC.createGain(), p = AC.createStereoPanner();
  src.buffer = buf; src.loop = loop; src.playbackRate.value = rate; g.gain.value = gain; p.pan.value = pan;
  src.connect(g); g.connect(p); p.connect(MASTER); toRoom(p, room); src.start(AC.currentTime + delay, offset);
  return { src, g };
}

/* a wooden bat meeting a baseball: a hard click, then a ringing "tock" and a low body thump */
let BAT_BUFS = [], GLOVE_BUF = null;
function makeSmackSounds() {
  const sr = AC.sampleRate;
  const make = (rings, clickMs, bodyMs, len) => { const n = Math.floor(sr * len), b = AC.createBuffer(1, n, sr), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) { const t = i / sr; let s = (Math.random() * 2 - 1) * (Math.exp(-t / (clickMs / 1000)) * 1.3 + Math.exp(-t / (bodyMs / 1000)) * .35);
      for (const [f, dm, a] of rings) s += Math.sin(2 * Math.PI * f * t) * Math.exp(-t / (dm / 1000)) * a; d[i] = s; }
    let pk = 0; for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i])); for (let i = 0; i < d.length; i++) d[i] /= pk; return b; };
  BAT_BUFS = [1, 1.08, .94].map(v => make([[1150 * v, 34, .55], [2350 * v, 22, .6], [3700 * v, 14, .35], [5300, 9, .2], [190 * v, 85, .8]], 2.4, 13, .55));
  BAT_BUFS.forEach(b => { const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.tanh(d[i] * 2.2) / Math.tanh(2.2); });   /* a little drive so the front of the crack is hard and sharp */
  GLOVE_BUF = make([[640, 30, .6], [1400, 18, .4], [150, 60, .9]], 3, 25, .4);
}


const R2 = (a, b) => a + Math.random() * (b - a), PICK = a => a[Math.random() * a.length | 0];

/* ---------- the crowd: real recordings ----------
   crowd-cheers.mp3 plays all the time. A quiet, steady stretch of it is the background. When the ball is hit, the loud
   part of the same recording swells in and stays up until the next question. crowd-disappointment.mp3 plays on a strikeout. */
const CROWD_FILES = { cheers: "audio/crowd-cheers.mp3", sad: "audio/crowd-disappointment.mp3", bat: "audio/bat-hit.mp3" };
const BAT_GAIN = 2.4;
const BED_GAIN = 1.9, ROAR_GAIN = 3.2, SAD_GAIN = 2.6;   /* how loud each one is: the knobs to turn it up or down */
let CROWD_BUF = null, crowdLoading = null, wantAmb = false;
function loadCrowd() {
  if (crowdLoading) return crowdLoading;
  const get = async url => { const r = await fetch(url); if (!r.ok) throw new Error("Could not load " + url); return AC.decodeAudioData(await r.arrayBuffer()); };
  crowdLoading = Promise.all([get(CROWD_FILES.cheers), get(CROWD_FILES.sad), get(CROWD_FILES.bat).catch(() => null)]).then(([cheers, sad, bat]) => { CROWD_BUF = { cheers, sad, bat }; }).catch(e => { console.error(e); crowdLoading = null; });
  return crowdLoading;
}
/* plays a slice of a recording over and over with no gap, blending the end of each pass into the start of the next */
function loopLayer(buf, { intro, ls, le, xf }) {
  const out = AC.createGain(); out.gain.value = .0001; out.connect(MASTER); toRoom(out, .25);
  const fi = new Float32Array(32).map((_, i) => Math.sin(i / 31 * Math.PI / 2)), fo = new Float32Array(32).map((_, i) => Math.cos(i / 31 * Math.PI / 2));
  let alive = true, timer = null;
  const pass = (when, off, first) => {
    if (!alive) return;
    const src = AC.createBufferSource(), g = AC.createGain(), len = le - off, end = when + len;
    src.buffer = buf; src.connect(g); g.connect(out);
    if (first) g.gain.setValueAtTime(1, when); else g.gain.setValueCurveAtTime(fi, when, xf);
    g.gain.setValueCurveAtTime(fo, end - xf, xf);
    src.start(when, off, len + .05);
    const nextWhen = end - xf;
    timer = setTimeout(() => pass(nextWhen, ls, false), Math.max(0, (nextWhen - AC.currentTime - .7) * 1000));
  };
  pass(AC.currentTime + .03, intro, true);
  return { out, stop() { alive = false; clearTimeout(timer); const t = AC.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(out.gain.value, t); out.gain.linearRampToValueAtTime(.0001, t + .5); } };
}
function startCrowd() {
  const t = AC.currentTime;
  const bed = loopLayer(CROWD_BUF.cheers, { intro: 10.6, ls: 10.6, le: 17.4, xf: .9 });   /* the steady, quieter stretch */
  bed.out.gain.linearRampToValueAtTime(BED_GAIN, t + 1.2);
  AMB = { bed, roar: null, hot: false, stop() { bed.stop(); if (this.roar) this.roar.stop(); } };
}
function ambience(on) {
  if (!audio()) return;
  if (!on) { wantAmb = false; if (AMB) { AMB.stop(); AMB = null; } return; }
  wantAmb = true; if (AMB) return;
  loadCrowd().then(() => { if (wantAmb && !AMB && CROWD_BUF) startCrowd(); });
}
/* the ball is hit: the loud part of the cheering swells in and stays up until crowdCalm() */
function crowdRoar() {
  if (!AMB || !CROWD_BUF) return;
  const t = AC.currentTime; AMB.hot = true;
  if (AMB.roar) { AMB.roar.stop(); AMB.roar = null; }
  const roar = loopLayer(CROWD_BUF.cheers, { intro: .9, ls: 3.2, le: 9.6, xf: 1.0 });   /* starts at the natural swell of the recording */
  roar.out.gain.linearRampToValueAtTime(ROAR_GAIN, t + .25);
  AMB.roar = roar;
  AMB.bed.out.gain.cancelScheduledValues(t); AMB.bed.out.gain.setValueAtTime(AMB.bed.out.gain.value, t); AMB.bed.out.gain.linearRampToValueAtTime(BED_GAIN * .3, t + .4);
}
/* the next question: back to the steady crowd */
function crowdCalm() {
  if (!AMB) return;
  const t = AC.currentTime; AMB.hot = false;
  if (AMB.roar) { const r = AMB.roar; r.out.gain.cancelScheduledValues(t); r.out.gain.setValueAtTime(r.out.gain.value, t); r.out.gain.linearRampToValueAtTime(.0001, t + 1.2); setTimeout(() => r.stop(), 1400); AMB.roar = null; }
  AMB.bed.out.gain.cancelScheduledValues(t); AMB.bed.out.gain.setValueAtTime(AMB.bed.out.gain.value, t); AMB.bed.out.gain.linearRampToValueAtTime(BED_GAIN, t + 1.2);
}
function ambSwell() { crowdRoar(); }
function crowdPulse(ms) { crowdRoar(); setTimeout(crowdCalm, ms); }
function crowdGroan() { if (CROWD_BUF) playBuf(CROWD_BUF.sad, { gain: SAD_GAIN, room: .3 }); }

/* soft background tune: an original little loop, quiet pad + plucked melody */
let MUS = null;
const NOTE = { C3: 130.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25 };
const CHORDS = { C: ["C4", "E4", "G4", "C3"], Am: ["A3", "C4", "E4", "A3"], F: ["F3", "A3", "C4", "F3"], G: ["G3", "B3", "D4", "G3"] };
const PROG = ["C", "Am", "F", "G", "C", "F", "G", "C"];
const MEL = [
  ["E4", 0, "G4", 0, "C5", 0, "G4", 0], ["A4", 0, "C5", 0, "E5", 0, "C5", 0], ["C5", 0, "A4", 0, "F4", 0, "A4", 0], ["B4", 0, "D5", 0, "G4", 0, 0, 0],
  ["E4", "G4", "C5", 0, "E5", 0, "D5", "C5"], ["A4", 0, "C5", "A4", "F4", 0, "A4", 0], ["G4", 0, "B4", "D5", "B4", 0, "G4", 0], ["C5", 0, 0, 0, "G4", 0, 0, 0]
];
function music(on) {
  if (!audio()) return;
  if (!on) { if (MUS) { clearInterval(MUS.id); const m = MUS; m.g.gain.cancelScheduledValues(AC.currentTime); m.g.gain.setValueAtTime(m.g.gain.value, AC.currentTime); m.g.gain.linearRampToValueAtTime(0.0001, AC.currentTime + .8); setTimeout(() => m.g.disconnect(), 1000); MUS = null; } return; }
  if (MUS) return;
  const g = AC.createGain(); g.gain.value = 0.0001; g.gain.linearRampToValueAtTime(.4, AC.currentTime + 1.5); g.connect(MASTER);
  const beat = 60 / 88, eighth = beat / 2, bar = beat * 4;
  let nextBar = AC.currentTime + .2, barNo = 0;
  const voice = (f, t, dur, type, peak, lp) => {
    const o = AC.createOscillator(), fl = AC.createBiquadFilter(), v = AC.createGain();
    o.type = type; o.frequency.value = f; fl.type = "lowpass"; fl.frequency.value = lp;
    v.gain.setValueAtTime(.0001, t); v.gain.linearRampToValueAtTime(peak, t + Math.min(.25, dur / 3)); v.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(fl); fl.connect(v); v.connect(g); o.start(t); o.stop(t + dur + .05);
  };
  const schedule = () => {
    while (nextBar < AC.currentTime + 1.2) {
      const t = nextBar, ch = CHORDS[PROG[barNo % 8]], mel = MEL[barNo % 8];
      ch.slice(0, 3).forEach(n => voice(NOTE[n], t, bar * .98, "sine", .014, 900));
      voice(NOTE[ch[3]], t, beat * 1.8, "triangle", .06, 500);
      voice(NOTE[ch[3]] * 1.5, t + beat * 2, beat * 1.6, "triangle", .035, 500);
      mel.forEach((n, i) => { if (n) voice(NOTE[n], t + i * eighth, eighth * 3.2, "triangle", .05, 2200); });
      nextBar += bar; barNo++;
    }
  };
  schedule();
  MUS = { id: setInterval(schedule, 300), g };
}
const ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
function renderMute() {
  const b = $("mute"); b.innerHTML = muted ? ICON_OFF : ICON_ON;
  b.setAttribute("aria-pressed", muted); b.setAttribute("aria-label", muted ? "Sound off. Turn sound on" : "Sound on. Turn sound off");
  if (MASTER) MASTER.gain.value = muted ? 0 : MASTER_LEVEL;
}
function toggleMute() { muted = !muted; audio(); renderMute(); RS.d.muted = muted; RS.save(); RSAmb.sync(); paintSettings(); }
$("mute").addEventListener("click", toggleMute);
renderMute();

/* ---------- game state ---------- */
let G = null, cur = null, awaiting = false, timerId = null, cpuId = null;
function getBest() { return RS.d.stats.best || 0; }
function setBest(v) { RS.d.stats.best = v; RS.save(); }

/* ---------- picking the questions ----------
   Seven questions a game: 2 easy, 3 medium, 2 hard, in a random order.
   Kinds: general questions (sorted easy / medium / hard), one for each team, "this team or that team" for every pair,
   "both of these two teams" for every pair (hard), "any of these three teams", and a roster question for every team-season since 1990.
   Free play never shows the same question twice (every question you've seen is remembered on this device until the whole pool has been used).
   The daily game walks through the pool in a fixed order by date, so a question never comes back for months. */
const EASY_RE = /Cy Young Award winner|3,000 career hits|Hall of Fame (pitcher|outfielder)|500 or more career home runs|300 career wins|World Series MVP|3,000 career strikeouts|MVP award since|batting title|Rookie of the Year winner since|Dominican Republic|2004 Red Sox|2016 Chicago Cubs|1998 New York Yankees|2009 New York Yankees|2012 San Francisco|2019 Washington/;
const GEN_E = [], GEN_M = [], GEN_H = [];
const TOO_HARD = text => /born in .+, /.test(text);   /* "born in" a city or town (Pittsburgh, Ponce, ...) is too hard, so those questions are never asked */
GEN_DEFS.forEach(([text, diff], i) => { if (TOO_HARD(text)) return; (diff === "easy" || EASY_RE.test(text) ? GEN_E : diff === "hard" ? GEN_H : GEN_M).push("g" + i); });
const GEN_TEAMAWARD = [], GEN_BORN = [], GEN_YEARLY = [], GEN_SEASONFEAT = [], GEN_MIXED = [];   /* the daily game's variety pools (general questions that are not about a team roster) */
GEN_DEFS.forEach(([text], i) => { if (TOO_HARD(text)) return; const ty = qType(text), k = "g" + i;
  if (ty === "teamaward") GEN_TEAMAWARD.push(k); else if (ty === "born" || ty === "birthcity") GEN_BORN.push(k);
  else if (["decade", "draft", "asyear"].includes(ty)) GEN_YEARLY.push(k); else if (ty === "seasonfeat") GEN_SEASONFEAT.push(k);
  else if (!["both", "three", "pair", "single", "season"].includes(ty)) GEN_MIXED.push(k); });
const KEY_T = TEAMS.map((_, i) => "t" + i), KEY_P = [], KEY_B = [];
for (let i = 0; i < TEAMS.length; i++) for (let j = i + 1; j < TEAMS.length; j++) { KEY_P.push("p" + i + "-" + j); KEY_B.push("b" + i + "-" + j); }
const teamTail = s => { const w = s.trim().split(" "); return /Sox$/.test(s) ? w.slice(-2).join(" ") : w[w.length - 1]; };
const GEN_SEASON = new Set(GEN_DEFS.map(d => (d[0].match(/on the (\d{4}) (.+)$/) || [])).filter(m => m[1]).map(m => m[1] + "|" + teamTail(m[2])));
const KEY_S = typeof SEASONS !== "undefined" ? Object.keys(SEASONS).sort().filter(k => { const nm = SEASONS[k].split("|")[0], t = TEAMS.find(x => x.abbr === k.slice(0, k.indexOf("-"))); return t && !GEN_SEASON.has(k.slice(k.indexOf("-") + 1) + "|" + teamTail(nm || t.name)); }).map(k => "s" + k) : [];
const KEY_X = []; for (let i = 0; i < TEAMS.length; i++) for (let j = i + 1; j < TEAMS.length; j++) for (let k = j + 1; k < TEAMS.length; k++) KEY_X.push("x" + i + "-" + j + "-" + k);
const QCACHE = new Map();
function unionQ(ids) {   /* "Name a player who has played for the A, the B or the C": anyone on any of the lists counts, at their most common rating */
  const teams = ids.map(i => TEAMS[i]), best = new Map();
  teams.forEach(t => t.players.split(";").forEach(item => { const head = item.split("=")[0], c = head.lastIndexOf(":"), name = head.slice(0, c), tier = +head.slice(c + 1), prev = best.get(name); if (!prev || tier < prev.tier) best.set(name, { tier, item }); }));
  const names = teams.map(t => "the " + t.name), list = names.length === 2 ? names.join(" or ") : names.slice(0, -1).join(", ") + " or " + names[names.length - 1];
  const q = buildQ("Name a player who has played for " + list, "medium", [...best.values()].map(v => v.item).join(";"), null); q.recent = true; return q;
}
const PARSED = {};
function bothQ(i, j) {   /* players who wore both uniforms: hard */
  const parse = t => PARSED[t.abbr] || (PARSED[t.abbr] = (() => { const m = new Map(); t.players.split(";").forEach(item => { const head = item.split("=")[0], c = head.lastIndexOf(":"); m.set(norm(head.slice(0, c)), { name: head.slice(0, c), tier: +head.slice(c + 1), item }); }); return m; })());
  const A = parse(TEAMS[i]), B = parse(TEAMS[j]), out = [];
  A.forEach((a, k) => { const b = B.get(k); if (b) out.push((a.tier <= b.tier ? a : b).item); });
  if (out.length < 8) return null;
  return buildQ("Name a player who has played for both the " + TEAMS[i].name + " and the " + TEAMS[j].name, "hard", out.join(";"), null);
}
function seasonQ(sk) {
  const rec = SEASONS[sk]; if (!rec) return null;
  const [nm, ids] = rec.split("|"), abbr = sk.slice(0, sk.indexOf("-")), year = sk.slice(sk.indexOf("-") + 1), t = TEAMS.find(x => x.abbr === abbr);
  if (!t || GEN_SEASON.has(year + "|" + teamTail(nm || t.name))) return null;   /* already a hand-made question */
  return buildQ("Name a player on the " + year + " " + (nm || t.name), "medium", ids.split(",").map(n => SEASON_PLAYERS[+n]).join(";"), null);
}
function questionFor(key) {
  if (QCACHE.has(key)) return QCACHE.get(key);
  const t = key[0], n = key.slice(1); let q = null;
  if (t === "g") {
    q = GENERAL[+n];
    /* "played for both the A and the B" is always worked out from the full team lists, never from a short fixed list */
    const m = q && /^Name a player who has played for both the (.+) and the (.+)$/.exec(q.text);
    if (m) { const i = TEAMS.findIndex(x => teamTail(x.name) === m[1].trim()), j = TEAMS.findIndex(x => teamTail(x.name) === m[2].trim()); if (i >= 0 && j >= 0 && i !== j) { const b = bothQ(Math.min(i, j), Math.max(i, j)); if (b) { b.text = q.text; q = b; } } }
  } else if (t === "t") q = TEAMQ[+n];
  else if (t === "s") q = seasonQ(n);
  else { const ids = n.split("-").map(Number); if (ids.every(i => TEAMS[i])) q = t === "b" ? bothQ(ids[0], ids[1]) : unionQ(ids); }
  if (q) q.key = key;
  if (QCACHE.size > 6000) QCACHE.clear();
  QCACHE.set(key, q); return q;
}
/* free play: 2 easy, 3 medium, 2 hard. Each slot draws from a weighted mix of kinds, and never from a question that has been seen. */
/* what kind of question is it? The order of a game never puts two of the same kind next to each other (and avoids neighbours from the same family) */
function qType(q) {
  const t = typeof q === "string" ? q : q.text;
  if (/^Name an? (Hall of Famer|MVP winner|Cy Young winner|All-Star|Gold Glove winner|Rookie of the Year) who played for the /.test(t)) return "teamaward";
  if (/^Name a player who made his MLB debut/.test(t)) return "debut";
  if (/picked in the first round/.test(t)) return "draft";
  if (/made the \d{4} All-Star team/.test(t)) return "asyear";
  if (/ in \d{4}( \(|$)/.test(t)) return "seasonfeat";
  if (/whose first name is/.test(t)) return "firstname";
  if (/\d feet \d+ inches/.test(t)) return "height";
  if (/born in .+, /.test(t)) return "birthcity";
  if (/from the \d{4}s|All-Star team in the/.test(t)) return "decade";
  if (/led his league/.test(t)) return "leader";
  if (/^Name a player who has played for both/.test(t)) return "both";
  if (/^Name a player who has played for .*, .* or /.test(t)) return "three";
  if (/^Name a player who has played for the .* or the /.test(t)) return "pair";
  if (/^Name a player who has played for the /.test(t)) return "single";
  if (/^Name a player on the /.test(t)) return "season";
  if (/born in/.test(t)) return "born";
  if (/Hall of Fame/.test(t)) return "hof";
  if (/Gold Glove/.test(t)) return "goldglove";
  if (/MVP|Cy Young|Rookie of the Year|Triple Crown|Home Run Derby|batting title|Silver Slugger/.test(t)) return "award";
  if (/no-hitter|perfect game/.test(t)) return "nohit";
  if (/career|50 or more|40-home|30-homer|20 games|or more/.test(t)) return "milestone";
  if (/manager|picked first|World Series|retired number/.test(t)) return "history";
  return "other";
}
const FAM_CAP = fam => fam === "season" || fam === "born" || fam === "yearly" ? 1 : 2;   /* most of one family in a single game */
const QFAMILY = { both: "played", three: "played", pair: "played", single: "played", teamaward: "played", season: "season", born: "born", birthcity: "born", decade: "yearly", draft: "yearly", asyear: "yearly", seasonfeat: "yearly", debut: "yearly" };
const qFam = q => QFAMILY[qType(q)] || qType(q);
function arrange(list, rand, prevType) {   /* the best order: no two of the same kind in a row, then no two of the same family, then random */
  const n = list.length, types = list.map(qType), fams = list.map(qFam);
  const perms = [], idx = list.map((_, i) => i);
  (function go(k) { if (k === n) { perms.push(idx.slice()); return; } for (let i = k; i < n; i++) { [idx[k], idx[i]] = [idx[i], idx[k]]; go(k + 1); [idx[k], idx[i]] = [idx[i], idx[k]]; } })(0);
  let best = 1e9, pool = [];
  for (const p of perms) {
    let pen = 0;
    for (let i = 1; i < n; i++) { if (types[p[i]] === types[p[i - 1]]) pen += 100; else if (fams[p[i]] === fams[p[i - 1]]) pen += 10; }
    if (prevType && types[p[0]] === prevType) pen += 50;   /* and not the same kind as the last question of the game before */
    if (pen < best) { best = pen; pool = [p]; } else if (pen === best) pool.push(p);
  }
  const pick = pool[rand() * pool.length | 0];
  return pick.map(i => list[i]);
}
const SLOTS = ["e", "e", "m", "m", "m", "h", "h"];
function dealFree(rand) {
  const seen = RS.d.seenQ = RS.d.seenQ && typeof RS.d.seenQ === "object" ? RS.d.seenQ : {};
  const taken = new Set(), out = [];
  const unseen = list => list.filter(k => !seen[k] && !taken.has(k));
  const triple = () => { for (let n = 0; n < 40; n++) { const ids = []; while (ids.length < 3) { const v = rand() * TEAMS.length | 0; if (!ids.includes(v)) ids.push(v); } ids.sort((a, b) => a - b); const k = "x" + ids.join("-"); if (!seen[k] && !taken.has(k)) return k; } return null; };
  const PLAN = { e: [[GEN_E, .85], [KEY_T, .15]], m: [[GEN_M, .7], [KEY_P, .12], [KEY_S, .03], ["x", .15]], h: [[GEN_H, .75], [KEY_B, .25]] };
  const famCount = {};
  const draw = slot => {
    for (let pass = 0; pass < 3; pass++) {
      const order = pass === 0 ? PLAN[slot] : [...PLAN.m, ...PLAN.h, ...PLAN.e];
      const opts = order.map(([src, w]) => { let c; if (src === "x") { const tk = triple(); c = tk ? [tk] : []; } else c = unseen(src); return { src, w, c }; }).filter(o => o.c.length);
      if (!opts.length) continue;
      let x = rand() * opts.reduce((s, o) => s + o.w, 0), pick = opts[0];
      for (const o of opts) { x -= o.w; if (x <= 0) { pick = o; break; } }
      for (let tries = 0; tries < 60; tries++) {
        const key = pick.c[rand() * pick.c.length | 0];
        const q = questionFor(key);
        if (!q) { seen[key] = 1; continue; }   /* a pair of teams with too few players in common: skip it */
        if ((famCount[qFam(q)] || 0) >= FAM_CAP(qFam(q))) continue;   /* already enough of this kind in this game */
        return { key, q };
      }
    }
    return null;
  };
  for (const slot of shuffle([...SLOTS], rand)) {
    let r = draw(slot);
    if (!r) { RS.d.seenQ = {}; Object.keys(seen).forEach(k => delete seen[k]); r = draw(slot); }   /* every question has been used: start over */
    taken.add(r.key); seen[r.key] = 1; out.push(r.q); famCount[qFam(r.q)] = (famCount[qFam(r.q)] || 0) + 1;
  }
  const ordered = arrange(out, rand, RS.d.lastType);
  RS.d.lastType = qType(ordered[ordered.length - 1]);
  return ordered;
}
/* daily: the same seven for everyone, walking through the pool in a fixed order by date so nothing repeats for months */
function dayNumber(key) { const [y, m, d] = key.split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); }
const ORDER = {};
function ordered(name, list) { return ORDER[name] || (ORDER[name] = shuffle([...list], RS.seeded("rareswing-order-" + name))); }
const VALID = {};
function validKeys(name, list, check) { return VALID[name] || (VALID[name] = ordered(name, check ? list.filter(k => questionFor(k)) : list)); }
function dealDaily(key) {
  const D = dayNumber(key), rand = RS.seeded(key + "|q"), out = [], used = new Set();
  const take = (L, idx) => {   /* the next question in this kind's fixed order that is valid and not already used today */
    for (let n = 0; n < L.length; n++) { const k = L[(idx + n) % L.length], q = used.has(k) ? null : questionFor(k); if (q) { used.add(k); out.push(q); return; } }
  };
  const S = validKeys("s", KEY_S), P = validKeys("p", KEY_P);
  const TA = validKeys("ta", GEN_TEAMAWARD), YR = validKeys("yr", GEN_YEARLY), SF = validKeys("sf", GEN_SEASONFEAT), BN = validKeys("bn", GEN_BORN), MX = validKeys("mx", GEN_MIXED);
  take(YR, D);                                                    /* a draft class, an All-Star team or an award decade */
  take(SF, D);                                                    /* a great season: 30 homers, 15 wins, .300, 30 steals, 200 strikeouts */
  take(BN, D);                                                    /* one birthplace */
  take(MX, D);                                                    /* one honors / milestone / debut / names question */
  take(TA, D);                                                    /* one "awards by team" */
  take(P, D);                                                     /* one "this team or that team" */
  take(S, D);                                                     /* one team-season roster */
  return arrange(out, rand, null);
}

/* a friend match: the code decides the seven questions, so both players get the same ones, whatever they have seen before */
function dealDuel(code) {
  const savedSeen = RS.d.seenQ, savedLast = RS.d.lastType;
  RS.d.seenQ = {}; RS.d.lastType = null;
  try { return dealFree(RS.seeded("friend-match|" + code)); } finally { RS.d.seenQ = savedSeen; RS.d.lastType = savedLast; }
}

function playsLabel() {
  if (DAILY) return;
  if (DUEL) { const e = $("playsInfo"); if (e) e.innerHTML = "Friend match: <strong>doesn't use a free play</strong>"; return; }
  const f = RS.freeLeft(), unl = !!RS.d.unlimited, el = $("playsInfo"), cost = RS_CONFIG.passCost;
  if (el) el.innerHTML = unl ? "Play Pass: <strong>unlimited free games</strong>" : f > 0 ? "Free plays left today: <strong>" + f + " of " + RS_CONFIG.freePlaysPerDay + "</strong>" : "No free plays left today. Unlock unlimited games for <strong>" + cost + " coins</strong>.";
  const it = $("introText");
  if (it) it.innerHTML = unl ? "Pick any team and face a random computer team. You have the <strong>Play Pass</strong>, so every game is free, all day, every day. Win a game to earn " + RS_CONFIG.freeWin + " coins." : "Pick any team and face a random computer team. You get <strong>" + RS_CONFIG.freePlaysPerDay + " free games every day</strong>. " + (f > 0 ? "You have <strong>" + f + " left today</strong>." : "You're out for today. Pay <strong>" + cost + " coins</strong> once to play free forever.") + " Win a game to earn " + RS_CONFIG.freeWin + " coins.";
  if ($("play")) $("play").textContent = "Play ball";
  if ($("again")) $("again").textContent = "Play again";
}
let pwTick = null;
function showPaywall() {
  const cost = RS_CONFIG.passCost, have = RS.d.coins, pw = $("paywall");
  const clock = () => { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), s = Math.max(0, m - n) / 1000 | 0, p = v => String(v).padStart(2, "0"); return p(s / 3600 | 0) + ":" + p(s / 60 % 60 | 0) + ":" + p(s % 60); };
  const paint = () => { $("pwText").innerHTML = "You've used your " + RS_CONFIG.freePlaysPerDay + " free games for today. Pay <strong>" + cost + " coins</strong> once to keep playing: free games all day, every day, forever. Otherwise your free games come back in <strong>" + clock() + "</strong>. The daily game is always free."; };
  paint(); clearInterval(pwTick); pwTick = setInterval(paint, 1000);
  $("pwBuy").textContent = "Unlock unlimited play \u00b7 " + cost + " coins";
  $("pwBuy").disabled = false;
  pw.hidden = false; $("pwBuy").focus();
}
function newGame() {
  const hadFree = !RS.d.unlimited && RS.freeLeft() > 0;
  const duelGame = !!(DUEL && !DAILY);
  if (!DAILY && !duelGame && !RS.spendPlay()) { showPaywall(); return; }
  RSAmb.stop(); document.body.classList.add("playing"); document.body.classList.remove("picking"); applyLayout();
  audio(); ambience(true);
  const key = RS.dayKey();
  if (DAILY) sel.mode = "cpu";
  if (duelGame) sel.mode = "solo";
  if (sel.mode === "cpu") {
    if (DAILY) { const r = RS.seeded(key + "|opp"); do { sel.b = r() * TEAMS.length | 0; } while (sel.b === sel.a); } else rollOpp();
  }
  const n = sel.mode === "solo" ? 1 : 2;
  const teamIdx = n === 1 ? [sel.a] : [sel.a, sel.b];
  G = {
    mode: sel.mode, n, key, hadFree, teams: teamIdx.map((i, k) => k === 0 ? RS.dress(TEAMS[i]) : TEAMS[i]),
    st: teamIdx.map(() => ({ runs: 0, bases: [false, false, false], k: 0, hits: 0, hr: 0, pts: 0, rarest: null })),
    round: 0, step: 0, taken: [], rounds: [], queue: DAILY ? dealDaily(key) : duelGame ? dealDuel(DUEL.code) : dealFree(Math.random), duel: duelGame ? DUEL : null
  };

  if (DAILY) RS.d.dailyStarted = { key, a: TEAMS[sel.a].abbr, b: sel.b == null ? TEAMS[sel.a].abbr : TEAMS[sel.b].abbr };   /* starting the daily game uses it up */
  RS.save();   /* remember which questions were dealt, even if the player leaves mid-game */  if (!DAILY) RS.save();   /* remember which questions have been dealt */
  G.cpuRng = DAILY ? RS.seeded(key + "|cpu") : Math.random;                       /* daily: the computer plays the same game for everyone */
  G.cpuForce = 1 + Math.floor((DAILY ? RS.seeded(key + "|force")() : Math.random()) * 5);   /* a round when the computer is certain to hit one out */
  G.cpuGoal = (DAILY ? RS.seeded(key + "|goal")() : Math.random()) < 0.62 ? "win" : "lose";   /* the computer's quiet goal this game */
  G.skill = 0.3 + 0.45 * (DAILY ? RS.seeded(key + "|skill")() : Math.random());   /* how sharp the computer is this game */
  $("log").innerHTML = "";
  $("start").hidden = true; $("recap").hidden = true; $("game").hidden = true;
  if (G.n === 2) showIntro(G.teams[1], G.teams[0], begin);
  else if (G.duel && G.duel.friendTeam != null) showIntro(TEAMS[G.duel.friendTeam], G.teams[0], begin, G.duel.friendName || "Friend");
  else begin();
}
function begin() { applyLayout(); buildFans(G.teams[0], G.teams[1]); ambience(true); $("game").hidden = false; window.scrollTo(0, 0); startTurn(); }
function showIntro(opp, me, done, oppLabel) {
  const side = (t, cls, sub) => '<div class="isd ' + cls + '">' + jersey(t, 200) + '<div class="tn">' + esc(t.name) + '</div><div class="sub">' + sub + "</div></div>";
  $("introIn").innerHTML = '<div class="ifly"><div class="ilead">And in today\'s game&hellip;</div><div class="irow2">' + side(me, "L", DAILY ? "Your team" : "Your team") + '<div class="ivs">VS</div>' + side(opp, "R", esc(oppLabel || "Computer")) + "</div></div>";
  const el = $("intro"); el.hidden = false;
  el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  const at = (ms, fn) => setTimeout(fn, ms);
  at(1500, () => crowdPulse(1800));    /* the crowd roars as each team arrives */
  at(3500, () => crowdPulse(2300));
  at(6400, () => { el.hidden = true; done(); });
}
const batIdx = () => 0;
const isCpu = () => false;

function renderBoard() {
  const cell = (k, v) => '<div class="cell"><div class="k">' + k + '</div><div class="v">' + v + "</div></div>";
  $("board").innerHTML = cell("Round", Math.min(G.round + 1, ROUNDS) + " / " + ROUNDS) + cell("Runs", G.st[0].runs) + cell("Strikeouts", G.st[0].k) + cell("Best", Math.max(getBest(), G.st[0].runs));
  G.st[0].bases.forEach((on, i) => RUN[i].setAttribute("opacity", on ? 1 : 0));
}

function startTurn() {
  fastFwd = false; wantNext = false;
  awaiting = false; $("glow").classList.remove("on");
  crowdCalm(); fansCalm(); $("card").classList.remove("answered", "playing", "pending");
  cur = G.queue[G.round];
  const team = G.teams[0];
  setColors(team, G.n === 1 ? null : G.teams[1]);
  $("batting").innerHTML = jersey(team, 34) + "<span>" + esc(team.name) + "</span>";
  $("pitchno").textContent = "Round " + (G.round + 1) + " of " + ROUNDS;
  $("q").textContent = cur.text;
  $("ans").value = "";
  clearHints(); $("result").hidden = true;
  $("ball").setAttribute("opacity", 0); $("dist").setAttribute("opacity", 0);
  resetField(); renderBoard();
  if (G.n === 2 && G.round < ROUNDS - 1) cpuAtBat();   /* the last at-bat waits for your answer so the final score is never level */
  $("ans").disabled = false; $("swing").disabled = false;
  startTimer(TIME);
  setTimeout(() => $("ans").focus(), 30);
}
function clearHints() { $("warn").textContent = ""; $("sugg").innerHTML = ""; }
let lastTick = -1, lastSec = -1, chantedNow = false;
let paused = false, pausedUsed = null, tmT0 = 0;
function startTimer(sec, used = 0) {
  clearInterval(timerId); lastTick = -1; lastSec = -1; chantedNow = false;
  if (paused) { pausedUsed = used; return; }   /* the settings panel is open: the clock starts when it closes */
  const bar = $("bar"), t0 = performance.now() - used * 1000; tmT0 = t0;
  $("timer").classList.remove("low");
  timerId = setInterval(() => {
    const left = sec - (performance.now() - t0) / 1000;
    bar.style.transform = "scaleX(" + Math.max(left / sec, 0) + ")";
    $("timer").classList.toggle("low", left <= 10);
    $("glow").classList.toggle("on", left <= 10 && left > 0 && !awaiting);
    $("glow").classList.toggle("fast", left <= 5);
    if (left > 0 && !awaiting) {
      const half = Math.ceil(left * 2), sec = Math.ceil(left);
      if (left <= 5) { if (half !== lastTick) { lastTick = half; sfx.tick(half % 2, .55 + (5 - left) * .08); } }          /* louder at 5 seconds, tick-tock */
      else if (sec !== lastSec) { lastSec = sec; sfx.tick(sec % 2, left <= 10 ? .3 : .07 + (TIME - left) / TIME * .1); }      /* a soft clock the whole time, a bit louder under 10 */
    }
    $("secs").classList.toggle("hot", left <= 10);
    $("secs").textContent = Math.max(Math.ceil(left), 0) + "s";
    if (left <= 0) { clearInterval(timerId); if (!awaiting) resolve({ kind: "k", why: "Time ran out. Strike three, looking." }); }
  }, 100);
}

/* the computer: a shaky guesser. It leans on obvious names, often names someone who doesn't fit, and sometimes freezes */
function decoyName() {
  const have = new Set(cur.answers.map(a => a.name));
  for (let n = 0; n < 12; n++) {
    const d = GEN_DEFS[G.cpuRng() * GEN_DEFS.length | 0], raw = d[2].indexOf("@") === 0 ? "" : (OVERRIDES[d[0]] || d[2]), items = raw.split(";").filter(Boolean);
    if (!items.length) continue;
    const it = items[G.cpuRng() * items.length | 0].split("=")[0], c = it.lastIndexOf(":"), nm = it.slice(0, c);
    if (+it.slice(c + 1) > 0 && !have.has(nm)) return nm;
  }
  return "Tom Smith";
}
function cpuAtBat() {
  const sk = G.skill;
  let r;
  const cr = G.cpuRng;
  /* keeps the game close: the computer wins a bit under half of games. Each game has a quiet goal, and the computer eases off or presses to match it. */
  const lead = G.st[1].runs - G.st[0].runs, lastR = G.round >= ROUNDS - 1;
  let steer = null;
  if (G.cpuGoal === "lose") { if (lead >= 3 || (lead >= 1 && cr() < .7) || (lastR && lead >= 0 && cr() < .9)) steer = "miss"; }
  else { if (lead <= -2 || (lastR && lead <= 0)) steer = "press"; else if (lead >= 4 && cr() < .5) steer = "miss"; }
  const must = G.st[1].runs === 0 && (G.round === G.cpuForce || G.round >= ROUNDS - 1);   /* the computer always puts up at least one run */
  if (must) {
    const best = cur.answers.filter(a => a.tier > 0).sort((a, b) => b.tier - a.tier), top = best.filter(a => a.tier === best[0].tier);
    r = { kind: "hit", a: top[cr() * top.length | 0] };
  } else if (steer === "miss") { const g2 = cr() < .5 ? decoyName() : null; r = g2 ? { kind: "k", why: "Guessed " + g2 + ". Not on the list.", guess: g2 } : { kind: "k", why: "Ran out of time." }; }
  else if (steer === "press" && cr() < .8) {
    const best = cur.answers.filter(a => a.tier >= 4).sort(() => cr() - .5);
    r = best.length ? { kind: "hit", a: best[0] } : { kind: "k", why: "Ran out of time." };
  } else if (cr() < 0.08) r = { kind: "k", why: "Ran out of time." };
  else if (cr() < 0.38 - 0.26 * sk) { const g = decoyName(); r = { kind: "k", why: "Guessed " + g + ". Not on the list.", guess: g }; }
  else {
    const byTier = [[], [], [], [], [], []]; cur.answers.forEach(a => { if (a.tier > 0) byTier[a.tier].push(a); });
    const W = t => ({ 1: 40, 2: 25, 3: 16, 4: 10, 5: 5 }[t]) * (1 + sk * (t - 3) * 0.3), tiers = [1, 2, 3, 4, 5].filter(t => byTier[t].length);
    let x = cr() * tiers.reduce((n, t) => n + W(t), 0), tr = tiers[0];
    for (const t of tiers) { x -= W(t); if (x <= 0) { tr = t; break; } }
    const pick = byTier[tr][cr() * byTier[tr].length | 0];
    r = { kind: "hit", a: pick };
  }
  applyResult(1, r);
}

/* the computer's last at-bat: chosen knowing your final runs, so the game never ends level */
function runsFor(bases, n) { let s = 0; for (let p = 3; p >= 1; p--) if (bases[p - 1] && p + n >= 4) s++; if (n >= 4) s++; return s; }
function cpuFinal() {
  const S1 = G.st[1], P = G.st[0].runs, C = S1.runs, cr = G.cpuRng;
  const cand = [["K", 0], ["1B", 1], ["2B", 2], ["3B", 3], ["HR", 4]].map(([c, n]) => ({ c, n, runs: C + (n ? runsFor(S1.bases, n) : 0) }));
  const ok = cand.filter(x => x.runs !== P && x.runs >= 1);
  const want = G.cpuGoal === "win" ? ok.filter(x => x.runs > P) : ok.filter(x => x.runs < P);
  const pool = (want.length ? want : ok.length ? ok : cand.filter(x => x.runs !== P)).slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = cr() * (i + 1) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const order = [...pool, ...cand.filter(x => x.runs !== P && !pool.includes(x))];
  const TIER_OF = { "1B": 1, "2B": 2, "3B": 4, HR: 5 };
  for (const x of order) {
    if (x.c === "K") { applyResult(1, { kind: "k", why: "Ran out of time." }); return; }
    const a = cur.answers.filter(y => y.tier > 0 && outcome({ kind: "hit", a: y }).code === x.c);
    if (a.length) { applyResult(1, { kind: "hit", a: a[cr() * a.length | 0] }); return; }
  }
  const x = order.find(y => y.c !== "K");   /* the question has no answer of the right size: still make the score come out right */
  if (x) applyResult(1, { kind: "hit", a: { name: "A player", tier: TIER_OF[x.c], full: "", keys: [] } });
  else applyResult(1, { kind: "k", why: "Ran out of time." });
}
let ALLN = null;
function allNames() {   /* every player name the game knows, so a real player who is simply the wrong answer gets "incorrect" */
  if (ALLN) return ALLN; ALLN = new Set();
  const add = raw => raw.split(";").forEach(item => { const h = item.split("=")[0]; ALLN.add(norm(h.slice(0, h.lastIndexOf(":")))); });
  TEAMS.forEach(t => add(t.players));
  if (typeof SEASON_PLAYERS !== "undefined") SEASON_PLAYERS.forEach(s => ALLN.add(norm(s.slice(0, s.lastIndexOf(":")))));
  return ALLN;
}
/* guesses: exact -> swing; close -> offer choices; otherwise try again (the clock keeps running) */
function choose(a) {
  clearHints();
  if (a.tier === 0) { $("warn").textContent = "Incorrect. Try again."; $("ans").focus(); return; }
  resolve({ kind: "hit", a });
}
$("form").addEventListener("submit", e => {
  e.preventDefault();
  if (awaiting) return;
  clearHints();
  const val = $("ans").value;
  if (!norm(val)) { $("warn").textContent = "Type an answer first."; return; }
  const m = findAnswer(cur, val);
  if (m.a) return choose(m.a);
  if (m.tooMany) { $("warn").textContent = "A lot of players share that name. Type a first and last name."; $("ans").select(); return; }
  if (m.suggest) {
    $("warn").textContent = m.ambiguous ? "Which one did you mean?" : "Not an exact match. Did you mean:";
    m.suggest.forEach(a => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "ghost sug"; b.textContent = a.name;
      b.addEventListener("click", () => choose(a));
      $("sugg").appendChild(b);
    });
    return;
  }
  $("warn").textContent = allNames().has(norm(val)) ? "Incorrect. Try again." : "We couldn't find a player by that name. Try again.";
  $("ans").select();
});
$("next").addEventListener("click", advanceAfterResult);
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.repeat && awaiting && !$("result").hidden && !$("game").hidden && $("settings").hidden) { e.preventDefault(); if ($("card").classList.contains("pending")) { fastFwd = true; wantNext = true; } else advanceAfterResult(); }
});

function outcome(r) {
  if (r.kind === "k") return { code: "K", label: "Strikeout", cls: "out", ft: 0, bases: 0 };
  const t = r.a.tier;   /* 1 common, 2-3 less common, 4 rare, 5 extremely rare */
  if (t <= 1) return { code: "1B", label: "Single", cls: "hit", ft: Math.round(rnd(130, 250)), bases: 1 };
  if (t <= 3) return { code: "2B", label: "Double", cls: "hit", ft: Math.round(rnd(270, 340)), bases: 2 };
  if (t === 4) return { code: "3B", label: "Triple", cls: "hit", ft: Math.round(rnd(340, 390)), bases: 3 };
  return { code: "HR", label: "Home run", cls: "hr", ft: Math.round(rnd(405, 480)), bases: 4 };
}
function runnersAdvance(S, n) {
  let scored = 0;
  const nb = [false, false, false];
  for (let p = 3; p >= 1; p--) if (S.bases[p - 1]) { const d = p + n; if (d >= 4) scored++; else nb[d - 1] = true; }
  if (n >= 4) scored++; else nb[n - 1] = true;
  S.bases = nb; return scored;
}
/* books one at-bat for a team: runs, stats and the recap entry */
function applyResult(bi, r) {
  const S = G.st[bi], o = outcome(r);
  let scored = 0;
  if (r.kind === "k") S.k++;
  else {
    scored = runnersAdvance(S, o.bases); S.runs += scored; S.hits++; S.pts += r.a.tier; if (o.bases === 4) S.hr++;
    if (!S.rarest || r.a.tier > S.rarest.tier) S.rarest = { name: r.a.name, tier: r.a.tier };
  }
  const entry = { ft: o.ft, used: r.kind === "k" ? TIME : Math.min(TIME, Math.max(0, (performance.now() - tmT0) / 1000)), ans: r.a ? r.a.name : null, tier: r.a ? r.a.tier : 0, code: o.code, label: o.label, scored, why: r.why, guess: r.guess };
  (G.rounds[G.round] = G.rounds[G.round] || { q: cur.text, e: [] }).e[bi] = entry;
  return { o, scored, entry };
}

function resolve(r) {
  if (awaiting) return;
  awaiting = true; clearInterval(timerId); clearHints(); $("glow").classList.remove("on");
  $("ans").disabled = true; $("swing").disabled = true;
  const before = G.st[0].bases.slice();
  const { o, scored, entry } = applyResult(0, r);
  if (G.n === 2 && G.round >= ROUNDS - 1) cpuFinal();
  const chip = document.createElement("span");
  chip.className = "chip" + (o.code === "HR" ? " hr" : o.bases ? " h" : "");
  chip.textContent = o.code; $("log").appendChild(chip);
  /* the result board comes up right away: the question, your answer and the common and deeper-cut answers. The rarity and Next button wait for the play. */
  const pool = cur.answers.filter(a => a.tier > 0 && !(r.a && a === r.a));
  const lo = Math.min(...pool.map(a => a.tier)), hi = Math.max(...pool.map(a => a.tier));
  const pick = t => shuffle(pool.filter(a => a.tier === t))[0].name;
  const known = pool.slice().sort((a, b) => (b.fame || 0) - (a.fame || 0))[0];   /* the most famous valid answer, if the list has any famous names */
  $("rcommon").textContent = known && known.fame > 0 ? known.name : pick(lo);
  $("rdeep").textContent = entry.deep = pick(hi);
  $("rpips").innerHTML = "";
  $("rnote").innerHTML = r.kind === "k" ? esc(r.why) : "<strong>" + esc(r.a.name) + "</strong>";
  $("result").hidden = false; $("card").classList.add("answered", "pending");
  let bannerP = null;
  animate(o, r, () => { bannerP = showBanner(o); }, before).then(() => bannerP || showBanner(o)).then(() => bannerP).then(() => {
    renderBoard();
    const pips = $("rpips"); pips.innerHTML = "";
    if (r.kind === "hit") {
      for (let i = 1; i <= 5; i++) { const el = document.createElement("i"); if (i <= r.a.tier) el.className = "on"; pips.appendChild(el); }
      const b = document.createElement("b"); b.textContent = TIER_LABEL[r.a.tier] + " answer"; pips.appendChild(b);
    }
    $("rnote").innerHTML = (scored ? "<strong>" + scored + (scored > 1 ? " runs score." : " run scores.") + "</strong> " : "") + (r.kind === "k" ? esc(r.why) : "<strong>" + esc(r.a.name) + "</strong>. " + o.ft + " ft." + (r.a.unverified ? ' <span class="muted">Recent player, counted as a double: team records stop at 2021.</span>' : ""));
    $("card").classList.remove("pending");
    if (wantNext) { wantNext = false; fastFwd = false; advanceAfterResult(); return; }
    $("next").focus();
    armAuto(G.round + 1 >= ROUNDS ? "See final score" : "Next at-bat");
  });
}
let autoId = null;
function armAuto(label) {
  clearTimeout(autoId);
  let n = 3;
  const tick = () => { if (n <= 0) { advanceAfterResult(); return; } $("next").textContent = label + " (" + n-- + ")"; autoId = setTimeout(tick, 1000); };
  tick();
}
function advanceAfterResult() {
  if ($("card").classList.contains("pending")) return;   /* wait for the play to finish */
  clearTimeout(autoId);
  if (!awaiting || $("game").hidden) return;
  G.round++;
  if (G.round >= ROUNDS) { endGame(); return; }
  if (G.duel) { awaiting = false; duelBarrier(G.round).then(startTurn); return; }
  startTurn();
}

/* ---------- pitch + hit animation ---------- */
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let fastFwd = false, wantNext = false;   /* Enter skips ahead: the animation finishes at once and the next question starts */
function tween(ms, fn) {
  return new Promise(res => {
    const t0 = performance.now(), D = reduceMotion ? 1 : ms;
    const f = now => { const p = fastFwd ? 1 : Math.min((now - t0) / D, 1); fn(p); p < 1 ? requestAnimationFrame(f) : res(); };
    requestAnimationFrame(f);
  });
}
const wait = ms => new Promise(r => { if (reduceMotion) { setTimeout(r, 1); return; } const t0 = performance.now(), id = setInterval(() => { if (fastFwd || performance.now() - t0 >= ms) { clearInterval(id); r(); } }, 25); });
const BAT = () => $("bat");
const setBat = ang => BAT().setAttribute("transform", "translate(181 262) rotate(" + ang.toFixed(1) + ")");
async function showBanner(o) {
  const el = $("hitbanner");
  $("hitword").textContent = o.label;
  el.className = "hitbanner on" + (o.code === "HR" ? " hr" : "");
  await wait(reduceMotion ? 1100 : 2000);
  el.className = "hitbanner";
}
const polar = (r, deg) => [200 + r * Math.sin(deg * Math.PI / 180), 272 - r * Math.cos(deg * Math.PI / 180)];
const pickOne = arr => arr[Math.random() * arr.length | 0];
/* where the ball goes: grounders through the infield, bloops, gap shots, down the lines, over the fence */
function planHit(o) {
  const side = Math.random() < .5 ? -1 : 1, R = rnd, H = [200, 266];
  const leg = (to, apex, ms, roll) => ({ to, apex, ms, roll: !!roll });
  const out = { legs: [], landAfter: 0, dive: null, wall: false };
  if (o.code === "1B") {
    const kind = pickOne(["ground", "ground", "bloop", "liner"]);
    if (kind === "ground") {
      const th = side * R(10, 26), end = polar(R(120, 140), side * R(26, 40));
      out.legs = [leg(polar(64, th), 0, 360, false), leg(end, 0, 950, true)]; out.dive = polar(64, th);   /* skips past a diving infielder */
    } else if (kind === "bloop") {
      const th = side * R(6, 30), r0 = R(95, 118);
      out.legs = [leg(polar(r0, th), 34, 620), leg(polar(r0 + 12, th), 7, 280), leg(polar(r0 + 32, th), 0, 600, true)];
    } else {
      const th = side * R(2, 10);
      out.legs = [leg(polar(R(100, 120), th), 14, 460), leg(polar(R(150, 168), th + side * 4), 0, 850, true)];
    }
  } else if (o.code === "2B") {
    if (Math.random() < .5) {   /* into the gap */
      const th = side * R(14, 24), r0 = R(128, 148);
      out.legs = [leg(polar(r0, th), 42, 800), leg(polar(r0 + 16, th + side), 10, 320), leg(polar(R(182, 190), th + side * 4), 0, 950, true)];
    } else {                    /* down the line */
      const th = side * R(39, 43);
      out.legs = [leg(polar(R(110, 132), th), 30, 650), leg(polar(R(184, 191), side * 44), 0, 1000, true)];
    }
  } else if (o.code === "3B") {
    if (Math.random() < .5) {   /* deep gap, rolls to the wall */
      const th = side * R(12, 22), r0 = R(160, 176);
      out.legs = [leg(polar(r0, th), 55, 950), leg(polar(r0 + 10, th), 14, 340), leg(polar(193, th + side * 3), 0, 750, true)];
    } else {                    /* corner, down the line */
      const th = side * R(38, 43);
      out.legs = [leg(polar(R(150, 170), th), 48, 900), leg(polar(193, side * 44), 0, 800, true)];
    }
    out.wall = true;
  } else {                      /* home run: over the wall */
    const th = side * R(2, 38);
    out.legs = [leg(polar(R(224, 238), th), 92, 1500)];
    out.wall = true; out.hr = polar(190, th);
  }
  out.landAfter = out.legs[0].roll || out.legs[0].apex === 0 ? 0 : 0;   /* the banner fires when the first leg ends */
  return out;
}
const HOME_PT = [200, 266], BASE_PT = [[250, 224], [200, 181], [150, 224]];
const VERT = [HOME_PT, ...BASE_PT, HOME_PT];
function atIndex(f) { const i = Math.min(Math.floor(f), 3), q = f - i, a = VERT[i], b = VERT[i + 1]; return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q]; }
/* the batter and every runner on base run the bases together, at the same speed */
function runBases(before, n) {
  const MS = 470, runners = [];
  runners.push({ dot: BATTER, s: 0 });
  before.forEach((on, i) => { if (on) runners.push({ dot: RUN[i], s: i + 1 }); });
  runners.forEach(r => { r.e = Math.min(r.s + n, 4); r.dot.setAttribute("opacity", 1); });
  const total = Math.max(...runners.map(r => (r.e - r.s) * MS));
  return tween(total, p => {
    const t = p * total;
    runners.forEach(r => { const f = Math.min(r.s + t / MS, r.e); const [x, y] = atIndex(f); setPos(r.dot, x, y); });
  }).then(() => {
    /* scoring runners disappear at the plate; everyone else is put back on their base by renderBoard */
    runners.forEach(r => { setPos(r.dot, r.dot._h[0], r.dot._h[1]); });
    BATTER.setAttribute("opacity", 0);
    renderBoard();
  });
}
async function animate(o, r, onLand, before) {
  const ball = $("ball"), dist = $("dist"), pit = FIELDERS[0], pop = $("pop"), sh = $("shadow");
  const set = (x, y, rr) => { ball.setAttribute("cx", x); ball.setAttribute("cy", y); ball.setAttribute("r", rr); };
  const PITCH_MS = 430;
  /* wind-up, then the ball travels from the mound to the plate while the batter swings */
  await tween(260, p => setPos(pit, 200, 240 - 3 * Math.sin(p * Math.PI)));
  ball.setAttribute("opacity", 1);
  sfx.whoosh();
  const swings = o.code !== "K" || Math.random() < 0.65;
  const lateBy = o.code === "K" ? 110 : 0;                         /* a miss is a late swing */
  const swing = swings ? wait(PITCH_MS - 200 + lateBy).then(() => tween(200, p => setBat(-40 + 185 * (1 - Math.pow(1 - p, 2))))) : Promise.resolve();
  await tween(PITCH_MS, p => set(200, 236 + 32 * p, 2.4 + 2.4 * p));
  if (o.code === "K") {
    await tween(160, p => set(200, 268 + 18 * p, 4.8));   /* into the catcher's glove */
    sfx.pop(); sfx.sad(); sfx.groan(); crowdGroan();                    /* womp womp, and the stands groan */
    if (onLand) onLand();
    await swing;
    dist.textContent = swings ? "SWING AND A MISS" : "STRIKE THREE"; dist.setAttribute("opacity", 1);
    await wait(500); return;
  }
  /* contact: the crowd reacts right away on every hit */
  sfx.crack(); ambSwell(); fansRoar(o.bases);
  pop.setAttribute("opacity", 1);
  tween(260, p => { pop.setAttribute("r", 4 + 22 * p); pop.setAttribute("opacity", 1 - p); });
  const runP = runBases(before || [false, false, false], o.bases);
  const plan = planHit(o), legs = plan.legs;
  const cum = []; let T = 0; legs.forEach(l => { cum.push(T); T += l.ms; });
  const landT = legs[0].ms;                                           /* first touch of the ground */
  const rest = plan.hr || legs[legs.length - 1].to;
  let chaser = null, best = 1e9;
  FIELDERS.forEach(c => { if (c._k === "P" || c._k === "C") return; const dd = Math.hypot(c._h[0] - rest[0], c._h[1] - rest[1]); if (dd < best) { best = dd; chaser = c; } });
  let diver = null;
  if (plan.dive) { let bd = 1e9; FIELDERS.forEach(c => { if (["B1", "B2", "SS", "B3"].includes(c._k)) { const dd = Math.hypot(c._h[0] - plan.dive[0], c._h[1] - plan.dive[1]); if (dd < bd) { bd = dd; diver = c; } } }); }
  const ease = q => q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
  let landed = false, from = [200, 266];
  sh.setAttribute("opacity", .35);
  await tween(T, p => {
    const t = p * T;
    let i = legs.length - 1; while (i > 0 && t < cum[i]) i--;
    const L = legs[i], start = i === 0 ? [200, 266] : legs[i - 1].to, q = Math.min((t - cum[i]) / L.ms, 1);
    const e = L.roll ? 1 - Math.pow(1 - q, 2) : q;                  /* rolls slow down */
    const gx = start[0] + (L.to[0] - start[0]) * e, gy = start[1] + (L.to[1] - start[1]) * e;
    const h = 4 * L.apex * q * (1 - q);
    set(gx, gy - h, 4.2 + h / 30);
    sh.setAttribute("cx", gx); sh.setAttribute("cy", gy + 1); sh.setAttribute("rx", 4.5); sh.setAttribute("ry", 2); sh.setAttribute("opacity", Math.max(.12, .4 - h / 160));
    if (!landed && t >= landT) { landed = true; if (!plan.hr) sfx.thud(); dist.textContent = o.ft + " FT"; dist.setAttribute("opacity", 1); }
    if (chaser) { const k = ease(Math.min(p / .92, 1)); const tgt = plan.hr || rest; setPos(chaser, chaser._h[0] + (tgt[0] - chaser._h[0]) * k, chaser._h[1] + (tgt[1] - chaser._h[1]) * k); }
    if (diver) { const k = ease(Math.min(t / legs[0].ms, 1)) * .8; setPos(diver, diver._h[0] + (plan.dive[0] - diver._h[0]) * k, diver._h[1] + (plan.dive[1] - diver._h[1]) * k); }
  });
  await swing; BAT().setAttribute("opacity", 0);
  if (onLand) onLand();                                              /* the big call comes once the play is made */
  if (plan.hr) {                                                    /* over the wall: ball is gone, fielder watches it leave */
    ball.setAttribute("opacity", 0); sh.setAttribute("opacity", 0);
    await wait(700); await runP; return;
  }
  /* the fielder gets to it and throws it back in */
  sfx.pop();
  pop.setAttribute("cx", rest[0]); pop.setAttribute("cy", rest[1]);
  tween(240, p => { pop.setAttribute("r", 3 + 12 * p); pop.setAttribute("opacity", .9 - .9 * p); });
  const cut = [200, 212];
  await tween(Math.min(380 + Math.hypot(rest[0] - cut[0], rest[1] - cut[1]) * 2.2, 700), p => {
    const gx = rest[0] + (cut[0] - rest[0]) * p, gy = rest[1] + (cut[1] - rest[1]) * p, h = 4 * 16 * p * (1 - p);
    set(gx, gy - h, 4.2); sh.setAttribute("cx", gx); sh.setAttribute("cy", gy + 1);
  });
  ball.setAttribute("opacity", 0); sh.setAttribute("opacity", 0);
  pop.setAttribute("cx", 200); pop.setAttribute("cy", 268);
  await runP;
  await wait(150);
}

/* ---------- recap page ---------- */
function resCls(code) { return code === "HR" ? "hr" : code === "K" ? "k" : ""; }
function recapExtras() {
  const E = i => G.rounds.map(r => r.e[i]).filter(Boolean);
  const sum = es => {
    const hit = es.filter(e => e.code !== "K"), n = code => es.filter(e => e.code === code).length;
    const pts = hit.reduce((s, e) => s + e.tier, 0), rare = hit.reduce((b, e) => !b || e.tier > b.tier ? e : b, null), long = hit.reduce((b, e) => !b || e.ft > b.ft ? e : b, null);
    const answered = es.filter(e => e.code !== "K" || e.ans);
    return { ab: es.length, hits: hit.length, k: n("K"), hr: n("HR"), t3: n("3B"), d2: n("2B"), s1: n("1B"), runs: es.reduce((s, e) => s + (e.scored || 0), 0), pts, avg: hit.length ? pts / hit.length : 0, rare, long, fast: hit.length ? Math.min(...hit.map(e => e.used)) : null, tiers: [1, 2, 3, 4, 5].map(t => hit.filter(e => Math.max(1, e.tier <= 1 ? 1 : e.tier) === t).length) };
  };
  const me = sum(E(0)), cpu = G.n === 2 ? sum(E(1)) : null;
  const grade = me.avg >= 3.4 && me.hits >= 5 ? "S" : me.avg >= 2.6 && me.hits >= 4 ? "A" : me.avg >= 1.9 && me.hits >= 3 ? "B" : me.hits >= 2 ? "C" : "D";
  const gradeNote = { S: "Elite. Deep cuts all game.", A: "Great mix of rare answers.", B: "Solid. Go deeper next time.", C: "A few good swings.", D: "Tough one. Think rarer." }[grade];
  const H = { K: 8, "1B": 30, "2B": 52, "3B": 76, HR: 100 };
  const chart = '<div class="swingChart" role="img" aria-label="Result of each at-bat">' + E(0).map((e, i) => '<div class="scol"><div class="sbw"><div class="sbar b-' + e.code + '" style="height:' + H[e.code] + '%" title="' + esc(e.label) + '"></div></div><b>' + e.code + '</b></div>').join("") + "</div>";
  const T = ["Common", "Less common", "Rare", "Very rare", "Extremely rare"], total = Math.max(1, me.hits);
  const meter = '<div class="rarMeter"><div class="rarBar">' + me.tiers.map((c, i) => c ? '<span class="rt t' + (i + 1) + '" style="flex:' + c + '" title="' + T[i] + ': ' + c + '">' + c + "</span>" : "").join("") + '</div><div class="rarKey">' + T.map((t, i) => '<span class="rk t' + (i + 1) + '">' + t + "</span>").join("") + "</div></div>";
  const fmt = v => v == null ? "\u2013" : v;
  const tiles = [["Hits", me.hits + " of " + me.ab], ["Home runs", me.hr], ["Triples", me.t3], ["Doubles", me.d2], ["Singles", me.s1], ["Strikeouts", me.k], ["Runs scored", me.runs], ["Rarity points", me.pts], ["Avg. rarity", me.hits ? me.avg.toFixed(1) + " / 5" : "\u2013"], ["Longest hit", me.long ? me.long.ft + " ft" : "\u2013"], ["Fastest answer", me.fast == null ? "\u2013" : me.fast.toFixed(1) + "s"], ["Hit rate", Math.round(me.hits / Math.max(1, me.ab) * 100) + "%"]];
  const tileHTML = '<div class="xStats">' + tiles.map(([k, v]) => '<div><b>' + v + "</b><span>" + k + "</span></div>").join("") + "</div>";
  let h2h = "";
  if (cpu) {
    const row = (k, a, b, hi = 1) => { const m = Math.max(a, b, 1); return '<div class="hrow"><span class="hv' + (a * hi > b * hi ? " lead" : "") + '">' + a + '</span><span class="hmid"><span class="hk">' + k + '</span><span class="hbar"><span class="hl2"><i style="width:' + Math.round(a / m * 100) + '%"></i></span><span class="hr2"><i style="width:' + Math.round(b / m * 100) + '%"></i></span></span></span><span class="hv' + (b * hi > a * hi ? " lead" : "") + '">' + b + "</span></div>"; };
    h2h = '<div class="h2h"><div class="hhead"><span>' + esc(G.teams[0].abbr) + '</span><span>Head to head</span><span>' + esc(G.teams[1].abbr) + "</span></div>" +
      row("Runs", G.st[0].runs, G.st[1].runs) + row("Hits", me.hits, cpu.hits) + row("Home runs", me.hr, cpu.hr) + row("Strikeouts", me.k, cpu.k, -1) + row("Rarity points", me.pts, cpu.pts) + row("Avg. rarity", +me.avg.toFixed(1), +cpu.avg.toFixed(1)) + row("Longest hit (ft)", me.long ? me.long.ft : 0, cpu.long ? cpu.long.ft : 0) + "</div>";
  }
  const s = RS.d.stats, rec = s.wins + "-" + s.losses;
  const career = '<div class="career"><b>Career</b><span>' + s.games + ' games</span><span>' + rec + ' record</span><span>' + s.hr + ' home runs</span><span>' + s.hits + ' hits</span><span>Best: ' + s.best + ' runs</span></div>';
  return '<div class="recapGrid one"><div class="chartCard"><h3>Your seven at-bats</h3>' + chart + '</div></div>' +
    '<div class="recapGrid two"><div class="leftCol"><div class="chartCard"><h3>How rare were your answers?</h3>' + meter + '</div><div class="chartCard"><h3>Highlights</h3><div class="hl">' + (me.rare ? '<div><span>Rarest answer</span><b>' + TIER_LABEL[me.rare.tier] + '</b><small>' + esc(me.rare.label) + "</small></div>" : "") + (me.long ? '<div><span>Longest hit</span><b>' + me.long.ft + " ft</b><small>" + esc(me.long.label) + "</small></div>" : "") + (me.fast != null ? '<div><span>Fastest answer</span><b>' + me.fast.toFixed(1) + "s</b><small>Quick thinking</small></div>" : "") + "</div></div></div>" + (h2h || "") + "</div>" +
    tileHTML + career;
}
function decideWinner() {   /* runs, then rarity points, then the longest hit, then the game's own goal: there are no ties */
  const [a, b] = G.st;
  if (a.runs !== b.runs) return a.runs > b.runs ? 0 : 1;
  if (a.pts !== b.pts) return a.pts > b.pts ? 0 : 1;
  const L = i => Math.max(0, ...G.rounds.map(r => r.e[i] && r.e[i].code !== "K" ? r.e[i].ft || 0 : 0));
  if (L(0) !== L(1)) return L(0) > L(1) ? 0 : 1;
  return G.cpuGoal === "win" ? 1 : 0;
}
function endGame() {
  document.body.classList.remove("playing"); RS.d.dailyStarted = null;
  clearTimeout(autoId);
  ambience(false); music(false);
  if (typeof RSAmb !== "undefined") RSAmb.start();   /* the stadium sound from the home page plays on the score sheet too */
  clearInterval(timerId); clearTimeout(cpuId); $("glow").classList.remove("on");
  let top = "", rows = "";
  if (G.n === 1) {
    const S = G.st[0], T = G.teams[0], prev = getBest(), isBest = S.runs > prev;
    if (isBest) setBest(S.runs);
    $("recapTitle").textContent = S.runs >= 10 ? "Hall of Fame game" : S.runs >= 6 ? "All-Star effort" : S.runs >= 3 ? "Solid start" : "Back to the minors";
    top = '<div class="verdict" style="grid-template-columns:auto minmax(0,1fr)"><div class="side">' + jersey(T, 76) + '</div><div><div class="final-runs">' + S.runs + (S.runs === 1 ? " run" : " runs") + '</div><div class="note">' + esc(T.name) + "</div></div></div>" +
      '<div class="stats" style="margin-top:12px">' + [["Hits", S.hits], ["Home runs", S.hr], ["Strikeouts", S.k], ["Rarest hit", S.rarest ? S.rarest.name : "None"]].map(([k, v]) => '<div><div class="k">' + k + '</div><div class="v" style="' + (String(v).length > 8 ? "font-size:18px;padding-top:6px" : "") + '">' + esc(v) + "</div></div>").join("") + "</div>";
    $("endBest").textContent = isBest ? "New best score." : "Best score: " + prev + ".";
    rows = G.rounds.map((r, i) => { const h = r.e[0]; const ans = h.ans ? TIER_LABEL[h.tier] + " answer" : "<strong>No hit.</strong> " + esc(h.why && h.why.indexOf("Guessed") === 0 ? "That one missed." : (h.why || "Time ran out."));
      return '<div class="rrow"><div class="n">' + (i + 1) + '</div><div><div class="qq">' + esc(r.q) + '</div><div class="ans">' + ans + '</div><div class="sub">A deeper cut: ' + esc(h.deep || "") + '</div></div><div class="res ' + resCls(h.code) + '">' + esc(h.label) + (h.scored ? "<small>" + h.scored + (h.scored > 1 ? " runs" : " run") + " scored</small>" : "") + "</div></div>"; }).join("");
  } else {
    const [A, B] = G.teams, [a, b] = G.st;
    const w = decideWinner();
    const better = a.pts === b.pts ? -1 : a.pts > b.pts ? 0 : 1;
    const name = i => G.teams[i].name;
    const banner = (G.mode === "cpu" ? (w === 0 ? "You win" : "Computer wins") : name(w) + " win");
    $("recapTitle").textContent = a.runs !== b.runs ? "Final score" : a.pts !== b.pts ? "Won on better answers" : "Won on the longest hit";
    top = '<div class="verdict heroV" style="--ca:' + G.teams[0].c1 + ';--cb:' + G.teams[1].c1 + '">' +
      [0, 1].map(i => ['<div class="side' + (w === i ? " win" : "") + '">' + (w === i ? '<div class="crown">Winner</div>' : "") + jersey(G.teams[i], 76) + '<div class="nm">' + esc(G.teams[i].name) + '</div><div class="sc">' + G.st[i].runs + '</div><div class="rp">Answer rarity: ' + G.st[i].pts + " pts \u00b7 " + G.st[i].hr + " HR</div></div>"]).reduce((acc, x, i) => acc + x[0] + (i === 0 ? '<div class="mid">FINAL</div>' : ""), "") + "</div>" +
      '<div class="banner">' + esc(banner) + '</div><div class="note">' + (better < 0 ? "Both teams had equally rare answers (" + a.pts + " pts each)." : "Better answers: <strong>" + esc(name(better)) + "</strong> (" + G.st[better].pts + " rarity pts to " + G.st[1 - better].pts + ").") + (a.runs === b.runs ? (a.pts !== b.pts ? " Tied on runs, so rarity broke the tie." : " Tied on runs and rarity, so the longest hit won it.") : "") + "</div>";
    $("endBest").textContent = "";
    rows = G.rounds.map((r, i) => {
      const t0 = r.e[0].tier, t1 = r.e[1].tier;
      const card = (j, other) => { const h = r.e[j]; return '<div class="vc' + (h.tier > other ? " better" : "") + '"><div class="who">' + esc(G.teams[j].name) + '</div><div class="r ' + resCls(h.code) + '">' + esc(h.label) + (h.scored ? " \u00b7 " + h.scored + (h.scored > 1 ? " runs" : " run") : "") + '</div><div class="s">' + (h.ans ? TIER_LABEL[h.tier] + " answer" : esc(h.why && h.why.indexOf("Guessed") === 0 ? "That one missed." : (h.why || "Time ran out."))) + "</div></div>"; };
      const deep = (r.e[0].deep || r.e[1].deep || "");
      return '<div class="vrow"><div class="qq"><span class="qn">' + (i + 1) + "</span>" + esc(r.q) + '</div><div class="vcols">' + card(0, t1) + card(1, t0) + '</div><div class="sub hint">A deeper cut: ' + esc(deep) + "</div></div>";
    }).join("");
  }
  /* coins, stats, daily record */
  const S0 = G.st[0], S1 = G.st[1];
  const won = G.n === 2 && decideWinner() === 0;
  const coins = G.n === 2 && won ? (DAILY ? RS_CONFIG.dailyWin : RS_CONFIG.freeWin) : 0;   /* a win pays: 20 coins in the daily game, 5 in free play. A loss pays nothing. */
  const st = RS.d.stats;
  st.games++; st.hr += S0.hr; st.hits += S0.hits; st.best = Math.max(st.best, S0.runs);
  if (G.n === 2) { if (won) st.wins++; else st.losses++; }
  RS.d.coins += coins;
  if (DAILY) {
    RS.d.streak = RS.d.lastDaily === RS.yesterday() ? RS.d.streak + 1 : 1; RS.d.lastDaily = G.key;
    RS.d.daily[G.key] = { you: S0.runs, cpu: S1.runs, a: TEAMS[sel.a].abbr, b: TEAMS[sel.b].abbr, won, tie: false, chips: G.rounds.map(r => r.e[0].code), coins };
  }
  RS.save(); playsLabel();
  $("coinNote").innerHTML = DAILY
    ? (coins ? "<strong>+" + coins + " coins</strong> for winning the daily game. " : "No coins this time. Win the daily game to earn " + RS_CONFIG.dailyWin + ". ") + "Streak: " + RS.d.streak + (RS.d.streak === 1 ? " day." : " days.") + ' <a href="shop.html">Spend them in the shop</a>'
    : G.n === 2 ? (coins ? "<strong>+" + coins + " coins</strong> for the win. " : "No coins for a loss. Win a free game to earn " + RS_CONFIG.freeWin + ". ") + '<a href="coins.html">Get coins</a>'
    : G.duel ? "Friend matches don't earn coins. Beat the computer in a free game to earn " + RS_CONFIG.freeWin + "."
    : 'Win a game against the computer to earn ' + RS_CONFIG.freeWin + ' coins. <a href="coins.html">Get coins</a>';
  $("recapTop").innerHTML = (G.duel ? '<div class="duelBox" id="duelBox"></div>' : "") + top + recapExtras();
  if (G.duel) { const d = G.duel, S = G.st[0]; DUEL = null; clearInterval(duLobbyPoll); $("play").disabled = false; $("gridA").style.pointerEvents = ""; $("modeSeg").style.display = ""; playsLabel(); finishDuel(d, { runs: S.runs, pts: S.pts, hits: S.hits, hr: S.hr }); }
  $("recapList").innerHTML = rows;
  $("game").hidden = true; $("recap").hidden = false; window.scrollTo(0, 0);
}

/* ---------- the ballpark organ ---------- */
function organ(notes, vol = .2) {
  if (!audio()) return;
  notes.forEach(([f, st, dur]) => {
    const t = AC.currentTime + st, g = AC.createGain(), lp = AC.createBiquadFilter(), vib = AC.createOscillator(), vg = AC.createGain();
    lp.type = "lowpass"; lp.frequency.value = 2800; vib.frequency.value = 6; vg.gain.value = f * .005; vib.connect(vg);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.setValueAtTime(vol, t + dur * .85); g.gain.linearRampToValueAtTime(.0001, t + dur + .1);
    [[1, "sine", 1], [2, "sine", .55], [3, "sine", .32], [4, "square", .07]].forEach(([m, type, a]) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = type; o.frequency.value = f * m; og.gain.value = a; vg.connect(o.frequency); o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + .2); });
    vib.start(t); vib.stop(t + dur + .2);
    lp.connect(g); g.connect(MASTER); toRoom(g, .7);
  });
}
const CHARGE = [[392, 0, .13], [523, .17, .13], [659, .34, .13], [784, .5, .36], [659, .92, .15], [784, 1.1, .95]];   /* ba da da DUN dun DUUUU */
let startOrganTimer = null;
function stopStartOrgan() { clearInterval(startOrganTimer); startOrganTimer = null; }
function startScreenOrgan() {   /* plays on the team-select screen until the two teams are shown. Browsers only allow sound after a first click or tap. */
  const go = () => { if ($("start").hidden) { stopStartOrgan(); return; } if (!muted && audio()) organ(CHARGE, .22); };
  const arm = () => { document.removeEventListener("pointerdown", arm, true); document.removeEventListener("keydown", arm, true); if ($("start").hidden) return; audio(); go(); startOrganTimer = setInterval(go, 6500); };
  if (AC && AC.state === "running") arm(); else { document.addEventListener("pointerdown", arm, true); document.addEventListener("keydown", arm, true); }
}

/* ---------- screen layouts ---------- */
/* the question sits on a board behind home plate and the whole field stays in view (phones stack the question above the field) */
function effectiveLayout() { return window.innerWidth < 720 ? "bottom" : "stadium"; }
function applyLayout() {
  const L = effectiveLayout(), game = $("game"), tall = L === "stadium";
  ["stadium", "top", "bottom"].forEach(x => game.classList.remove("lay-" + x)); game.classList.add("lay-" + L);
  $("svg").setAttribute("viewBox", tall ? "12 22 376 393" : "12 22 376 313");   /* cropped to the stands so the field is as big as possible */
  $("stage").style.setProperty("--ar", (376 / (tall ? 393 : 313)).toFixed(4));
  const slot = L === "stadium" ? $("stage") : L === "bottom" ? $("slotBottom") : $("slotTop");
  if ($("card").parentNode !== slot) slot.appendChild($("card"));
}
let rsz = null; window.addEventListener("resize", () => { clearTimeout(rsz); rsz = setTimeout(applyLayout, 120); });
document.addEventListener("fullscreenchange", () => { document.body.classList.toggle("fs", !!document.fullscreenElement); setTimeout(applyLayout, 50); });
applyLayout();

/* ---------- play a friend ---------- */
const DUEL_KEY = "rs-duel-v1";
const duStore = { get() { try { return JSON.parse(localStorage.getItem(DUEL_KEY) || "null"); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(DUEL_KEY, JSON.stringify(v)); } catch (e) {} } };
const duApi = async (path, body) => {
  const base = (window.RS_CONFIG && RS_CONFIG.stripe && RS_CONFIG.stripe.api) || "/api";
  try {
    const r = await fetch(base + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { error: j.error || "Something went wrong. Please try again." };
    return j;
  } catch (e) { return { error: "Friend matches need the live site. They don't work in this preview." }; }
};
const duName = () => { const el = $("duName"), v = el && el.value.trim(); return v || (RS.account && RS.account.user && RS.account.user.name) || "Player"; };
function duelResultHTML(v) {
  const me = v.you, other = me === "host" ? "guest" : "host", friend = (v[other] && v[other].name) || "Your friend";
  if (v.result) {
    const m = v.mine, t = v.theirs, head = v.result === "win" ? "You win!" : v.result === "loss" ? esc(friend) + " wins" : "It's a draw";
    const why = m.runs !== t.runs ? "" : v.result === "draw" ? "Tied on runs and on answer rarity." : "Tied on runs. Decided by rarer answers (" + m.pts + " to " + t.pts + " rarity points).";
    return '<div class="duRes ' + v.result + '"><div class="duHead">' + head + '</div><div class="duScore"><span><b>' + m.runs + '</b>You</span><span class="duDash">to</span><span><b>' + t.runs + '</b>' + esc(friend) + '</span></div>' + (why ? '<div class="duWhy">' + why + '</div>' : "") + "</div>";
  }
  if (v.mine) return "";
  return "";
}
let duPoll = null, duHostPoll = null, duLobbyPoll = null;
async function finishDuel(d, score) {
  const box = $("duelBox"); if (!box) return;
  duStore.set({ code: d.code, token: d.token, role: d.role, done: true });
  const paint = v => {
    if (v.error) { box.innerHTML = '<div class="duRes"><div class="duWhy">' + esc(v.error) + "</div></div>"; return false; }
    const html = duelResultHTML(v);
    if (html) { box.innerHTML = html + '<div class="duWhy">Code ' + esc(d.code) + "</div>"; return true; }
    const other = d.role === "host" ? "guest" : "host", f = v[other];
    box.innerHTML = '<div class="duRes wait"><div class="duHead">Score sent: ' + score.runs + (score.runs === 1 ? " run" : " runs") + '</div><div class="duWhy">' + (f ? "Waiting for " + esc(f.name) + " to finish. This updates by itself." : "Waiting for your friend to join with code <b>" + esc(d.code) + "</b>.") + " You can also check later: Play a friend, then Check my last match.</div></div>";
    return false;
  };
  box.innerHTML = '<div class="duRes wait"><div class="duWhy">Sending your score\u2026</div></div>';
  let v = await duApi("/duel/finish", { code: d.code, token: d.token, runs: score.runs, pts: score.pts, hits: score.hits, hr: score.hr });
  if (paint(v)) return;
  clearInterval(duPoll);
  duPoll = setInterval(async () => { const x = await duApi("/duel/get?code=" + d.code + "&t=" + d.token); if (x.error) return; if (paint(x)) clearInterval(duPoll); }, 3000);
}
const duShow = id => { ["duMenu", "duGetBox", "duEnterBox", "duStat"].forEach(k => $(k).hidden = k !== id); $("duNameRow").hidden = id !== "duMenu" && id !== "duEnterBox"; $("duMsg").textContent = ""; };
function openDuel(prefill) {
  if (!$("duelOv")) return;
  const last = duStore.get(); $("duLast").hidden = !last;
  if (!$("duName").value) $("duName").value = (duStore.get() && duStore.get().name) || (RS.account && RS.account.user && RS.account.user.name) || "";
  duShow("duMenu"); $("duelOv").hidden = false;
  if (prefill) { duShow("duEnterBox"); $("duIn").value = prefill; $("duIn").focus(); }
}
const duFriend = v => v && DUEL ? (DUEL.role === "host" ? v.guest : v.host) : null;
function startDuelPick() {   /* both players land here together: pick a team, tap Ready, and the match starts for both at once */
  clearInterval(duHostPoll); clearInterval(duLobbyPoll);
  $("duelOv").hidden = true; $("welcome").hidden = true; $("pickStep").hidden = false;
  $("modeSeg").style.display = "none"; sel.mode = "solo"; DUEL.ready = false; DUEL.starting = false;
  document.body.classList.add("picking");
  renderStart(); $("pickA").textContent = "Pick your team";
  $("play").textContent = "Ready"; $("play").disabled = false; $("gridA").style.pointerEvents = "";
  $("pickHint").textContent = "Pick your team, then tap Ready. When you both are ready the match starts for you both at the same time.";
  const paint = v => {
    const f = duFriend(v), mt = $("matchup");
    if (!v || v.error) { mt.textContent = "Friend match \u00b7 " + DUEL.code; return; }
    mt.textContent = "Friend match \u00b7 " + DUEL.code + " \u00b7 " + (f ? esc(f.name) + (f.ready ? " is ready" : f.team != null ? " picked a team" : " is picking a team") : "waiting for your friend");
    $("playsInfo").textContent = DUEL.ready ? (f && f.ready ? "Both ready. Get set!" : "You're ready. Waiting for " + (f ? f.name : "your friend") + "\u2026") : "Friend match: doesn't use a free play.";
    if (v.startIn != null && !DUEL.starting) beginDuelCountdown(v);
  };
  const poll = async () => { if (!DUEL || DUEL.starting) return; const v = await duApi("/duel/state", { code: DUEL.code, token: DUEL.token }); paint(v); };
  paint(null); poll(); duLobbyPoll = setInterval(poll, 1000);
  window.scrollTo(0, 0);
}
async function duelReady() {
  if (!DUEL || DUEL.ready) return;
  DUEL.ready = true; $("play").disabled = true; $("play").textContent = "Ready \u2713"; $("gridA").style.pointerEvents = "none";
  const v = await duApi("/duel/state", { code: DUEL.code, token: DUEL.token, team: sel.a, ready: true });
  if (v.error) { DUEL.ready = false; $("play").disabled = false; $("play").textContent = "Ready"; $("gridA").style.pointerEvents = ""; $("playsInfo").textContent = v.error; return; }
  const f = duFriend(v); $("playsInfo").textContent = f && f.ready ? "Both ready. Get set!" : "You're ready. Waiting for " + (f ? f.name : "your friend") + "\u2026";
  if (v.startIn != null) beginDuelCountdown(v);
}
function beginDuelCountdown(v) {   /* the server says how long until the start, so both screens count down to the same moment */
  if (!DUEL || DUEL.starting) return; DUEL.starting = true; clearInterval(duLobbyPoll);
  const f = duFriend(v); DUEL.friendTeam = f && f.team != null ? f.team : null; DUEL.friendName = f ? f.name : "Friend";
  const t = performance.now() + v.startIn, ov = $("duCount"), n = $("duCountN");
  $("duCountVs").textContent = "vs " + DUEL.friendName; ov.hidden = false;
  const tick = () => {
    const left = t - performance.now();
    if (left <= 0) { ov.hidden = true; newGame(); return; }
    n.textContent = Math.max(1, Math.ceil(left / 1000)); setTimeout(tick, 60);
  };
  tick();
}
async function duelBarrier(done) {   /* lock-step: the next question starts only when your friend has finished this one too */
  const d = G.duel, wait = $("duWait"); wait.hidden = false;
  const t0 = Date.now(), seat = d.role === "host" ? "guest" : "host";
  try {
    for (;;) {
      const v = await duApi("/duel/state", { code: d.code, token: d.token, round: done });
      const f = v && v[seat];
      if (!v || v.error || !f || f.round >= done || f.done || Date.now() - t0 > 40000) break;
      await new Promise(r => setTimeout(r, 600));
    }
  } finally { wait.hidden = true; }
}
if ($("duelOv")) {
  $("introFriend").addEventListener("click", () => openDuel());
  $("duClose").addEventListener("click", () => { $("duelOv").hidden = true; });
  ["duBack1", "duBack2", "duBack3"].forEach(k => $(k).addEventListener("click", () => { clearInterval(duHostPoll); openDuel(); }));
  $("duGet").addEventListener("click", async () => {
    $("duMsg").textContent = "Making your code\u2026"; $("duGet").disabled = true;
    const name = duName(), r = await duApi("/duel/create", { name }); $("duGet").disabled = false;
    if (r.error) { $("duMsg").textContent = r.error; return; }
    DUEL = { code: r.code, token: r.token, role: "host", name }; duStore.set({ code: r.code, token: r.token, role: "host", name, done: false });
    $("duCode").textContent = r.code; duShow("duGetBox");
    clearInterval(duHostPoll);
    duHostPoll = setInterval(async () => {
      if (!DUEL || DUEL.code !== r.code || $("duelOv").hidden || $("duGetBox").hidden) { clearInterval(duHostPoll); return; }
      const v = await duApi("/duel/get?code=" + r.code + "&t=" + r.token);
      if (v.guest) { clearInterval(duHostPoll); startDuelPick(); }
    }, 1500);
  });
  $("duCopy").addEventListener("click", async () => {
    const link = location.origin + location.pathname.replace(/[^/]*$/, "") + "play.html?join=" + DUEL.code;
    try { await navigator.clipboard.writeText("Play me on Rare Swing! Code " + DUEL.code + " " + link); $("duMsg").textContent = "Copied. Paste it in a text to your friend."; } catch (e) { $("duMsg").textContent = "Send your friend this code: " + DUEL.code; }
  });
  $("duEnter").addEventListener("click", () => { duShow("duEnterBox"); $("duIn").focus(); });
  const join = async () => {
    const code = $("duIn").value.trim().toUpperCase(); if (code.length !== 6) { $("duMsg").textContent = "The code has 6 letters and numbers."; return; }
    $("duMsg").textContent = "Joining\u2026"; $("duJoin").disabled = true;
    const name = duName(), r = await duApi("/duel/join", { code, name }); $("duJoin").disabled = false;
    if (r.error) { $("duMsg").textContent = r.error; return; }
    DUEL = { code: r.code, token: r.token, role: "guest", name }; duStore.set({ code: r.code, token: r.token, role: "guest", name, done: false });
    startDuelPick();
  };
  $("duJoin").addEventListener("click", join);
  $("duIn").addEventListener("keydown", e => { if (e.key === "Enter") join(); });
  $("duLast").addEventListener("click", async () => {
    const last = duStore.get(); if (!last) return;
    $("duMsg").textContent = "Checking\u2026";
    const v = await duApi("/duel/get?code=" + last.code + "&t=" + last.token);
    if (v.error) { $("duMsg").textContent = v.error; return; }
    duShow("duStat"); const other = last.role === "host" ? "guest" : "host", f = v[other];
    const html = duelResultHTML(v);
    $("duStatGo").hidden = true;
    if (html) $("duStatIn").innerHTML = html + '<p class="duP">Code ' + esc(last.code) + "</p>";
    else if (v[last.role] && v[last.role].done) $("duStatIn").innerHTML = '<p class="duP">You finished. ' + (f ? "Waiting for " + esc(f.name) + " to finish." : "Waiting for your friend to join with code <b>" + esc(last.code) + "</b>.") + "</p>";
    else { DUEL = { code: last.code, token: last.token, role: last.role, name: last.name }; $("duStatIn").innerHTML = '<p class="duP">You haven\'t played match <b>' + esc(last.code) + "</b> yet.</p>"; $("duStatGo").hidden = false; }
  });
  $("duStatGo").addEventListener("click", startDuelPick);
  const qs = new URLSearchParams(location.search);
  if (!DAILY && qs.get("join")) { document.body.classList.add("picking"); $("welcome").hidden = true; openDuel(qs.get("join").toUpperCase().slice(0, 6)); }
  else if (!DAILY && qs.get("friend")) { document.body.classList.add("picking"); $("welcome").hidden = true; openDuel(); }
}

/* ---------- buttons ---------- */
$("play").addEventListener("click", () => { if (DUEL && !DAILY) duelReady(); else newGame(); });
if ($("pwBuy")) {
  $("pwBuy").addEventListener("click", () => { if (RS.d.coins < RS_CONFIG.passCost) { location.href = "coins.html"; return; } if (RS.buyPass()) { $("paywall").hidden = true; clearInterval(pwTick); if ($("pickStep").hidden) { $("welcome").hidden = true; $("pickStep").hidden = false; playsLabel(); window.scrollTo(0, 0); } else newGame(); } });
  $("pwClose").addEventListener("click", () => { $("paywall").hidden = true; clearInterval(pwTick); if (document.body.classList.contains("picking")) location.href = "index.html"; });
}
if ($("again")) $("again").addEventListener("click", newGame);
if ($("change")) $("change").addEventListener("click", () => { RSAmb.start(); $("recap").hidden = true; $("start").hidden = false; renderStart(); window.scrollTo(0, 0); });
renderStart(); playsLabel();
{
  const openPick = () => { $("welcome").hidden = true; $("pickStep").hidden = false; window.scrollTo(0, 0); };
  const outOfPlays = () => !DAILY && !RS.d.unlimited && RS.freeLeft() <= 0;   /* free play with no free games left: ask before anything else */
  if ($("introGo")) $("introGo").addEventListener("click", () => { if (outOfPlays()) showPaywall(); else openPick(); });
  if (/[?&]go=1/.test(location.search)) { document.body.classList.add("picking"); if (outOfPlays()) { $("welcome").hidden = true; showPaywall(); } else openPick(); }   /* coming from a button on the home page: straight to picking a team */
  const st = RS.d.stats, tile = (k, v) => '<div><b>' + v + '</b><span>' + k + '</span></div>', box = $("introStats");
  if (box) {
    const f = RS.freeLeft();
    box.innerHTML = DAILY
      ? tile("Day streak", RS.d.streak || 0) + tile("Coins for a win", "+" + RS_CONFIG.dailyWin) + tile("Your coins", RS.d.coins) + tile("Daily games played", Object.keys(RS.d.daily || {}).length)
      : tile("Free games left today", RS.d.unlimited ? "Unlimited" : f + " of " + RS_CONFIG.freePlaysPerDay) + tile("Your coins", RS.d.coins) + tile("Games played", st.games) + tile("Home runs hit", st.hr);
  }
}

/* daily: one game per day. Come back to see your result and the countdown to the next one. */
function showDailyDone(rec) {
  document.body.classList.remove("picking");   /* coming from the home page's "See result" button: show the usual page bar too */
  $("start").hidden = true; $("dailyDone").hidden = false;
  const A = TEAMS.find(t => t.abbr === rec.a), B = TEAMS.find(t => t.abbr === rec.b);
  const verdict = rec.forfeit ? "You left today's game early" : rec.tie ? "Tie game" : rec.won ? "You win" : "Computer wins";
  $("dailyDoneBody").innerHTML = '<div class="verdict"><div class="side' + (rec.won ? " win" : "") + '">' + jersey(RS.dress(A), 76) + '<div class="nm">' + esc(A.name) + '</div><div class="sc">' + rec.you + '</div></div><div class="mid">FINAL</div><div class="side' + (!rec.won && !rec.tie ? " win" : "") + '">' + jersey(B, 76) + '<div class="nm">' + esc(B.name) + '</div><div class="sc">' + rec.cpu + '</div></div></div>' +
    '<div class="banner">' + verdict + '</div><div class="log" style="padding-left:0">' + rec.chips.map(c => '<span class="chip' + (c === "HR" ? " hr" : c === "K" ? "" : " h") + '">' + c + "</span>").join("") + '</div>' +
    '<div class="note">Streak: <strong>' + RS.d.streak + (RS.d.streak === 1 ? " day" : " days") + '</strong> \u00b7 Coins earned today: <strong>' + rec.coins + "</strong></div>";
  const tick = () => { const n = new Date(), m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1), s = Math.max(0, m - n) / 1000 | 0, p = v => String(v).padStart(2, "0"); $("nextDaily").textContent = p(s / 3600 | 0) + ":" + p(s / 60 % 60 | 0) + ":" + p(s % 60); };
  tick(); setInterval(tick, 1000);
  $("copyDaily").addEventListener("click", () => {
    const txt = "Rare Swing Daily " + G_KEY() + ": " + rec.you + "-" + rec.cpu + " " + (rec.tie ? "T" : rec.won ? "W" : "L") + "  " + rec.chips.join(" ");
    const done = () => { $("copyDaily").textContent = "Copied"; };
    try { navigator.clipboard.writeText(txt).then(done, () => { $("copyDaily").textContent = txt; }); } catch (e) { $("copyDaily").textContent = txt; }
  });
}
const G_KEY = () => RS.dayKey();
if (DAILY) {
  $("dailyDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  let rec = RS.d.daily[RS.dayKey()];
  const ds = RS.d.dailyStarted;
  if (!rec && ds && ds.key === RS.dayKey()) { rec = RS.d.daily[ds.key] = { you: 0, cpu: 0, a: ds.a, b: ds.b, won: false, tie: false, chips: [], coins: 0, forfeit: true }; RS.d.dailyStarted = null; RS.save(); }
  if (rec) showDailyDone(rec);
}


/* ---------- settings / pause / leave ---------- */
function paintSettings() {
  $("setMute").textContent = muted ? "Sound is off. Turn it on" : "Sound is on. Turn it off";
  $("setFs").textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
}
function openSettings() {   /* the clock keeps running while this is open */
  if (!G) return;
  $("setMain").hidden = false; $("setConfirm").hidden = true; paintSettings();
  $("settings").hidden = false; $("setResume").focus();
}
function closeSettings() {
  $("settings").hidden = true;
  if (!awaiting && !$("game").hidden) $("ans").focus();
}
function leaveWarning() {
  if (G && G.duel) return "If you leave now, your match is not scored and your friend will be left waiting. It does not use a free play.";
  if (DAILY) return "If you leave now you lose today's daily game. It counts as played, so you can't try again until tomorrow, and you can't win the " + RS_CONFIG.dailyWin + " coins.";
  return RS.d.unlimited ? "If you leave now, your progress in this game will be lost." : "If you leave now you lose 1 of your " + RS_CONFIG.freePlaysPerDay + " free plays for today.";
}
$("gearBtn").addEventListener("click", openSettings);
$("setResume").addEventListener("click", closeSettings);
$("setMute").addEventListener("click", toggleMute);
$("setFs").addEventListener("click", () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) {} setTimeout(paintSettings, 300); });
$("setLeave").addEventListener("click", () => { $("setWarn").textContent = leaveWarning(); $("setMain").hidden = true; $("setConfirm").hidden = false; $("setStay").focus(); });
$("setStay").addEventListener("click", () => { $("setMain").hidden = false; $("setConfirm").hidden = true; $("setResume").focus(); });
$("setReallyLeave").addEventListener("click", () => {
  clearInterval(timerId); clearTimeout(cpuId);
  if (DAILY && G) {   /* the daily game is used up */
    const key = G.key, S0 = G.st[0], S1 = G.st[1];
    RS.d.daily[key] = { you: S0.runs, cpu: S1 ? S1.runs : 0, a: TEAMS[sel.a].abbr, b: TEAMS[sel.b == null ? sel.a : sel.b].abbr, won: false, tie: false, chips: G.rounds.map(r => r.e[0] && r.e[0].code).filter(Boolean), coins: 0, forfeit: true };
    RS.d.dailyStarted = null; RS.save();
  }
  location.href = (location.pathname.split("/").pop() || (DAILY ? "daily.html" : "play.html")) + location.search;
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && G && !$("game").hidden && $("settings").hidden && $("intro").hidden) openSettings(); else if (e.key === "Escape" && !$("settings").hidden) closeSettings(); });
