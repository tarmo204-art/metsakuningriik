/* ================= RENDER ================= */
const cv = document.getElementById('map'), cx = cv.getContext('2d');
let TS = 40, DPR = 1, groundCv = null, groundKey = '';
let ents = [], parts = [], floats = [], hover = null, tnow = 0;
let fireflies = [], drops = [];

function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)] }
function shade(h, a) { const [r, g, b] = hexRgb(h); const f = v => clamp(Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a), 0, 255); return `rgb(${f(r)},${f(g)},${f(b)})` }
function mixHex(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})` }
const th = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v) };
function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = fill; c.fill() }
function circ(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); c.fillStyle = fill; c.fill() }
function ell(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill() }
function rect(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h) }
function shadow(c, x, y, rx, ry) { ell(c, x, y, rx, ry, 'rgba(10,25,15,.28)') }

/* ---------- time of day ---------- */
const SKY_K = [[0, .5, .7], [.05, 0, .35], [.1, 0, 0], [.58, 0, 0], [.64, .25, 1], [.7, .62, .4], [.74, .8, 0], [.93, .8, 0], [1, .5, .7]];
function skyState() {
  const p = (S.time % DAY) / DAY;
  for (let i = 1; i < SKY_K.length; i++) if (p <= SKY_K[i][0]) {
    const a = SKY_K[i - 1], b = SKY_K[i], t = (p - a[0]) / (b[0] - a[0]);
    return { p, dark: a[1] + (b[1] - a[1]) * t, warm: a[2] + (b[2] - a[2]) * t };
  }
  return { p, dark: .5, warm: 0 };
}
function phaseName(p) { if (p < .1) return 'Koidik'; if (p < .58) return 'Päev'; if (p < .7) return 'Õhtu'; if (p < .93) return 'Öö'; return 'Koidik' }
function clockStr(p) { const m = Math.floor(((p * 24 + 6) % 24) * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') }

/* ---------- ground ---------- */
function resizeMap() {
  const wrap = document.getElementById('mapWrap');
  const mobile = matchMedia('(max-width:900px)').matches;
  const r = wrap.getBoundingClientRect();
  let ts = Math.floor(r.width / W);
  if (!mobile) ts = Math.min(ts, Math.floor((r.height - 4) / H));
  ts = Math.max(18, Math.min(ts, 84));
  TS = ts; DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = ts * W * DPR; cv.height = ts * H * DPR;
  cv.style.width = ts * W + 'px'; cv.style.height = ts * H + 'px';
  groundKey = '';
}
function buildGround() {
  const key = S.view + ':' + TS + ':' + season().k;
  if (groundKey === key) return;
  groundKey = key;
  groundCv = document.createElement('canvas'); groundCv.width = TS * W * DPR; groundCv.height = TS * H * DPR;
  const c = groundCv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const R = REGIONS[S.view], tiles = S.regions[S.view].tiles, s = TS, seed = REGION_ORDER.indexOf(S.view) + 1;
  const isW = (x, y) => x >= 0 && y >= 0 && x < W && y < H && tiles[y * W + x].t === 'water';
  // base
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    rect(c, x * s, y * s, s + 1, s + 1, mixHex(R.ground[0], R.ground[1], th(x, y, seed)));
  }
  // soft light patches
  for (let i = 0; i < 26; i++) {
    const x = th(i, 1, seed) * W * s, y = th(i, 2, seed) * H * s, r = (0.8 + th(i, 3, seed) * 1.8) * s;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    const lighter = th(i, 4, seed) > .5;
    g.addColorStop(0, lighter ? 'rgba(255,255,200,.07)' : 'rgba(0,20,10,.09)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const sk = season().k, snowyR = REGIONS[S.view].snowy;
  if (!snowyR) {
    const tint = { kevad: 'rgba(150,230,90,.08)', suvi: 'rgba(0,0,0,0)', sygis: 'rgba(200,150,40,.16)', talv: 'rgba(236,243,247,.62)' }[sk];
    c.fillStyle = tint; c.fillRect(0, 0, W * s, H * s);
  }
  // grass tufts and flowers
  const flowerCols = { kodu: ['#f4f1d0', '#ffd65a', '#c99be8'], pime: ['#b8c9ff', '#6f8f5f'], jarv: ['#ffe36a', '#ffffff', '#ff9ab0'], maed: ['#dcd6c8', '#a2b0d8'], org: ['#e6a6ff', '#9ff2ff', '#ffe0f7'], iidne: ['#9bd18a', '#d8f0a0'], raba: ['#e0465a', '#f4f1d0', '#b33a4a'], meri: ['#f4f1d0', '#c9a6e8'], pohjala: ['#ffffff'], haldja: ['#e6a6ff', '#9ff2ff', '#fff6b0'] }[S.view] || ['#ffffff'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (isW(x, y)) continue;
    const bx = x * s, by = y * s;
    for (let k = 0; k < 5; k++) {
      const gx = bx + th(x * 3 + k, y, seed + 9) * s, gy = by + th(x, y * 5 + k, seed + 3) * s;
      c.strokeStyle = th(x + k, y, 2) > .5 ? 'rgba(20,50,25,.35)' : 'rgba(190,230,140,.22)'; c.lineWidth = Math.max(1, s / 32);
      c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - s * .04, gy - s * .12); c.moveTo(gx, gy); c.lineTo(gx + s * .05, gy - s * .1); c.stroke();
    }
    if (th(x, y, seed + 21) > .78 && sk !== 'talv' && !snowyR) {
      const fx = bx + th(x, y, 31) * s * .8 + s * .1, fy = by + th(y, x, 33) * s * .8 + s * .1;
      circ(c, fx, fy, s * .035, pick(flowerCols)); circ(c, fx + s * .07, fy + s * .05, s * .03, flowerCols[0]);
    }
    if (S.view === 'maed' && th(x, y, 55) > .7) { ell(c, bx + s * .5, by + s * .6, s * .3, s * .14, 'rgba(120,125,115,.35)') }
  }
  // shores
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!isW(x, y)) continue;
    const bx = x * s, by = y * s, sand = 'rgba(214,201,150,.85)';
    c.fillStyle = sand;
    if (!isW(x, y - 1)) c.fillRect(bx - 1, by - s * .1, s + 2, s * .16);
    if (!isW(x, y + 1)) c.fillRect(bx - 1, by + s * .92, s + 2, s * .16);
    if (!isW(x - 1, y)) c.fillRect(bx - s * .1, by - 1, s * .16, s + 2);
    if (!isW(x + 1, y)) c.fillRect(bx + s * .92, by - 1, s * .16, s + 2);
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isW(x, y)) {
    const bx = x * s, by = y * s, inset = s * .02;
    const ix = !isW(x - 1, y) ? s * .05 : -1, iy = !isW(x, y - 1) ? s * .05 : -1, ix2 = !isW(x + 1, y) ? s * .05 : -1, iy2 = !isW(x, y + 1) ? s * .05 : -1;
    const frozen = snowyR || sk === 'talv';
    const g = c.createLinearGradient(0, by, 0, by + s); g.addColorStop(0, frozen ? '#cfe8f2' : '#3f8fb0'); g.addColorStop(1, frozen ? '#aed5e6' : '#2f7898');
    c.fillStyle = g; c.fillRect(bx + ix + inset, by + iy, s - ix - ix2 - inset, s - iy - iy2);
    // reeds near shore
    if ((!isW(x - 1, y) || !isW(x + 1, y)) && th(x, y, 77) > .55 && (S.view === 'jarv' || S.view === 'kodu')) {
      const rx = !isW(x - 1, y) ? bx + s * .12 : bx + s * .88;
      for (let k = 0; k < 4; k++) { c.strokeStyle = '#4c6b2c'; c.lineWidth = Math.max(1, s / 30); c.beginPath(); c.moveTo(rx + k * s * .03, by + s * .7); c.lineTo(rx + k * s * .04 - s * .03, by + s * .3); c.stroke() }
      ell(c, rx, by + s * .33, s * .02, s * .06, '#6b4a2a');
    }
  }
}

/* ---------- objects ---------- */
function drawTree(c, kind, stage, x, y, s, sway) {
  const sc = [0.3, 0.5, 0.75, 1][stage];
  shadow(c, x, y, s * .34 * sc + s * .05, s * .1 * sc + s * .03);
  const sk = S && S.time !== undefined ? season().k : 'suvi';
  const snow = S && (S.weather.t === 'lumi' || sk === 'talv' || (REGIONS[S.view] || {}).snowy);
  if (stage === 0) {
    c.strokeStyle = '#6b4a2a'; c.lineWidth = Math.max(1.2, s / 22); c.beginPath(); c.moveTo(x, y); c.lineTo(x + sway * s * .02, y - s * .28); c.stroke();
    ell(c, x - s * .07, y - s * .22, s * .07, s * .035, '#7cc05a'); ell(c, x + s * .07, y - s * .27, s * .07, s * .035, '#93d16a'); return;
  }
  const sw = sway * s * .03 * sc;
  if (kind === 'kuusk' || kind === 'tume') {
    const h = s * 1.3 * sc, cols = kind === 'tume' ? ['#163a2a', '#1d4a36', '#275b42'] : ['#22553a', '#2b6a47', '#367d54'];
    rect(c, x - s * .05 * sc, y - h * .2, s * .1 * sc, h * .22, '#5b3b22');
    for (let i = 0; i < 3; i++) {
      const yb = y - h * (0.14 + i * 0.24), w = s * .44 * sc * (1 - i * 0.24), top = yb - h * .4, tx = x + sw * (i + 1);
      poly(c, [x - w, yb, x + w, yb, tx, top], cols[i]);
      poly(c, [tx, top, x + w, yb, x + w * .15, yb], 'rgba(255,255,255,.06)');
      if (snow) poly(c, [tx, top, tx - w * .3, top + h * .13, tx + w * .3, top + h * .13], 'rgba(245,250,255,.9)');
    }
  } else if (kind === 'kask' || kind === 'hobekask') {
    const h = s * 1.15 * sc, cols = kind === 'hobekask' ? ['#8dbfac', '#a7d6c3', '#c9ecdc'] : { kevad: ['#7fbf4f', '#94d062', '#b3e27e'], suvi: ['#4f9a3e', '#5fae4a', '#7cc35c'], sygis: ['#c39a32', '#d8b544', '#e9cd64'], talv: null }[sk];
    if (!cols) {
      rect(c, x - s * .04 * sc, y - h * .55, s * .08 * sc, h * .55, '#ece8dc');
      c.strokeStyle = '#6a5a4a'; c.lineWidth = Math.max(1, s * .02);
      c.beginPath(); for (const [dx, dy] of [[-.2, -.95], [.2, -.92], [0, -1.05], [-.12, -.75], [.14, -.72]]) { c.moveTo(x, y - h * .5); c.lineTo(x + dx * s * sc + sw, y + dy * h) } c.stroke();
      ell(c, x + sw, y - h * .98, s * .12 * sc, s * .04 * sc, 'rgba(245,250,255,.85)');
      return;
    }
    rect(c, x - s * .04 * sc, y - h * .55, s * .08 * sc, h * .55, '#ece8dc');
    c.fillStyle = '#2b2b2b'; for (let i = 0; i < 4; i++) c.fillRect(x - s * .04 * sc, y - h * (.1 + i * .12), s * .05 * sc, Math.max(1, s * .015));
    const cy = y - h * .66;
    circ(c, x - s * .16 * sc + sw * .5, cy + s * .06 * sc, s * .21 * sc, cols[0]);
    circ(c, x + s * .17 * sc + sw * .7, cy + s * .04 * sc, s * .2 * sc, cols[0]);
    circ(c, x + sw, cy - s * .1 * sc, s * .25 * sc, cols[1]);
    circ(c, x - s * .05 * sc + sw, cy - s * .16 * sc, s * .13 * sc, cols[2]);
    if (snow) ell(c, x + sw, cy - s * .3 * sc, s * .14 * sc, s * .05 * sc, 'rgba(245,250,255,.85)');
  } else if (kind === 'mand') {
    const h = s * 1.4 * sc;
    poly(c, [x - s * .05 * sc, y, x + s * .05 * sc, y, x + s * .03 * sc + sw * .5, y - h * .8, x - s * .03 * sc + sw * .5, y - h * .8], '#a3603a');
    c.strokeStyle = '#a3603a'; c.lineWidth = Math.max(1, s * .025 * sc); c.beginPath(); c.moveTo(x + sw * .3, y - h * .55); c.lineTo(x + s * .18 * sc + sw, y - h * .7); c.stroke();
    ell(c, x + s * .18 * sc + sw, y - h * .72, s * .13 * sc, s * .06 * sc, '#2a5a34');
    ell(c, x + sw, y - h * .82, s * .28 * sc, s * .1 * sc, '#2a5a34');
    ell(c, x - s * .08 * sc + sw, y - h * .9, s * .18 * sc, s * .08 * sc, '#367043');
    ell(c, x + s * .1 * sc + sw, y - h * .93, s * .12 * sc, s * .06 * sc, '#438050');
    if (snow) ell(c, x + sw, y - h * .97, s * .18 * sc, s * .04 * sc, 'rgba(245,250,255,.9)');
  } else if (kind === 'tamm') {
    const h = s * 1.55 * sc, cols = ['#24492b', '#2f5e35', '#3f7442'];
    poly(c, [x - s * .13 * sc, y, x + s * .13 * sc, y, x + s * .08 * sc, y - h * .5, x - s * .08 * sc, y - h * .5], '#4a3220');
    poly(c, [x - s * .13 * sc, y, x - s * .25 * sc, y + s * .02, x - s * .1 * sc, y - s * .1 * sc], '#4a3220');
    poly(c, [x + s * .13 * sc, y, x + s * .26 * sc, y + s * .02, x + s * .1 * sc, y - s * .1 * sc], '#4a3220');
    rect(c, x - s * .02 * sc, y - h * .45, s * .03 * sc, h * .3, 'rgba(120,170,90,.5)');
    const cy = y - h * .66;
    circ(c, x - s * .27 * sc + sw * .5, cy + s * .08 * sc, s * .26 * sc, cols[0]);
    circ(c, x + s * .27 * sc + sw * .6, cy + s * .06 * sc, s * .26 * sc, cols[0]);
    circ(c, x + sw, cy - s * .12 * sc, s * .34 * sc, cols[1]);
    circ(c, x - s * .1 * sc + sw, cy - s * .22 * sc, s * .18 * sc, cols[2]);
    circ(c, x + s * .14 * sc + sw, cy - s * .02 * sc, s * .12 * sc, cols[2]);
    if (snow) ell(c, x + sw, cy - s * .44 * sc, s * .2 * sc, s * .06 * sc, 'rgba(245,250,255,.85)');
  }
}
function drawTile(c, t, px, py, s, night) {
  const x = px + s / 2, y = py + s * .86;
  switch (t.t) {
    case 'tree': drawTree(c, t.k, t.s, x, y, s, Math.sin(tnow * 1.3 + px * .02 + py * .01) * (S.weather.t === 'vihm' ? 1.8 : 1)); break;
    case 'stump': shadow(c, x, y, s * .2, s * .07); rect(c, x - s * .11, y - s * .14, s * .22, s * .14, '#6b4528'); ell(c, x, y - s * .14, s * .11, s * .05, '#d9a86e'); ell(c, x, y - s * .14, s * .05, s * .022, '#b6834c'); break;
    case 'rock': case 'goldvein': {
      const k = t.t === 'rock' ? 0.55 + 0.45 * t.c / 8 : 1, cy = y - s * .12;
      shadow(c, x, y, s * .3 * k, s * .08);
      poly(c, [x - s * .3 * k, y - s * .02, x - s * .22 * k, cy - s * .18 * k, x + s * .02, cy - s * .27 * k, x + s * .28 * k, cy - s * .1 * k, x + s * .3 * k, y - s * .02], '#8b9496');
      poly(c, [x - s * .22 * k, cy - s * .18 * k, x + s * .02, cy - s * .27 * k, x + s * .28 * k, cy - s * .1 * k, x - s * .02, cy - s * .08 * k], '#b9c1c3');
      poly(c, [x - s * .02, cy - s * .08 * k, x + s * .28 * k, cy - s * .1 * k, x + s * .3 * k, y - s * .02, x + s * .05, y - s * .02], '#6f797b');
      if (t.t === 'goldvein') {
        const on = t.c > 0;
        for (let i = 0; i < 5; i++) circ(c, x - s * .15 + th(i, 1, px) * s * .3, cy - s * .1 + th(i, 2, py) * s * .12, s * .03, on ? '#ffd24a' : '#7a6a40');
        if (on && Math.sin(tnow * 3 + px) > .7) circ(c, x + s * .1, cy - s * .15, s * .04, 'rgba(255,240,180,.9)');
      }
      break;
    }
    case 'rubble': for (let i = 0; i < 4; i++) ell(c, x - s * .2 + i * s * .13, y - s * .04 - (i % 2) * s * .05, s * .07, s * .045, i % 2 ? '#8b9496' : '#a9b1b3'); break;
    case 'bush': {
      shadow(c, x, y, s * .3, s * .08);
      circ(c, x - s * .15, y - s * .16, s * .17, '#2f6d39'); circ(c, x + s * .15, y - s * .15, s * .17, '#2f6d39'); circ(c, x, y - s * .26, s * .2, '#3b8246');
      if (t.ripe) for (let i = 0; i < 7; i++) circ(c, x - s * .22 + th(i, 3, px) * s * .44, y - s * .36 + th(i, 4, py) * s * .26, s * .042, i % 3 ? '#d93b57' : '#4a3a9a');
      else for (let i = 0; i < 4; i++) circ(c, x - s * .2 + th(i, 3, px) * s * .4, y - s * .34 + th(i, 4, py) * s * .22, s * .03, '#9cc96a');
      break;
    }
    case 'chest': {
      const glow = .5 + .5 * Math.sin(tnow * 3);
      circ(c, x, y - s * .15, s * (.38 + glow * .05), `rgba(255,210,100,${.12 + glow * .1})`);
      shadow(c, x, y, s * .26, s * .07);
      rect(c, x - s * .24, y - s * .3, s * .48, s * .28, '#7a4a24');
      poly(c, [x - s * .24, y - s * .3, x - s * .2, y - s * .42, x + s * .2, y - s * .42, x + s * .24, y - s * .3], '#94592a');
      rect(c, x - s * .24, y - s * .31, s * .48, s * .04, '#e0a83a'); rect(c, x - s * .03, y - s * .32, s * .06, s * .1, '#ffd060');
      rect(c, x - s * .18, y - s * .3, s * .03, s * .28, '#c48c2c'); rect(c, x + s * .15, y - s * .3, s * .03, s * .28, '#c48c2c');
      break;
    }
    case 'cave': {
      const ice = S.view === 'pohjala';
      shadow(c, x, y, s * .46, s * .1);
      poly(c, [x - s * .5, y, x - s * .42, y - s * .45, x - s * .15, y - s * .72, x + s * .2, y - s * .7, x + s * .45, y - s * .4, x + s * .5, y], ice ? '#a9c4cf' : '#7d8688');
      poly(c, [x - s * .42, y - s * .45, x - s * .15, y - s * .72, x + s * .2, y - s * .7, x, y - s * .5], ice ? '#d6ebf2' : '#a3abad');
      c.beginPath(); c.moveTo(x - s * .2, y); c.lineTo(x - s * .2, y - s * .22); c.quadraticCurveTo(x, y - s * .52, x + s * .2, y - s * .22); c.lineTo(x + s * .2, y); c.closePath(); c.fillStyle = '#0c0a0a'; c.fill();
      const f = .6 + .4 * Math.sin(tnow * 8) * Math.sin(tnow * 3);
      rect(c, x + s * .26, y - s * .32, s * .03, s * .22, '#5e3b20'); circ(c, x + s * .275, y - s * .35, s * (.045 + f * .015), '#ffb347'); circ(c, x + s * .275, y - s * .35, s * .16, `rgba(255,180,80,${.12 + f * .1})`);
      if (ice) for (let i = 0; i < 4; i++) poly(c, [x - s * .16 + i * s * .1, y - s * .3 - (i % 2) * s * .04, x - s * .14 + i * s * .1, y - s * .18, x - s * .12 + i * s * .1, y - s * .3 - (i % 2) * s * .04], '#e8f6fc');
      break;
    }
    case 'relic': case 'oldstone': {
      const on = t.t === 'relic', glow = .5 + .5 * Math.sin(tnow * 2.2 + px);
      if (on) circ(c, x, y - s * .35, s * (.4 + glow * .06), `rgba(140,255,200,${.1 + glow * .12})`);
      shadow(c, x, y, s * .2, s * .06);
      poly(c, [x - s * .16, y, x - s * .13, y - s * .62, x, y - s * .72, x + s * .14, y - s * .6, x + s * .16, y], '#7d8580');
      poly(c, [x, y - s * .72, x + s * .14, y - s * .6, x + s * .16, y, x + s * .02, y], '#5f6763');
      c.strokeStyle = on ? `rgba(160,255,210,${.6 + glow * .4})` : 'rgba(40,50,45,.6)'; c.lineWidth = Math.max(1, s / 26);
      c.beginPath(); c.moveTo(x - s * .06, y - s * .55); c.lineTo(x - s * .02, y - s * .42); c.lineTo(x - s * .07, y - s * .3); c.moveTo(x - s * .02, y - s * .42); c.lineTo(x + s * .04, y - s * .48); c.moveTo(x - s * .05, y - s * .2); c.lineTo(x + s * .05, y - s * .14); c.stroke();
      break;
    }
    case 'crystal': {
      const glow = .5 + .5 * Math.sin(tnow * 2.6 + py);
      circ(c, x, y - s * .25, s * (.42 + glow * .05), `rgba(120,220,255,${.12 + glow * .12})`);
      shadow(c, x, y, s * .22, s * .06);
      poly(c, [x - s * .05, y, x - s * .1, y - s * .45, x, y - s * .62, x + s * .07, y - s * .42, x + s * .05, y], '#7fd8f0');
      poly(c, [x, y - s * .62, x + s * .07, y - s * .42, x + s * .05, y, x, y], '#4fb4d8');
      poly(c, [x - s * .08, y, x - s * .22, y - s * .28, x - s * .14, y - s * .36, x - s * .03, y], '#a6ecff');
      poly(c, [x + s * .06, y, x + s * .2, y - s * .25, x + s * .25, y - s * .18, x + s * .14, y], '#5cc4e4');
      break;
    }
    case 'mushring': {
      const ready = t.w <= 0, glow = .5 + .5 * Math.sin(tnow * 2 + px);
      if (ready) circ(c, x, y - s * .2, s * .42, `rgba(230,170,255,${.1 + glow * .12})`);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2, mx = x + Math.cos(a) * s * .3, my = y - s * .2 + Math.sin(a) * s * .15;
        rect(c, mx - s * .015, my - s * .06, s * .03, s * .07, '#efe6d6'); ell(c, mx, my - s * .06, s * .05, s * .03, ready ? '#d0443c' : '#8a6a62');
        if (ready) circ(c, mx - s * .015, my - s * .07, s * .01, '#fff');
      }
      break;
    }
    case 'b': {
      const b = getB(t.id); if (b) drawBuilding(c, b.type, px, py, s, { lvl: b.lvl, night, b, status: RATES && RATES.status[b.id] });
      break;
    }
  }
}

/* ---------- buildings ---------- */
function drawBuilding(c, type, px, py, s, o = {}) {
  const u = s / 20, X = v => px + v * u, Y = v => py + v * u, n = o.night || 0, t = tnow;
  const build = o.b && o.b.done && !o.b.up;
  if (build) c.globalAlpha = 0.45;
  const win = (x, y, w, h) => { rect(c, X(x), Y(y), w * u, h * u, n > .3 ? `rgba(255,${200 + 20 * n},110,${.55 + .45 * n})` : '#6f97a6'); rect(c, X(x + w / 2 - .2), Y(y), .4 * u, h * u, 'rgba(60,40,20,.6)') };
  shadow(c, X(10), Y(18.2), 8.5 * u, 2.2 * u);
  switch (type) {
    case 'elumaja': {
      rect(c, X(4), Y(10), 12 * u, 8 * u, '#dccba5');
      rect(c, X(4), Y(10), 12 * u, .8 * u, '#6b4a2e'); rect(c, X(4), Y(14), 12 * u, .6 * u, '#6b4a2e'); rect(c, X(4), Y(10), .7 * u, 8 * u, '#6b4a2e'); rect(c, X(15.3), Y(10), .7 * u, 8 * u, '#6b4a2e');
      rect(c, X(13), Y(3.5), 2 * u, 5 * u, '#8a5a40');
      poly(c, [X(2.2), Y(10.6), X(10), Y(2.8), X(17.8), Y(10.6)], '#b24a33'); poly(c, [X(10), Y(2.8), X(17.8), Y(10.6), X(10), Y(10.6)], '#93392a');
      for (let i = 0; i < 3; i++) rect(c, X(4 + i * 4), Y(8.6 - i * .2), 3.2 * u, .4 * u, 'rgba(0,0,0,.12)');
      rect(c, X(8.8), Y(13.4), 2.6 * u, 4.6 * u, '#5a3a22'); win(5.2, 11.6, 2.6, 2.2); win(12.2, 11.6, 2.6, 2.2);
      if ((o.lvl || 1) >= 3) { rect(c, X(16), Y(13), 3.4 * u, 5 * u, '#cdb98f'); poly(c, [X(15.6), Y(13.2), X(17.7), Y(11), X(19.8), Y(13.2)], '#93392a') }
      smoke(c, X(14), Y(3.2), u, t);
      break;
    }
    case 'metsamaja': {
      rect(c, X(3.5), Y(10), 13 * u, 8 * u, '#8a5a34');
      for (let i = 0; i < 5; i++) { rect(c, X(3.5), Y(10.4 + i * 1.6), 13 * u, .35 * u, '#5e3b20'); circ(c, X(3.5), Y(11 + i * 1.6), .8 * u, '#c9935a'); circ(c, X(16.5), Y(11 + i * 1.6), .8 * u, '#c9935a') }
      poly(c, [X(1.8), Y(10.8), X(10), Y(3.5), X(18.2), Y(10.8)], '#3f6b3a'); poly(c, [X(10), Y(3.5), X(18.2), Y(10.8), X(10), Y(10.8)], '#335a30');
      for (let i = 0; i < 6; i++) circ(c, X(4 + i * 2.4), Y(10.2 - Math.abs(i - 2.5) * 1.4), .8 * u, '#4f8a45');
      rect(c, X(4.5), Y(4.5), 1.8 * u, 4 * u, '#6b6e6a');
      rect(c, X(8.6), Y(13.2), 2.8 * u, 4.8 * u, '#4a2d18'); win(12.4, 12, 2.6, 2.2);
      rect(c, X(15.5), Y(15.5), 4 * u, 1.2 * u, '#a0653a'); rect(c, X(15.8), Y(14.3), 3.6 * u, 1.2 * u, '#b9774a');
      smoke(c, X(5.4), Y(4.2), u, t);
      break;
    }
    case 'marjaaed': {
      rect(c, X(2), Y(7), 16 * u, 11 * u, '#5a3f26');
      for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
        const bx = X(5 + i * 5), by = Y(11 + r * 4.6);
        circ(c, bx, by, 2.2 * u, '#2f6d39'); circ(c, bx - u, by - u, 1.4 * u, '#3b8246');
        const ok = !o.status || o.status.s === 'ok';
        for (let k = 0; k < 4; k++) circ(c, bx - 1.2 * u + th(k, i, r) * 2.4 * u, by - 1.4 * u + th(i, k, r) * 2.4 * u, .45 * u, ok ? (k % 2 ? '#d93b57' : '#3b2f8a') : '#9cc96a');
      }
      c.strokeStyle = '#c9935a'; c.lineWidth = .7 * u; c.strokeRect(X(2), Y(7), 16 * u, 11 * u);
      for (let i = 0; i <= 8; i++) { rect(c, X(2 + i * 2) - .4 * u, Y(6.2), .8 * u, 2 * u, '#c9935a'); rect(c, X(2 + i * 2) - .4 * u, Y(17), .8 * u, 1.6 * u, '#c9935a') }
      break;
    }
    case 'kaev': {
      ell(c, X(10), Y(15.5), 6 * u, 2.6 * u, '#8b9496'); ell(c, X(10), Y(14.2), 6 * u, 2.6 * u, '#a9b1b3'); ell(c, X(10), Y(14.2), 4.4 * u, 1.7 * u, '#2a5c74');
      ell(c, X(10), Y(14.2), 4.4 * u, 1.7 * u, `rgba(150,220,255,${.2 + .1 * Math.sin(t * 2)})`);
      for (let i = 0; i < 6; i++) rect(c, X(4.6 + i * 2), Y(15.3), .3 * u, 1.6 * u, '#7c8486');
      rect(c, X(4.5), Y(6), u, 8.5 * u, '#6b4528'); rect(c, X(14.5), Y(6), u, 8.5 * u, '#6b4528');
      poly(c, [X(3), Y(6.8), X(10), Y(2.5), X(17), Y(6.8)], '#8f3d2b');
      rect(c, X(5), Y(7.6), 10 * u, .6 * u, '#4a2d18');
      c.strokeStyle = '#3a2a1a'; c.lineWidth = .3 * u; c.beginPath(); c.moveTo(X(10), Y(8)); c.lineTo(X(10), Y(10.5 + Math.sin(t) * .5)); c.stroke();
      rect(c, X(9), Y(10.5 + Math.sin(t) * .5), 2 * u, 1.8 * u, '#8a5a34');
      break;
    }
    case 'saeveski': {
      rect(c, X(5), Y(8), 13 * u, 10 * u, '#9b6b3e'); for (let i = 0; i < 6; i++) rect(c, X(5 + i * 2.2), Y(8), .3 * u, 10 * u, 'rgba(60,35,15,.35)');
      poly(c, [X(4), Y(8.6), X(11.5), Y(3), X(19), Y(8.6)], '#6e4a2b'); poly(c, [X(11.5), Y(3), X(19), Y(8.6), X(11.5), Y(8.6)], '#5a3b22');
      rect(c, X(12), Y(12.5), 4 * u, 5.5 * u, '#4a2d18');
      const a = t * 3, cxx = X(4.5), cyy = Y(13);
      circ(c, cxx, cyy, 3.6 * u, '#5d4430'); c.save(); c.translate(cxx, cyy); c.rotate(o.status && o.status.s !== 'ok' ? 0 : a);
      c.strokeStyle = '#3a2a1a'; c.lineWidth = .8 * u; for (let i = 0; i < 8; i++) { c.rotate(Math.PI / 4); c.beginPath(); c.moveTo(0, 0); c.lineTo(3.5 * u, 0); c.stroke(); rect(c, 3 * u, -.8 * u, 1.2 * u, 1.6 * u, '#7c5a3c') }
      c.restore(); circ(c, cxx, cyy, u, '#c9935a');
      for (let i = 0; i < 3; i++) { rect(c, X(13.5), Y(17 - i * 1.4) - u, 6 * u, 1.3 * u, '#b9774a'); circ(c, X(19.5), Y(16.95 - i * 1.4) - .35 * u, .65 * u, '#e2b27a') }
      break;
    }
    case 'kivimurd': {
      poly(c, [X(1), Y(18), X(4), Y(9), X(9), Y(5), X(15), Y(7), X(19), Y(14), X(19), Y(18)], '#7d8688');
      poly(c, [X(4), Y(9), X(9), Y(5), X(15), Y(7), X(11), Y(10)], '#a3abad');
      poly(c, [X(11), Y(10), X(15), Y(7), X(19), Y(14), X(13), Y(13)], '#5f686a');
      rect(c, X(5), Y(10), 5 * u, 6 * u, '#3a3a36');
      rect(c, X(11), Y(14), 6 * u, 3 * u, '#8a5a34'); circ(c, X(12.3), Y(17.5), 1.1 * u, '#3a2a1a'); circ(c, X(15.7), Y(17.5), 1.1 * u, '#3a2a1a');
      for (let i = 0; i < 4; i++) circ(c, X(12 + i * 1.3), Y(13.6), .9 * u, '#b9c1c3');
      c.save(); c.translate(X(6), Y(16)); c.rotate(-.6 + (o.status && o.status.s === 'ok' ? Math.sin(t * 5) * .25 : 0));
      rect(c, 0, -.3 * u, 5 * u, .6 * u, '#7a5534'); poly(c, [4.4 * u, -2 * u, 5.6 * u, -1.6 * u, 5.4 * u, 1.6 * u, 4.6 * u, 2 * u], '#c0c6c8'); c.restore();
      break;
    }
    case 'pold': {
      rect(c, X(1), Y(5), 18 * u, 13.5 * u, '#6b4b2f');
      const snow = S.weather.t === 'lumi';
      for (let r = 0; r < 5; r++) {
        const ry = Y(7 + r * 2.6);
        rect(c, X(1), ry + .9 * u, 18 * u, .5 * u, 'rgba(0,0,0,.18)');
        for (let i = 0; i < 9; i++) {
          const sx = X(2 + i * 2) + Math.sin(t * 1.6 + i * .7 + r) * .3 * u;
          c.strokeStyle = snow ? '#e8eef0' : '#e3c25a'; c.lineWidth = .5 * u;
          c.beginPath(); c.moveTo(X(2 + i * 2), ry + u); c.lineTo(sx, ry - u); c.stroke();
          ell(c, sx, ry - 1.2 * u, .45 * u, .8 * u, snow ? '#f4f8fa' : '#f0d36e');
        }
      }
      break;
    }
    case 'turg': {
      rect(c, X(3), Y(9), u, 9 * u, '#6b4528'); rect(c, X(16), Y(9), u, 9 * u, '#6b4528');
      rect(c, X(2.5), Y(13), 15 * u, 4.6 * u, '#8a5a34'); rect(c, X(2.5), Y(13), 15 * u, .8 * u, '#b9774a');
      for (let i = 0; i < 7; i++) { poly(c, [X(2 + i * 2.3), Y(9.8), X(3.6 + i * 2.3), Y(6), X(4.3 + i * 2.3), Y(9.8)], i % 2 ? '#f0e2c0' : '#c8473a') }
      poly(c, [X(1.6), Y(10.2), X(3.6), Y(5.4), X(16.4), Y(5.4), X(18.4), Y(10.2)], 'rgba(0,0,0,0)');
      rect(c, X(1.6), Y(9.6), 16.8 * u, u, '#a33a2f');
      for (let i = 0; i < 5; i++) circ(c, X(4.5 + i * 2.6), Y(12.4), 1.1 * u, ['#d93b57', '#f0cd7d', '#7fc35a', '#e2b27a', '#ffd065'][i]);
      rect(c, X(9.3), Y(7.2), 1.4 * u, 1.8 * u, '#3a2a1a');
      if (n > .2) circ(c, X(10), Y(8.4), .9 * u, '#ffd286');
      break;
    }
    case 'sepikoda': {
      rect(c, X(3), Y(9), 13 * u, 9 * u, '#7b7f80');
      for (let r = 0; r < 4; r++) for (let i = 0; i < 4; i++) c.strokeStyle = 'rgba(40,40,40,.35)', c.lineWidth = .25 * u, c.strokeRect(X(3 + i * 3.25 + (r % 2) * 1.6), Y(9 + r * 2.25), 3.25 * u, 2.25 * u);
      poly(c, [X(2), Y(9.6), X(9.5), Y(4.2), X(17), Y(9.6)], '#3b3f46');
      rect(c, X(12.5), Y(2), 2.4 * u, 6 * u, '#62676a');
      const f = .6 + .4 * Math.sin(t * 9) * Math.sin(t * 3.3);
      rect(c, X(5.5), Y(12.5), 5 * u, 5.5 * u, '#1e1a18'); rect(c, X(6.2), Y(14.5), 3.6 * u, 3 * u, `rgba(255,${110 + f * 60},40,${.75 + f * .25})`);
      rect(c, X(16), Y(15), 3.4 * u, 1.2 * u, '#3b3f46'); rect(c, X(16.8), Y(16.2), 1.8 * u, 1.8 * u, '#3b3f46');
      smoke(c, X(13.7), Y(1.6), u, t, '#5b5f63');
      if (Math.sin(t * 6 + px) > .6) for (let i = 0; i < 3; i++) circ(c, X(17.5 + Math.sin(t * 20 + i) * 1.5), Y(14 - i * .8), .3 * u, '#ffb347');
      break;
    }
    case 'vahitorn': {
      c.strokeStyle = '#5e3b20'; c.lineWidth = 1.1 * u;
      c.beginPath(); c.moveTo(X(5), Y(18)); c.lineTo(X(7.5), Y(-2)); c.moveTo(X(15), Y(18)); c.lineTo(X(12.5), Y(-2)); c.moveTo(X(5.6), Y(14)); c.lineTo(X(14.2), Y(6)); c.moveTo(X(14.4), Y(14)); c.lineTo(X(5.8), Y(6)); c.stroke();
      rect(c, X(5.5), Y(-3.5), 9 * u, 2.4 * u, '#8a5a34');
      for (let i = 0; i < 5; i++) rect(c, X(5.5 + i * 2), Y(-5.5), u, 2 * u, '#8a5a34');
      poly(c, [X(5), Y(-5.4), X(10), Y(-11), X(15), Y(-5.4)], '#7a2f25');
      rect(c, X(9.8), Y(-15), .5 * u, 4.5 * u, '#3a2a1a'); poly(c, [X(10.3), Y(-15), X(14 + Math.sin(t * 4) * .5), Y(-14), X(10.3), Y(-13)], '#f2b552');
      const g = .5 + .5 * Math.sin(t * 7);
      circ(c, X(10), Y(-2.4), (1 + g * .3) * u, `rgba(255,${150 + g * 60},60,${.5 + n * .5})`);
      break;
    }
    case 'mesila': {
      for (let i = 0; i < 8; i++) circ(c, X(2 + th(i, 1, 3) * 16), Y(16 + th(i, 2, 3) * 2.5), .55 * u, ['#ffd65a', '#e98ab0', '#ffffff', '#c99be8'][i % 4]);
      for (let i = 0; i < 3; i++) {
        const hx = X(2.5 + i * 5.3), hy = Y(9 + (i % 2));
        rect(c, hx + .4 * u, hy + 6 * u, .6 * u, 2 * u, '#5e3b20'); rect(c, hx + 3 * u, hy + 6 * u, .6 * u, 2 * u, '#5e3b20');
        rect(c, hx, hy, 4 * u, 6.3 * u, '#e3b24c'); rect(c, hx, hy + 2 * u, 4 * u, .5 * u, '#b9862e'); rect(c, hx, hy + 4.1 * u, 4 * u, .5 * u, '#b9862e');
        poly(c, [hx - .7 * u, hy + .2 * u, hx + 2 * u, hy - 2.2 * u, hx + 4.7 * u, hy + .2 * u], '#8a5a34');
        rect(c, hx + 1.4 * u, hy + 5.3 * u, 1.2 * u, .5 * u, '#3a2a1a');
      }
      for (let k = 0; k < 6; k++) { const bx = X(10 + Math.sin(t * 2.6 + k * 1.7) * 7), by = Y(6 + Math.cos(t * 3.4 + k * 2.1) * 3.5); circ(c, bx, by, .5 * u, '#ffd23a'); rect(c, bx - .1 * u, by - .5 * u, .25 * u, u, '#2a1a05') }
      break;
    }
    case 'kalurionn': {
      rect(c, X(4.5), Y(12), .9 * u, 6.5 * u, '#5e3b20'); rect(c, X(14.6), Y(12), .9 * u, 6.5 * u, '#5e3b20'); rect(c, X(9.6), Y(12), .9 * u, 6.5 * u, '#5e3b20');
      rect(c, X(3), Y(11.6), 14 * u, 1.3 * u, '#8a5a34');
      rect(c, X(4.5), Y(5.8), 11 * u, 6 * u, '#9b6b3e'); for (let i = 0; i < 5; i++) rect(c, X(4.5 + i * 2.2), Y(5.8), .25 * u, 6 * u, 'rgba(60,35,15,.35)');
      poly(c, [X(3.4), Y(6.3), X(10), Y(1.4), X(16.6), Y(6.3)], '#4f6b7a'); poly(c, [X(10), Y(1.4), X(16.6), Y(6.3), X(10), Y(6.3)], '#3f5866');
      rect(c, X(6), Y(8), 2.4 * u, 3.8 * u, '#4a2d18'); win(11.6, 7.6, 2.6, 2.2);
      c.strokeStyle = 'rgba(230,220,190,.85)'; c.lineWidth = .25 * u; c.beginPath();
      for (let i = 0; i <= 4; i++) { c.moveTo(X(.3 + i * .8), Y(7)); c.lineTo(X(1.5 + i * .8), Y(14)); c.moveTo(X(.3), Y(7 + i * 1.7)); c.lineTo(X(4), Y(7.5 + i * 1.7)) } c.stroke();
      for (let i = 0; i < 2; i++) { const fy = Y(13 + Math.sin(t * 2 + i) * .3); ell(c, X(16.5 + i * 1.8), fy, .9 * u, .45 * u, '#9fb7c4'); poly(c, [X(15.6 + i * 1.8), fy, X(15 + i * 1.8), fy - .5 * u, X(15 + i * 1.8), fy + .5 * u], '#9fb7c4') }
      break;
    }
    case 'purskkaev': {
      ell(c, X(10), Y(16), 8.6 * u, 3.2 * u, '#8b9496'); ell(c, X(10), Y(15), 8.6 * u, 3.2 * u, '#c3cacc');
      ell(c, X(10), Y(15), 7.2 * u, 2.4 * u, '#4fa6c8'); ell(c, X(10 + Math.sin(t) * 2), Y(15), 3 * u, .6 * u, 'rgba(220,245,255,.5)');
      rect(c, X(9.1), Y(7.2), 1.8 * u, 7.6 * u, '#b9c1c3'); ell(c, X(10), Y(7.3), 3.4 * u, 1.1 * u, '#c3cacc'); ell(c, X(10), Y(7), 2.6 * u, .7 * u, '#6fc0de');
      c.strokeStyle = 'rgba(190,235,255,.85)'; c.lineWidth = .55 * u;
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(X(10), Y(6.6)); c.quadraticCurveTo(X(10 + sd * 3.5), Y(1.5 + Math.sin(t * 5) * .4), X(10 + sd * 6), Y(14.2)); c.stroke() }
      c.beginPath(); c.moveTo(X(10), Y(6.6)); c.lineTo(X(10), Y(2.5 + Math.sin(t * 6) * .5)); c.stroke();
      for (let k = 0; k < 6; k++) { const f = (t * .9 + k / 6) % 1, sd = k % 2 ? 1 : -1; circ(c, X(10 + sd * 6 * f), Y(6.6 - 6 * f + 13 * f * f), .35 * u, 'rgba(220,245,255,.9)') }
      break;
    }
    case 'loss': {
      rect(c, X(2), Y(7), 16 * u, 11 * u, '#b8b2a2');
      for (let i = 0; i < 8; i++) rect(c, X(2 + i * 2), Y(5.8), 1.2 * u, 1.4 * u, '#b8b2a2');
      rect(c, X(6.5), Y(1), 7 * u, 8 * u, '#c9c3b2'); for (let i = 0; i < 4; i++) rect(c, X(6.5 + i * 1.9), Y(-.3), 1.2 * u, 1.4 * u, '#c9c3b2');
      rect(c, X(0), Y(0), 4.4 * u, 18 * u, '#a39d8e'); rect(c, X(15.6), Y(0), 4.4 * u, 18 * u, '#a39d8e');
      poly(c, [X(-.6), Y(.4), X(2.2), Y(-6), X(5), Y(.4)], '#3a5f8c'); poly(c, [X(15), Y(.4), X(17.8), Y(-6), X(20.6), Y(.4)], '#3a5f8c');
      poly(c, [X(6), Y(1.2), X(10), Y(-5), X(14), Y(1.2)], '#2f5078');
      rect(c, X(9.85), Y(-9), .4 * u, 4.2 * u, '#3a2a1a'); poly(c, [X(10.25), Y(-9), X(13.5 + Math.sin(t * 3) * .6), Y(-8.2), X(10.25), Y(-7.3)], '#c8473a');
      poly(c, [X(8), Y(18), X(8), Y(13.5), X(10), Y(11.6), X(12), Y(13.5), X(12), Y(18)], '#3a2a1a');
      win(1.4, 4, 1.6, 2.4); win(17, 4, 1.6, 2.4); win(9.2, 3.5, 1.6, 2.4); win(4.5, 10, 1.4, 2); win(14.1, 10, 1.4, 2);
      rect(c, X(2), Y(17.2), 16 * u, .8 * u, 'rgba(0,0,0,.15)');
      break;
    }
  }
  c.globalAlpha = 1;
  if (build) {
    c.strokeStyle = '#a0653a'; c.lineWidth = .7 * u;
    c.beginPath(); c.moveTo(X(3), Y(18)); c.lineTo(X(3), Y(6)); c.moveTo(X(17), Y(18)); c.lineTo(X(17), Y(6)); c.moveTo(X(3), Y(8)); c.lineTo(X(17), Y(8)); c.moveTo(X(3), Y(13)); c.lineTo(X(17), Y(13)); c.moveTo(X(3), Y(18)); c.lineTo(X(17), Y(8)); c.stroke();
  }
  if (o.b) {
    const b = o.b;
    if (b.done) {
      const p = clamp((Date.now() - b.start) / (b.done - b.start), 0, 1);
      rect(c, X(2), Y(19), 16 * u, 1.4 * u, 'rgba(0,0,0,.55)'); rect(c, X(2.3), Y(19.3), 15.4 * u * p, .8 * u, b.up ? '#97d983' : '#f2b552');
      if (Math.random() < .04) dust(b.x + .5, b.y + .8, true);
    }
    for (let i = 0; i < b.lvl; i++) { circ(c, X(1.4 + i * 1.5), Y(1.4), .75 * u, '#2a1a05'); circ(c, X(1.4 + i * 1.5), Y(1.4), .55 * u, '#f2b552') }
    if (o.status && (o.status.s === 'stall' || o.status.s === 'warn')) {
      const bob = Math.sin(t * 4) * .5;
      circ(c, X(17.5), Y(1 + bob), 1.7 * u, o.status.s === 'stall' ? '#e2513f' : '#e8a33a');
      rect(c, X(17.2), Y(-.1 + bob), .6 * u, 1.5 * u, '#fff'); rect(c, X(17.2), Y(1.8 + bob), .6 * u, .5 * u, '#fff');
    }
  }
}
function drawWagon(c, px, py, s, night) {
  const u = s / 20, X = v => px + v * u, Y = v => py + v * u;
  shadow(c, X(10), Y(18.2), 9 * u, 2 * u);
  rect(c, X(2.5), Y(11), 15 * u, 4.2 * u, '#7a4a24'); rect(c, X(2.5), Y(11), 15 * u, .7 * u, '#a0653a');
  c.beginPath(); c.moveTo(X(3), Y(11)); c.bezierCurveTo(X(3), Y(2.5), X(17), Y(2.5), X(17), Y(11)); c.closePath(); c.fillStyle = '#efe0bd'; c.fill();
  for (let i = 0; i < 3; i++) { c.strokeStyle = '#c8473a'; c.lineWidth = 1.1 * u; c.beginPath(); c.moveTo(X(6 + i * 4), Y(11)); c.lineTo(X(6 + i * 4), Y(4.6 + Math.abs(i - 1) * .9)); c.stroke() }
  for (const wx of [5.5, 14.5]) { circ(c, X(wx), Y(16), 2.4 * u, '#3a2a1a'); circ(c, X(wx), Y(16), 1.6 * u, '#8a5a34'); circ(c, X(wx), Y(16), .6 * u, '#3a2a1a') }
  rect(c, X(17.5), Y(12.5), 3 * u, .6 * u, '#5e3b20');
  rect(c, X(9.7), Y(.5), .4 * u, 3.5 * u, '#3a2a1a'); poly(c, [X(10.1), Y(.5), X(13 + Math.sin(tnow * 4) * .4), Y(1.2), X(10.1), Y(2)], '#f2b552');
  const bob = Math.sin(tnow * 3) * .6;
  circ(c, X(17.5), Y(-1.5 + bob), 2 * u, '#2a1a05'); circ(c, X(17.5), Y(-1.5 + bob), 1.6 * u, '#f6c95c'); circ(c, X(17.5), Y(-1.5 + bob), .9 * u, '#e8a73a');
  if (night > .3) { circ(c, X(3), Y(9), .8 * u, '#ffd286'); circ(c, X(3), Y(9), 2 * u, 'rgba(255,210,134,.25)') }
}
function smoke(c, x, y, u, t, col = '#d8dcd6') {
  for (let i = 0; i < 3; i++) { const k = ((t * .45 + i / 3) % 1); circ(c, x + Math.sin(t + i) * u + k * 2.4 * u, y - k * 7 * u, (0.8 + k * 1.6) * u, `rgba(${col === '#d8dcd6' ? '216,220,214' : '91,95,99'},${.45 * (1 - k)})`) }
}

/* ---------- animals ---------- */
function drawAnimal(c, a, x, y, s, night) {
  if (a.folk || a.deer) return drawFolk(c, a, x, y, s, night);
  const f = a.f || 1, m = a.moving ? 1 : 0, ph = a.ph || 0, sp = a.sp;
  if (ANIMALS[sp].fly) {
    const flap = Math.sin(ph) * s * .09, col = S.view === 'jarv' ? '#4a5a3a' : S.view === 'org' ? '#e0d6ff' : '#2b2b30';
    ell(c, x, y + s * .9, s * .1, s * .03, 'rgba(10,25,15,.15)');
    c.strokeStyle = col; c.lineWidth = Math.max(1.4, s * .045); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - s * .18, y - flap); c.quadraticCurveTo(x - s * .08, y - s * .06, x, y); c.quadraticCurveTo(x + s * .08, y - s * .06, x + s * .18, y - flap); c.stroke();
    if (a.tame || a.leave) heartIcon(c, x, y - s * .2, s * .07);
    return;
  }
  c.save(); c.translate(x, y); c.scale(f, 1);
  const bob = m ? Math.abs(Math.sin(ph)) : 0;
  const leg = (lx, len, col) => { const sw = m ? Math.sin(ph + lx * 20) * s * .04 : 0; c.strokeStyle = col; c.lineWidth = Math.max(1.2, s * .035); c.beginPath(); c.moveTo(lx * s, -len * s); c.lineTo(lx * s + sw, 0); c.stroke() };
  if (sp === 'janes') {
    const hop = bob * s * .12;
    ell(c, 0, 0, s * .14, s * .04, 'rgba(10,25,15,.25)');
    ell(c, 0, -s * .1 - hop, s * .14, s * .1, '#9b8a76'); circ(c, -s * .13, -s * .12 - hop, s * .045, '#f4efe6');
    circ(c, s * .12, -s * .17 - hop, s * .07, '#a8977f');
    ell(c, s * .1, -s * .3 - hop, s * .025, s * .08, '#9b8a76'); ell(c, s * .15, -s * .3 - hop, s * .025, s * .08, '#8a7a66');
    circ(c, s * .15, -s * .18 - hop, s * .012, '#1a1a1a');
  } else if (sp === 'hirv') {
    const white = S.view === 'org', body = white ? '#ebe5d8' : '#9a6a3e', dark = white ? '#cfc6b4' : '#7a522e';
    ell(c, 0, 0, s * .26, s * .05, 'rgba(10,25,15,.25)');
    leg(-.15, .2, dark); leg(-.09, .2, body); leg(.1, .2, dark); leg(.16, .2, body);
    ell(c, 0, -s * .26 - bob * s * .02, s * .22, s * .1, body);
    for (let i = 0; i < 3; i++) circ(c, -s * .08 + i * s * .07, -s * .29, s * .015, 'rgba(255,255,255,.7)');
    poly(c, [s * .14, -s * .3, s * .2, -s * .48, s * .26, -s * .46, s * .22, -s * .28], body);
    ell(c, s * .27, -s * .48, s * .07, s * .045, body); circ(c, s * .3, -s * .49, s * .012, '#1a1a1a');
    c.strokeStyle = '#d8c3a0'; c.lineWidth = Math.max(1, s * .025);
    c.beginPath(); c.moveTo(s * .23, -s * .52); c.lineTo(s * .2, -s * .66); c.lineTo(s * .15, -s * .72); c.moveTo(s * .2, -s * .63); c.lineTo(s * .27, -s * .7); c.stroke();
    ell(c, -s * .22, -s * .3, s * .04, s * .03, '#f4efe6');
  } else if (sp === 'rebane') {
    ell(c, 0, 0, s * .22, s * .045, 'rgba(10,25,15,.25)');
    leg(-.1, .13, '#3a2a1a'); leg(.1, .13, '#3a2a1a');
    const tw = Math.sin(tnow * 3) * s * .03;
    ell(c, -s * .24, -s * .2 + tw, s * .13, s * .06, '#d8742c'); circ(c, -s * .35, -s * .21 + tw, s * .04, '#f4efe6');
    ell(c, 0, -s * .18 - bob * s * .02, s * .16, s * .08, '#d8742c'); ell(c, s * .04, -s * .14, s * .09, s * .04, '#f4efe6');
    poly(c, [s * .12, -s * .2, s * .3, -s * .2, s * .2, -s * .3], '#e0803a');
    poly(c, [s * .14, -s * .27, s * .16, -s * .37, s * .2, -s * .29], '#c4642a'); poly(c, [s * .2, -s * .29, s * .23, -s * .38, s * .25, -s * .28], '#c4642a');
    circ(c, s * .3, -s * .2, s * .015, '#1a1a1a'); circ(c, s * .21, -s * .25, s * .012, '#1a1a1a');
  } else if (sp === 'siil') {
    ell(c, 0, 0, s * .13, s * .035, 'rgba(10,25,15,.25)');
    ell(c, 0, -s * .08, s * .13, s * .08, '#6b5a48');
    c.strokeStyle = '#3e3226'; c.lineWidth = Math.max(1, s * .018);
    c.beginPath(); for (let i = 0; i < 11; i++) { const a = Math.PI * (1.02 + i / 10 * .96); c.moveTo(Math.cos(a) * s * .09, -s * .08 + Math.sin(a) * s * .05); c.lineTo(Math.cos(a) * s * .16, -s * .08 + Math.sin(a) * s * .11) } c.stroke();
    ell(c, s * .12, -s * .055, s * .055, s * .035, '#c9a985'); circ(c, s * .175, -s * .055, s * .013, '#1a1a1a'); circ(c, s * .13, -s * .07, s * .01, '#1a1a1a');
  } else if (sp === 'kobras') {
    ell(c, 0, 0, s * .2, s * .04, 'rgba(10,25,15,.25)');
    ell(c, -s * .2, -s * .03, s * .09, s * .03, '#3e3026');
    ell(c, 0, -s * .1 - bob * s * .01, s * .15, s * .09, '#7a5434'); circ(c, s * .13, -s * .14, s * .065, '#7a5434');
    circ(c, s * .1, -s * .2, s * .018, '#5a3c24'); rect(c, s * .17, -s * .11, s * .022, s * .03, '#f4efe6'); circ(c, s * .19, -s * .14, s * .013, '#1a1a1a'); circ(c, s * .15, -s * .16, s * .01, '#1a1a1a');
  } else if (sp === 'ilves') {
    ell(c, 0, 0, s * .24, s * .045, 'rgba(10,25,15,.25)');
    leg(-.13, .17, '#a57e52'); leg(-.07, .17, '#c8a070'); leg(.1, .17, '#a57e52'); leg(.15, .17, '#c8a070');
    ell(c, 0, -s * .23 - bob * s * .02, s * .2, s * .08, '#c8a070');
    for (let i = 0; i < 5; i++) circ(c, -s * .12 + i * s * .06, -s * .24 + (i % 2) * s * .03, s * .012, '#7a5a3a');
    ell(c, -s * .21, -s * .26, s * .045, s * .025, '#c8a070'); circ(c, -s * .25, -s * .26, s * .018, '#2a2a2a');
    circ(c, s * .19, -s * .3, s * .075, '#d2ab7c');
    poly(c, [s * .14, -s * .34, s * .15, -s * .45, s * .19, -s * .36], '#a57e52'); poly(c, [s * .21, -s * .36, s * .25, -s * .45, s * .26, -s * .34], '#a57e52');
    c.strokeStyle = '#1a1a1a'; c.lineWidth = Math.max(1, s * .012); c.beginPath(); c.moveTo(s * .15, -s * .45); c.lineTo(s * .15, -s * .5); c.moveTo(s * .25, -s * .45); c.lineTo(s * .25, -s * .5); c.stroke();
    ell(c, s * .22, -s * .25, s * .05, s * .03, '#efe4cf'); circ(c, s * .23, -s * .31, s * .013, night > .4 ? '#d8ff7a' : '#1a1a1a');
  } else if (sp === 'poder') {
    ell(c, 0, 0, s * .32, s * .05, 'rgba(10,25,15,.25)');
    leg(-.18, .3, '#2e2018'); leg(-.11, .3, '#3a2a1e'); leg(.13, .3, '#2e2018'); leg(.19, .3, '#3a2a1e');
    ell(c, 0, -s * .38 - bob * s * .02, s * .27, s * .12, '#5a3e2a'); ell(c, s * .08, -s * .47, s * .14, s * .06, '#4a3222');
    poly(c, [s * .18, -s * .44, s * .26, -s * .58, s * .32, -s * .56, s * .26, -s * .38], '#5a3e2a');
    ell(c, s * .35, -s * .55, s * .1, s * .055, '#5a3e2a'); ell(c, s * .43, -s * .53, s * .045, s * .04, '#4a3222'); poly(c, [s * .3, -s * .5, s * .33, -s * .42, s * .36, -s * .5], '#4a3222');
    circ(c, s * .35, -s * .57, s * .012, '#1a1a1a');
    ell(c, s * .25, -s * .67, s * .1, s * .04, '#d8c3a0'); ell(c, s * .4, -s * .68, s * .09, s * .035, '#cbb48e');
  } else if (sp === 'hyljes') {
    const br = Math.sin(tnow * 2 + x) * s * .01;
    ell(c, 0, 0, s * .24, s * .04, 'rgba(10,25,15,.25)');
    poly(c, [-s * .2, -s * .06, -s * .32, -s * .12, -s * .3, -s * .01], '#6f797f');
    ell(c, 0, -s * .08 - br, s * .22, s * .08, '#8a949a'); ell(c, 0, -s * .05, s * .17, s * .035, '#b9c3c8');
    for (let i = 0; i < 4; i++) circ(c, -s * .12 + i * s * .07, -s * .11, s * .012, '#5f686d');
    circ(c, s * .2, -s * .15 - br, s * .075, '#8a949a'); circ(c, s * .23, -s * .17 - br, s * .016, '#1a1a1a');
    c.strokeStyle = '#d0d6d8'; c.lineWidth = 1; c.beginPath(); c.moveTo(s * .26, -s * .13); c.lineTo(s * .33, -s * .15); c.moveTo(s * .26, -s * .12); c.lineTo(s * .33, -s * .11); c.stroke();
    ell(c, s * .08, -s * .03, s * .06, s * .02, '#6f797f');
  } else if (sp === 'karu') {
    ell(c, 0, 0, s * .3, s * .05, 'rgba(10,25,15,.25)');
    const tl = (lx) => { const sw = m ? Math.sin(ph + lx * 20) * s * .03 : 0; rect(c, lx * s - s * .035 + sw, -s * .2, s * .07, s * .2, '#4a3220') };
    tl(-.17); tl(-.08); tl(.1); tl(.18);
    ell(c, 0, -s * .3 - bob * s * .02, s * .27, s * .16, '#5a3d28'); ell(c, -s * .02, -s * .4, s * .2, s * .07, '#64452e');
    circ(c, s * .26, -s * .36, s * .1, '#5a3d28'); circ(c, s * .21, -s * .45, s * .03, '#4a3220'); circ(c, s * .3, -s * .45, s * .03, '#4a3220');
    ell(c, s * .34, -s * .33, s * .055, s * .04, '#8a6a4a'); circ(c, s * .38, -s * .34, s * .015, '#1a1a1a'); circ(c, s * .28, -s * .39, s * .013, '#1a1a1a');
  } else if (sp === 'hunt') {
    ell(c, 0, 0, s * .28, s * .05, 'rgba(10,25,15,.25)');
    leg(-.16, .2, '#55595f'); leg(-.1, .2, '#6b7076'); leg(.12, .2, '#55595f'); leg(.18, .2, '#6b7076');
    poly(c, [-s * .22, -s * .26, -s * .4, -s * .14, -s * .24, -s * .2], '#6b7076');
    ell(c, 0, -s * .27 - bob * s * .02, s * .24, s * .1, '#7d8188'); ell(c, 0, -s * .33, s * .2, s * .05, '#5d6168');
    poly(c, [s * .17, -s * .32, s * .4, -s * .3, s * .38, -s * .24, s * .2, -s * .2], '#7d8188');
    poly(c, [s * .2, -s * .34, s * .22, -s * .46, s * .27, -s * .35], '#5d6168');
    const eye = night > .4 || a.raid ? '#ffe36a' : '#1a1a1a';
    circ(c, s * .3, -s * .31, s * .018, eye);
    if (a.raid && night > .4) circ(c, s * .3, -s * .31, s * .05, 'rgba(255,230,100,.25)');
  }
  c.restore();
  if (a.tame) heartIcon(c, x, y - s * (sp === 'hirv' ? .85 : sp === 'poder' ? .9 : sp === 'hunt' || sp === 'karu' || sp === 'ilves' ? .65 : .45) + Math.sin(tnow * 2 + x) * s * .03, s * .06);
}
function heartIcon(c, x, y, r) {
  c.fillStyle = '#ff7d96'; c.beginPath(); c.moveTo(x, y + r * 1.2); c.bezierCurveTo(x - r * 2, y, x - r, y - r * 1.4, x, y - r * .4); c.bezierCurveTo(x + r, y - r * 1.4, x + r * 2, y, x, y + r * 1.2); c.fill();
}

/* ---------- entities ---------- */
const landOK = t => t.t === 'grass' || t.t === 'bush' || t.t === 'stump' || t.t === 'tree' || t.t === 'rubble';
function randLand() {
  const tiles = S.regions[S.view].tiles;
  for (let i = 0; i < 200; i++) { const x = ri(0, W - 1), y = ri(0, H - 1); if (landOK(tiles[y * W + x])) return { x: x + .5, y: y + .5 } }
  return { x: W / 2, y: H / 2 };
}
function spawnAnimal(sp, tame, edge) {
  const A = ANIMALS[sp];
  if (A.fly) {
    const fromL = Math.random() < .5, y = rnd(.5, H - 1.5);
    ents.push({ sp, fly: true, tame, x: fromL ? -1 : W + 1, y, vx: (fromL ? 1 : -1) * rnd(1.2, 2.2), vy: rnd(-.2, .2), ph: rnd(0, 6), f: fromL ? 1 : -1 });
    return;
  }
  const p = edge ? { x: Math.random() < .5 ? -.5 : W + .5, y: rnd(1, H - 1) } : randLand();
  const a = { sp, tame, x: p.x, y: p.y, tx: p.x, ty: p.y, wait: rnd(0, 3), ph: 0, f: 1, pet: 0 };
  if (edge) { const q = randLand(); a.tx = q.x; a.ty = q.y; a.wait = 0 }
  ents.push(a);
}
function spawnRaid() { for (let i = 0; i < (S.raid ? S.raid.n : 0); i++) { spawnAnimal('hunt', false, true); ents[ents.length - 1].raid = true } }
function spawnView() {
  ents = [];
  const R = REGIONS[S.view], sps = R.animals.filter(k => ANIMALS[k].lvl <= S.level);
  const n = S.view === 'kodu' ? 4 : 6;
  for (let i = 0; i < n; i++) spawnAnimal(sps[i % sps.length], false, false);
  if (S.view === 'kodu') for (const sp of ANIMAL_ORDER) for (let i = 0; i < (S.st.tamed[sp] || 0); i++) spawnAnimal(sp, true, false);
  if (S.view === 'kodu' && S.raid) spawnRaid();
  fireflies = Array.from({ length: 16 }, () => ({ x: rnd(0, W), y: rnd(0, H), p: rnd(0, 6), v: rnd(.2, .5) }));
}
function updateEnts(dt) {
  const tiles = S.regions[S.view].tiles;
  for (const a of ents) {
    if (a.pet > 0) a.pet -= dt;
    if (a.fly) {
      a.x += a.vx * dt; a.y += a.vy * dt + Math.sin(tnow * 2 + a.ph) * dt * .2; a.ph += dt * 12; a.moving = true;
      if (a.x < -2 || a.x > W + 2) a.dead = true;
      if (a.leave) { a.vy -= dt; if (a.y < -1) a.dead = true }
      continue;
    }
    const A = ANIMALS[a.sp];
    if (a.flee || a.leave) {
      if (a.tx > -1 && a.tx < W + 1) { a.tx = a.x < W / 2 ? -2 : W + 2; a.ty = a.y }
      const dx = a.tx - a.x; a.x += Math.sign(dx) * A.speed * 2.2 * dt; a.f = dx < 0 ? -1 : 1; a.ph += dt * 14; a.moving = true;
      if (a.x < -1.5 || a.x > W + 1.5) a.dead = true;
      continue;
    }
    if (a.wait > 0) { a.wait -= dt; a.moving = false; continue }
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < .05) {
      a.wait = a.raid ? rnd(.3, 1) : rnd(1, 4.5); a.moving = false;
      for (let k = 0; k < 20; k++) { const nx = clamp(a.x + rnd(-3, 3), .3, W - .3), ny = clamp(a.y + rnd(-2.5, 2.5), .4, H - .2), t = tiles[Math.floor(ny) * W + Math.floor(nx)]; if (t && landOK(t)) { a.tx = nx; a.ty = ny; break } }
    } else {
      const st = Math.min(d, A.speed * dt * (a.raid ? .7 : 1)); a.x += dx / d * st; a.y += dy / d * st;
      if (Math.abs(dx) > .02) a.f = dx < 0 ? -1 : 1; a.ph += dt * A.speed * 7; a.moving = true;
    }
  }
  ents = ents.filter(a => !a.dead);
  // respawn wild life
  const wild = ents.filter(a => !a.tame && !a.raid).length, target = S.view === 'kodu' ? 4 : 6;
  if (wild < target && Math.random() < dt * .12) { const R = REGIONS[S.view], sps = R.animals.filter(k => ANIMALS[k].lvl <= S.level); spawnAnimal(pick(sps), false, true) }
}

/* ---------- particles ---------- */
function floatText(x, y, txt, col) { floats.push({ x, y, txt, col, life: 1.5 }) }
function sparkle(x, y, col, n = 12) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), v = rnd(.6, 1.8); parts.push({ x, y: y - .3, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .6, life: rnd(.6, 1.1), col, r: rnd(.03, .06), g: .4 }) } }
function leaves(x, y, k) { const col = k === 'kask' ? '#e0c050' : k === 'hobekask' ? '#b7dccb' : '#3f7a4a'; for (let i = 0; i < 14; i++) parts.push({ x: x + rnd(-.3, .3), y: y - rnd(.4, 1), vx: rnd(-.8, .8), vy: rnd(-.6, .2), life: rnd(.8, 1.5), col, r: .045, g: 1.4, leaf: true }) }
function chips(x, y, col) { for (let i = 0; i < 7; i++) parts.push({ x, y: y - .2, vx: rnd(-1.2, 1.2), vy: rnd(-2, -.8), life: .6, col, r: .035, g: 5 }) }
function ripple(x, y) { parts.push({ x, y, ring: true, life: .9, col: '#d8f4ff' }); parts.push({ x: x + .1, y: y + .05, ring: true, life: 1.2, col: '#d8f4ff' }) }
function hearts(x, y) { for (let i = 0; i < 5; i++) parts.push({ x: x + rnd(-.2, .2), y, vx: rnd(-.3, .3), vy: rnd(-1, -.6), life: 1.2, heart: true, g: 0 }) }
function dust(x, y, few) { for (let i = 0; i < (few ? 2 : 14); i++) parts.push({ x: x + rnd(-.4, .4), y: y + rnd(-.1, .2), vx: rnd(-.5, .5), vy: rnd(-.6, -.2), life: rnd(.5, 1), col: '#d9c7a0', r: rnd(.05, .1), g: 0, fade: true }) }

/* ---------- frame ---------- */
let lastFrame = 0, regionTitleT = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!S || document.getElementById('game').hidden) { lastFrame = ts; return }
  const dt = Math.min(.1, (ts - lastFrame) / 1000 || 0); lastFrame = ts; tnow = ts / 1000;
  updateEnts(dt);
  if (typeof updateLife === 'function') updateLife(dt);
  buildGround();
  const c = cx, s = TS, sky = skyState(), night = sky.dark;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.drawImage(groundCv, 0, 0, W * s, H * s);
  const tiles = S.regions[S.view].tiles;
  // animated water
  const frozenW = REGIONS[S.view].snowy || season().k === 'talv';
  if (!frozenW) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tiles[y * W + x].t === 'water') {
    for (let k = 0; k < 2; k++) {
      const wy = y * s + s * (.3 + k * .4) + Math.sin(tnow * 1.5 + x + k) * s * .04, wx = x * s + s * (.2 + .3 * ((Math.sin(tnow * .7 + y * 2 + k * 3) + 1) / 2));
      c.strokeStyle = 'rgba(220,245,255,.35)'; c.lineWidth = Math.max(1, s / 30); c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + s * .22, wy); c.stroke();
    }
    if (S.weather.t === 'vihm' && Math.random() < .03) parts.push({ x: x + Math.random(), y: y + Math.random(), ring: true, life: .6, col: '#d8f4ff' });
  }
  // hover highlight
  if (hover && hover.x >= 0) {
    const ht = tiles[hover.y * W + hover.x];
    let col = 'rgba(255,255,255,.18)';
    if (UI.tool === 'ehita' && UI.placing) col = (ht.t === 'grass' || ht.t === 'stump') ? 'rgba(151,217,131,.38)' : 'rgba(255,110,90,.38)';
    if (UI.tool === 'pyua') col = ht.t === 'water' ? 'rgba(134,205,224,.4)' : 'rgba(255,255,255,.08)';
    if (UI.tool === 'istuta') col = (ht.t === 'grass' || ht.t === 'stump') ? 'rgba(151,217,131,.32)' : 'rgba(255,110,90,.3)';
    c.fillStyle = col; c.fillRect(hover.x * s + 1, hover.y * s + 1, s - 2, s - 2);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.strokeRect(hover.x * s + 1.5, hover.y * s + 1.5, s - 3, s - 3);
  }
  // rows: tiles then walkers
  const walkers = ents.filter(a => !a.fly).concat(typeof folkList === 'function' ? folkList() : []).sort((a, b) => a.y - b.y);
  let wi = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) drawTile(c, tiles[y * W + x], x * s, y * s, s, night);
    if (hover && hover.y === y && hover.x >= 0) {
      const ht = tiles[hover.y * W + hover.x];
      if (ht.t === 'grass' || ht.t === 'stump') {
        c.globalAlpha = .6;
        if (UI.tool === 'ehita' && UI.placing) drawBuilding(c, UI.placing, hover.x * s, hover.y * s, s, {});
        if (UI.tool === 'istuta') drawTree(c, 'kuusk', 1, hover.x * s + s / 2, hover.y * s + s * .86, s, 0);
        c.globalAlpha = 1;
      }
    }
    if (S.merchant && S.view === 'kodu' && S.merchant.y === y) drawWagon(c, S.merchant.x * s, y * s, s, night);
    while (wi < walkers.length && walkers[wi].y < y + 1) { const a = walkers[wi++]; drawAnimal(c, a, a.x * s, a.y * s, s, night) }
  }
  while (wi < walkers.length) { const a = walkers[wi++]; drawAnimal(c, a, a.x * s, a.y * s, s, night) }
  drawHunt(c, s);
  if (typeof drawLifeOverlay === 'function') drawLifeOverlay(c, s);
  // particles
  for (const p of parts) {
    p.life -= dt;
    if (p.ring) { const k = 1 - p.life; c.strokeStyle = `rgba(216,244,255,${Math.max(0, p.life)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(p.x * s, p.y * s, Math.max(1, k * s * .3 + 1), Math.max(1, k * s * .12 + 1), 0, 0, 6.29); c.stroke(); continue }
    p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.heart) { c.globalAlpha = clamp(p.life, 0, 1); heartIcon(c, p.x * s, p.y * s, s * .05); c.globalAlpha = 1; continue }
    c.globalAlpha = clamp(p.fade ? p.life * .6 : p.life * 1.5, 0, 1);
    if (p.leaf) ell(c, p.x * s, p.y * s, s * p.r * 1.4, s * p.r * .7, p.col); else circ(c, p.x * s, p.y * s, s * p.r, p.col);
    c.globalAlpha = 1;
  }
  parts = parts.filter(p => p.life > 0);
  // birds above
  for (const a of ents) if (a.fly) drawAnimal(c, a, a.x * s, a.y * s, s, night);
  drawWeather(c, s, dt);
  // region mood
  if (S.view === 'pime') { c.fillStyle = 'rgba(5,20,15,.22)'; c.fillRect(0, 0, W * s, H * s) }
  if (S.view === 'org') { for (let i = 0; i < 3; i++) { const fx = ((tnow * .03 * (i + 1) + i * .37) % 1.4 - .2) * W * s, fy = (.25 + i * .25) * H * s, r = s * 5; const g = c.createRadialGradient(fx, fy, 0, fx, fy, r); g.addColorStop(0, 'rgba(220,200,255,.14)'); g.addColorStop(1, 'rgba(220,200,255,0)'); c.fillStyle = g; c.fillRect(fx - r, fy - r, r * 2, r * 2) } }
  // light & night
  if (sky.warm > 0) { c.fillStyle = `rgba(255,140,60,${sky.warm * .14})`; c.fillRect(0, 0, W * s, H * s) }
  if (night > 0.01) {
    c.fillStyle = `rgba(8,16,44,${night * .7})`; c.fillRect(0, 0, W * s, H * s);
    c.globalCompositeOperation = 'lighter';
    for (const b of S.buildings) {
      if (b.region !== S.view || (b.done && !b.up)) continue;
      const lights = { elumaja: [[6.5, 12.7], [13.5, 12.7]], metsamaja: [[13.7, 13.1]], loss: [[2.2, 5.2], [17.8, 5.2], [10, 4.7]], sepikoda: [[8, 16]], vahitorn: [[10, -2.4]], turg: [[10, 8.4]], kalurionn: [[12.9, 8.7]], purskkaev: [[10, 15]], kaev: [] }[b.type] || [];
      for (const [lx, ly] of lights) {
        const gx = b.x * s + lx * s / 20, gy = b.y * s + ly * s / 20, r = s * (b.type === 'vahitorn' ? 1.6 : 0.9);
        const g = c.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(255,190,90,${.55 * night})`); g.addColorStop(1, 'rgba(255,170,80,0)');
        c.fillStyle = g; c.fillRect(gx - r, gy - r, r * 2, r * 2);
      }
    }
    for (let i = 0; i < tiles.length; i++) {
      const t = tiles[i]; if (!(t.t === 'crystal' || t.t === 'relic' || (t.t === 'mushring' && t.w <= 0) || t.t === 'chest')) continue;
      const gx = (i % W + .5) * s, gy = (Math.floor(i / W) + .6) * s, r = s * 1.1;
      const col = t.t === 'crystal' ? '120,220,255' : t.t === 'relic' ? '140,255,200' : t.t === 'chest' ? '255,210,110' : '230,170,255';
      const g = c.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, `rgba(${col},${.45 * night})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
    if (night > .35 && S.weather.t !== 'vihm' && S.weather.t !== 'lumi') for (const f of fireflies) {
      f.p += dt * 2; f.x += Math.sin(f.p * .7) * dt * f.v; f.y += Math.cos(f.p * .5) * dt * f.v;
      if (f.x < 0) f.x = W; if (f.x > W) f.x = 0; if (f.y < 0) f.y = H; if (f.y > H) f.y = 0;
      const a = (Math.sin(f.p * 2.3) + 1) / 2 * night;
      const g = c.createRadialGradient(f.x * s, f.y * s, 0, f.x * s, f.y * s, s * .25); g.addColorStop(0, `rgba(230,255,140,${a})`); g.addColorStop(1, 'rgba(230,255,140,0)');
      c.fillStyle = g; c.fillRect(f.x * s - s * .25, f.y * s - s * .25, s * .5, s * .5);
    }
    c.globalCompositeOperation = 'source-over';
  }
  // floating texts
  c.textAlign = 'center'; c.font = `800 ${Math.max(11, s * .3)}px "Alegreya Sans", system-ui, sans-serif`;
  for (const f of floats) { f.life -= dt; f.y -= dt * .6; c.globalAlpha = clamp(f.life, 0, 1); c.lineWidth = 3; c.strokeStyle = 'rgba(10,20,15,.8)'; c.strokeText(f.txt, f.x * s, f.y * s); c.fillStyle = f.col; c.fillText(f.txt, f.x * s, f.y * s); c.globalAlpha = 1 }
  floats = floats.filter(f => f.life > 0);
  drawDial(sky);
}
function drawWeather(c, s, dt) {
  const w = S.weather.t, Wd = W * s, Hd = H * s;
  if (w === 'vihm' || w === 'lumi') {
    const n = w === 'vihm' ? 110 : 80;
    while (drops.length < n) drops.push({ x: Math.random() * Wd, y: Math.random() * Hd, v: rnd(.8, 1.2), p: rnd(0, 6) });
    if (drops.length > n) drops.length = n;
    c.strokeStyle = 'rgba(200,225,255,.45)'; c.lineWidth = 1;
    for (const d of drops) {
      if (w === 'vihm') { d.y += dt * s * 14 * d.v; d.x -= dt * s * 2; c.beginPath(); c.moveTo(d.x, d.y); c.lineTo(d.x + s * .06, d.y - s * .32); c.stroke() }
      else { d.y += dt * s * 1.4 * d.v; d.p += dt; d.x += Math.sin(d.p * 1.5) * dt * s * .4; circ(c, d.x, d.y, Math.max(1.2, s * .035 * d.v), 'rgba(255,255,255,.85)') }
      if (d.y > Hd) { d.y = -10; d.x = Math.random() * Wd + (w === 'vihm' ? s * 2 : 0) }
      if (d.x < -20) d.x = Wd;
    }
    c.fillStyle = w === 'vihm' ? 'rgba(40,60,80,.12)' : 'rgba(220,230,240,.08)'; c.fillRect(0, 0, Wd, Hd);
  } else drops.length = 0;
  if (w === 'pilves' || w === 'vihm') {
    for (let i = 0; i < 3; i++) { const cxp = ((tnow * .015 * (i + 1) + i * .4) % 1.5 - .25) * Wd, cyp = (.2 + i * .3) * Hd, r = s * 4; const g = c.createRadialGradient(cxp, cyp, 0, cxp, cyp, r); g.addColorStop(0, 'rgba(10,20,30,.16)'); g.addColorStop(1, 'rgba(10,20,30,0)'); c.fillStyle = g; c.fillRect(cxp - r, cyp - r, r * 2, r * 2) }
  }
  if (w === 'udu') {
    c.fillStyle = 'rgba(225,232,230,.16)'; c.fillRect(0, 0, Wd, Hd);
    for (let i = 0; i < 4; i++) { const fx = ((tnow * .02 * (i + 1) + i * .3) % 1.5 - .25) * Wd, fy = (.15 + i * .25) * Hd, r = s * 4.5; const g = c.createRadialGradient(fx, fy, 0, fx, fy, r); g.addColorStop(0, 'rgba(235,240,238,.28)'); g.addColorStop(1, 'rgba(235,240,238,0)'); c.fillStyle = g; c.fillRect(fx - r, fy - r, r * 2, r * 2) }
  }
  if (w === 'paike') { const g = c.createLinearGradient(0, 0, Wd * .6, Hd * .6); g.addColorStop(0, 'rgba(255,240,180,.12)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.fillRect(0, 0, Wd, Hd) }
}
const dial = document.getElementById('dial'), dc = dial.getContext('2d');
function drawDial(sky) {
  const a = sky.p * Math.PI * 2 - Math.PI / 2 - Math.PI * .1;
  dc.clearRect(0, 0, 56, 56);
  const g = dc.createLinearGradient(0, 0, 0, 56); g.addColorStop(0, sky.dark > .5 ? '#1a2a55' : '#7fc4e8'); g.addColorStop(1, sky.dark > .5 ? '#0c1630' : '#cfeaf5');
  circ(dc, 28, 28, 26, g); dc.strokeStyle = '#f2b552'; dc.lineWidth = 3; dc.beginPath(); dc.arc(28, 28, 26, 0, 6.29); dc.stroke();
  const sx = 28 + Math.cos(a) * 15, sy = 28 + Math.sin(a) * 15, mx = 28 - Math.cos(a) * 15, my = 28 - Math.sin(a) * 15;
  circ(dc, sx, sy, 7, '#ffd65a'); circ(dc, mx, my, 6, '#e8eef8'); circ(dc, mx + 3, my - 2, 5, sky.dark > .5 ? '#1a2a55' : '#a6d6ee');
  rect(dc, 0, 40, 56, 16, 'rgba(30,70,45,.9)');
}

/* ---------- thumbnails ---------- */
function paintThumb(cvs) {
  const size = cvs.clientWidth || 60, d = 2; cvs.width = size * d; cvs.height = size * d;
  const c = cvs.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const g = c.createRadialGradient(size / 2, size * .7, 2, size / 2, size * .6, size * .7); g.addColorStop(0, '#4f8f45'); g.addColorStop(1, '#2a5236');
  c.fillStyle = g; c.fillRect(0, 0, size, size);
  if (cvs.dataset.thumb) { const s = size * .66; drawBuilding(c, cvs.dataset.thumb, (size - s) / 2, size * .26, s, { lvl: 1, night: 0 }) }
  if (cvs.dataset.wagon) { const s = size * .8; drawWagon(c, (size - s) / 2, size * .22, s, 0) }
  if (cvs.dataset.animal) { const sp = cvs.dataset.animal; drawAnimal(c, { sp, f: 1, ph: 0 }, size * .45, ANIMALS[sp].fly ? size * .45 : size * .82, size * .9, 0) }
  if (cvs.dataset.region) {
    const R = REGIONS[cvs.dataset.region]; const wv = cvs.clientWidth || 300, hv = cvs.clientHeight || 58; cvs.width = wv * d; cvs.height = hv * d; c.setTransform(d, 0, 0, d, 0, 0);
    const gg = c.createLinearGradient(0, 0, 0, hv); gg.addColorStop(0, shade(R.ground[0], .25)); gg.addColorStop(1, R.ground[1]); c.fillStyle = gg; c.fillRect(0, 0, wv, hv);
    const kinds = R.gen.kinds; const rng = mulberry32(hashStr(cvs.dataset.region));
    if (R.gen.water !== 'none') { ell(c, wv * .75, hv * .9, wv * .2, hv * .2, '#3f8fb0') }
    for (let i = 0; i < 14; i++) { const x = rng() * wv, s = hv * (.45 + rng() * .3); drawTree(c, kinds[i % kinds.length], 3, x, hv * (.8 + rng() * .2), s, 0) }
    if (cvs.dataset.region === 'maed') for (let i = 0; i < 4; i++) drawTile(c, { t: 'rock', c: 8 }, wv * (.1 + i * .22), hv * .35, hv * .6, 0);
    if (cvs.dataset.lock === '1') { c.fillStyle = 'rgba(8,16,20,.55)'; c.fillRect(0, 0, wv, hv) }
  }
}
function paintThumbs(root) { root.querySelectorAll('canvas[data-thumb],canvas[data-animal],canvas[data-region],canvas[data-wagon]').forEach(paintThumb) }

/* ---------- start background ---------- */
const sb = document.getElementById('startBg'), sbc = sb.getContext('2d');
const sbFlies = Array.from({ length: 40 }, () => ({ x: Math.random(), y: .4 + Math.random() * .6, p: Math.random() * 6 }));
function startFrame(ts) {
  if (document.getElementById('start').hidden) { requestAnimationFrame(startFrame); return }
  const w = sb.clientWidth, h = sb.clientHeight, d = Math.min(2, devicePixelRatio || 1);
  if (sb.width !== w * d) { sb.width = w * d; sb.height = h * d }
  const c = sbc; c.setTransform(d, 0, 0, d, 0, 0); const t = ts / 1000;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0b1a2a'); g.addColorStop(.45, '#1d3b46'); g.addColorStop(.75, '#3b5a40'); g.addColorStop(1, '#0d1f17');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  circ(c, w * .78, h * .2, Math.min(w, h) * .07, '#f3ecc8'); circ(c, w * .78, h * .2, Math.min(w, h) * .12, 'rgba(243,236,200,.08)');
  for (let i = 0; i < 50; i++) { const sx = th(i, 1, 1) * w, sy = th(i, 2, 1) * h * .4; circ(c, sx, sy, th(i, 3, 1) * 1.3 + .3, `rgba(255,255,240,${.3 + .5 * Math.abs(Math.sin(t + i))})`) }
  const layers = [{ c: '#1e3a3a', y: .62, sz: .16, sp: 6 }, { c: '#15302a', y: .74, sz: .2, sp: 12 }, { c: '#0c1f19', y: .9, sz: .26, sp: 20 }];
  layers.forEach((L, li) => {
    const step = Math.max(26, w / 30) * (1 + li * .4), off = (t * L.sp) % step;
    for (let x = -step + off - step; x < w + step; x += step) {
      const k = th(Math.floor((x - off) / step), li, 7), hh = h * L.sz * (.7 + k * .6), by = h * L.y + k * 10;
      for (let j = 0; j < 3; j++) { const ww = step * .55 * (1 - j * .22), yb = by - hh * j * .28; poly(c, [x - ww, yb, x + ww, yb, x, yb - hh * .5], L.c) }
    }
    c.fillStyle = L.c; c.fillRect(0, h * L.y, w, h);
    const fg = c.createLinearGradient(0, h * L.y - 40, 0, h * L.y + 30); fg.addColorStop(0, 'rgba(180,210,200,0)'); fg.addColorStop(.6, 'rgba(180,210,200,.08)'); fg.addColorStop(1, 'rgba(180,210,200,0)'); c.fillStyle = fg; c.fillRect(0, h * L.y - 40, w, 70);
  });
  c.globalCompositeOperation = 'lighter';
  for (const f of sbFlies) { f.p += .016; const fx = (f.x + Math.sin(f.p * .3) * .02) * w, fy = (f.y + Math.cos(f.p * .25) * .02) * h, a = (Math.sin(f.p * 2) + 1) / 2; const gg = c.createRadialGradient(fx, fy, 0, fx, fy, 9); gg.addColorStop(0, `rgba(230,255,150,${a * .9})`); gg.addColorStop(1, 'rgba(230,255,150,0)'); c.fillStyle = gg; c.fillRect(fx - 9, fy - 9, 18, 18) }
  c.globalCompositeOperation = 'source-over';
  requestAnimationFrame(startFrame);
}
