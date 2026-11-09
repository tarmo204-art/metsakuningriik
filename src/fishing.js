/* ================= FISHING ================= */
TOOL_ICON.pyua = '<svg viewBox="0 0 20 20"><path d="M3 18 L15 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M15 3 Q18 9 16 15" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="16" cy="15.5" r="1.8" fill="currentColor"/></svg>';
ICON.fish = '<svg viewBox="0 0 20 20"><path d="M2 10 C5 4.5, 12 4.5, 15 10 C12 15.5, 5 15.5, 2 10Z" fill="#7fbcd2"/><path d="M14 10 L19 6 L18 10 L19 14Z" fill="#5a9ab4"/><circle cx="5.5" cy="9" r="1" fill="#1a1a1a"/><path d="M8 7 Q9.5 10 8 13" stroke="#4f8aa4" stroke-width="1" fill="none"/></svg>';
const FRESH = ['kodu', 'jarv', 'maed', 'org', 'iidne', 'raba', 'pohjala', 'haldja', 'pime'];
/* r: 1 tavaline, 2 haruldasem, 3 haruldane, 4 legendaarne, 0 leid */
const FISH = {
  ahven: { n: 'Ahven', r: 1, reg: FRESH, w: [.1, .7], v: 6, shape: 'n', c: ['#9fb04a', '#4a6a2a', '#e8e0b0', '#e2563a'], stripes: 6 },
  sarg: { n: 'Särg', r: 1, reg: FRESH, w: [.1, .5], v: 5, shape: 'n', c: ['#c9d2d6', '#5f7680', '#f2f4f2', '#d9503a'] },
  latikas: { n: 'Latikas', r: 1, reg: ['jarv', 'raba', 'haldja', 'kodu'], w: [.5, 3.5], v: 8, shape: 'd', c: ['#b9a26a', '#6a5a3a', '#e6dcbf', '#7a6a4a'] },
  linask: { n: 'Linask', r: 2, reg: ['raba', 'kodu', 'org'], w: [.4, 2.2], v: 14, shape: 'n', c: ['#8a9a3a', '#4a5a1a', '#d8c870', '#5a6a2a'] },
  haug: { n: 'Haug', r: 2, reg: ['kodu', 'jarv', 'raba', 'iidne', 'pime', 'haldja'], w: [1, 9], v: 18, shape: 'l', c: ['#7a9a5a', '#3a5a2a', '#e6e8c8', '#9a7a3a'], spots: 1 },
  koha: { n: 'Koha', r: 2, reg: ['jarv', 'haldja'], w: [1, 7], v: 20, shape: 'l', c: ['#a9b49a', '#4a5a4a', '#eef0e2', '#7a8a6a'], stripes: 7 },
  vikerforell: { n: 'Vikerforell', r: 2, reg: ['maed', 'iidne'], w: [.5, 3.5], v: 22, shape: 'n', c: ['#9ab4a4', '#4a6a5a', '#f2e8e0', '#d97aa0'], band: '#e86a8a', spots: 1 },
  siig: { n: 'Siig', r: 2, reg: ['pohjala', 'jarv'], w: [.5, 2.8], v: 18, shape: 'n', c: ['#d0d8de', '#7a8a94', '#f6f8f8', '#9aa8b0'] },
  rAim: { n: 'Räim', r: 1, reg: ['meri'], w: [.05, .25], v: 4, shape: 'n', c: ['#c8d8e2', '#3a5a7a', '#f6fafc', '#9ab4c8'] },
  lest: { n: 'Lest', r: 1, reg: ['meri'], w: [.2, 1.6], v: 10, shape: 'f', c: ['#a08a6a', '#6a5a42', '#e8dcc0', '#8a7a5a'], spots: 1 },
  tursk: { n: 'Tursk', r: 2, reg: ['meri'], w: [1, 9], v: 20, shape: 'n', c: ['#a9a07a', '#6a6a4a', '#eee8d8', '#8a8a6a'], spots: 1 },
  angerjas: { n: 'Angerjas', r: 3, reg: FRESH.concat(['meri']), night: true, w: [.5, 3], v: 35, shape: 'e', c: ['#5a5a3a', '#2a2a1a', '#c8b88a', '#4a4a2a'] },
  luts: { n: 'Luts', r: 3, reg: FRESH, winter: true, w: [.5, 4], v: 30, shape: 'e', c: ['#7a6a4a', '#3a2e1e', '#d8c8a0', '#5a4a32'], spots: 1 },
  lohe: { n: 'Lõhe', r: 3, reg: ['meri', 'maed'], w: [2, 14], v: 45, shape: 'l', c: ['#c0ccd4', '#4a5a6a', '#f6f2ee', '#8a9aaa'], spots: 1 },
  saga: { n: 'Säga', r: 3, reg: ['jarv', 'raba'], w: [5, 45], v: 50, shape: 'l', c: ['#5a5a4a', '#2a2a22', '#b8b09a', '#3a3a30'], whisk: 1 },
  kuuangerjas: { n: 'Kuu-angerjas', r: 4, reg: ['org', 'haldja'], night: true, w: [1, 4], v: 120, shape: 'e', c: ['#4a7ad8', '#1a2a6a', '#c8e0ff', '#7ab0ff'], glow: '#8ab8ff' },
  haldjakala: { n: 'Haldjakala', r: 4, reg: ['haldja'], w: [.3, 1.5], v: 150, shape: 'd', c: ['#d8a8f0', '#7a5ab0', '#f8eaff', '#9ae8f0'], glow: '#e6b8ff', band: '#9ae8f0' },
  jaakala: { n: 'Jääkala', r: 4, reg: ['pohjala'], w: [.5, 3], v: 130, shape: 'n', c: ['#e0f2fa', '#8ab8cc', '#ffffff', '#b8e4f2'], glow: '#d8f6ff' },
  kuldkala: { n: 'Kuldkala', r: 4, reg: FRESH.concat(['meri']), rare: .25, w: [.2, .6], v: 0, shape: 'n', c: ['#ffc23a', '#e07a10', '#ffe8a0', '#ffa020'], glow: '#ffd060', wish: true },
};
const JUNK = {
  saabas: { n: 'Vana saabas', r: 0, w: [.6, 1.2], txt: 'Keegi on siin kunagi märjaks saanud. Vähemalt naljakas leid.' },
  pudel: { n: 'Pudelipost', r: 0, w: [.3, .5], txt: 'Pudelis on rullitud aardekaart!' },
  laegas: { n: 'Uppunud laegas', r: 0, w: [4, 9], txt: 'Mudane laegas, täis vana kulda!' },
};
const FISH_ORDER = Object.keys(FISH);
const RAR = { 0: ['Leid', '#c3d3a4'], 1: ['Tavaline', '#c3d3a4'], 2: ['Haruldasem', '#86cde0'], 3: ['Haruldane', '#e6a6ff'], 4: ['Legendaarne', '#ffd286'] };
const RODS = [null, { n: 'Vitsaõng', cap: 4 }, { n: 'Bambusõng', cap: 10, cost: { gold: 300, wood: 100 } }, { n: 'Meistriõng', cap: 25, cost: { gold: 1200, stone: 300 } }, { n: 'Haldjaõng', cap: 65, cost: { gold: 4000, berries: 500 }, fame: 1000 }];
const LINES = [null, { n: 'Tavaline tamiil', cap: 3 }, { n: 'Tugev tamiil', cap: 8, cost: { gold: 150 } }, { n: 'Meistri tamiil', cap: 20, cost: { gold: 600, wood: 100 } }, { n: 'Punutud nöör', cap: 65, cost: { gold: 2500, berries: 300 } }];
const gearCap = () => Math.min(RODS[S.fish.rod].cap, LINES[S.fish.line].cap);
const gearText = () => `${RODS[S.fish.rod].n} (${RODS[S.fish.rod].cap} kg) · ${LINES[S.fish.line].n} (${LINES[S.fish.line].cap} kg)`;
const repairCost = () => S.fish.rod === 1 ? { wood: 20 } : scaleCost(RODS[S.fish.rod].cost, .3);
function repairRod() { const c = repairCost(); if (!canAfford(c)) { toast('Parandamiseks jääb puudu.', 'bad'); return } pay(c); S.fish.broken = false; toast(`${RODS[S.fish.rod].n} on parandatud!`, 'good', 'fish') }
const lineNext = () => S.fish.line < 4 ? LINES[S.fish.line + 1] : null;
function buyLine() { const n = lineNext(); if (!n) return; if (!canAfford(n.cost)) { toast('Tamiili ostmiseks jääb puudu.', 'bad'); return } pay(n.cost); S.fish.line++; S.st.linesBought = (S.st.linesBought || 0) + 1; toast(`Uus varustus: ${n.n}, kannab ${n.cap} kg.`, 'gold', 'fish') }
function showRepair() {
  showModal(() => `<h2>Õng on katki</h2><p>${RODS[S.fish.rod].n} murdus liiga raske kala all. Enne järgmist püüki tuleb see parandada.</p><dl class="kv"><dt>Parandus</dt><dd>${costHTML(repairCost())}</dd></dl><div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Hiljem</button><button class="btn" type="button" data-act="repairRod" ${canAfford(repairCost()) ? '' : 'disabled'}>Paranda õng</button></div>`);
}
const BOOK_MS = [
  { n: 3, rew: { gold: 200, xp: 100 } }, { n: 6, rew: { gold: 300, map: 1, xp: 200 } }, { n: 10, rew: { gold: 800, fame: 30, xp: 300 }, rod: true },
  { n: 15, rew: { gold: 1500, fame: 50, map: 2, xp: 500 } }, { n: FISH_ORDER.length, rew: { gold: 5000, fame: 200, xp: 1500 }, title: true },
];
function ensureFish() {
  if (!S.fish) S.fish = { rod: 1, book: {}, ms: {}, luck: 0, catches: 0, released: 0, bottles: 0, biggest: 0 };
  if (!S.fish.line) S.fish.line = 1; if (S.fish.broken === undefined) S.fish.broken = false;
}
const fishWater = rk => rk === 'meri' ? 'meri' : rk === 'pohjala' ? 'jaa' : 'mage';

