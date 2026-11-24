/* =====================================================================
   Kala õnge otsas + pritsmed ekraanil
   Kui kala on kätte saadud (pärast väljahüpet), ripub ta õnge otsas: kõigub nööri otsas,
   siputab (alguses tugevalt, siis vaiksemalt) ja temalt tilgub vett.
   Samal hetkel lendavad pritsmed vastu ekraani – suured veetilgad, mis aeglaselt alla nõrguvad.
   ===================================================================== */
const HANG = { at: 0, id: 0, lens: [] };
function lensSplash(w, h, n) {
  for (let i = 0; i < n; i++) HANG.lens.push({ x: rnd(.05, .95) * w, y: rnd(.05, .8) * h, r: rnd(6, 26) * Math.max(.8, Math.min(1.4, w / 500)), vy: rnd(4, 22), life: rnd(1.8, 3.2), max: 0 });
  HANG.lens.forEach(d => d.max = d.max || d.life);
}
function drawLens(c, dt) {
  for (const d of HANG.lens) {
    d.life -= dt; d.y += d.vy * dt; d.vy += dt * 6;
    const a = Math.max(0, Math.min(1, d.life / d.max * 1.6));
    const g = c.createRadialGradient(d.x - d.r * .25, d.y - d.r * .3, d.r * .1, d.x, d.y, d.r);
    g.addColorStop(0, `rgba(255,255,255,${.1 * a})`); g.addColorStop(.7, `rgba(200,235,255,${.2 * a})`); g.addColorStop(.92, `rgba(255,255,255,${.7 * a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(d.x, d.y, d.r, d.r * 1.08, 0, 0, 7); c.fill();
    c.fillStyle = `rgba(255,255,255,${.7 * a})`; c.beginPath(); c.ellipse(d.x - d.r * .35, d.y - d.r * .4, d.r * .18, d.r * .11, -.6, 0, 7); c.fill(); // läige
    c.strokeStyle = `rgba(20,40,60,${.18 * a})`; c.lineWidth = 1; c.beginPath(); c.arc(d.x, d.y + d.r * .05, d.r * .95, .3, Math.PI - .3); c.stroke();
    // nõrguv jälg
    if (d.vy > 12) { c.strokeStyle = `rgba(220,240,255,${.18 * a})`; c.lineWidth = d.r * .35; c.lineCap = 'round'; c.beginPath(); c.moveTo(d.x, d.y - d.r); c.lineTo(d.x, d.y - d.r - d.vy * .8); c.stroke() }
  }
  HANG.lens = HANG.lens.filter(d => d.life > 0);
}
function drawHanging(c, w, h, t) {
  const r = FV.result, tip = FX.tip; if (!r || r.kind !== 'fish' || !tip || !FD.sp[r.species]) return;
  const now = performance.now();
  if (FX.leap) return; // ootame, kuni väljahüpe on läbi
  if (HANG.id !== FV.resAt) { HANG.id = FV.resAt; HANG.at = now; lensSplash(w, h, 14 + Math.min(10, (+r.rarity || 1) * 2)); fxDrops(tip[0], tip[1] + h * .25, 18, 1) }
  const e = (now - HANG.at) / 1000, calm = Math.max(.2, 1 - e / 4);
  // kala tõstetakse kaamerale lähemale: nöör ritva otsast alla, kala kõigub vaate vasakul pool
  const sw = Math.sin(e * 2.6) * .3 * Math.max(.25, 1 - e / 6) + Math.sin(e * 1.1) * .05;
  const ax = Math.max(tip[0] + 10, w * .34), ay = h * .1, Ll = h * .1, mx = ax + Math.sin(sw) * Ll, my = ay + Math.cos(sw) * Ll;
  const L = Math.max(70, Math.min(h * .52, 62 + Math.cbrt(Math.max(.005, +r.weight)) * 52));
  // nöör
  c.strokeStyle = 'rgba(240,240,240,.9)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo((tip[0] + ax) / 2, Math.min(tip[1], ay) - 6, ax, ay); c.lineTo(mx, my); c.stroke();
  // kala: suu konksus üleval, keha ripub alla, siputab
  // siputamine: pidev värin + iga natukese aja tagant tugev rabelemine
  const act = Math.max(.55, 1 - e / 10), ph = e % 2.2, burst = ph < .6 ? Math.sin(ph / .6 * Math.PI) : 0;
  const wig = Math.sin(t * 19) * (.2 + .35 * burst) * act + Math.sin(t * 6) * .08;
  if (burst > .8 && Math.random() < .5) { FX.drops.push({ x: mx + rnd(-L * .2, L * .2), y: my + L * .6, vx: rnd(-60, 60), vy: rnd(-40, 10), life: .6, r: rnd(1.2, 2.4) }) }
  if (burst > .95 && !HANG.bz) { HANG.bz = true; if (typeof lensSplash === 'function' && Math.random() < .6) lensSplash(w, h, 3) } else if (burst < .5) HANG.bz = false;
  c.save(); c.translate(mx, my); c.rotate(-sw * .8 + wig);
  c.rotate(Math.PI / 2); // pea üles, suu konksus
  c.translate(L * .45, 0);
  c.scale(1, 1 + burst * .06 * Math.sin(t * 30)); drawLook(c, 0, 0, L, FD.sp[r.species].look, t * (2 + burst * 4), 1);
  c.restore();
  // konks suus
  c.strokeStyle = '#c8ccd0'; c.lineWidth = 1.5; c.beginPath(); c.arc(mx, my + 2, 3, 0, Math.PI); c.stroke();
  // tilgad
  if (Math.random() < .35 * (calm + .3)) { const a = -sw * .8 + wig, tx = mx - Math.sin(a) * L * .9, ty = my + Math.cos(a) * L * .9; FX.drops.push({ x: tx + rnd(-3, 3), y: ty, vx: rnd(-8, 8), vy: rnd(20, 60), life: .9, r: rnd(1, 2) }) }
}
{
  const _fx = drawFx;
  drawFx = function (c, w, h, dt, t) {
    if (FV.phase === 'result') drawHanging(c, w, h, t);
    _fx(c, w, h, dt, t);
    if (HANG.lens.length) drawLens(c, dt);
  };
}
