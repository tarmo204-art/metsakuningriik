/* =====================================================================
   Kalamehe käed ja õnge käsitlemine püügistseenis
   - Õng liigub: viskel hoog taha ja ette, haakimisel jõnks üles, võitluses tõuseb pingega,
     sööstu ajal tõmbab kala otsa alla, ootamisel kerge õõtsumine.
   - Parem käsi hoiab käepidemest (sõrmed ümber käepideme, pöial peal),
     vasak käsi keerab rulli vända – vänt keerleb, kui hoiad KERI all.
   ===================================================================== */
const ROD = { a: 0, ph: '', ph0: 0, crank: .9, cranking: false };
// õnge asend: tagastab ridva alguse ja otsa ekraanil
function rodPose(w, h, dt, t) {
  const now = performance.now(), ph = FV.phase;
  if (ph !== ROD.ph) { ROD.ph = ph; ROD.ph0 = now }
  const e = now - ROD.ph0, hk = FV.hook;
  let target = Math.sin(t * 1.1) * .015, snap = null;
  if (ph === 'casting') {
    if (e < 240) snap = -.42 * (e / 240);                         // hoog taha
    else if (e < 430) snap = -.42 + .72 * ((e - 240) / 190);      // vise ette
    else target = .06;
  } else if (ph === 'waiting') target = .04 + Math.sin(t * 1.1) * .015 + (isLure() ? Math.sin(t * 3.2) * .02 : 0); // lanti keritakse – ots tõmbleb
  else if (ph === 'bite') target = .07 + Math.sin(t * 30) * .03;
  else if (ph === 'hooking') snap = e < 140 ? -.36 * (e / 140) : -.3;   // haakimise jõnks
  else if (ph === 'reel' && hk && hk.ten != null) target = -.1 - .22 * hk.ten + (hk.surgeLeft > 0 ? .1 + Math.sin(t * 24) * .03 : 0);
  else if (ph === 'landing') target = -.34;
  else if (ph === 'result') target = -.08;
  if (snap != null) ROD.a = snap; else ROD.a += (target - ROD.a) * Math.min(1, dt * 9);
  // vänt keerleb, kui keritakse (võitluses KERI all, lanti kerides, välja tuues)
  ROD.cranking = (ph === 'reel' && hk && (hk.hold || now < (hk.pulseUntil || 0))) || ph === 'landing' || (ph === 'waiting' && isLure());
  if (ROD.cranking) ROD.crank += dt * (ph === 'waiting' ? 4 : 11);
  const nar = w < 600, x0 = nar ? w * .075 : w * .035, y0 = nar ? h * .94 : h * .97, vx = (nar ? w * .37 : w * .34) - x0, vy = h * .07 - y0, ca = Math.cos(ROD.a), sa = Math.sin(ROD.a);
  return { x0, y0, x1: x0 + vx * ca - vy * sa, y1: y0 + vx * sa + vy * ca };
}
/* ---------- käed ---------- */
function handCols() {
  const look = typeof rdLook === 'function' && typeof RD !== 'undefined' && RD.d ? rdLook() : {};
  return { skin: look.kaed ? look.kaed.col : '#e3b08a', glove: !!look.kaed, slv: look.keha ? look.keha.col : '#5a7a8a' };
}
function skinGrad(c, x, y, r, col) { const g = c.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r * 1.2); g.addColorStop(0, mixC(col, '#ffffff', .22)); g.addColorStop(.6, col); g.addColorStop(1, mixC(col, '#000000', .28)); return g }
function drawHands(c, w, h, t) {
  const R = FX.rod; if (!R) return;
  const K = handCols(), len = Math.hypot(R.x1 - R.x0, R.y1 - R.y0), ang = Math.atan2(R.y1 - R.y0, R.x1 - R.x0), S = R.S, hl = len * .26, w0 = S * .045, sc = w0 / 8.5;
  const ca = Math.cos(ang), sa = Math.sin(ang), W = (x, y) => [R.x0 + x * ca - y * sa, R.y0 + x * sa + y * ca];
  const dark = mixC(K.skin, '#000000', .35);
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  /* --- vasak käsi rulli vändal (enne paremat, jääb taha) --- */
  const spin = ROD.crank, rx = hl * .6, ry = w0 * 2.6, rr = S * .06;
  const kx = rx + Math.cos(spin) * rr * .2, ky = ry + Math.sin(spin) * rr * 1.25, [KX, KY] = W(kx, ky);
  // käsivars alt paremalt
  const ax = Math.min(w * .62, KX + w * .2), ay = h * 1.12;
  c.strokeStyle = mixC(K.slv, '#000000', .1); c.lineWidth = 30 * sc; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(KX + 30 * sc, KY + 60 * sc, KX + 12 * sc, KY + 22 * sc); c.stroke();
  c.strokeStyle = mixC(K.slv, '#000000', .35); c.lineWidth = 2; c.beginPath(); c.moveTo(KX + 2 * sc, KY + 30 * sc); c.lineTo(KX + 26 * sc, KY + 24 * sc); c.stroke(); // varrukaserv
  // käelaba ja näpistavad sõrmed
  c.fillStyle = skinGrad(c, KX + 8 * sc, KY + 12 * sc, 14 * sc, K.skin);
  c.beginPath(); c.ellipse(KX + 8 * sc, KY + 12 * sc, 13 * sc, 10 * sc, -.5, 0, 7); c.fill();
  c.fillStyle = skinGrad(c, KX - 2 * sc, KY + 2 * sc, 6 * sc, K.skin);
  c.beginPath(); c.ellipse(KX - 3 * sc, KY + 3 * sc, 7 * sc, 4.2 * sc, -1.1, 0, 7); c.fill(); // nimetissõrm
  c.beginPath(); c.ellipse(KX + 3 * sc, KY - 3 * sc, 6.5 * sc, 3.8 * sc, .3, 0, 7); c.fill();  // pöial
  c.strokeStyle = dark; c.lineWidth = 1; c.beginPath(); c.moveTo(KX + 2 * sc, KY + 8 * sc); c.quadraticCurveTo(KX + 8 * sc, KY + 6 * sc, KX + 14 * sc, KY + 10 * sc); c.stroke();
  if (!K.glove) { c.fillStyle = 'rgba(255,235,225,.55)'; c.beginPath(); c.ellipse(KX + 6 * sc, KY - 4.5 * sc, 2 * sc, 1.3 * sc, .3, 0, 7); c.fill() } // küüs
  /* --- parem käsi käepidemel --- */
  const gx = hl * .1;
  // käsivars ja varrukas (tuleb ekraani alt vasakult)
  const [PX, PY] = W(gx, w0 * .9);
  c.strokeStyle = K.slv; c.lineWidth = 38 * sc; c.beginPath(); c.moveTo(-w * .04, h * 1.15); c.quadraticCurveTo(PX - 30 * sc, PY + 70 * sc, PX - 4 * sc, PY + 18 * sc); c.stroke();
  c.strokeStyle = mixC(K.slv, '#000000', .25); c.lineWidth = 6 * sc; c.beginPath(); c.moveTo(-w * .04 + 10 * sc, h * 1.15); c.quadraticCurveTo(PX - 22 * sc, PY + 74 * sc, PX + 2 * sc, PY + 24 * sc); c.stroke(); // varjuline volt
  // käerandme / kinda serv
  c.strokeStyle = K.glove ? mixC(K.skin, '#000000', .2) : mixC(K.slv, '#ffffff', .15); c.lineWidth = 8 * sc; c.beginPath(); c.moveTo(PX - 16 * sc, PY + 22 * sc); c.lineTo(PX + 10 * sc, PY + 26 * sc); c.stroke();
  c.translate(R.x0, R.y0); c.rotate(ang);
  // peopesa (ridva all)
  c.fillStyle = skinGrad(c, gx, w0 * 1.4, 18 * sc, K.skin);
  c.beginPath(); c.ellipse(gx - 2 * sc, w0 * 1.25, 19 * sc, 12 * sc, 0, 0, 7); c.fill();
  // neli sõrme ümber käepideme (üle ridva)
  for (let i = 0; i < 4; i++) {
    const fx = gx - 13 * sc + i * 8.2 * sc, fw = (i === 3 ? 6.2 : 7.4) * sc, top = -w0 * .95 - (i === 1 || i === 2 ? 1.5 * sc : 0), bot = w0 * 1.3;
    c.fillStyle = skinGrad(c, fx, (top + bot) / 2, fw * 1.4, K.skin);
    c.beginPath(); c.roundRect(fx - fw / 2, top, fw, bot - top, [fw / 2, fw / 2, fw * .3, fw * .3]); c.fill();
    c.strokeStyle = 'rgba(60,30,15,.35)'; c.lineWidth = .9; c.stroke();
    c.strokeStyle = 'rgba(80,40,20,.3)'; c.beginPath(); c.moveTo(fx - fw * .35, top + (bot - top) * .45); c.lineTo(fx + fw * .35, top + (bot - top) * .45); c.stroke(); // sõrmelüli
    if (!K.glove) { c.fillStyle = 'rgba(255,232,222,.5)'; c.beginPath(); c.ellipse(fx, top + 2.2 * sc, fw * .3, 1.6 * sc, 0, 0, 7); c.fill() }
  }
  // pöial pealt mööda käepidet otsa poole
  c.fillStyle = skinGrad(c, gx + 14 * sc, -w0 * 1.05, 9 * sc, K.skin);
  c.beginPath(); c.ellipse(gx + 12 * sc, -w0 * 1.0, 12 * sc, 4.6 * sc, -.05, 0, 7); c.fill();
  c.strokeStyle = 'rgba(60,30,15,.35)'; c.lineWidth = .9; c.stroke();
  if (!K.glove) { c.fillStyle = 'rgba(255,232,222,.55)'; c.beginPath(); c.ellipse(gx + 21 * sc, -w0 * 1.05, 2.4 * sc, 1.8 * sc, 0, 0, 7); c.fill() }
  // nimetissõrm sirutatud nööri peale (nagu päris kalastajal)
  c.fillStyle = skinGrad(c, gx + 18 * sc, w0 * .6, 7 * sc, K.skin);
  c.beginPath(); c.ellipse(gx + 15 * sc, w0 * 1.1, 10 * sc, 3.6 * sc, .25, 0, 7); c.fill();
  c.restore();
}

var ROD_SCENE = false;
rdDrawHand = function (c, w, h, t) { drawHands(c, w, h, t) };
