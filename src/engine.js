/* ================= ENGINE ================= */
let SAVE_KEY = 'metsakuningriik.v1';
let S = null, RATES = null, SILENT = false, silentLog = [];
let storageOk = true, lastSaved = 0;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = n => { n = Math.floor(n + 1e-9); if (n < 10000) return String(n); if (n < 1e6) return (n / 1000).toFixed(1).replace('.', ',') + 'k'; return (n / 1e6).toFixed(2).replace('.', ',') + 'M' };
const fmt1 = n => (Math.round(n * 10) / 10).toFixed(Math.abs(n) < 10 && n % 1 !== 0 ? 1 : 0).replace('.', ',');
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); if (s < 60) return s + ' s'; const m = Math.floor(s / 60), r = s % 60; if (m < 60) return m + ' min' + (r ? ' ' + r + ' s' : ''); return Math.floor(m / 60) + ' h ' + (m % 60) + ' min' };
const dayNum = () => Math.floor(S.time / DAY) + 1;
const dateKey = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') };

function newState(name, kingdom) {
  const created = Date.now();
  const st = { gathered: {}, trades: 0, planted: 0, chopped: 0, built: {}, builtTotal: 0, upgrades: 0, tamed: {}, tamedTotal: 0, discoveries: 0, sold: 0, bought: 0, goldEarned: 0, cooked: 0, nights: 0, maxBldLvl: 0, rainPlant: 0, scared: 0, raids: 0 };
  RES_KEYS.forEach(k => st.gathered[k] = 0);
  const market = {}; MARKET_KEYS.forEach(k => market[k] = { m: 1, h: Array(12).fill(1) });
  const s = {
    v: 1, name, kingdom, created, last: created,
    res: { wood: 40, stone: 20, berries: 20, food: 25, water: 30, gold: 120 },
    xp: 0, level: 1, fame: 0, time: 40, weather: { t: 'paike', until: 260 },
    regions: {}, buildings: [], nextId: 1, view: 'kodu',
    st, quests: {}, ach: {}, daily: { last: null, streak: 0, best: 0 },
    market, marketT: 0, raid: null, welcomed: false, upg: {}, merchant: null, seenSeasons: [],
  };
  s.regions.kodu = genRegion('kodu', created);
  return s;
}
function migrate(s) {
  const t = newState(s.name || 'Valitseja', s.kingdom || 'Metsakuningriik');
  for (const k in t) if (s[k] === undefined) s[k] = t[k];
  for (const k in t.st) if (s.st[k] === undefined) s.st[k] = t.st[k];
  RES_KEYS.forEach(k => { if (s.res[k] === undefined) s.res[k] = 0; if (s.st.gathered[k] === undefined) s.st.gathered[k] = 0 });
  MARKET_KEYS.forEach(k => { if (!s.market[k]) s.market[k] = { m: 1, h: Array(12).fill(1) } });
  return s;
}

/* ---------- world generation ---------- */
function genRegion(key, seed) {
  const R = REGIONS[key], g = R.gen, rand = mulberry32(hashStr(key + ':' + seed));
  const tiles = [];
  for (let i = 0; i < W * H; i++) tiles.push({ t: 'grass' });
  const at = (x, y) => tiles[y * W + x];
  const ph = rand() * 6;
  const pools = Array.from({ length: 6 }, () => ({ x: 1 + rand() * 14, y: 1 + rand() * 9, r: .8 + rand() * .9 }));
  const water = (x, y) => {
    if (g.water === 'pools') return pools.some(p => ((x - p.x) / p.r) ** 2 + ((y - p.y) / (p.r * .8)) ** 2 < 1);
    if (g.water === 'sea') return x > 11.6 + Math.sin(y * 0.8 + ph) * 1.1;
    if (g.water === 'island') return ((x - 7.5) / 7.3) ** 2 + ((y - 5) / 5.1) ** 2 > 1;
    if (g.water === 'pond') return ((x - 12.5) / 2.4) ** 2 + ((y - 7.6) / 1.7) ** 2 < 1;
    if (g.water === 'lake') return ((x - 2.5) / 5.6) ** 2 + ((y - 9.8) / 4.6) ** 2 < 1 || ((x + 0.5) / 2.6) ** 2 + ((y - 3.5) / 3) ** 2 < 1;
    if (g.water === 'stream') return Math.abs(x - (3.2 + Math.sin(y * 0.7 + ph) * 1.4)) < 0.75;
    return false;
  };
  const clear = (x, y) => key === 'kodu' && x >= 5 && x <= 10 && y >= 3 && y <= 7;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const t = at(x, y);
    if (water(x, y)) { t.t = 'water'; continue }
    if (clear(x, y)) continue;
    const r = rand();
    if (r < g.trees) { t.t = 'tree'; t.s = 3; t.g = 0; t.k = g.kinds[Math.floor(rand() * g.kinds.length)] }
    else if (r < g.trees + g.rocks) { t.t = 'rock'; t.c = 8 }
    else if (r < g.trees + g.rocks + g.bushes) { t.t = 'bush'; t.ripe = true; t.g = 1 }
  }
  const freeSpot = () => { for (let i = 0; i < 400; i++) { const x = 1 + Math.floor(rand() * (W - 2)), y = 1 + Math.floor(rand() * (H - 2)); const t = at(x, y); if (t.t !== 'water' && !clear(x, y) && (t.t === 'grass' || t.t === 'tree' || t.t === 'rock')) return t } return null };
  for (let i = 0; i < (g.gold || 0); i++) { const t = freeSpot(); if (t) { for (const k in t) delete t[k]; t.t = 'goldvein'; t.c = 6 } }
  for (const d of R.disc) { const t = freeSpot(); if (t) { for (const k in t) delete t[k]; t.t = d; if (d === 'mushring') { t.w = 0; t.found = false } } }
  if (key === 'kodu') {
    Object.assign(at(6, 4), { t: 'tree', s: 1, g: .3, k: 'kask' });
    Object.assign(at(9, 6), { t: 'bush', ripe: true, g: 1 });
    Object.assign(at(10, 3), { t: 'rock', c: 8 });
  }
  return { tiles };
}

