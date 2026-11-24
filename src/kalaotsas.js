/* =====================================================================
   Kala õnge otsas + pritsmed ekraanil
   Kui kala on kätte saadud (pärast väljahüpet), ripub ta õnge otsas: kõigub nööri otsas,
   siputab (alguses tugevalt, siis vaiksemalt) ja temalt tilgub vett.
   Samal hetkel lendavad pritsmed vastu ekraani – suured veetilgad, mis aeglaselt alla nõrguvad.
   ===================================================================== */
const HANG = { at: 0, id: 0, lens: [] };
// veepiisad ekraanil: alguses jäävad klaasile pidama, siis hakkavad nirisema alla ja jätavad märja jälje
function lensSplash(w, h, n) {
  const k = Math.max(.8, Math.min(1.4, w / 500));
  for (let i = 0; i < n; i++) {
    const r = rnd(3, 11) * k;
    HANG.lens.push({ x: rnd(.04, .96) * w, y: rnd(.03, .75) * h, r, vy: 0, stick: rnd(.15, 1.4), life: rnd(2.6, 4.2), max: 0, trail: [], beads: [] });
  }
  HANG.lens.forEach(d => d.max = d.max || d.life);
}
function drawLens(c, dt) {
  for (const d of HANG.lens) {
    d.life -= dt;
    if (d.stick > 0) d.stick -= dt; else { d.vy = Math.min(140, d.vy + dt * (30 + d.r * 6) * (Math.random() < .2 ? .2 : 1)); d.y += d.vy * dt; d.trail.push([d.x, d.y]); if (d.trail.length > 40) d.trail.shift(); if (Math.random() < dt * 4) d.beads.push([d.x + rnd(-1, 1), d.y - d.r, rnd(.8, 1.8)]); d.x += Math.sin(d.y * .07) * .15 }
    const a = Math.max(0, Math.min(1, d.life / d.max * 1.8));
    // märg jälg
    if (d.trail.length > 2) { c.strokeStyle = `rgba(210,235,250,${.16 * a})`; c.lineWidth = d.r * .55; c.lineCap = 'round'; c.beginPath(); c.moveTo(d.trail[0][0], d.trail[0][1]); d.trail.forEach(p => c.lineTo(p[0], p[1])); c.stroke() }
    for (const b of d.beads) { c.fillStyle = `rgba(230,245,255,${.35 * a})`; c.beginPath(); c.arc(b[0], b[1], b[2], 0, 7); c.fill() }
    // piisk: ümar põhi, terav saba üles (liigub alla)
    const r = d.r, tl = r * (d.vy > 10 ? 1.9 : 1.15);
    c.beginPath(); c.moveTo(d.x, d.y - tl); c.bezierCurveTo(d.x + r * .55, d.y - r * .9, d.x + r, d.y - r * .1, d.x + r, d.y + r * .15);
    c.arc(d.x, d.y + r * .15, r, 0, Math.PI); c.bezierCurveTo(d.x - r, d.y - r * .1, d.x - r * .55, d.y - r * .9, d.x, d.y - tl); c.closePath();
    const g = c.createLinearGradient(d.x, d.y - tl, d.x, d.y + r * 1.2);
    g.addColorStop(0, `rgba(255,255,255,${.12 * a})`); g.addColorStop(.6, `rgba(190,225,245,${.18 * a})`); g.addColorStop(1, `rgba(20,50,70,${.28 * a})`);
    c.fillStyle = g; c.fill(); c.strokeStyle = `rgba(255,255,255,${.35 * a})`; c.lineWidth = .8; c.stroke();
    c.fillStyle = `rgba(255,255,255,${.85 * a})`; c.beginPath(); c.ellipse(d.x - r * .35, d.y - r * .15, r * .2, r * .32, -.35, 0, 7); c.fill(); // läige
    c.fillStyle = `rgba(255,255,255,${.4 * a})`; c.beginPath(); c.arc(d.x + r * .35, d.y + r * .6, r * .14, 0, 7); c.fill();
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