function pickCatch(rk) {
  const night = skyState().dark > .45, winter = season().k === 'talv', rain = S.weather.t === 'vihm';
  const luck = 1 + .15 * (S.fish.rod - 1) + .25 * S.fish.luck + (rain ? .2 : 0);
  const pool = [];
  for (const k of FISH_ORDER) {
    const f = FISH[k]; if (!f.reg.includes(rk)) continue;
    if (f.night && !night) continue; if (f.winter && !(winter || rk === 'pohjala')) continue;
    let w = { 1: 60, 2: 26, 3: 9, 4: 2.2 }[f.r] * (f.r >= 3 ? luck : 1) * (f.rare || 1);
    if (k === 'saga' && night) w *= 2;
    pool.push([k, w]);
  }
  pool.push(['saabas', 3], ['pudel', 2], ['laegas', 1.2]);
  let tot = pool.reduce((a, p) => a + p[1], 0), r = Math.random() * tot;
  for (const [k, w] of pool) { r -= w; if (r <= 0) return k }
  return pool[0][0];
}
const fishDef = k => FISH[k] || JUNK[k];

/* ---------- drawing ---------- */
function drawFish(c, x, y, L, k, t = 0, dir = 1) {
  const f = fishDef(k); if (!f) return;
  c.save(); c.translate(x, y); c.scale(dir, 1);
  if (JUNK[k]) {
    if (k === 'saabas') { poly(c, [-L * .3, -L * .35, -L * .05, -L * .35, -L * .05, L * .05, L * .35, L * .1, L * .35, L * .25, -L * .3, L * .25], '#5a3e2a'); rect(c, -L * .3, L * .18, L * .65, L * .07, '#2a1a10') }
    else if (k === 'pudel') { ell(c, 0, 0, L * .3, L * .12, 'rgba(140,200,170,.75)'); rect(c, L * .26, -L * .05, L * .14, L * .1, 'rgba(140,200,170,.75)'); rect(c, L * .38, -L * .055, L * .05, L * .11, '#8a5a34'); rect(c, -L * .15, -L * .06, L * .3, L * .12, '#e8d3a2') }
    else { rect(c, -L * .35, -L * .15, L * .7, L * .35, '#5a3e22'); poly(c, [-L * .35, -L * .15, -L * .3, -L * .3, L * .3, -L * .3, L * .35, -L * .15], '#6a4a2a'); rect(c, -L * .35, -L * .16, L * .7, L * .05, '#b98a3a'); rect(c, -L * .04, -L * .17, L * .08, L * .12, '#ffd060'); for (let i = 0; i < 3; i++) ell(c, -L * .2 + i * L * .18, L * .22, L * .05, L * .03, 'rgba(90,110,60,.8)') }
    c.restore(); return;
  }
  const [body, back, belly, fin] = f.c;
  const hh = { n: .2, l: .15, e: .08, d: .3, f: .26 }[f.shape] * L, wig = Math.sin(t * 6) * L * .04;
  if (f.glow) { const g = c.createRadialGradient(0, 0, 0, 0, 0, L * .7); g.addColorStop(0, f.glow + '88'); g.addColorStop(1, f.glow + '00'); c.fillStyle = g; c.fillRect(-L, -L, L * 2, L * 2) }
  // tail
  if (f.shape === 'e') { c.beginPath(); c.moveTo(L * .3, 0); c.quadraticCurveTo(L * .45, -hh + wig, L * .55, wig); c.quadraticCurveTo(L * .45, hh + wig, L * .3, 0); c.fillStyle = fin; c.fill() }
  else poly(c, [L * .38, 0, L * .55, -hh * 1.1 + wig, L * .5, wig, L * .55, hh * 1.1 + wig], fin);
  // dorsal + belly fins
  poly(c, [-L * .05, -hh * .85, L * .12, -hh * 1.45, L * .22, -hh * .75], fin);
  poly(c, [L * .05, hh * .8, L * .15, hh * 1.25, L * .22, hh * .7], fin);
  // body
  c.beginPath(); c.moveTo(-L * .45, 0); c.bezierCurveTo(-L * .35, -hh * 1.3, L * .25, -hh * 1.2, L * .4, 0); c.bezierCurveTo(L * .25, hh * 1.2, -L * .35, hh * 1.3, -L * .45, 0); c.closePath();
  const g = c.createLinearGradient(0, -hh, 0, hh); g.addColorStop(0, back); g.addColorStop(.45, body); g.addColorStop(1, belly);
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  if (f.stripes) for (let i = 0; i < f.stripes; i++) rect(c, -L * .3 + i * L * .1, -hh * 1.2, L * .035, hh * 1.4, 'rgba(30,40,20,.35)');
  if (f.band) rect(c, -L * .4, -hh * .15, L * .8, hh * .3, f.band + 'aa');
  if (f.spots) for (let i = 0; i < 9; i++) circ(c, -L * .3 + th(i, 1, L) * L * .6, -hh * .8 + th(i, 2, L) * hh * 1.2, L * .018, 'rgba(30,30,20,.4)');
  c.restore();
  if (f.shape === 'f') ell(c, -L * .25, -hh * .35, L * .03, L * .03, '#1a1a1a');
  circ(c, -L * .32, -hh * .2, Math.max(1, L * .035), '#f6f2e8'); circ(c, -L * .325, -hh * .2, Math.max(.8, L * .02), '#111');
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, L * .012); c.beginPath(); c.moveTo(-L * .22, -hh * .7); c.quadraticCurveTo(-L * .16, 0, -L * .22, hh * .7); c.stroke();
  if (f.whisk) { c.beginPath(); c.moveTo(-L * .43, 0); c.quadraticCurveTo(-L * .55, hh * .4, -L * .6, hh * .9); c.moveTo(-L * .43, -hh * .05); c.quadraticCurveTo(-L * .56, -hh * .2, -L * .62, -hh * .1); c.stroke() }
  c.restore();
}
function paintFishThumbs(root) {
  root.querySelectorAll('canvas[data-fish]').forEach(cv2 => {
    const w = cv2.clientWidth || 70, h = cv2.clientHeight || 46, d = 2; cv2.width = w * d; cv2.height = h * d;
    const c = cv2.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2e6a84'); g.addColorStop(1, '#18405a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    const k = cv2.dataset.fish;
    if (cv2.dataset.unknown === '1') { c.globalAlpha = .9; c.filter = 'brightness(0)'; drawFish(c, w / 2, h / 2, w * .78, k, 0, 1); c.filter = 'none'; c.globalAlpha = 1 }
    else drawFish(c, w / 2, h / 2, w * .78, k, 0, 1);
  });
}
{ const orig = paintThumbs; paintThumbs = function (root) { orig(root); paintFishThumbs(root) } }