/* ---------- buildings ---------- */
const getB = id => S.buildings.find(b => b.id === id);
const countType = t => S.buildings.filter(b => b.type === t).length;
function bEffect(b, lvl = b.lvl) {
  const D = BUILD[b.type], rm = REGIONS[b.region].bonus[b.type] || 1, lm = lvl * (1 + 0.1 * (lvl - 1));
  const prod = {}, use = {};
  for (const k in D.prod) prod[k] = D.prod[k] * lm * rm;
  for (const k in D.use) use[k] = D.use[k] * lvl;
  return { prod, use, upkeep: (D.upkeep || 0) * lvl, fame: (D.fame || 0) * lvl * rm, storage: (D.storage || 0) * lvl, residents: (D.res || 0) * lvl, gather: (D.gather || 0) * lvl, rm };
}
function season() { return SEASONS[Math.floor((dayNum() - 1) / 3) % 4] }
function weatherMult(type) { const m = WEATHER[S.weather.t].mult; const sm = season().mult[type] || 1; if (!m) return sm; return (m[type] ?? m._ ?? 1) * sm }
const scaleCost = (c, f) => { const o = {}; for (const k in c) o[k] = Math.ceil(c[k] * f); return o };
const upCost = b => scaleCost(BUILD[b.type].cost, Math.pow(1.7, b.lvl));
const upTime = b => buildTime(BUILD[b.type].time * (1 + 0.7 * b.lvl));
const canAfford = c => Object.keys(c).every(k => S.res[k] >= c[k]);
function pay(c) { for (const k in c) S.res[k] -= c[k] }
const hasActive = t => S.buildings.some(b => b.type === t && (!b.done || b.up));

function computeRates() {
  const net = {}; RES_KEYS.forEach(k => net[k] = 0);
  const status = {}; let fame = 0, residents = 0, storage = 0, gather = 0, guard = false, upkeep = 0;
  const goldOk = S.res.gold > 0.01;
  for (const b of S.buildings) {
    const e = bEffect(b);
    if (b.done && !b.up) { status[b.id] = { s: 'build' }; continue }
    storage += e.storage; residents += e.residents; gather += e.gather;
    if (BUILD[b.type].guard) guard = true;
    if (b.done) { status[b.id] = { s: 'up' }; continue }
    if (e.upkeep > 0 && !goldOk) { status[b.id] = { s: 'stall', why: 'Kuld on otsas, ülalpidamine on maksmata' }; continue }
    let lack = null;
    for (const k in e.use) if (k !== 'food' && S.res[k] < 0.3) lack = k;
    if (lack) { status[b.id] = { s: 'stall', why: 'Puudub ' + RES[lack].n.toLowerCase() }; continue }
    const hungry = b.type === 'elumaja' && S.res.food < 0.3;
    const wm = weatherMult(b.type);
    const um = (['pold', 'marjaaed', 'mesila'].includes(b.type) ? 1 + .15 * upgRank('muld') : 1) * (b.type === 'elumaja' ? 1 + .15 * upgRank('peod') : 1);
    for (const k in e.prod) net[k] += e.prod[k] * wm * um * (hungry ? 0.4 : 1);
    for (const k in e.use) { if (k === 'food' && hungry) continue; net[k] -= e.use[k] }
    net.gold -= e.upkeep; upkeep += e.upkeep;
    fame += e.fame;
    status[b.id] = hungry ? { s: 'warn', why: 'Elanikud on näljas ja maksavad vähem' } : { s: 'ok' };
  }
  for (const sp in S.st.tamed) {
    const n = S.st.tamed[sp], bo = ANIMALS[sp].bonus;
    for (const k in bo) { if (k === 'fame') fame += bo[k] * n; else net[k] += bo[k] * n }
    if (ANIMALS[sp].guard && n > 0) guard = true;
  }
  fame *= 1 + .2 * upgRank('kroonikud');
  return { net, status, fame, residents, cap: BASE_CAP + storage + 500 * upgRank('ladu'), gather, guard, upkeep };
}

