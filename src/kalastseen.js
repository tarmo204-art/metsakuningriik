/* ===== Kalapüügi kohtade realistlikud taustad + püügiefektid ===== */
const BD = { key: '', cv: document.createElement('canvas'), fg: document.createElement('canvas') };
function bdR(seed) { let s = (seed * 2654435761) >>> 0 || 7; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
function bdMix(a, b, k) { const p = x => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)], A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('') }
function bdHills(c, w, y0, amp, col, seed, n = 7) {
  const r = bdR(seed), pts = []; for (let i = 0; i <= n; i++) pts.push([i / n * w, y0 - amp * (.35 + r() * .65)]);
  c.fillStyle = col; c.beginPath(); c.moveTo(0, y0 + 2); c.lineTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) { const [x0, a] = pts[i - 1], [x1, b] = pts[i]; c.bezierCurveTo(x0 + (x1 - x0) * .4, a, x0 + (x1 - x0) * .6, b, x1, b) }
  c.lineTo(w, y0 + 2); c.closePath(); c.fill();
}
function bdMount(c, w, y0, amp, col, seed, snow, sk) {
  const r = bdR(seed), pk = []; let x = -20; while (x <= w + 40) { pk.push([x, y0 - amp * (.25 + r() * .75)]); x += w * (.05 + r() * .09) }
  c.fillStyle = col; c.beginPath(); c.moveTo(-20, y0 + 2); for (const [px, py] of pk) c.lineTo(px, py); c.lineTo(w + 40, y0 + 2); c.closePath(); c.fill();
  // varjupool
  c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i < pk.length; i++) { const [x0, y1] = pk[i - 1], [x1, y2] = pk[i]; if (y1 < y2) { c.beginPath(); c.moveTo(x0, y1); c.lineTo(x1, y2); c.lineTo(x1, y0); c.lineTo(x0 + (x1 - x0) * .3, y0); c.closePath(); c.fill() } }
  if (snow) { c.fillStyle = sk || 'rgba(250,252,255,.92)'; for (const [px, py] of pk) if (py < y0 - amp * .62) { const s = (y0 - py) * .22; c.beginPath(); c.moveTo(px, py); c.lineTo(px - s * 1.1, py + s * 1.1); c.lineTo(px - s * .4, py + s * .8); c.lineTo(px, py + s * 1.2); c.lineTo(px + s * .5, py + s * .85); c.lineTo(px + s * 1.1, py + s * 1.05); c.closePath(); c.fill() } }
}
function bdSpruce(c, x, yb, hh, col, snow) {
  const w = hh * .3, n = 6; c.fillStyle = col; c.beginPath(); c.moveTo(x, yb - hh);
  for (let i = 1; i <= n; i++) { const k = i / n, y = yb - hh + hh * .9 * k; c.lineTo(x + w * k * .55, y - hh * .05); c.lineTo(x + w * k, y) }
  c.lineTo(x + w * .12, yb - hh * .08); c.lineTo(x + w * .08, yb); c.lineTo(x - w * .08, yb); c.lineTo(x - w * .12, yb - hh * .08);
  for (let i = n; i >= 1; i--) { const k = i / n, y = yb - hh + hh * .9 * k; c.lineTo(x - w * k, y); c.lineTo(x - w * k * .55, y - hh * .05) }
  c.closePath(); c.fill();
  if (snow) { c.fillStyle = 'rgba(245,250,255,.9)'; for (let i = 1; i <= n; i++) { const k = i / n, y = yb - hh + hh * .9 * k; c.beginPath(); c.moveTo(x - w * k * .9, y - hh * .01); c.quadraticCurveTo(x, y - hh * .09, x + w * k * .9, y - hh * .01); c.lineTo(x + w * k * .5, y - hh * .05); c.lineTo(x - w * k * .5, y - hh * .05); c.fill() } }
}
function bdBirch(c, x, yb, hh, col, r) {
  c.strokeStyle = '#e8e4da'; c.lineWidth = Math.max(1, hh * .035); c.beginPath(); c.moveTo(x, yb); c.lineTo(x + hh * .02, yb - hh * .85); c.stroke();
  c.fillStyle = col; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(x + (r() - .5) * hh * .36, yb - hh * (.55 + r() * .4), hh * (.1 + r() * .08), hh * (.12 + r() * .08), 0, 0, 6.283); c.fill() }
}
function bdPine(c, x, yb, hh, col, r) {
  c.strokeStyle = '#6a4630'; c.lineWidth = Math.max(1, hh * .04); c.beginPath(); c.moveTo(x, yb); c.quadraticCurveTo(x + hh * .05, yb - hh * .5, x + (r() - .5) * hh * .1, yb - hh * .82); c.stroke();
  c.fillStyle = col; for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(x + (r() - .5) * hh * .4, yb - hh * (.78 + r() * .18), hh * (.14 + r() * .08), hh * (.06 + r() * .03), 0, 0, 6.283); c.fill() }
}
function bdForest(c, w, yb, hMin, hMax, col, seed, dens, mix, snow) {
  const r = bdR(seed); let x = -10;
  while (x < w + 10) {
    const hh = hMin + r() * (hMax - hMin), k = r();
    if (mix === 'pine' && k < .5) bdPine(c, x, yb, hh * 1.1, col, r);
    else if (mix === 'mixed' && k < .3) bdBirch(c, x, yb, hh * .85, bdMix(col, '#8aa860', .35), r);
    else bdSpruce(c, x, yb + hh * .02, hh, col, snow);
    x += hh * (.18 + r() * .22) / dens;
  }
}
function bdClouds(c, w, h, seed, n, col, yMax) {
  const r = bdR(seed);
  for (let i = 0; i < n; i++) {
    const cx = r() * w, cy = h * (.03 + r() * yMax), s = w * (.05 + r() * .07);
    for (let j = 0; j < 6; j++) { const g = c.createRadialGradient(cx + (j - 2.5) * s * .35, cy + (r() - .5) * s * .2, 0, cx + (j - 2.5) * s * .35, cy, s * (.35 + r() * .25)); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(cx - s * 2, cy - s, s * 4, s * 2) }
  }
}
function bdReeds(c, x0, x1, yb, hh, seed, col) {
  const r = bdR(seed); c.lineCap = 'round';
  for (let x = x0; x < x1; x += 2 + r() * 4) {
    const L = hh * (.5 + r() * .5), bend = (r() - .3) * L * .35;
    c.strokeStyle = r() < .5 ? col : bdMix(col, '#c8b870', .3); c.lineWidth = 1 + r(); c.beginPath(); c.moveTo(x, yb); c.quadraticCurveTo(x + bend * .3, yb - L * .6, x + bend, yb - L); c.stroke();
    if (r() < .14) { c.fillStyle = '#5a3a20'; c.beginPath(); c.ellipse(x + bend * .9, yb - L * .88, 1.8, L * .09, bend / L, 0, 6.283); c.fill() }
  }
}
function bdLily(c, x, y, s, r) { c.fillStyle = '#3a7a3a'; c.beginPath(); c.ellipse(x, y, s, s * .38, 0, .3, 6.0); c.lineTo(x, y); c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.stroke(); if (r() < .4) { c.fillStyle = '#fff4f8'; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.beginPath(); c.ellipse(x + Math.cos(a) * s * .25, y - s * .12 + Math.sin(a) * s * .08, s * .18, s * .08, a, 0, 6.283); c.fill() } c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x, y - s * .14, s * .08, 0, 6.283); c.fill() } }
function bdRock(c, x, y, s, col) { const g = c.createLinearGradient(x, y - s, x, y + s * .3); g.addColorStop(0, bdMix(col, '#ffffff', .25)); g.addColorStop(1, bdMix(col, '#000000', .35)); c.fillStyle = g; c.beginPath(); c.moveTo(x - s, y); c.quadraticCurveTo(x - s * .9, y - s * .7, x - s * .2, y - s * .8); c.quadraticCurveTo(x + s * .7, y - s * .75, x + s, y); c.closePath(); c.fill() }
function bdCastle(c, x, yb, s, night) {
  const wall = night ? '#4a5060' : '#a8a49a', dark = night ? '#30343e' : '#7a766e', roof = night ? '#5a2a2a' : '#a8342c';
  bdHills(c, x + s * 2.2, yb, s * .5, night ? '#1e3020' : '#3e6a3a', 77, 3);
  const tower = (tx, tw, th2) => { c.fillStyle = wall; c.fillRect(tx - tw / 2, yb - s * .35 - th2, tw, th2); c.fillStyle = dark; c.fillRect(tx + tw * .15, yb - s * .35 - th2, tw * .35, th2); c.fillStyle = roof; c.beginPath(); c.moveTo(tx - tw * .62, yb - s * .35 - th2); c.lineTo(tx, yb - s * .35 - th2 - tw * 1.3); c.lineTo(tx + tw * .62, yb - s * .35 - th2); c.fill();
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, yb - s * .35 - th2 - tw * 1.3); c.lineTo(tx, yb - s * .35 - th2 - tw * 1.9); c.stroke(); c.fillStyle = '#f2b552'; c.beginPath(); c.moveTo(tx, yb - s * .35 - th2 - tw * 1.9); c.lineTo(tx + tw * .55, yb - s * .35 - th2 - tw * 1.75); c.lineTo(tx, yb - s * .35 - th2 - tw * 1.6); c.fill();
    c.fillStyle = night ? '#ffd27a' : '#2a2a30'; for (let i = 0; i < 2; i++) c.fillRect(tx - tw * .12, yb - s * .35 - th2 * (.35 + i * .3), tw * .24, th2 * .1) };
  c.fillStyle = wall; c.fillRect(x - s * .1, yb - s * .55, s * 1.9, s * .3); for (let i = 0; i < 10; i++) c.fillRect(x - s * .1 + i * s * .2, yb - s * .62, s * .1, s * .08);
  tower(x, s * .28, s * .5); tower(x + s * .85, s * .36, s * .85); tower(x + s * 1.75, s * .28, s * .45);
  c.fillStyle = '#2a1e14'; c.beginPath(); c.arc(x + s * .85, yb - s * .3, s * .1, Math.PI, 0); c.fillRect(x + s * .75, yb - s * .3, s * .2, s * .05); c.fill();
}
function bdLighthouse(c, x, yb, s, night) {
  bdRock(c, x, yb, s * .9, '#6a6660');
  c.fillStyle = '#f4f0e8'; c.beginPath(); c.moveTo(x - s * .16, yb - s * .5); c.lineTo(x - s * .1, yb - s * 1.9); c.lineTo(x + s * .1, yb - s * 1.9); c.lineTo(x + s * .16, yb - s * .5); c.fill();
  c.fillStyle = '#c83a2a'; for (let i = 0; i < 3; i++) c.fillRect(x - s * .15 + i * s * .01, yb - s * (.75 + i * .4), s * .3 - i * s * .02, s * .14);
  c.fillStyle = '#2a2a30'; c.fillRect(x - s * .14, yb - s * 2.12, s * .28, s * .22); c.fillStyle = night ? '#fff0a0' : '#d8e8f0'; c.fillRect(x - s * .1, yb - s * 2.08, s * .2, s * .14);
  c.fillStyle = '#c83a2a'; c.beginPath(); c.moveTo(x - s * .17, yb - s * 2.12); c.lineTo(x, yb - s * 2.32); c.lineTo(x + s * .17, yb - s * 2.12); c.fill();
}
function bdStone(c, x, yb, w2, h2, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - w2 / 2, yb); c.lineTo(x - w2 * .45, yb - h2 * .9); c.quadraticCurveTo(x, yb - h2 * 1.08, x + w2 * .45, yb - h2 * .85); c.lineTo(x + w2 / 2, yb); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + w2 * .1, yb - h2 * .85, w2 * .35, h2 * .85) }