/* ---------- minigame ---------- */
let F = null;
function startFishing(x, y) {
  ensureFish();
  const t = S.regions[S.view].tiles[y * W + x];
  if (t.t !== 'water') { info('Õnge saab visata ainult vette. Klõpsa veel.'); return }
  if (S.fish.broken) { showRepair(); return }
  const freeBait = hasActive('kalurionn');
  if (!freeBait && S.res.berries < 1) { info('Söödaks on vaja 1 marja. Kalurionn annab sööta tasuta.'); toast('Söödaks on vaja 1 marja.', 'bad'); return }
  if (!freeBait) S.res.berries -= 1;
  ripple(x + .5, y + .5); UI.lastFishTile = y * W + x;
  const k = pickCatch(S.view), f = fishDef(k), r = f.r;
  const diff = { 0: [.26, 1.0, 2], 1: [.24, 1.15, 2], 2: [.19, 1.45, 3], 3: [.15, 1.8, 3], 4: [.11, 2.2, 4] }[r];
  const wgt = Math.round(rnd(f.w[0], f.w[1]) * (Math.random() < .08 ? 1.35 : 1) * 100) / 100;
  F = { k, weight: wgt, est: Math.max(.1, Math.round(wgt * rnd(.85, 1.15) * 10) / 10), region: S.view, phase: 'wait', t: 0, wait: rnd(1.3, 3.6) * (S.weather.t === 'vihm' ? .7 : 1), bite: 0, hits: 0, need: diff[2], misses: 0, maxMiss: 2 + Math.floor(S.fish.rod / 2), zone: { c: rnd(.25, .75), w: diff[0] + .03 * (S.fish.rod - 1) }, speed: diff[1], needle: 0, msg: 'Ujuk hõljub. Oota, kuni kala võtab...', flash: 0, freeBait };
  showModal(fishView, 'fishing');
  requestAnimationFrame(fishLoop);
}
function fishView() {
  return `<div class="mhead"><span class="ic lg" style="width:40px;height:40px">${ICON.fish}</span><div><h2>Kalapüük</h2><p class="lead">${REGIONS[F.region].n}${F.freeBait ? ' · sööt kalurionnist' : ' · sööt: 1 mari'}</p><p class="lead" style="font-size:12.5px">${gearText()}</p></div></div>
    <canvas id="fishCv" aria-label="Püügikoht"></canvas>
    <p class="fishmsg" id="fishMsg" aria-live="polite">${F.msg}</p>
    <button class="btn wide fishbtn" type="button" id="fishBtn">${F.phase === 'lost' ? 'Viska uuesti' : 'Haagi! <small>(tühik)</small>'}</button>
    <div class="mbtns"><button class="btn ghost sm" type="button" id="fishCut" ${F.phase === 'reel' ? '' : 'hidden'}>Lase kala lahti</button><button class="btn ghost sm" type="button" data-act="fishStop">Lõpeta püük</button></div>`;
}
function fishMsg(m) { F.msg = m; const el = document.getElementById('fishMsg'); if (el) el.textContent = m }
function fishLoop(ts) {
  if (!F || F.phase === 'done' || !UI.modalView || UI.modalView !== fishView) { if (F && F.phase !== 'done' && UI.modalView !== fishView) F = null; return }
  const now = ts / 1000, dt = Math.min(.05, F.last ? now - F.last : 0); F.last = now; F.t += dt;
  if (F.phase === 'wait' && F.t >= F.wait) { F.phase = 'bite'; F.bite = 0; fishMsg('Võtab! Haagi kohe!') }
  else if (F.phase === 'bite') { F.bite += dt; if (F.bite > .95) { F.phase = 'lost'; fishMsg('Kala sõi sööda ära ja ujus minema. Proovi uuesti.'); fishFail() } }
  else if (F.phase === 'reel') { F.needle = (Math.sin(F.t * F.speed * Math.PI) + 1) / 2 }
  if (F.flash > 0) F.flash -= dt;
  drawFishScene(now);
  if (F && F.phase !== 'lost' && F.phase !== 'done') requestAnimationFrame(fishLoop);
}
function drawFishScene(t) {
  const cvs = document.getElementById('fishCv'); if (!cvs) return;
  const w = cvs.clientWidth || 400, h = Math.round(w * .5), d = Math.min(2, devicePixelRatio || 1);
  if (cvs.width !== w * d) { cvs.width = w * d; cvs.height = h * d; cvs.style.height = h + 'px' }
  const c = cvs.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const wt = fishWater(F.region), sky = skyState();
  const sg = c.createLinearGradient(0, 0, 0, h * .3); sg.addColorStop(0, sky.dark > .5 ? '#0e1a3a' : '#9ccfe8'); sg.addColorStop(1, sky.dark > .5 ? '#22305a' : '#d8ecf2');
  c.fillStyle = sg; c.fillRect(0, 0, w, h * .3);
  rect(c, 0, h * .24, w, h * .08, wt === 'meri' ? '#c8b884' : wt === 'jaa' ? '#e8f2f6' : '#3f7a3a');
  const wg = c.createLinearGradient(0, h * .3, 0, h); wg.addColorStop(0, wt === 'meri' ? '#2a6a8a' : wt === 'jaa' ? '#3a6a80' : '#3a7a94'); wg.addColorStop(1, wt === 'meri' ? '#0e2e44' : '#163848');
  c.fillStyle = wg; c.fillRect(0, h * .3, w, h * .7);
  if (wt === 'jaa') { c.fillStyle = '#eef6fa'; c.fillRect(0, h * .3, w, h * .7); c.beginPath(); c.ellipse(w * .6, h * .55, w * .2, h * .16, 0, 0, 6.29); c.fillStyle = '#244e62'; c.fill() }
  for (let i = 0; i < 6; i++) { const yy = h * (.38 + i * .1) + Math.sin(t * 1.3 + i) * 2, xx = ((t * 18 * (i % 2 ? 1 : -1) + i * 90) % (w + 80)) - 40; c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 40, yy); c.stroke() }
  if (sky.dark > .1) { c.fillStyle = `rgba(8,16,44,${sky.dark * .45})`; c.fillRect(0, 0, w, h) }
  // rod + line + bobber
  const bx = w * .6, by = h * .5;
  let bob = Math.sin(t * 2.2) * 2;
  if (F.phase === 'bite') bob = 8 + Math.sin(t * 30) * 4;
  if (F.phase === 'reel') bob = 3 + Math.sin(t * 12) * 3;
  c.strokeStyle = '#6b4528'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, h * .95); c.lineTo(w * .3, h * .08); c.stroke();
  c.strokeStyle = 'rgba(240,240,240,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(w * .3, h * .08); c.quadraticCurveTo(w * .5, h * .2, bx, by + bob - 6); c.stroke();
  if (F.phase === 'bite' || F.phase === 'reel') for (let i = 0; i < 2; i++) { c.strokeStyle = `rgba(255,255,255,${.5 - i * .2})`; c.beginPath(); c.ellipse(bx, by + 6, 10 + ((t * 30 + i * 10) % 24), 4 + ((t * 10 + i * 4) % 8), 0, 0, 6.29); c.stroke() }
  circ(c, bx, by + bob, 6, '#e8412e'); c.beginPath(); c.arc(bx, by + bob, 6, Math.PI, 0); c.fillStyle = '#ffffff'; c.fill(); rect(c, bx - 1, by + bob - 13, 2, 7, '#3a2a1a');
  if (F.phase === 'reel') {
    // shadow of fish under water
    const fx = bx + Math.sin(t * 2.4) * w * .12, L = Math.min(w * .32, 40 + (fishDef(F.k).w[1] * 6));
    c.globalAlpha = .35; c.filter = 'brightness(0)'; drawFish(c, fx, h * .78, L, F.k, t, Math.cos(t * 2.4) > 0 ? -1 : 1); c.filter = 'none'; c.globalAlpha = 1;
    // tension bar
    const bx0 = w * .06, bw = w * .88, byy = h * .9, bh = 14;
    rect(c, bx0 - 2, byy - 2, bw + 4, bh + 4, 'rgba(0,0,0,.55)');
    rect(c, bx0, byy, bw, bh, '#24343a');
    rect(c, bx0 + (F.zone.c - F.zone.w / 2) * bw, byy, F.zone.w * bw, bh, F.flash > 0 ? '#d8ff9a' : '#7fd16a');
    rect(c, bx0 + F.needle * bw - 2, byy - 5, 4, bh + 10, '#fff4d8');
    for (let i = 0; i < F.need; i++) circ(c, w - 18 - i * 16, 16, 6, i < F.hits ? '#ffd286' : 'rgba(255,255,255,.25)');
    const over = F.est > gearCap();
    c.font = '800 13px "Alegreya Sans", system-ui, sans-serif'; c.textAlign = 'center';
    const txt = `~${fmt1(F.est)} kg  /  varustus ${gearCap()} kg`, tw = c.measureText(txt).width + 18;
    rect(c, w / 2 - tw / 2, h * .82 - 22, tw, 20, over ? 'rgba(160,30,20,.85)' : 'rgba(0,0,0,.5)');
    c.fillStyle = over ? '#ffd8d0' : '#eaf6fa'; c.fillText(txt, w / 2, h * .82 - 7);
    for (let i = 0; i < F.maxMiss; i++) circ(c, 18 + i * 16, 16, 5, i < F.misses ? '#ff8a78' : 'rgba(255,255,255,.18)');
  }
}
function fishHook() {
  if (!F) return;
  if (F.phase === 'wait') { F.phase = 'lost'; fishMsg('Liiga vara! Kala ehmus ära. Oota, kuni ujuk tõmbub vee alla.'); fishFail(); return }
  if (F.phase === 'bite') {
    F.phase = 'reel'; F.t = 0; const cut = document.getElementById('fishCut'); if (cut) cut.hidden = false;
    const load = F.est / gearCap();
    fishMsg(load > 1.5 ? `Hiiglane! Umbes ${fmt1(F.est)} kg, aga su varustus kannab ${gearCap()} kg. See läheb peaaegu kindlasti katki. Lase lahti või riski!` : load > 1 ? `Raske kala, umbes ${fmt1(F.est)} kg! Varustus kannab ${gearCap()} kg, võib katki minna.` : `Kala on konksus (umbes ${fmt1(F.est)} kg)! Vajuta, kui valge joon on rohelisel alal (${F.need} korda).`);
    return;
  }
  if (F.phase !== 'reel') return;
  const lo = F.zone.c - F.zone.w / 2, hi = F.zone.c + F.zone.w / 2;
  if (F.needle >= lo && F.needle <= hi) {
    const load = F.weight / gearCap();
    if (load > 1 && Math.random() < (load > 1.5 ? 1 : (load - 1) * 1.6)) { breakGear(); return }
    F.hits++; F.flash = .25;
    if (F.hits >= F.need) { landFish(); return }
    F.zone = { c: rnd(.18, .82), w: Math.max(.08, F.zone.w * .92) }; F.speed *= 1.08;
    fishMsg(['Hea! Kala väsib.', 'Veel natuke!', 'Tõmba!'][F.hits % 3]);
  } else {
    F.misses++;
    if (F.misses >= F.maxMiss) { F.phase = 'lost'; fishMsg('Nöör läks lõdvaks ja kala rebis end lahti. Proovi uuesti!'); fishFail(); return }
    fishMsg('Mööda! Nöör pingul, ole ettevaatlik.');
  }
}
function breakGear() {
  S.st.gearBroken = (S.st.gearBroken || 0) + 1; F.phase = 'lost';
  if (LINES[S.fish.line].cap <= RODS[S.fish.rod].cap) {
    const was = LINES[S.fish.line].n; S.fish.line = 1;
    fishMsg(`Plõks! ${was} katkes ${fmt1(F.weight)} kg kala all ja kala ujus minema. ${was === LINES[1].n ? 'Seo uus tavaline tamiil ja proovi tugevamaga.' : 'Said varutamiili, aga osta tugevam uuesti.'}`);
  } else {
    S.fish.broken = true;
    fishMsg(`Krõks! ${RODS[S.fish.rod].n} murdus ${fmt1(F.weight)} kg kala all! Paranda õng, enne kui uuesti püüad.`);
  }
  toast(S.fish.broken ? 'Õng murdus! Paranda see vahekaardil „Seiklused“.' : 'Tamiil katkes! Tugevama saad osta vahekaardil „Seiklused“.', 'bad', 'fish');
  fishFail();
}
function fishFail() {
  const btn = document.getElementById('fishBtn');
  if (btn) { btn.textContent = 'Viska uuesti'; btn.dataset.again = '1' }
}
function landFish() {
  const k = F.k, f = fishDef(k);
  const wgt = F.weight || Math.round(rnd(f.w[0], f.w[1]) * 100) / 100;
  F.phase = 'done'; F.weight = wgt;
  S.fish.catches++; S.st.fishCaught = (S.st.fishCaught || 0) + 1;
  addXP(5 + 5 * (f.r || 1));
  let extra = '';
  if (JUNK[k]) {
    if (k === 'pudel') { give({ map: 1 }); S.fish.bottles++; extra = 'Said aardekaardi!' }
    else if (k === 'laegas') { const rew = { gold: 150 + S.level * 20, stone: 60 + S.level * 4 }; give(rew); extra = rewardText(rew) }
    else { give({ xp: 20 }); extra = '+20 kogemust naeru eest' }
    F.result = { k, junk: true, extra }; showModal(fishResultView, 'fishing'); return;
  }
  const b = S.fish.book[k] || { n: 0, max: 0 }, isNew = b.n === 0, rec = wgt > b.max;
  b.n++; b.max = Math.max(b.max, wgt); S.fish.book[k] = b; S.fish.biggest = Math.max(S.fish.biggest, wgt);
  const kinds = FISH_ORDER.filter(x => S.fish.book[x]).length;
  for (const m of BOOK_MS) if (kinds >= m.n && !S.fish.ms[m.n]) {
    S.fish.ms[m.n] = 1; give(m.rew);
    if (m.rod && S.fish.rod < 4) S.fish.rod++;
    toast(`Kalade raamat: ${m.n} liiki! ${rewardText(m.rew)}${m.rod ? ', tasuta õnge täiendus' : ''}${m.title ? '. Sinu tiitel on nüüd Kalakuningas!' : ''}`, 'gold', 'fish');
  }
  F.result = { k, wgt, isNew, rec };
  showModal(fishResultView, 'fishing');
}
const fishVal = (k, wgt) => { const f = FISH[k], avg = (f.w[0] + f.w[1]) / 2; return { food: Math.max(2, Math.round(wgt * 6 + f.r * 3)), gold: Math.max(3, Math.round(f.v * (.6 + .4 * wgt / avg) * (1 + S.level * .03))), fame: Math.max(1, Math.round(f.v / 8 + f.r * 3)) } };
function fishResultView() {
  const r = F && F.result; if (!r) return null;
  const f = fishDef(r.k), [rn, rc] = RAR[f.r];
  let h = `<div class="catch"><canvas class="catchcv" data-fish="${r.k}"></canvas><div><span class="pill" style="color:${rc}">${rn}</span><h2>${f.n}</h2>`;
  if (r.junk) return h + `<p>${f.txt}</p><p class="lead">${esc(r.extra)}</p></div></div>${fishAgainBtns()}`;
  h += `<p class="lead">${fmt1(r.wgt)} kg${r.isNew ? ' · <b style="color:var(--amber-2)">Uus liik raamatus!</b>' : r.rec ? ' · <b style="color:var(--ok)">Uus isiklik rekord!</b>' : ''}</p></div></div>`;
  if (f.wish) return h + `<p>Kuldkala räägib: „Lase mind vabaks ja ma täidan ühe su soovi!“</p><div class="wishes">
    <button class="btn" type="button" data-act="fishWish" data-arg="rikkus">Rikkus<small>+${fmt(2000 + S.level * 100)} kulda</small></button>
    <button class="btn" type="button" data-act="fishWish" data-arg="tarkus">Tarkus<small>+${fmt(800 + S.level * 60)} kogemust</small></button>
    <button class="btn" type="button" data-act="fishWish" data-arg="onn">Kaluriõnn<small>püsivalt rohkem haruldasi kalu</small></button>
    <button class="btn" type="button" data-act="fishWish" data-arg="kuulsus">Kuulsus<small>+${300 + S.level * 5} kuulsust</small></button></div>`;
  const v = fishVal(r.k, r.wgt);
  return h + `<p>Mida kalaga teed?</p><div class="wishes">
    <button class="btn" type="button" data-act="fishUse" data-arg="food">Toiduks<small>+${v.food} toitu</small></button>
    <button class="btn" type="button" data-act="fishUse" data-arg="gold">Müü<small>+${v.gold} kulda</small></button>
    <button class="btn ghost" type="button" data-act="fishUse" data-arg="free">Lase vabaks<small>+${v.fame} kuulsust</small></button></div>`;
}
function fishAgainBtns() { return `<div class="mbtns"><button class="btn ghost" type="button" data-act="fishStop">Lõpeta</button><button class="btn" type="button" data-act="fishAgain">Viska uuesti</button></div>` }
function fishDone(msg) {
  const r = F.result; r.used = true;
  showModal(() => `<div class="catch"><canvas class="catchcv" data-fish="${r.k}"></canvas><div><h2>${fishDef(r.k).n}</h2><p>${msg}</p></div></div>${fishAgainBtns()}`, 'fishing');
}
function fishAgain() {
  const reg = F ? F.region : S.view; F = null;
  if (S.fish.broken) { showRepair(); return }
  if (S.view !== reg) setView(reg);
  const T = S.regions[S.view].tiles, opts = []; T.forEach((t, i) => { if (t.t === 'water') opts.push(i) });
  if (!opts.length) { closeModal(); return }
  const i = UI.lastFishTile != null && T[UI.lastFishTile] && T[UI.lastFishTile].t === 'water' ? UI.lastFishTile : pick(opts);
  startFishing(i % W, Math.floor(i / W));
}
const rodNext = () => S.fish.rod < 4 ? RODS[S.fish.rod + 1] : null;
function buyRod() {
  const n = rodNext(); if (!n) return;
  if (!canAfford(n.cost) || (n.fame && S.fame < n.fame)) { toast('Õnge täiendamiseks jääb puudu.', 'bad'); return }
  pay(n.cost); S.fish.rod++; toast(`Uus õng: ${n.n}! Haruldased kalad tulevad sagedamini ja püük on kergem.`, 'gold', 'fish');
}
function openFishBook() {
  showModal(() => {
    const kinds = FISH_ORDER.filter(x => S.fish.book[x]).length;
    return `<h2>Kalade raamat</h2><p class="lead">Püütud ${kinds} / ${FISH_ORDER.length} liiki · kokku ${S.fish.catches} saaki · suurim ${fmt1(S.fish.biggest)} kg</p>
      <div class="msrow">${BOOK_MS.map(m => `<span class="pill ${S.fish.ms[m.n] ? 'ok' : ''}">${m.n} liiki: ${rewardText(m.rew)}${m.rod ? ', õng' : ''}</span>`).join('')}</div>
      <div class="fishgrid">${FISH_ORDER.map(k => { const f = FISH[k], b = S.fish.book[k], [rn, rc] = RAR[f.r]; const where = f.reg.length >= 9 ? 'magevesi' : f.reg.map(r => REGIONS[r].n).join(', ');
        return `<div class="fcard ${b ? '' : 'unk'}"><canvas data-fish="${k}" data-unknown="${b ? 0 : 1}"></canvas><b>${b ? f.n : '???'}</b><small style="color:${rc}">${rn}</small><small>${b ? `${b.n}× · rekord ${fmt1(b.max)} kg` : `${fmt1(f.w[0])}–${fmt1(f.w[1])} kg · ${where}${f.night ? ' · öösel' : ''}${f.winter ? ' · talvel' : ''}`}</small></div>` }).join('')}</div>
      <div class="mbtns"><button class="btn" type="button" data-act="closeModal">Sulge</button></div>`;
  }, 'fishbook');
}
function renderFishCard() {
  ensureFish();
  const kinds = FISH_ORDER.filter(x => S.fish.book[x]).length, n = rodNext();
  let h = `<div class="card adv"><div class="advhead"><span class="ic lg">${ICON.fish}</span><div><h3>Kalapüük</h3><p class="lead">Vali tööriist „Püüa“ ja klõpsa veel. Oota, kuni ujuk vee alla tõmbub, haagi kohe ja vajuta siis, kui joon on rohelisel alal. Igas piirkonnas on oma kalad, mõni ujub ainult öösel või talvel. Kuldkala täidab soovi!</p></div></div>
    <dl class="stats"><dt>Õng</dt><dd>${RODS[S.fish.rod].n} · ${RODS[S.fish.rod].cap} kg${S.fish.broken ? ' · <span style="color:var(--bad)">katki</span>' : ''}</dd><dt>Tamiil</dt><dd>${LINES[S.fish.line].n} · ${LINES[S.fish.line].cap} kg</dd><dt>Liike raamatus</dt><dd>${kinds} / ${FISH_ORDER.length}</dd><dt>Saake kokku</dt><dd>${S.fish.catches}</dd></dl>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="fishTool">Võta õng kätte</button><button class="btn sm ghost" type="button" data-act="fishBook">Kalade raamat</button></div>`;
  h += `<p class="lead" style="font-size:12.5px">Varustus kannab nii palju, kui jaksab nõrgem osa: praegu ${gearCap()} kg. Liiga raske kala all katkeb tamiil või murdub õng.</p>`;
  if (S.fish.broken) h += `<div class="act" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">${costHTML(repairCost())}<button class="btn sm" type="button" data-act="repairRod" ${canAfford(repairCost()) ? '' : 'disabled'}>Paranda õng</button></div>`;
  if (n) h += `<div class="act" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">${costHTML(n.cost, n.fame ? `<span class="${S.fame < n.fame ? 'lack' : ''}">${ic('fame')}${n.fame} vaja</span>` : '')}<button class="btn sm ghost" type="button" data-act="buyRod" ${canAfford(n.cost) && (!n.fame || S.fame >= n.fame) ? '' : 'disabled'}>Osta ${n.n} (${n.cap} kg)</button></div>`;
  const ln = lineNext();
  if (ln) h += `<div class="act" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">${costHTML(ln.cost)}<button class="btn sm ghost" type="button" data-act="buyLine" ${canAfford(ln.cost) ? '' : 'disabled'}>Osta ${ln.n} (${ln.cap} kg)</button></div>`;
  return h + '</div>';
}
{ const base = TABS.seiklused.r; TABS.seiklused.r = () => { const h = base(); return h.replace(/<\/div>$/, '') + renderFishCard() + '</div>' } }