/* ---------- XP / rewards ---------- */
const xpNeed = l => Math.round(30 * Math.pow(l, 1.5) + 20);
function addXP(n) {
  S.xp += n; let from = S.level;
  while (S.xp >= xpNeed(S.level)) { S.xp -= xpNeed(S.level); S.level++ }
  if (S.level > from) onLevelUp(from + 1, S.level);
}
function unlocksBetween(a, b) {
  const u = [];
  for (const k of BUILD_ORDER) if (BUILD[k].lvl >= a && BUILD[k].lvl <= b) u.push(BUILD[k].n);
  for (const k of REGION_ORDER) if (REGIONS[k].lvl >= a && REGIONS[k].lvl <= b && k !== 'kodu') u.push(REGIONS[k].n + ' (piirkond)');
  for (const k of ANIMAL_ORDER) if (ANIMALS[k].lvl >= a && ANIMALS[k].lvl <= b && ANIMALS[k].lvl > 1) u.push(ANIMALS[k].n + ' (loom)');
  return u;
}
function give(rew) {
  for (const k in rew) {
    const v = rew[k];
    if (RES[k]) { S.res[k] += v; if (k === 'gold') S.st.goldEarned += v }
    else if (k === 'fame') S.fame += v;
    else if (k === 'map') S.maps = (S.maps || 0) + v;
  }
  if (rew.xp) addXP(rew.xp);
}
const rewardHTML = r => Object.keys(r).map(k => `<span>${ic(RES[k] ? k : k)}+${fmt(r[k])}</span>`).join('');
const rewardText = r => Object.keys(r).map(k => '+' + fmt(r[k]) + ' ' + (RES[k] ? RES[k].g : k === 'xp' ? 'kogemust' : k === 'map' ? 'aardekaart' : 'kuulsust')).join(', ');

/* manual gathering, capped by storage */
function addRes(k, amt, x, y) {
  const cap = RATES.cap;
  if (k !== 'gold' && S.res[k] >= cap) { floatText(x, y, 'Ladu täis', '#ff8a78'); toastOnce('full', 'Ladu on täis. Ehita elumaju, turg või loss, et laomahtu suurendada, või müü kaupa turul.', 'bad'); return 0 }
  const before = S.res[k];
  S.res[k] = k === 'gold' ? S.res[k] + amt : Math.min(cap, S.res[k] + amt);
  const got = S.res[k] - before;
  S.st.gathered[k] += got; if (k === 'gold') S.st.goldEarned += got;
  floatText(x, y, '+' + fmt(got) + ' ' + RES[k].g, RES[k].c);
  return got;
}