const BD_SKY = {
  metsajarv: ['#6fb2dc', '#d8ecf2'], jogi: ['#78b8de', '#e2f0f2'], kuninglik: ['#86b4e0', '#f2dcc0'], meri: ['#5aa8dc', '#dcf0f6'], jaa: ['#a8c8dc', '#eef4f6'],
  salajane: ['#3a2a6a', '#c898c0'], saarestik: ['#6aaedc', '#e8eef0'], avameri: ['#4a9ad6', '#d6eaf2'], sugavik: ['#1a2440', '#5a5a78']
};
function bdPaint(c, w, h, spot, night) {
  const wl = h * .32, [s0, s1] = BD_SKY[spot] || BD_SKY.metsajarv;
  const sg = c.createLinearGradient(0, 0, 0, wl); sg.addColorStop(0, night ? '#06102a' : s0); sg.addColorStop(1, night ? '#1e2a52' : s1); c.fillStyle = sg; c.fillRect(0, 0, w, wl + 2);
  if (night) { const r = bdR(5); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,240,${.3 + r() * .6})`; c.beginPath(); c.arc(r() * w, r() * wl * .9, r() * 1.2 + .3, 0, 6.283); c.fill() }
    const mx = w * .82, my = wl * .3, g = c.createRadialGradient(mx, my, 0, mx, my, 50); g.addColorStop(0, 'rgba(240,236,208,.45)'); g.addColorStop(1, 'rgba(240,236,208,0)'); c.fillStyle = g; c.fillRect(mx - 50, my - 50, 100, 100); c.fillStyle = '#f2ecd0'; c.beginPath(); c.arc(mx, my, 11, 0, 6.283); c.fill() }
  else if (spot !== 'sugavik' && spot !== 'salajane') { const sx = w * .78, sy = wl * .32, g = c.createRadialGradient(sx, sy, 0, sx, sy, 90); g.addColorStop(0, 'rgba(255,250,220,.95)'); g.addColorStop(.12, 'rgba(255,245,200,.7)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(sx - 90, sy - 90, 180, 180) }
  if (spot === 'salajane') { const mx = w * .7, my = wl * .35, g = c.createRadialGradient(mx, my, 0, mx, my, 80); g.addColorStop(0, 'rgba(255,230,255,.8)'); g.addColorStop(.25, 'rgba(230,190,255,.35)'); g.addColorStop(1, 'rgba(200,160,255,0)'); c.fillStyle = g; c.fillRect(mx - 80, my - 80, 160, 160); c.fillStyle = '#fff0fa'; c.beginPath(); c.arc(mx, my, 20, 0, 6.283); c.fill() }
  bdClouds(c, w, h, spot.length * 13, spot === 'sugavik' ? 4 : 5, night ? 'rgba(80,90,120,.3)' : spot === 'sugavik' ? 'rgba(70,76,104,.35)' : spot === 'salajane' ? 'rgba(255,200,240,.35)' : 'rgba(255,255,255,.85)', .16);
  const fog = (k, y0) => { const g = c.createLinearGradient(0, y0 - h * .06, 0, y0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(${night ? '40,50,90' : '230,240,245'},${k})`); c.fillStyle = g; c.fillRect(0, y0 - h * .06, w, h * .06) };
  const N = col => night ? bdMix(col, '#0a1428', .65) : col;
  if (spot === 'metsajarv' || spot === 'jogi') {
    bdHills(c, w, wl - h * .02, h * .1, N('#8aa8b8'), 11); fog(.4, wl);
    bdForest(c, w, wl - h * .006, h * .05, h * .08, N('#4a7a6a'), 21, 1.6, 'spruce'); fog(.25, wl);
    bdForest(c, w, wl + 1, h * .07, h * .13, N('#1e4a32'), spot === 'jogi' ? 33 : 31, 1.2, 'mixed');
    c.fillStyle = N(spot === 'jogi' ? '#5a7a3a' : '#4a6a34'); c.fillRect(0, wl - 2, w, 4);
    bdReeds(c, w * .02, w * .2, wl + 3, h * .06, 3, N('#5a7a3a')); bdReeds(c, w * .7, w * .86, wl + 3, h * .05, 4, N('#5a7a3a'));
  } else if (spot === 'kuninglik') {
    bdMount(c, w, wl - h * .02, h * .17, N('#8a9ab0'), 41, true); fog(.35, wl);
    bdCastle(c, w * .55, wl, h * .2, night);
    bdForest(c, w * .5, wl + 1, h * .06, h * .1, N('#2a5236'), 43, 1.3, 'mixed'); c.save(); c.translate(w * .78, 0); bdForest(c, w * .25, wl + 1, h * .06, h * .1, N('#2a5236'), 44, 1.3, 'mixed'); c.restore();
  } else if (spot === 'meri') {
    c.fillStyle = N('#9aa890'); c.beginPath(); c.moveTo(0, wl + 1); c.lineTo(0, wl - h * .07); c.bezierCurveTo(w * .15, wl - h * .09, w * .3, wl - h * .06, w * .42, wl - h * .02); c.quadraticCurveTo(w * .5, wl - h * .005, w * .56, wl + 1); c.fill();
    bdForest(c, w * .36, wl - h * .045, h * .035, h * .065, N('#3a5a3a'), 52, 1, 'pine');
    c.fillStyle = N('#e2d2a4'); c.beginPath(); c.moveTo(0, wl + 1); c.lineTo(0, wl - h * .02); c.bezierCurveTo(w * .2, wl - h * .03, w * .4, wl - h * .01, w * .58, wl + 1); c.fill(); bdLighthouse(c, w * .9, wl + 2, h * .1, night);
  } else if (spot === 'jaa') {
    bdMount(c, w, wl - h * .02, h * .18, N('#b8c8d8'), 61, true); fog(.45, wl);
    bdForest(c, w, wl + 1, h * .06, h * .12, N('#2a4a3e'), 62, 1.2, 'spruce', true);
    c.fillStyle = N('#f0f6fa'); c.fillRect(0, wl - 3, w, 6);
  } else if (spot === 'salajane') {
    bdHills(c, w, wl - h * .01, h * .12, N('#4a3a6a'), 71); fog(.3, wl);
    bdForest(c, w, wl + 1, h * .07, h * .14, N('#24203a'), 72, 1.1, 'spruce');
    for (let i = 0; i < 5; i++) bdStone(c, w * (.12 + i * .055), wl + 1, w * .022, h * (.09 + (i % 2) * .03), N('#6a6488'));
    c.fillStyle = N('#6a6488'); c.fillRect(w * .12 - w * .012, wl - h * .125, w * .08, h * .018); c.fillRect(w * .23 - w * .012, wl - h * .125, w * .08, h * .018);
    for (let i = 0; i < 14; i++) { const r = bdR(i + 70), x = r() * w, y = wl - 2 - r() * 3; c.fillStyle = 'rgba(160,255,220,.9)'; c.beginPath(); c.ellipse(x, y, 3, 1.6, 0, Math.PI, 0); c.fill(); const g = c.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(160,255,220,.35)'); g.addColorStop(1, 'rgba(160,255,220,0)'); c.fillStyle = g; c.fillRect(x - 9, y - 9, 18, 18) }
  } else if (spot === 'saarestik') {
    for (let i = 0; i < 4; i++) { const r = bdR(i + 80), x = w * (.06 + i * .27), iw = w * (.1 + r() * .08), ih = h * (.04 + r() * .04); c.fillStyle = N('#a8948a'); c.beginPath(); c.moveTo(x - iw / 2, wl + 1); c.quadraticCurveTo(x - iw * .3, wl - ih, x, wl - ih); c.quadraticCurveTo(x + iw * .35, wl - ih * .95, x + iw / 2, wl + 1); c.fill(); c.save(); c.translate(x - iw * .3, 0); bdForest(c, iw * .6, wl - ih * .7, h * .04, h * .07, N('#2e4e36'), 81 + i, .9, 'pine'); c.restore() }
    bdLighthouse(c, w * .93, wl + 1, h * .06, night);
  } else if (spot === 'avameri') {
    c.fillStyle = N('#7a90a8'); c.fillRect(0, wl - 1.5, w, 2);
  } else if (spot === 'sugavik') {
    for (let i = 0; i < 5; i++) { const r = bdR(i + 90), x = w * (.1 + i * .2 + r() * .05), hh = h * (.08 + r() * .1); c.fillStyle = N('#2a2e3a'); c.beginPath(); c.moveTo(x - w * .03, wl + 1); c.lineTo(x - w * .01, wl - hh); c.lineTo(x + w * .012, wl - hh * .85); c.lineTo(x + w * .035, wl + 1); c.fill() }
  }
  if (night) { c.fillStyle = 'rgba(6,12,34,.28)'; c.fillRect(0, 0, w, wl + 2) }
}
function bdFg(c, w, h, spot, night) {
  const N = col => night ? bdMix(col, '#0a1428', .6) : col, r = bdR(spot.length * 7);
  if (spot === 'metsajarv' || spot === 'kuninglik' || spot === 'salajane') { for (let i = 0; i < 6; i++) bdLily(c, w * (.72 + r() * .26), h * (.62 + r() * .34), w * (.018 + r() * .016), r); bdReeds(c, w * .9, w, h, h * .32, 9, N('#4a6a2a')) }
  if (spot === 'jogi') { bdRock(c, w * .82, h * .66, w * .05, N('#7a7a72')); bdRock(c, w * .93, h * .8, w * .07, N('#6a6a64')); bdRock(c, w * .28, h * .5, w * .03, N('#7a7a72')) }
  if (spot === 'meri' || spot === 'saarestik') { bdRock(c, w * .95, h * .92, w * .08, N('#8a7a70')); bdRock(c, w * .86, h * .98, w * .05, N('#7a6a62')) }
}
function bdWater(c, w, h, t, night, d, wTop, wBot, spot) {
  const wl = h * .32, wh = h - wl;
  const wg = c.createLinearGradient(0, wl, 0, h); wg.addColorStop(0, night ? bdMix(wTop, '#081020', .55) : bdMix(wTop, '#d8ecf4', .25)); wg.addColorStop(.25, night ? bdMix(wTop, '#081020', .5) : wTop); wg.addColorStop(1, night ? bdMix(wBot, '#000000', .4) : wBot);
  c.fillStyle = wg; c.fillRect(0, wl, w, wh);
  if (spot === 'jaa') {
    c.fillStyle = night ? '#9aa8b8' : '#e4eef4'; c.fillRect(0, wl, w, wh);
    const ig = c.createLinearGradient(0, wl, 0, h); ig.addColorStop(0, 'rgba(160,200,220,.3)'); ig.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = ig; c.fillRect(0, wl, w, wh);
    c.strokeStyle = 'rgba(120,160,190,.45)'; c.lineWidth = 1; const r = bdR(3); for (let i = 0; i < 9; i++) { let x = r() * w, y = wl + r() * wh; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (r() - .5) * 60; y += (r() - .3) * 20; c.lineTo(x, y) } c.stroke() }
    c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(r() * w, wl + r() * wh, 30 + r() * 50, 4 + r() * 5, 0, 0, 6.283); c.fill() }
    c.fillStyle = '#c83a2a'; c.beginPath(); c.moveTo(w * .1, wl + wh * .35); c.lineTo(w * .16, wl + wh * .05); c.lineTo(w * .22, wl + wh * .35); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(w * .16, wl + wh * .05); c.lineTo(w * .22, wl + wh * .35); c.lineTo(w * .17, wl + wh * .35); c.fill();
    const hx = w * .6, hy = h * .56; c.fillStyle = '#1f4e62'; c.beginPath(); c.ellipse(hx, hy, w * .14, h * .1, 0, 0, 6.283); c.fill();
    const g = c.createRadialGradient(hx, hy, 0, hx, hy, w * .14); g.addColorStop(0, 'rgba(40,110,140,.6)'); g.addColorStop(1, 'rgba(10,40,60,0)'); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 4; c.stroke(); c.strokeStyle = 'rgba(150,190,210,.6)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(hx, hy + 2, w * .14 - 3, h * .1 - 3, 0, .2, 2.9); c.stroke();
    return;
  }
  // peegeldus: taust tagurpidi, lainetades
  if (BD.cv.width) {
    const k = 1.15, step = 3;
    for (let y = wl; y < h; y += step) {
      const sy = wl - (y - wl) * k; if (sy < 0) break;
      const depth = (y - wl) / wh, rk = (y - wl) / (wl / k), off = Math.sin(t * 1.6 + y * .09) * (1 + depth * 7) + Math.sin(t * .7 + y * .03) * 2;
      c.globalAlpha = .45 * Math.pow(1 - rk, 1.5); if (c.globalAlpha <= .01) break;
      c.drawImage(BD.cv, 0, Math.max(0, sy - step) * d, w * d, step * d, off, y, w, step + .5);
    }
    c.globalAlpha = 1;
  }
  // päikese/kuu sillerdus
  const gx = night ? w * .82 : spot === 'salajane' ? w * .7 : w * .78;
  if (spot !== 'sugavik') for (let i = 0; i < 46; i++) { const k = i / 46, y = wl + 3 + k * k * wh * .7, sp = 6 + k * 40, x = gx + Math.sin(i * 12.9 + t * 1.3) * sp, a = (.5 + .5 * Math.sin(t * 3 + i * 1.7)) * (1 - k) * (night ? .5 : .75); c.fillStyle = `rgba(255,250,225,${a})`; c.fillRect(x - 3 - k * 6, y, 6 + k * 12, 1.3 + k * 1.5) }
  // lained perspektiivis
  const flow = spot === 'jogi' ? 70 : spot === 'meri' || spot === 'avameri' || spot === 'saarestik' ? 26 : spot === 'sugavik' ? 10 : 12;
  for (let i = 0; i < 26; i++) {
    const k = ((i * .618) % 1), y = wl + 4 + k * k * wh * .95, len = 10 + k * 70, sp2 = flow * (.3 + k), x = ((t * sp2 + i * 137) % (w + len * 2)) - len;
    c.strokeStyle = `rgba(255,255,255,${.06 + k * .14})`; c.lineWidth = .6 + k * 1.6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len / 2, y - 1.5 - k * 2, x + len, y); c.stroke();
    c.strokeStyle = `rgba(0,30,50,${.05 + k * .1})`; c.beginPath(); c.moveTo(x + 3, y + 2 + k * 2); c.quadraticCurveTo(x + len / 2, y + 3.5 + k * 3, x + len - 3, y + 2 + k * 2); c.stroke();
  }
  if (spot === 'meri' || spot === 'avameri' || spot === 'saarestik') { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; for (let i = 0; i < 5; i++) { const x = ((t * 18 + i * 260) % (w + 100)) - 50; c.beginPath(); c.moveTo(x, wl + 2 + i % 2); c.lineTo(x + 30, wl + 2 + i % 2); c.stroke() } }
  if (spot === 'avameri') { const sx = ((t * 6) % (w + 200)) - 100, col = night ? 'rgba(20,26,40,.85)' : 'rgba(60,70,90,.7)'; c.fillStyle = col; c.beginPath(); c.moveTo(sx, wl - 1); c.lineTo(sx + 44, wl - 1); c.lineTo(sx + 38, wl + 4); c.lineTo(sx + 6, wl + 4); c.fill(); c.fillRect(sx + 14, wl - 9, 14, 8); c.fillRect(sx + 18, wl - 15, 4, 6) }
  if (spot === 'meri' || spot === 'avameri') for (let i = 0; i < 3; i++) { const gx2 = ((t * (14 + i * 5) + i * 300) % (w + 60)) - 30, gy = h * (.08 + i * .05) + Math.sin(t * 2 + i) * 5, f = Math.sin(t * 7 + i * 2) * 4; c.strokeStyle = night ? 'rgba(200,210,230,.6)' : 'rgba(255,255,255,.9)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(gx2 - 7, gy + f); c.quadraticCurveTo(gx2 - 3, gy - 2, gx2, gy); c.quadraticCurveTo(gx2 + 3, gy - 2, gx2 + 7, gy + f); c.stroke() }
  if (spot === 'jogi') for (let i = 0; i < 4; i++) { const x = [w * .28, w * .82, w * .93][i % 3], y = [h * .5, h * .66, h * .8][i % 3]; c.strokeStyle = `rgba(255,255,255,${.4 + .3 * Math.sin(t * 5 + i)})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(x - w * .02, y + 1, w * .03 + Math.sin(t * 6 + i) * 2, 3, 0, Math.PI * .1, Math.PI * .9); c.stroke() }
  if (spot === 'sugavik') for (let i = 0; i < 30; i++) { const x = (Math.sin(i * 7.3) * .5 + .5) * w + Math.sin(t * .3 + i) * 20, y = wl + (Math.sin(i * 3.1) * .5 + .5) * wh * .95 + Math.sin(t * .7 + i * 2) * 6, a = .3 + .5 * Math.abs(Math.sin(t * .8 + i)), g = c.createRadialGradient(x, y, 0, x, y, 7); g.addColorStop(0, `rgba(120,230,255,${a})`); g.addColorStop(1, 'rgba(120,230,255,0)'); c.fillStyle = g; c.fillRect(x - 7, y - 7, 14, 14) }
  if (spot === 'salajane') { for (let i = 0; i < 3; i++) { const fx = ((t * 12 * (i + 1) + i * 200) % (w + 300)) - 150, g = c.createRadialGradient(fx, h * .5, 0, fx, h * .5, 160); g.addColorStop(0, 'rgba(220,200,255,.18)'); g.addColorStop(1, 'rgba(220,200,255,0)'); c.fillStyle = g; c.fillRect(fx - 160, h * .5 - 160, 320, 320) }
    for (let i = 0; i < 12; i++) { const x = (Math.sin(i * 5.1 + t * .2) * .5 + .5) * w, y = h * (.15 + (Math.sin(i * 2.7 + t * .3) * .5 + .5) * .5), a = .5 + .5 * Math.sin(t * 3 + i); c.fillStyle = `rgba(220,255,160,${a})`; c.beginPath(); c.arc(x, y, 1.6, 0, 6.283); c.fill() } }
  // kaldajoone vaht/varjund
  const sh = c.createLinearGradient(0, wl, 0, wl + 8); sh.addColorStop(0, 'rgba(0,0,0,.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sh; c.fillRect(0, wl, w, 8);
}
function drawBackdrop(c, w, h, t, night, d, wTop, wBot) {
  const spot = FV.spot || 'metsajarv', key = spot + '|' + (night ? 1 : 0) + '|' + Math.round(w) + '|' + Math.round(h) + '|' + d;
  if (BD.key !== key) {
    BD.key = key; for (const cv of [BD.cv, BD.fg]) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) }
    const a = BD.cv.getContext('2d'); a.setTransform(d, 0, 0, d, 0, 0); a.clearRect(0, 0, w, h); try { bdPaint(a, w, h, spot, night) } catch (e) { }
    const f = BD.fg.getContext('2d'); f.setTransform(d, 0, 0, d, 0, 0); f.clearRect(0, 0, w, h); try { bdFg(f, w, h, spot, night) } catch (e) { }
  }
  c.drawImage(BD.cv, 0, 0, BD.cv.width, Math.round(h * .32 * d) + 2, 0, 0, w, h * .32 + 2 / d);
  bdWater(c, w, h, t, night, d, wTop, wBot, spot);
  c.drawImage(BD.fg, 0, 0, w, h);
}

/* ---------- püügiefektid ---------- */
const FX = { drops: [], rings: [], texts: [], conf: [], shake: 0, leap: null, rays: null, w: 600, h: 260, bx: 360, by: 140 };
function fxDrops(x, y, n, k = 1) { for (let i = 0; i < n; i++) FX.drops.push({ x, y, vx: rnd(-90, 90) * k, vy: rnd(-230, -70) * k, life: rnd(.5, 1), r: rnd(1.2, 3) * (k > .8 ? 1 : .7) }) }
function fxRing(x, y, max = 40, col = '255,255,255') { FX.rings.push({ x, y, t: 0, max, col }) }
function fxText(x, y, txt, col, size = 22) { FX.texts.push({ x, y, txt, col, life: 1.3, size }) }
function fxBite() { fxDrops(FX.bx, FX.by, 16); fxRing(FX.bx, FX.by + 6, 46); fxRing(FX.bx, FX.by + 6, 30); FX.shake = .22 }
function fxHit(perfect) {
  const x = FX.bx + rnd(-30, 30), y = FX.h * .62;
  fxDrops(x, y, perfect ? 22 : 12, 1.1); fxRing(x, y, perfect ? 60 : 40);
  fxText(FX.w / 2, FX.h * .72, perfect ? 'TÄPNE!' : 'HEA!', perfect ? '#ffe27a' : '#b8ff9a', perfect ? 28 : 22);
  FX.shake = perfect ? .18 : .1;
}
function fxMiss() { fxText(FX.w / 2, FX.h * .72, 'MÖÖDA!', '#ff9a8a', 22); FX.shake = .3 }
function fxLand(r) {
  if (r.kind !== 'fish') { sparkleScene('#ffd065'); fxDrops(FX.bx, FX.by, 20); fxRing(FX.bx, FX.by, 50); return }
  FX.leap = { t0: performance.now(), sid: r.species, rar: r.rarity, giant: r.giant, w: +r.weight, landed: false, xp: r.xp, nw: r.new_species, rec: r.record };
  fxDrops(FX.bx, FX.by, 30, 1.3); fxRing(FX.bx, FX.by, 70); fxRing(FX.bx, FX.by, 45); FX.shake = .25;
}
function drawFx(c, w, h, dt, t) {
  // kala hüpe veest
  const L2 = FX.leap;
  if (L2) {
    const k = (performance.now() - L2.t0) / 1500, sp = FD.sp[L2.sid];
    if (k >= 1) {
      if (!L2.landed) {
        L2.landed = true; const col = RAR2[L2.rar][1];
        fxDrops(FX.bx + w * .16, FX.by, 26, 1.2); fxRing(FX.bx + w * .16, FX.by, 60);
        sparkleScene(col); if (L2.rar >= 3 || L2.giant) FX.rays = { t0: performance.now(), col, big: L2.rar >= 5 || L2.giant };
        if (L2.rar >= 4 || L2.giant) for (let i = 0; i < 70; i++) FX.conf.push({ x: w / 2 + rnd(-40, 40), y: h * .35, vx: rnd(-220, 220), vy: rnd(-320, -80), r: rnd(0, 6.28), vr: rnd(-8, 8), col: ['#ffd25e', '#ff6a5a', '#6ad8ff', '#9aff7a', col][i % 5], life: rnd(1.6, 2.6) });
        fxRing(FX.bx + w * .16, FX.by, 120, col.startsWith('#') ? [1, 3, 5].map(i => parseInt(col.slice(i, i + 2), 16)).join(',') : '255,255,255');
        for (let i = 0; i < 16; i++) FX.conf.push({ x: FX.bx + w * .16, y: FX.by - 10, vx: rnd(-160, 160), vy: rnd(-300, -150), r: 0, vr: rnd(-6, 6), col: '#ffd84a', coin: 1, life: rnd(1, 1.6) });
        if (L2.xp) setTimeout(() => fxText(FX.bx + w * .16, FX.by - 40, `+${L2.xp} XP`, '#9ae8ff', 20), 250);
        if (L2.nw) setTimeout(() => fxText(w / 2, h * .32, 'UUS LIIK KALARAAMATUS!', '#9aff7a', 22), 500); else if (L2.rec) setTimeout(() => fxText(w / 2, h * .32, 'ISIKLIK REKORD!', '#ffb86a', 22), 500);
        fxText(w / 2, h * .2, L2.giant ? 'REKORDSUURUS!' : ['', 'Püütud!', 'Ebatavaline!', 'HARULDANE!', 'EEPILINE!', 'LEGENDAARNE!', 'MÜÜTILINE!'][L2.rar] || 'Püütud!', col, L2.rar >= 4 ? 34 : 28);
      }
      FX.leap = null;
    } else {
      const x0 = FX.bx, x1 = FX.bx + w * .16, x = x0 + (x1 - x0) * k, top = h * .1, y = FX.by - Math.sin(k * Math.PI) * (FX.by - top), ang = Math.atan2(Math.cos(k * Math.PI) * -(FX.by - top), (x1 - x0)) * .8;
      const Lf = Math.min(w * .26, 60 + Math.min(40, L2.w) * 3);
      c.save(); c.translate(x, y); c.rotate(ang);
      if (L2.rar >= 3) { const g = c.createRadialGradient(0, 0, 0, 0, 0, Lf); g.addColorStop(0, RAR2[L2.rar][1] + '66'); g.addColorStop(1, RAR2[L2.rar][1] + '00'); c.fillStyle = g; c.fillRect(-Lf, -Lf, Lf * 2, Lf * 2) }
      drawLook(c, 0, 0, Lf, sp ? Object.assign({ _id: L2.sid }, sp.look) : {}, t * 3, -1);
      c.restore();
      if (Math.random() < .6) FX.drops.push({ x: x + rnd(-8, 8), y: y + rnd(-4, 6), vx: rnd(-30, 30), vy: rnd(-20, 40), life: rnd(.3, .7), r: rnd(1, 2.2) });
    }
  }
  // kiired haruldase kala puhul
  if (FX.rays) {
    const k = (performance.now() - FX.rays.t0) / 2600; if (k >= 1) FX.rays = null;
    else { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.sin(k * Math.PI) * (FX.rays.big ? .5 : .32); c.translate(w / 2, h * .35); c.rotate(t * .4);
      for (let i = 0; i < 14; i++) { c.rotate(Math.PI * 2 / 14); const g = c.createLinearGradient(0, 0, w * .7, 0); g.addColorStop(0, FX.rays.col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(w * .7, -18); c.lineTo(w * .7, 18); c.fill() }
      c.restore() }
  }
  // tilgad
  for (const p of FX.drops) { p.life -= dt; p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); c.fillStyle = 'rgba(230,246,255,.95)'; c.beginPath(); c.ellipse(p.x, p.y, p.r * .8, p.r * 1.2, 0, 0, 6.283); c.fill(); c.globalAlpha = 1 }
  FX.drops = FX.drops.filter(p => p.life > 0);
  for (const r of FX.rings) { r.t += dt; const k = r.t / .9; c.strokeStyle = `rgba(${r.col},${Math.max(0, .7 * (1 - k))})`; c.lineWidth = 2 * (1 - k) + .5; c.beginPath(); c.ellipse(r.x, r.y, r.max * k, r.max * k * .3, 0, 0, 6.283); c.stroke() }
  FX.rings = FX.rings.filter(r => r.t < .9);
  for (const p of FX.conf) { p.life -= dt; p.vy += 300 * dt; p.vx *= .99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; c.save(); c.globalAlpha = Math.max(0, Math.min(1, p.life)); c.translate(p.x, p.y); c.rotate(p.r); if (p.coin) { c.scale(Math.cos(p.r * 2), 1); c.fillStyle = '#f2b532'; c.beginPath(); c.arc(0, 0, 4, 0, 6.283); c.fill(); c.fillStyle = '#ffe89a'; c.beginPath(); c.arc(-1, -1, 2, 0, 6.283); c.fill() } else { c.fillStyle = p.col; c.fillRect(-4, -2, 8, 4) } c.restore() }
  FX.conf = FX.conf.filter(p => p.life > 0 && p.y < h + 20);
  for (const tx of FX.texts) {
    tx.life -= dt; const k = 1 - tx.life / 1.3, s = k < .15 ? .6 + k / .15 * .5 : 1.1 - Math.min(.1, (k - .15));
    c.save(); c.globalAlpha = Math.max(0, Math.min(1, tx.life * 2)); c.translate(tx.x, tx.y - k * 26); c.scale(s, s);
    c.font = `900 ${tx.size}px "Alegreya Sans", system-ui, sans-serif`; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = 'rgba(10,20,30,.85)'; c.strokeText(tx.txt, 0, 0); c.fillStyle = tx.col; c.fillText(tx.txt, 0, 0); c.restore();
  }
  FX.texts = FX.texts.filter(x => x.life > 0);
}
{ const _dl = doLose; doLose = async function (msg) { fxDrops(FX.bx, FX.by, 10, .8); fxRing(FX.bx, FX.by, 40, '255,150,130'); fxText(FX.w / 2, FX.h * .3, 'PÄÄSES!', '#ff9a8a', 26); return _dl.apply(this, arguments) } }

/* ---------- ujuk, nöör, viskamine ---------- */
FX.bub = []; FX.castT0 = 0; FX.lastPh = ''; FX.snap = 0; FX.nib = 0;
function drawBobber(c, x, wy, sink, t, s, night) {
  // wy = veepinna kõrgus ujuki kohal, sink = kui palju ujuk on vee all (px)
  const H = 30 * s, R = 6.2 * s, top = wy - H * .55 + sink;
  // veealune osa (murdub ja tumeneb)
  c.save(); c.beginPath(); c.rect(x - 30 * s, wy, 60 * s, 60 * s); c.clip(); c.globalAlpha = .45; c.translate(Math.sin(t * 3) * 1.2 * s, 0);
  c.fillStyle = '#c8b890'; c.beginPath(); c.moveTo(x, top + H * 1.05); c.quadraticCurveTo(x + R * 1.05, top + H * .62, x + R, top + H * .42); c.lineTo(x - R, top + H * .42); c.quadraticCurveTo(x - R * 1.05, top + H * .62, x, top + H * 1.05); c.fill();
  c.strokeStyle = 'rgba(40,30,20,.6)'; c.lineWidth = 1.2 * s; c.beginPath(); c.moveTo(x, top + H * 1.05); c.lineTo(x, top + H * 1.4); c.stroke();
  c.restore();
  // pinnast kõrgem osa
  c.save(); c.beginPath(); c.rect(x - 30 * s, wy - 80 * s, 60 * s, 80 * s + .5); c.clip();
  c.strokeStyle = '#2a2018'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(x, top + H * .1); c.lineTo(x, top - H * .45); c.stroke();
  c.fillStyle = '#ff3a2a'; c.beginPath(); c.ellipse(x, top - H * .45, 1.6 * s, 3.4 * s, 0, 0, 6.283); c.fill();
  const g = c.createLinearGradient(x - R, 0, x + R, 0); g.addColorStop(0, '#a8180e'); g.addColorStop(.35, '#ff5a3a'); g.addColorStop(.6, '#f03a22'); g.addColorStop(1, '#8a1208');
  c.fillStyle = g; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + R * 1.05, top + H * .12, x + R, top + H * .42); c.lineTo(x - R, top + H * .42); c.quadraticCurveTo(x - R * 1.05, top + H * .12, x, top); c.fill();
  const wg = c.createLinearGradient(x - R, 0, x + R, 0); wg.addColorStop(0, '#b8b4a8'); wg.addColorStop(.4, '#ffffff'); wg.addColorStop(1, '#a8a498'); c.fillStyle = wg; c.fillRect(x - R * .99, top + H * .32, R * 1.98, H * .1);
  c.fillStyle = '#1a1410'; c.fillRect(x - R, top + H * .3, R * 2, H * .025);
  c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(x - R * .42, top + H * .16, R * .2, H * .09, -.3, 0, 6.283); c.fill();
  c.restore();
  // veepiir: menisk ja peegeldus
  if (sink < H * .5) {
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.2 * s; c.beginPath(); c.ellipse(x, wy, R * 1.5, R * .4, 0, 0, 6.283); c.stroke();
    c.fillStyle = 'rgba(255,80,50,.18)'; c.beginPath(); c.ellipse(x + Math.sin(t * 2) * s, wy + H * .25, R * .7, H * .18, 0, 0, 6.283); c.fill();
  }
}
function drawLineBobber(c, w, h, t, tip, bx, by, bob, casting) {
  const ph = FV.phase, s = Math.max(.85, Math.min(1.5, h / 220)), now = performance.now();
  if (ph !== FX.lastPh) {
    if (ph === 'casting') FX.castT0 = now;
    if (ph === 'lost' && FX.lastPh !== 'idle') FX.snap = now;
    FX.lastPh = ph;
  }
  // viskamine: ujuk lendab kaares õnge otsast vette
  const flyK = FX.castT0 ? (now - FX.castT0) / 750 : 2;
  let fx = bx, fy = by + bob, flying = flyK < 1 && (ph === 'casting' || ph === 'waiting');
  if (flying) { fx = tip[0] + (bx - tip[0]) * flyK; fy = tip[1] + (by - tip[1]) * flyK - Math.sin(flyK * Math.PI) * h * .25 }
  else if (FX.castT0 && flyK >= 1) { FX.castT0 = 0; fxDrops(bx, by, 16, .9); fxRing(bx, by + 4, 50); fxRing(bx, by + 4, 32); if (typeof sfx === 'function') sfx('splash') }
  // nöör katkeb: lõdvalt tagasi
  if (FX.snap && now - FX.snap < 900) {
    const k = (now - FX.snap) / 900; c.strokeStyle = `rgba(240,240,240,${.8 * (1 - k)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(tip[0], tip[1]);
    for (let i = 1; i <= 12; i++) { const q = i / 12; c.lineTo(tip[0] + (bx - tip[0]) * q * (1 - k * .7), tip[1] + (by - tip[1]) * q * (1 - k * .5) + Math.sin(q * 9 + k * 14) * 14 * k + q * q * 60 * k) } c.stroke();
  }
  if (casting && ph !== 'casting' && !flying) return;
  // väike näksimine enne näkkamist
  let sink = 0;
  if (ph === 'waiting' && FV.biteAt) { const left = FV.biteAt - now; if (left < 1600 && left > 0 && Math.sin(now / 90) > .6) { sink = 2.5 * s; if (Math.random() < .05) fxRing(bx, by + 2, 18) } }
  if (ph === 'bite') { sink = (16 + Math.sin(t * 30) * 6) * s; if (Math.random() < .5) FX.bub.push({ x: bx + rnd(-5, 5) * s, y: by + 10 * s, v: rnd(20, 40), r: rnd(1, 2.6) * s, life: rnd(.5, 1) }) }
  if (ph === 'reel') { sink = (8 + Math.sin(t * 14) * 4) * s; if (Math.random() < .25) FX.bub.push({ x: bx + rnd(-8, 8) * s, y: by + 8 * s, v: rnd(20, 40), r: rnd(1, 2.2) * s, life: rnd(.4, .8) }) }
  const bobY = flying ? fy : by + Math.sin(t * 2.2) * 1.5 * s;
  // nöör
  const tight = ph === 'reel' || ph === 'hooking' || ph === 'landing', mx = (tip[0] + fx) / 2 + (tight ? 0 : w * .03), my = (tip[1] + bobY) / 2 + (tight ? -h * .02 : h * .04);
  c.strokeStyle = tight ? 'rgba(255,255,255,.95)' : 'rgba(240,240,240,.8)'; c.lineWidth = tight ? 1.3 : 1;
  c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(mx + (tight ? Math.sin(t * 40) * 1.5 : 0), my, fx, flying ? fy : bobY - 12 * s + sink); c.stroke();
  if (tight) { c.strokeStyle = 'rgba(180,230,255,.35)'; c.lineWidth = 3; c.stroke(); if (Math.random() < .3) { const q = Math.random(); FX.drops.push({ x: tip[0] + (fx - tip[0]) * q, y: tip[1] + (bobY - tip[1]) * q, vx: rnd(-20, 20), vy: rnd(0, 40), life: .5, r: 1.2 }) } }
  if (flying) { c.save(); c.translate(fx, fy); c.rotate(flyK * 6); c.translate(-fx, -fy); drawBobber(c, fx, fy + 12 * s, 0, t, s, 0); c.restore(); return }
  // rõngad
  if (ph === 'bite' || ph === 'reel') for (let i = 0; i < 3; i++) { const k = ((t * 1.6 + i / 3) % 1); c.strokeStyle = `rgba(255,255,255,${.6 * (1 - k)})`; c.lineWidth = 1.4; c.beginPath(); c.ellipse(bx, by, 8 + k * 40 * s, (3 + k * 12) * s, 0, 0, 6.283); c.stroke() }
  else { const k = (t * .4) % 1; c.strokeStyle = `rgba(255,255,255,${.25 * (1 - k)})`; c.lineWidth = 1; c.beginPath(); c.ellipse(bx, by, 10 + k * 26 * s, (3 + k * 7) * s, 0, 0, 6.283); c.stroke() }
  drawBobber(c, bx, by, sink, t, s, 0);
  // mullid
  for (const b of FX.bub) { b.life -= 1 / 60; b.y -= b.v / 60; c.strokeStyle = `rgba(230,250,255,${Math.max(0, b.life)})`; c.lineWidth = 1; c.beginPath(); c.arc(b.x, Math.max(by - 2, b.y), b.r, 0, 6.283); c.stroke() }
  FX.bub = FX.bub.filter(b => b.life > 0 && b.y > by - 3);
}