Object.assign(ACT, {
  fishTool: () => { setTool('pyua'); if (isMobile()) $('#mapWrap').scrollIntoView({ behavior: 'smooth', block: 'center' }) },
  fishBook: () => { ensureFish(); openFishBook() },
  buyRod: () => { buyRod(); if (S.fish.broken) S.fish.broken = false },
  buyLine: () => buyLine(),
  repairRod: () => { repairRod(); closeModal() },
  fishStop: () => { F = null; closeModal() },
  fishAgain: () => fishAgain(),
  fishUse: a => {
    const r = F && F.result; if (!r || r.used) return; const v = fishVal(r.k, r.wgt);
    if (a === 'food') { give({ food: v.food }); S.st.gathered.food += v.food; fishDone(`Kala läks pajasse: +${v.food} toitu.`) }
    else if (a === 'gold') { give({ gold: v.gold }); fishDone(`Kalakaupmees maksis ${v.gold} kulda.`) }
    else { give({ fame: v.fame }); S.fish.released++; fishDone(`Lasid kala vabaks. Rahvas räägib su heast südamest: +${v.fame} kuulsust.`) }
  },
  fishWish: a => {
    const r = F && F.result; if (!r || r.used) return; S.st.goldfish = (S.st.goldfish || 0) + 1; S.fish.released++;
    if (a === 'rikkus') { give({ gold: 2000 + S.level * 100 }); fishDone('Kuldkala sulpsas vette ja su varakamber täitus kullaga!') }
    else if (a === 'tarkus') { give({ xp: 800 + S.level * 60 }); fishDone('Kuldkala sosistas sulle iidseid tarkusi.') }
    else if (a === 'onn') { S.fish.luck++; fishDone(`Kuldkala õnnistas su õnge. Haruldasi kalu tuleb nüüd rohkem (õnn ${S.fish.luck}).`) }
    else { give({ fame: 300 + S.level * 5 }); fishDone('Kogu kuningriik räägib, kuidas sa kuldkalaga kohtusid!') }
  },
});
$('#modalCard').addEventListener('pointerdown', e => {
  if (!F) return;
  if (e.target.closest('#fishCut')) { if (F.phase === 'reel') { F.phase = 'lost'; fishMsg('Lasid kala lahti. Varustus jäi terveks.'); e.target.closest('#fishCut').hidden = true; fishFail() } return }
  const t = e.target.closest('#fishBtn, #fishCv'); if (!t) return;
  e.preventDefault();
  const btn = document.getElementById('fishBtn');
  if (F.phase === 'lost') { fishAgain(); return }
  fishHook();
});
document.addEventListener('keydown', e => {
  if (!F || UI.modalView !== fishView || (e.key !== ' ' && e.key !== 'Enter')) return;
  e.preventDefault(); const btn = document.getElementById('fishBtn');
  if (F.phase === 'lost') fishAgain(); else fishHook();
});