/* ---------- tick ---------- */
function tick(dt, silent) {
  SILENT = silent;
  const p0 = (S.time % DAY) / DAY; S.time += dt; const p1 = (S.time % DAY) / DAY;
  const crossed = a => p1 >= p0 ? (p0 < a && p1 >= a) : (a > p0 || a <= p1);
  if (crossed(0.7)) onNightfall();
  if (crossed(0.84)) onMidnight();
  if (p1 < p0) {
    S.st.nights++;
    const se = season(); if (!S.seenSeasons.includes(se.k)) S.seenSeasons.push(se.k);
    if (!silent) {
      if ((dayNum() - 1) % 3 === 0) { toast(`Algas ${se.n.toLowerCase()}! ${se.fx[0].toUpperCase() + se.fx.slice(1)}.`, 'gold', 'fame'); groundKey = '' }
      else toast(`Päev ${dayNum()} algab. Linnud laulavad.`, 'info', 'fame');
      if (!S.merchant && S.level >= 2 && Math.random() < .6) spawnMerchant();
    }
  }
  if (S.merchant && S.time >= S.merchant.until) { S.merchant = null; if (!silent) toast('Rändkaupmees pani vankri kinni ja sõitis edasi.', 'info') }
  if (S.time >= S.weather.until) newWeather();

  const now = Date.now();
  for (const b of S.buildings) if (b.done && b.done <= now) finishBuild(b);

  RATES = computeRates();
  for (const k of RES_KEYS) {
    const d = RATES.net[k] * dt / 60;
    if (d > 0) {
      if (k === 'gold') { S.res.gold += d; S.st.gathered.gold += d; S.st.goldEarned += d }
      else if (S.res[k] < RATES.cap) { const b4 = S.res[k]; S.res[k] = Math.min(RATES.cap, S.res[k] + d); S.st.gathered[k] += S.res[k] - b4 }
    } else S.res[k] = Math.max(0, S.res[k] + d);
  }
  S.fame += RATES.fame * dt / 60;

  // nature
  const wg = WEATHER[S.weather.t].grow * season().grow * (1 + .3 * upgRank('haldjad'));
  const forest = {};
  for (const b of S.buildings) if (b.type === 'metsamaja' && !b.done) forest[b.region] = (forest[b.region] || 0) + b.lvl;
  for (const rk in S.regions) {
    const boost = 1 + 0.2 * (forest[rk] || 0);
    for (const t of S.regions[rk].tiles) {
      switch (t.t) {
        case 'tree': if (t.s < 3) { t.g += dt / 45 * wg * boost; if (t.g >= 1) { t.s++; t.g = 0 } } break;
        case 'bush': if (!t.ripe) { t.g += dt / 40 * (S.weather.t === 'vihm' ? 1.5 : 1); if (t.g >= 1) { t.ripe = true; t.g = 1 } } break;
        case 'rubble': t.w -= dt; if (t.w <= 0) { t.t = 'rock'; t.c = 8; delete t.w } break;
        case 'goldvein': if (t.c <= 0) { t.w -= dt; if (t.w <= 0) { t.c = 6; t.w = 0 } } break;
        case 'mushring': if (t.w > 0) t.w = Math.max(0, t.w - dt); break;
      }
    }
  }
  // market drift
  S.marketT += dt;
  while (S.marketT >= 30) {
    S.marketT -= 30;
    for (const k of MARKET_KEYS) { const m = S.market[k]; m.m = clamp(m.m + (1 - m.m) * 0.08 + rnd(-0.07, 0.07), 0.45, 2); m.h.push(m.m); if (m.h.length > 16) m.h.shift() }
  }
  checkAch();
  SILENT = false;
}
function newWeather() {
  const se = season().k, wt = k => k === 'lumi' ? (se === 'talv' ? 40 : se === 'sygis' ? 4 : 0) : k === 'vihm' ? (se === 'talv' ? 3 : se === 'suvi' ? 14 : 24) : k === 'paike' ? (se === 'suvi' ? 45 : se === 'talv' ? 18 : 30) : WEATHER[k].w;
  const ws = Object.keys(WEATHER); let tot = ws.reduce((a, k) => a + wt(k), 0), r = Math.random() * tot, pickW = 'paike';
  for (const k of ws) { r -= wt(k); if (r <= 0) { pickW = k; break } }
  if (pickW === S.weather.t) { const alt = ws.filter(k => wt(k) > 0 && k !== pickW); if (alt.length) pickW = pick(alt) }
  S.weather = { t: pickW, until: S.time + rnd(150, 300) };
  if (!SILENT) toast('Ilm muutus: ' + WEATHER[pickW].n.toLowerCase() + '. ' + WEATHER_FX[pickW] + '.', 'info');
}
function onNightfall() {
  if (SILENT) return;
  RATES = computeRates();
  if (S.level >= 3 && !RATES.guard && S.res.food > 5) {
    S.raid = { n: ri(2, 3) };
    toast('Hundid hiilivad Kodumetsa! Mine sinna ja peleta nad minema enne südaööd, muidu varastavad nad toitu.', 'bad');
    if (S.view === 'kodu') spawnRaid();
  } else toast('Öö laskub metsa üle. Tulikärbsed süttivad.', 'info');
}
function onMidnight() {
  if (SILENT || !S.raid) { S.raid = null; return }
  if (S.raid.n > 0) {
    const lost = Math.min(Math.floor(S.res.food), 8 * S.raid.n + Math.floor(S.res.food * 0.05 * S.raid.n));
    S.res.food -= lost; S.st.raids++;
    toast(`Hundid varastasid öösel ${lost} toitu. Vahitorn või sõbralik hunt hoiab neid eemal.`, 'bad');
  }
  S.raid = null;
  ents.forEach(a => { if (a.raid) a.flee = true });
}
function finishBuild(b) {
  const D = BUILD[b.type];
  if (b.up) {
    b.lvl++; S.st.upgrades++; S.st.maxBldLvl = Math.max(S.st.maxBldLvl, b.lvl);
    b.done = null; b.up = false;
    addXP(10 * b.lvl);
    toast(`${D.n} on nüüd ${b.lvl}. tasemel.`, 'good');
  } else {
    b.done = null;
    S.st.built[b.type] = (S.st.built[b.type] || 0) + 1; S.st.builtTotal++;
    S.st.maxBldLvl = Math.max(S.st.maxBldLvl, 1);
    const cs = Object.values(D.cost).reduce((a, v) => a + v, 0);
    addXP(Math.round(10 + cs / 8));
    toast(`${D.n} on valmis!`, 'good');
  }
  if (typeof sparkle === 'function' && b.region === S.view) sparkle(b.x + .5, b.y + .5, '#ffd286', 14);
}
function checkAch() {
  for (const a of ACH) if (!S.ach[a.id] && a.ok(S)) {
    S.ach[a.id] = Date.now(); S.fame += a.fame;
    toast(`Saavutus: ${a.n}${a.fame ? ' (+' + a.fame + ' kuulsust)' : ''}`, 'gold', 'fame');
  }
}
function catchUp(sec) {
  const b4 = { ...S.res }, fame0 = S.fame, lvl0 = S.level;
  let left = Math.min(sec, offlineCapH() * 3600); const used = left;
  silentLog = [];
  while (left > 0) { const d = Math.min(5, left); tick(d, true); left -= d }
  const diff = {}; RES_KEYS.forEach(k => { const d = S.res[k] - b4[k]; if (Math.abs(d) >= 1) diff[k] = d });
  return { diff, fame: S.fame - fame0, used, levels: S.level - lvl0, log: silentLog.slice(0, 6) };
}

/* ---------- player actions ---------- */
const tier = () => REGION_ORDER.indexOf(S.view) + 1;
function treeYield(k) { return Math.round((k === 'tamm' ? 11 : k === 'mand' ? 7 : 5) * (1 + RATES.gather) * (1 + .4 * upgRank('kirves'))) }
const offlineCapH = () => 4 + 2 * upgRank('valitsus');
const buildTime = t => Math.max(2, Math.round(t * 4 * (1 - .2 * upgRank('ehitajad'))));
const merchantAt = (x, y) => S.merchant && S.view === 'kodu' && S.merchant.x === x && S.merchant.y === y;
function interactTile(x, y) {
  if (merchantAt(x, y)) { openMerchant(); return }
  const tile = S.regions[S.view].tiles[y * W + x];
  const cx = x + .5, cy = y + .5, gm = 1 + RATES.gather;
  switch (tile.t) {
    case 'b': openBuilding(tile.id); return;
    case 'tree': {
      if (tile.s < 3) { info('See puu on veel noor. Lase tal kasvada, enne kui langetad.'); floatText(cx, cy, 'Veel noor', '#c3d3a4'); return }
      const amt = treeYield(tile.k);
      if (addRes('wood', amt, cx, cy) > 0) { const k = tile.k; for (const p in tile) delete tile[p]; tile.t = 'stump'; tile.k = k; S.st.chopped++; addXP(2); leaves(cx, cy, k); info('Langetasid puu. Kännu saad koristada või istutada sinna uue puu.') }
      return;
    }
    case 'stump': addRes('wood', 1, cx, cy); for (const p in tile) delete tile[p]; tile.t = 'grass'; addXP(1); info('Känd on koristatud. Vaba maa ootab ehitajat.'); return;
    case 'rock': if (addRes('stone', Math.round(3 * gm * (1 + .4 * upgRank('kirka'))), cx, cy) > 0) { tile.c--; addXP(1); chips(cx, cy, '#c9d0d2'); if (tile.c <= 0) { tile.t = 'rubble'; tile.w = 150; info('Kivi on otsas. Uus kivi kerkib 150 sekundi pärast.') } else info(`Kivis on veel ${tile.c} kildu.`) } return;
    case 'rubble': info(`Kivid kerkivad uuesti ${fmtTime(tile.w)} pärast.`); return;
    case 'goldvein':
      if (tile.c > 0) { addRes('gold', Math.round(4 * gm * (1 + .4 * upgRank('kirka'))), cx, cy); tile.c--; addXP(2); chips(cx, cy, '#ffd065'); if (tile.c <= 0) tile.w = 240; info(tile.c > 0 ? `Kullasoones on veel ${tile.c} tükki.` : 'Kullasoon on tühi. See täitub 4 minuti pärast.') }
      else info(`Kullasoon täitub ${fmtTime(tile.w)} pärast.`);
      return;
    case 'bush':
      if (tile.ripe) { if (addRes('berries', Math.round(4 * gm * (1 + .4 * upgRank('amber'))), cx, cy) > 0) { tile.ripe = false; tile.g = 0; addXP(1); info('Korjasid marjad. Põõsas valmib uuesti umbes 40 sekundiga.') } }
      else { info(`Marjad on alles rohelised (${Math.round(tile.g * 100)}% valmis).`); floatText(cx, cy, 'Pole valmis', '#c3d3a4') }
      return;
    case 'water': if (addRes('water', Math.round(3 * gm * (1 + .4 * upgRank('amber'))), cx, cy) > 0) { addXP(1); ripple(cx, cy) } return;
    case 'chest': {
      const t = tier(), rk = pick(['wood', 'stone', 'berries', 'food', 'water']);
      const rew = { gold: ri(40, 80) * t, [rk]: ri(20, 45) * t, xp: 25 * t };
      if (Math.random() < .35) rew.map = 1;
      give(rew); S.st.discoveries++; for (const p in tile) delete tile[p]; tile.t = 'grass';
      sparkle(cx, cy, '#ffd065', 26); toast('Leidsid sammaldunud aardelaeka! ' + rewardText(rew), 'gold', 'gold'); info('Avastus! Aardelaegas on tühjaks tehtud.');
      return;
    }
    case 'relic': {
      const t = tier(), rew = { fame: 12 * t, xp: 40 * t };
      give(rew); S.st.discoveries++; tile.t = 'oldstone';
      sparkle(cx, cy, '#a9f0d0', 26); toast('Iidne ruunikivi ärkas ellu ja jutustas su kuningriigist lugusid. ' + rewardText(rew), 'gold', 'fame'); info('Avastus! Ruunikivi on oma saladuse jaganud.');
      return;
    }
    case 'crystal': {
      const t = tier(), rew = { xp: 50 * t, gold: 25 * t };
      give(rew); S.st.discoveries++; for (const p in tile) delete tile[p]; tile.t = 'grass';
      sparkle(cx, cy, '#8fe6ff', 30); toast('Helendav kristall purunes valguseks. ' + rewardText(rew), 'gold', 'xp'); info('Avastus! Kristall andis oma väe sulle.');
      return;
    }
    case 'mushring': {
      if (!tile.found) { tile.found = true; S.st.discoveries++; toast('Avastasid haldjate seenteringi! Siit saab iga 3 minuti järel kingituse.', 'gold', 'xp') }
      if (tile.w > 0) { info(`Haldjad puhkavad. Uus kingitus ${fmtTime(tile.w)} pärast.`); return }
      const t = tier(), rk = pick(['wood', 'stone', 'berries', 'food', 'water', 'gold']), rew = { [rk]: ri(15, 35) * t, xp: 15 * t };
      give(rew); tile.w = 180; sparkle(cx, cy, '#e7b7ff', 20); toast('Haldjad kinkisid sulle: ' + rewardText(rew), 'good'); info('Seentering kustus. Haldjad tulevad 3 minuti pärast tagasi.');
      return;
    }
    case 'oldstone': info('Vana ruunikivi. Selle saladus on juba sinu.'); return;
    case 'cave': caveIntro(S.view); return;
    case 'grass': info('Vaba rohumaa. Siia saab ehitada hoone või istutada puu.'); return;
  }
}
function plantAt(x, y) {
  const tile = S.regions[S.view].tiles[y * W + x], cx = x + .5, cy = y + .5;
  if (merchantAt(x, y)) { info('Siin seisab rändkaupmehe vanker.'); return }
  if (tile.t !== 'grass' && tile.t !== 'stump') { info('Puid saab istutada ainult vabale rohumaale või kännu asemele.'); floatText(cx, cy, 'Siia ei saa', '#ff8a78'); return }
  if (S.res.water < 1) { info('Istiku kastmiseks on vaja 1 vett. Too vett tiigist.'); floatText(cx, cy, 'Vaja vett', '#ff8a78'); return }
  S.res.water -= 1;
  const k = pick(REGIONS[S.view].gen.kinds);
  for (const p in tile) delete tile[p];
  Object.assign(tile, { t: 'tree', s: 0, g: 0, k });
  S.st.planted++; if (S.weather.t === 'vihm') S.st.rainPlant++;
  addXP(2); floatText(cx, cy, 'Istutatud', '#b9e3a0'); sparkle(cx, cy, '#b9e3a0', 8);
  info('Istik kasvab neli järku. Vihm ja metsamaja kiirendavad kasvu.');
}
function placeBuilding(type, x, y) {
  const D = BUILD[type], tile = S.regions[S.view].tiles[y * W + x], cx = x + .5, cy = y + .5;
  if (tile.t !== 'grass' && tile.t !== 'stump') { info('Siia ei saa ehitada. Vali vaba rohumaa ruut või känd.'); floatText(cx, cy, 'Koht on hõivatud', '#ff8a78'); return false }
  if (merchantAt(x, y)) { info('Siin seisab rändkaupmehe vanker. Vali teine koht.'); return false }
  if (D.water) { const T = S.regions[S.view].tiles, near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < W && ny < H && T[ny * W + nx].t === 'water' }); if (!near) { info(`${D.n} tuleb ehitada vee kõrvale.`); floatText(cx, cy, 'Vaja vett kõrval', '#ff8a78'); return false } }
  if (S.level < D.lvl) { info(`${D.n} avaneb ${D.lvl}. tasemel.`); return false }
  if (countType(type) >= D.max) { info(`${D.n}: rohkem ei saa ehitada (maksimaalselt ${D.max}).`); return false }
  if (!canAfford(D.cost)) { info('Ressursse jääb puudu: ' + Object.keys(D.cost).filter(k => S.res[k] < D.cost[k]).map(k => RES[k].n.toLowerCase()).join(', ') + '.'); floatText(cx, cy, 'Ei jõua', '#ff8a78'); return false }
  pay(D.cost);
  const now = Date.now();
  const b = { id: S.nextId++, type, lvl: 1, region: S.view, x, y, start: now, done: now + buildTime(D.time) * 1000, up: false };
  S.buildings.push(b);
  for (const p in tile) delete tile[p];
  tile.t = 'b'; tile.id = b.id;
  addXP(5); dust(cx, cy);
  info(`${D.n} on ehitamisel. Valmib ${fmtTime(buildTime(D.time))} pärast.`);
  return true;
}
function upgradeB(id) {
  const b = getB(id); if (!b || b.done || b.lvl >= MAX_LVL) return;
  const c = upCost(b); if (!canAfford(c)) { toast('Täiendamiseks jääb ressursse puudu.', 'bad'); return }
  pay(c); const now = Date.now(); b.up = true; b.start = now; b.done = now + upTime(b) * 1000;
  addXP(5); toast(`${BUILD[b.type].n}: täiendamine algas.`, 'info');
}
function speedCost(b) { return Math.ceil((b.done - Date.now()) / 1000 / 4) + 1 }
function speedB(id) {
  const b = getB(id); if (!b || !b.done) return;
  const c = speedCost(b); if (S.res.gold < c) { toast(`Kiirendamiseks on vaja ${c} kulda.`, 'bad'); return }
  S.res.gold -= c; b.done = Date.now(); finishBuild(b); RATES = computeRates();
}
function demolishB(id) {
  const b = getB(id); if (!b) return;
  const ref = scaleCost(BUILD[b.type].cost, 0.5); give(ref);
  const reg = S.regions[b.region]; const tile = reg.tiles[b.y * W + b.x];
  for (const p in tile) delete tile[p]; tile.t = 'grass';
  S.buildings = S.buildings.filter(o => o !== b);
  toast(`${BUILD[b.type].n} lammutati. Tagasi said: ${rewardText(ref)}.`, 'info');
  RATES = computeRates();
}
function regionReq(k) {
  const R = REGIONS[k];
  return [
    { ok: S.level >= R.lvl, t: `Tase ${R.lvl}` },
    { ok: S.fame >= R.fame, t: `${R.fame} kuulsust` },
    { ok: S.res.gold >= R.cost, t: `${R.cost} kulda` },
    ...(R.tower ? [{ ok: hasActive('vahitorn'), t: 'Vahitorn' }] : []),
  ];
}
function unlockRegion(k) {
  if (S.regions[k]) return;
  if (!regionReq(k).every(r => r.ok)) { toast('Piirkonna avamise tingimused pole täidetud.', 'bad'); return }
  S.res.gold -= REGIONS[k].cost;
  S.regions[k] = genRegion(k, S.created); ensureAdventure();
  addXP(50); S.fame += 5;
  toast(`Avastasid uue piirkonna: ${REGIONS[k].n}!`, 'gold', 'fame');
  setView(k);
}
const turgLvl = () => S.buildings.filter(b => b.type === 'turg' && (!b.done || b.up)).reduce((a, b) => a + b.lvl, 0);
const sellUnit = k => MBASE[k] * S.market[k].m * (1 + 0.08 * turgLvl()) * (1 + .1 * upgRank('kaubateed')) * (typeof lifeSellMult === 'function' ? lifeSellMult() : 1);
const buyUnit = k => MBASE[k] * S.market[k].m * 1.75 * (1 - .06 * upgRank('kaubateed'));
function sell(k, q) {
  if (!hasActive('turg')) return;
  q = q === 'all' ? Math.floor(S.res[k]) : Math.min(+q, Math.floor(S.res[k]));
  if (q <= 0) { toast('Sul pole seda kaupa müüa.', 'bad'); return }
  const g = Math.floor(q * sellUnit(k));
  S.res[k] -= q; S.res.gold += g; S.st.goldEarned += g; S.st.sold += q;
  S.market[k].m = clamp(S.market[k].m - q * 0.0012, 0.45, 2);
  toast(`Müüsid ${q} ${RES[k].g} ja said ${g} kulda.`, 'good', 'gold');
}
function buy(k, q) {
  if (!hasActive('turg')) return;
  q = Math.min(+q, Math.floor(RATES.cap - S.res[k]));
  if (q <= 0) { toast('Ladu on täis.', 'bad'); return }
  const c = Math.ceil(q * buyUnit(k));
  if (S.res.gold < c) { toast(`Ostuks on vaja ${c} kulda.`, 'bad'); return }
  S.res.gold -= c; S.res[k] += q; S.st.bought += q;
  S.market[k].m = clamp(S.market[k].m + q * 0.0012, 0.45, 2);
  toast(`Ostsid ${q} ${RES[k].g} ${c} kulla eest.`, 'good', k);
}
function cook(n) {
  n = Math.min(n, Math.floor(S.res.berries / 3), Math.floor(S.res.water));
  if (n <= 0) { toast('Toidu valmistamiseks on vaja 3 marja ja 1 vett.', 'bad'); return }
  const room = Math.floor((RATES.cap - S.res.food) / 2); n = Math.min(n, room);
  if (n <= 0) { toast('Toiduladu on täis.', 'bad'); return }
  S.res.berries -= 3 * n; S.res.water -= n; S.res.food += 2 * n;
  S.st.cooked += 2 * n; S.st.gathered.food += 2 * n; addXP(n);
  toast(`Valmistasid lõkkel ${2 * n} toitu.`, 'good', 'food');
}
function dailyState() {
  const today = dateKey(), y = new Date(); y.setDate(y.getDate() - 1);
  const can = S.daily.last !== today;
  const streakNext = can ? (S.daily.last === dateKey(y) ? S.daily.streak + 1 : 1) : S.daily.streak;
  return { can, streakNext, idx: (streakNext - 1) % 7 };
}
function claimDaily() {
  const d = dailyState(); if (!d.can) return;
  const rew = DAILY[d.idx]; give(rew);
  S.daily.last = dateKey(); S.daily.streak = d.streakNext; S.daily.best = Math.max(S.daily.best, d.streakNext);
  toast(`Päevapreemia (${d.streakNext}. päev järjest): ${rewardText(rew)}`, 'gold', 'gold');
}
function claimQuest(id) {
  const q = QUESTS.find(o => o.id === id); if (!q || S.quests[id] || q.get(S) < q.goal) return;
  S.quests[id] = 1; give(q.reward);
  toast(`Ülesanne täidetud: ${q.n}. ${rewardText(q.reward)}`, 'gold', 'xp');
}
function tryTame(a) {
  const A = ANIMALS[a.sp], ax = a.x, ay = a.y - .3;
  if (a.raid) {
    a.raid = false; a.flee = true; if (S.raid) S.raid.n = Math.max(0, S.raid.n - 1); S.st.scared++; addXP(3);
    floatText(ax, ay, 'Kaduge!', '#ffd286');
    info(S.raid && S.raid.n > 0 ? `Peletasid hundi minema. Alles on veel ${S.raid.n}.` : 'Kõik hundid on minema peletatud. Toiduvarud on täna öösel kaitstud.');
    return;
  }
  if (a.tame) {
    if (a.pet > 0) { info(`${A.n} puhkab. Sõber on õnnelik.`); return }
    a.pet = 25; hearts(ax, ay); addXP(1); info(`${A.n} nautis silitamist.`); return;
  }
  if (a.flee) return;
  if (S.level < A.lvl) { info(`${A.com} saad sõbruneda alates ${A.lvl}. tasemest.`); floatText(ax, ay, `Tase ${A.lvl}`, '#ffd286'); return }
  if ((S.st.tamed[a.sp] || 0) >= maxTame()) { info(`Sul on juba ${maxTame()} sõbralikku ${A.part}.`); return }
  if (S.res.berries < A.feed) { info(`${A.com} sõbrunemiseks on vaja ${A.feed} marja.`); floatText(ax, ay, `Vaja ${A.feed} marja`, '#ff8a78'); return }
  S.res.berries -= A.feed;
  const chance = Math.min(0.92, 0.6 + 0.02 * S.level + .08 * upgRank('sosistaja'));
  if (Math.random() < chance) {
    S.st.tamed[a.sp] = (S.st.tamed[a.sp] || 0) + 1; S.st.tamedTotal++; addXP(15);
    hearts(ax, ay); hearts(ax + .2, ay - .2);
    toast(`${A.n} on nüüd sinu sõber ja kolib Kodumetsa! ${A.bt}.`, 'good');
    if (S.view === 'kodu') { a.tame = true; a.pet = 25 } else a.leave = true;
    info(`${A.n} sõi marjad ja jäi sinuga sõbraks.`);
  } else {
    a.flee = true; floatText(ax, ay, 'Põgenes!', '#ffb3a6');
    info(`${A.n} sõi marjad ära, kuid ehmus ja jooksis minema. Proovi teisega.`);
  }
}