QUESTS.push(
  Q('q79', 'Püüa oma esimene kala', 1, s => (s.fish && s.fish.catches) || 0, { berries: 50, xp: 60 }),
  Q('q80', 'Püüa 5 erinevat kalaliiki', 5, s => s.fish ? FISH_ORDER.filter(x => s.fish.book[x]).length : 0, { gold: 400, xp: 200 }),
  Q('q81', 'Püüa haug', 1, s => (s.fish && s.fish.book.haug && s.fish.book.haug.n) || 0, { gold: 300, xp: 150 }),
  Q('q82', 'Osta parem õng', 2, s => (s.fish && s.fish.rod) || 1, { gold: 300, xp: 150 }),
  Q('q87', 'Osta tugevam tamiil', 1, s => s.st.linesBought || 0, { gold: 150, xp: 80 }),
  Q('q83', 'Leia pudelipost', 1, s => (s.fish && s.fish.bottles) || 0, { xp: 200, fame: 20 }),
  Q('q84', 'Püüa 50 saaki', 50, s => (s.fish && s.fish.catches) || 0, { gold: 1500, fame: 40, xp: 500 }),
  Q('q85', 'Püüa legendaarne kala', 1, s => s.fish ? FISH_ORDER.filter(x => FISH[x].r === 4 && s.fish.book[x]).length : 0, { gold: 2000, fame: 80, xp: 800 }),
  Q('q86', 'Täida kalade raamat', FISH_ORDER.length, s => s.fish ? FISH_ORDER.filter(x => s.fish.book[x]).length : 0, { gold: 6000, fame: 150, xp: 2000 }),
);
ACH.push(
  { id: 'a28', n: 'Kalakuningas', d: 'Püüa kõik kalaliigid', ok: s => !!(s.fish && FISH_ORDER.every(x => s.fish.book[x])), fame: 50 },
  { id: 'a29', n: 'Kolm soovi', d: 'Kohtu kuldkalaga', ok: s => (s.st.goldfish || 0) >= 1, fame: 20 },
  { id: 'a30', n: 'Suur saak', d: 'Püüa vähemalt 20 kg kala', ok: s => !!(s.fish && s.fish.biggest >= 20), fame: 15 },
  { id: 'a31', n: 'Hea süda', d: 'Lase vabaks 20 kala', ok: s => !!(s.fish && s.fish.released >= 20), fame: 15 },
);