/* ---------- council ---------- */
const upgCost = k => scaleCost(UPG[k].cost, Math.pow(2, upgRank(k)));
const upgFame = k => UPG[k].fame * (upgRank(k) + 1);
function buyUpg(k) {
  const U = UPG[k], r = upgRank(k);
  if (r >= U.max || S.level < U.lvl || S.fame < upgFame(k) || !canAfford(upgCost(k))) { toast('Selle uuenduse tingimused pole veel täidetud.', 'bad'); return }
  pay(upgCost(k)); S.upg[k] = r + 1; addXP(20 * (r + 1));
  toast(`Nõukogu kinnitas: ${U.n} (${r + 1}. aste).`, 'gold', 'fame');
}
/* ---------- traveling merchant ---------- */
function spawnMerchant() {
  const T = S.regions.kodu.tiles, free = [];
  for (let i = 0; i < T.length; i++) if (T[i].t === 'grass') free.push(i);
  if (!free.length) return;
  const i = pick(free), L = S.level, offers = [];
  const keys = MARKET_KEYS.slice();
  for (let n = 0; n < 2; n++) {
    const a = pick(keys), b = pick(keys.filter(k => k !== a));
    const qa = Math.round((40 + L * 12) * rnd(.8, 1.3) / 10) * 10;
    const qb = Math.max(5, Math.round(qa * MBASE[a] / MBASE[b] * rnd(1.4, 1.8) / 5) * 5);
    offers.push({ give: { [a]: qa }, get: { [b]: qb }, done: false });
  }
  offers.push({ give: { gold: 150 + L * 40 }, get: { fame: 10 + L * 2 }, done: false, label: 'Kaugete maade kroonika' });
  if (Math.random() < .5) offers.push({ give: { gold: 120 + L * 15 }, get: { map: 1 }, done: false, label: 'Kulunud aardekaart' });
  offers.push({ give: { berries: 40 + L * 6, water: 20 + L * 4 }, get: { xp: 80 + L * 20 }, done: false, label: 'Rändava targa õpetus' });
  S.merchant = { x: i % W, y: Math.floor(i / W), until: S.time + 300, offers };
  toast('Rändkaupmees saabus Kodumetsa! Klõpsa tema vankril, tal on head pakkumised. Ta jääb 5 minutiks.', 'gold', 'gold');
}
function merchantTrade(i) {
  const m = S.merchant; if (!m) return; const o = m.offers[i]; if (!o || o.done) return;
  if (!canAfford(o.give)) { toast('Sul pole piisavalt kaupa selle tehingu jaoks.', 'bad'); return }
  pay(o.give); give(o.get); o.done = true; S.st.trades++;
  toast('Tehing tehtud! ' + rewardText(o.get), 'good', 'gold');
}

/* ---------- saving ---------- */
function save() {
  if (!S) return;
  S.last = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); storageOk = true; lastSaved = Date.now(); flashSave() } catch (e) { storageOk = false }
}
function loadSave() { try { const j = localStorage.getItem(SAVE_KEY); return j ? JSON.parse(j) : null } catch (e) { storageOk = false; return null } }
function wipeSave() { try { localStorage.removeItem(SAVE_KEY) } catch (e) { } }
