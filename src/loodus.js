/* ================= REALISTLIKUD PUUD, PÕÕSAD JA KIVID ================= */
// Iga puu, põõsas ja kivi joonistatakse üks kord eraldi pildiks (mälu säästmiseks) ja siis kaardile.
const NAT = new Map();
function natRand(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
function natSprite(key, s, draw) {
  const px = Math.max(8, Math.round(s * (typeof DPR !== 'undefined' ? DPR : 1)));
  const k = key + '|' + px;
  let cv2 = NAT.get(k);
  if (!cv2) {
    if (NAT.size > 900) NAT.clear();
    cv2 = document.createElement('canvas'); cv2.width = px * 2; cv2.height = px * 2;
    const c = cv2.getContext('2d'); c.translate(px, px * 1.8); draw(c, px); NAT.set(k, cv2);
  }
  return cv2;
}
function natBlit(c, spr, x, y, s, shear) {
  c.save(); c.translate(x, y); if (shear) c.transform(1, 0, shear, 1, 0, 0);
  c.drawImage(spr, -s, -s * 1.8, s * 2, s * 2); c.restore();
}
const lerpC = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})` };
// lehekobar: valgus ülalt vasakult, vari all paremal
function leafClump(c, x, y, r, base, rnd, dens = 1) {
  const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.05);
  g.addColorStop(0, shade(base, .16)); g.addColorStop(.5, base); g.addColorStop(1, shade(base, -.3));
  c.fillStyle = g; c.beginPath();
  const n = 9; for (let i = 0; i <= n; i++) { const a = i / n * 6.283, rr = r * (.82 + rnd() * .3); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * .9; i ? c.quadraticCurveTo(x + Math.cos(a - .35) * rr * 1.12, y + Math.sin(a - .35) * rr * 1.0, px, py) : c.moveTo(px, py) }
  c.fill();
  // lehe tekstuur
  const k = Math.round(10 * dens);
  for (let i = 0; i < k; i++) { const a = rnd() * 6.283, d = rnd() * r * .85, lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * .9, top = ly < y; c.fillStyle = top ? `rgba(255,255,220,${.05 + rnd() * .06})` : `rgba(0,20,0,${.08 + rnd() * .1})`; c.beginPath(); c.ellipse(lx, ly, r * .13, r * .07, rnd() * 3, 0, 6.283); c.fill() }
}
function trunk(c, x0, y0, x1, y1, w0, w1, col, rnd, bark) {
  const g = c.createLinearGradient(x0 - w0, 0, x0 + w0, 0); g.addColorStop(0, shade(col, .15)); g.addColorStop(.45, col); g.addColorStop(1, shade(col, -.45));
  c.fillStyle = g; c.beginPath(); c.moveTo(x0 - w0, y0); c.quadraticCurveTo((x0 + x1) / 2 - w0 * .8, (y0 + y1) / 2, x1 - w1, y1); c.lineTo(x1 + w1, y1); c.quadraticCurveTo((x0 + x1) / 2 + w0 * .8, (y0 + y1) / 2, x0 + w0, y0); c.closePath(); c.fill();
  if (bark) { c.strokeStyle = bark; c.lineWidth = Math.max(.6, w0 * .12); for (let i = 0; i < 6; i++) { const t = rnd(), yy = y0 + (y1 - y0) * t, xx = x0 + (x1 - x0) * t + (rnd() - .5) * w0; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + (rnd() - .5) * w0 * .3, yy - w0 * (.6 + rnd())); c.stroke() } }
}
function treeSprite(kind, stage, sk, snow, v, s) {
  return natSprite(`t|${kind}|${stage}|${sk}|${snow ? 1 : 0}|${v}`, s, (c, S0) => {
    const rnd = natRand(v * 9973 + stage * 131 + kind.length * 17), sc = [0.3, 0.5, 0.75, 1][stage], u = S0 * sc;
    // pehme vari
    const sh = c.createRadialGradient(0, 0, 0, 0, 0, u * .45); sh.addColorStop(0, 'rgba(10,25,15,.38)'); sh.addColorStop(1, 'rgba(10,25,15,0)'); c.fillStyle = sh; c.beginPath(); c.ellipse(u * .08, 0, u * .5, u * .14, 0, 0, 6.283); c.fill();
    if (stage === 0) {
      c.strokeStyle = '#6b4a2a'; c.lineWidth = Math.max(1, S0 / 30); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(S0 * .02, -S0 * .15, 0, -S0 * .3); c.stroke();
      for (const [dx, dy, a] of [[-.07, -.22, -.5], [.07, -.27, .5], [0, -.31, 0]]) { c.save(); c.translate(dx * S0, dy * S0); c.rotate(a); const g = c.createLinearGradient(0, -S0 * .04, 0, S0 * .04); g.addColorStop(0, '#a8e07a'); g.addColorStop(1, '#4f9a3e'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, S0 * .075, S0 * .035, 0, 0, 6.283); c.fill(); c.restore() }
      return;
    }
    if (kind === 'kuusk' || kind === 'tume') {
      const h = S0 * 1.32 * sc, dark = kind === 'tume', c0 = dark ? '#123526' : '#1d4d33', c1 = dark ? '#1f4a36' : '#2c6a46', c2 = dark ? '#2e5e45' : '#3f8a5a';
      trunk(c, 0, 0, 0, -h * .25, u * .055, u * .04, '#5b3b22', rnd);
      const tiers = 6 + stage;
      for (let i = 0; i < tiers; i++) {
        const t = i / (tiers - 1), yb = -h * (.12 + t * .72), w = u * .5 * (1 - t * .82) * (.92 + rnd() * .16), hh = h * .2;
        // oksarinne: sakiline, rippuvad otsad
        const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, lerpC(c1, c2, .6)); g.addColorStop(.45, c1); g.addColorStop(1, c0);
        c.fillStyle = g; c.beginPath(); c.moveTo(-w, yb + hh * .12);
        const teeth = 7; for (let k = 0; k <= teeth; k++) { const xx = -w + 2 * w * k / teeth, yy = yb + (k % 2 ? hh * .02 : hh * .16) + (rnd() - .5) * hh * .05; c.lineTo(xx, yy) }
        c.lineTo(w * .1, yb - hh * .95); c.closePath(); c.fill();
        // okkatekstuur
        c.strokeStyle = 'rgba(160,220,150,.18)'; c.lineWidth = Math.max(.5, u * .008); c.beginPath(); for (let k = 0; k < 8; k++) { const xx = (rnd() - .5) * w * 1.6, yy = yb - rnd() * hh * .7; c.moveTo(xx, yy); c.lineTo(xx - u * .03, yy + u * .02) } c.stroke();
        if (snow) { c.fillStyle = 'rgba(248,252,255,.92)'; c.beginPath(); c.moveTo(-w * .85, yb + hh * .02); c.quadraticCurveTo(-w * .2, yb - hh * .25, w * .05, yb - hh * .9); c.quadraticCurveTo(-w * .1, yb - hh * .3, w * .5, yb - hh * .05); c.quadraticCurveTo(0, yb - hh * .1, -w * .85, yb + hh * .02); c.fill() }
      }
      c.strokeStyle = c1; c.lineWidth = Math.max(1, u * .02); c.beginPath(); c.moveTo(0, -h * .8); c.lineTo(u * .01, -h * .98); c.stroke();
      if (stage === 3 && !snow && rnd() < .7) for (let i = 0; i < 3; i++) { const xx = (rnd() - .5) * u * .4, yy = -h * (.3 + rnd() * .3); c.fillStyle = '#6a4424'; c.beginPath(); c.ellipse(xx, yy, u * .018, u * .04, 0, 0, 6.283); c.fill() }
      return;
    }
    if (kind === 'kask' || kind === 'hobekask') {
      const h = S0 * 1.18 * sc, silver = kind === 'hobekask';
      const pal = silver ? ['#8dbfac', '#a7d6c3', '#c9ecdc'] : { kevad: ['#79b84c', '#94d062', '#b8e486'], suvi: ['#478f38', '#5aa846', '#7cc35c'], sygis: ['#b8902a', '#d8b544', '#efd270'], talv: null }[sk];
      // valge tüvi mustade triipudega
      const tw = u * .045; const g = c.createLinearGradient(-tw, 0, tw, 0); g.addColorStop(0, '#f8f6ee'); g.addColorStop(.6, '#e6e2d4'); g.addColorStop(1, '#a8a294');
      c.fillStyle = g; c.beginPath(); c.moveTo(-tw, 0); c.lineTo(-tw * .55, -h * .78); c.lineTo(tw * .55, -h * .78); c.lineTo(tw, 0); c.fill();
      c.fillStyle = '#2b2b2b'; for (let i = 0; i < 7; i++) { const yy = -h * (.05 + rnd() * .65), ww = tw * (.5 + rnd() * .9); c.fillRect(-tw * .9 + rnd() * tw * .4, yy, ww, Math.max(1, u * .012)) }
      // oksad
      c.strokeStyle = '#5a4a3a'; c.lineWidth = Math.max(.6, u * .012);
      const br = []; for (let i = 0; i < 7; i++) { const yy = -h * (.42 + i * .07), dir = i % 2 ? 1 : -1, len = u * (.22 + rnd() * .14) * (1 - i * .06); br.push([dir * len, yy - u * .1]); c.beginPath(); c.moveTo(0, yy); c.quadraticCurveTo(dir * len * .5, yy - u * .02, dir * len, yy - u * .1); c.stroke() }
      if (!pal) { c.lineWidth = Math.max(.4, u * .006); c.strokeStyle = 'rgba(90,74,58,.7)'; for (const [bx, by] of br) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (rnd() - .5) * u * .2, by - u * (.06 + rnd() * .1)); c.stroke() } if (snow) for (const [bx, by] of br) { c.fillStyle = 'rgba(248,252,255,.9)'; c.beginPath(); c.ellipse(bx * .7, by + u * .02, u * .05, u * .012, 0, 0, 6.283); c.fill() } return }
      // võra: palju väikesi kobaraid, kased on hõredad ja rippuvad
      const cy = -h * .7, rw = u * .3, rh = h * .32;
      const cl = []; for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()); cl.push([Math.cos(a) * rw * d, cy + Math.sin(a) * rh * d * .9, u * (.075 + rnd() * .045)]) }
      cl.sort((a, b) => a[1] - b[1]);
      for (const [lx, ly, r] of cl) leafClump(c, lx, ly, r, pal[Math.floor(rnd() * 2)], rnd, .6);
      for (let i = 0; i < 5; i++) { const [lx, ly, r] = cl[Math.floor(rnd() * cl.length)]; leafClump(c, lx - r * .3, ly - r * .5, r * .6, pal[2], rnd, .4) }
      if (snow) { c.fillStyle = 'rgba(248,252,255,.85)'; c.beginPath(); c.ellipse(0, cy - rh * .85, rw * .55, u * .04, 0, 0, 6.283); c.fill() }
      return;
    }
    if (kind === 'mand') {
      const h = S0 * 1.42 * sc;
      trunk(c, 0, 0, u * .03, -h * .8, u * .05, u * .028, '#b06a3c', rnd, 'rgba(90,40,20,.45)');
      const pal = ['#24502e', '#2f6a3a', '#4a8a52'];
      const tops = [[-.2, -.82, .17], [.16, -.9, .2], [0, -.98, .17], [.24, -.75, .12], [-.1, -.7, .1]];
      c.strokeStyle = '#8a4e2c'; c.lineWidth = Math.max(.8, u * .018); for (const [dx, dy] of tops) { c.beginPath(); c.moveTo(u * .02, dy * h + u * .1); c.lineTo(dx * u, dy * h + u * .02); c.stroke() }
      for (const [dx, dy, r] of tops) { c.save(); c.scale(1, .55); leafClump(c, dx * u, (dy * h) / .55, r * u, pal[Math.floor(rnd() * 2)], rnd, .8); c.restore() }
      if (snow) for (const [dx, dy, r] of tops) { c.fillStyle = 'rgba(248,252,255,.9)'; c.beginPath(); c.ellipse(dx * u, dy * h - r * u * .35, r * u * .7, u * .025, 0, 0, 6.283); c.fill() }
      return;
    }
    if (kind === 'tamm') {
      const h = S0 * 1.55 * sc;
      // jäme sõlmeline tüvi juurtega
      trunk(c, 0, 0, u * .02, -h * .5, u * .14, u * .08, '#4a3220', rnd, 'rgba(20,10,5,.5)');
      c.fillStyle = '#4a3220'; for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * u * .1, -u * .08); c.quadraticCurveTo(d * u * .2, 0, d * u * .3, u * .02); c.lineTo(d * u * .1, 0); c.fill() }
      c.fillStyle = 'rgba(110,160,80,.45)'; c.beginPath(); c.ellipse(-u * .06, -h * .25, u * .04, u * .12, 0, 0, 6.283); c.fill();
      const pal = { kevad: ['#3c6e30', '#4f8a3c', '#6aa84e'], suvi: ['#244a2a', '#2f5e35', '#447a48'], sygis: ['#8a5a1e', '#b07a28', '#d09a3a'], talv: null }[sk];
      c.strokeStyle = '#4a3220'; c.lineWidth = Math.max(1, u * .04); c.lineCap = 'round';
      const arms = [[-.32, -.62], [.34, -.6], [-.12, -.82], [.16, -.84]]; for (const [dx, dy] of arms) { c.beginPath(); c.moveTo(0, -h * .45); c.quadraticCurveTo(dx * u * .5, -h * .55, dx * u, dy * h); c.stroke() }
      if (!pal) { c.lineWidth = Math.max(.6, u * .015); for (const [dx, dy] of arms) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(dx * u, dy * h); c.lineTo(dx * u + (rnd() - .5) * u * .25, dy * h - u * (.08 + rnd() * .1)); c.stroke() } if (snow) for (const [dx, dy] of arms) { c.fillStyle = 'rgba(248,252,255,.9)'; c.beginPath(); c.ellipse(dx * u, dy * h, u * .06, u * .015, 0, 0, 6.283); c.fill() } return }
      const cy = -h * .7, rw = u * .48, rh = h * .32, cl = [];
      for (let i = 0; i < 30; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()); cl.push([Math.cos(a) * rw * d, cy + Math.sin(a) * rh * d, u * (.12 + rnd() * .07)]) }
      cl.sort((a, b) => a[1] - b[1]); for (const [lx, ly, r] of cl) leafClump(c, lx, ly, r, pal[Math.floor(rnd() * 2)], rnd, 1);
      for (let i = 0; i < 6; i++) { const [lx, ly, r] = cl[Math.floor(rnd() * cl.length)]; leafClump(c, lx - r * .25, ly - r * .45, r * .55, pal[2], rnd, .5) }
      if (sk === 'sygis') for (let i = 0; i < 6; i++) { c.fillStyle = '#6a4424'; c.beginPath(); c.ellipse((rnd() - .5) * u * .6, -h * (.45 + rnd() * .35), u * .015, u * .02, 0, 0, 6.283); c.fill() }
      if (snow) { c.fillStyle = 'rgba(248,252,255,.85)'; c.beginPath(); c.ellipse(0, cy - rh * .9, rw * .6, u * .06, 0, 0, 6.283); c.fill() }
    }
  });
}
function rockSprite(kind, size, gold, moss, snow, v, s) {
  return natSprite(`r|${kind}|${size}|${gold}|${moss}|${snow ? 1 : 0}|${v}`, s, (c, S0) => {
    const rnd = natRand(v * 7919 + size * 31 + (kind === 'goldvein' ? 5 : 0)), k = .55 + .45 * size / 8, rw = S0 * .32 * k, rh = S0 * .26 * k;
    const sh = c.createRadialGradient(0, 0, 0, 0, 0, rw * 1.3); sh.addColorStop(0, 'rgba(10,20,15,.45)'); sh.addColorStop(1, 'rgba(10,20,15,0)'); c.fillStyle = sh; c.beginPath(); c.ellipse(rw * .1, 0, rw * 1.25, rh * .35, 0, 0, 6.283); c.fill();
    // ebakorrapärane ümar rahn
    const pts = []; const n = 9; for (let i = 0; i < n; i++) { const a = Math.PI + i / (n - 1) * Math.PI, r = .85 + rnd() * .25; pts.push([Math.cos(a) * rw * r, -Math.abs(Math.sin(a)) * rh * 1.6 * r - rh * .05]) }
    c.beginPath(); c.moveTo(-rw, 0); for (let i = 0; i < pts.length; i++) { const [px, py] = pts[i], [qx, qy] = pts[Math.min(pts.length - 1, i + 1)]; c.quadraticCurveTo(px, py, (px + qx) / 2, (py + qy) / 2) } c.lineTo(rw, 0); c.quadraticCurveTo(0, rh * .25, -rw, 0); c.closePath();
    const g = c.createRadialGradient(-rw * .35, -rh * 1.3, rw * .1, 0, -rh * .5, rw * 1.3); g.addColorStop(0, '#d4d8d6'); g.addColorStop(.45, '#9aa09e'); g.addColorStop(1, '#5a6260');
    c.fillStyle = g; c.fill(); c.save(); c.clip();
    // tekstuur: täpid ja praod
    for (let i = 0; i < 40; i++) { c.fillStyle = rnd() < .5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.12)'; c.fillRect((rnd() - .5) * rw * 2, -rnd() * rh * 1.8, Math.max(1, S0 * .012), Math.max(1, S0 * .012)) }
    c.strokeStyle = 'rgba(40,44,42,.45)'; c.lineWidth = Math.max(.6, S0 * .01); for (let i = 0; i < 2; i++) { let x = (rnd() - .5) * rw, y = -rh * (1 + rnd() * .5); c.beginPath(); c.moveTo(x, y); for (let k2 = 0; k2 < 3; k2++) { x += (rnd() - .5) * rw * .4; y += rh * .3; c.lineTo(x, y) } c.stroke() }
    // varjus pool
    const g2 = c.createLinearGradient(-rw, 0, rw, 0); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.6, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = g2; c.fillRect(-rw, -rh * 2, rw * 2, rh * 2.3);
    if (moss && !snow) for (let i = 0; i < 5; i++) { const mx = (rnd() - .6) * rw, my = -rh * (1.2 + rnd() * .5); c.fillStyle = `rgba(${90 + rnd() * 30},${130 + rnd() * 30},${50},.75)`; c.beginPath(); c.ellipse(mx, my, rw * (.2 + rnd() * .15), rh * .15, 0, 0, 6.283); c.fill() }
    if (kind === 'goldvein') { for (let i = 0; i < 8; i++) { const gx = (rnd() - .5) * rw * 1.4, gy = -rh * (.3 + rnd() * 1.2); c.fillStyle = gold ? '#ffd24a' : '#7a6a40'; c.beginPath(); c.moveTo(gx, gy - S0 * .025); c.lineTo(gx + S0 * .02, gy); c.lineTo(gx, gy + S0 * .02); c.lineTo(gx - S0 * .02, gy); c.fill(); if (gold) { c.fillStyle = 'rgba(255,250,200,.8)'; c.fillRect(gx - S0 * .005, gy - S0 * .012, S0 * .008, S0 * .008) } } }
    c.restore();
    if (snow) { c.fillStyle = 'rgba(248,252,255,.95)'; c.beginPath(); c.ellipse(-rw * .1, -rh * 1.55, rw * .7, rh * .28, 0, 0, 6.283); c.fill() }
    // kivikesed ümber
    for (let i = 0; i < 3; i++) { const px = (rnd() < .5 ? -1 : 1) * rw * (1 + rnd() * .3), py = rnd() * rh * .15; c.fillStyle = '#8a908e'; c.beginPath(); c.ellipse(px, py, S0 * .025, S0 * .016, 0, 0, 6.283); c.fill() }
  });
}
function bushSprite(ripe, sk, snow, v, region, s) {
  return natSprite(`b|${ripe ? 1 : 0}|${sk}|${snow ? 1 : 0}|${v}|${region}`, s, (c, S0) => {
    const rnd = natRand(v * 4111 + 7), r = S0 * .33;
    const sh = c.createRadialGradient(0, 0, 0, 0, 0, r * 1.2); sh.addColorStop(0, 'rgba(10,25,15,.4)'); sh.addColorStop(1, 'rgba(10,25,15,0)'); c.fillStyle = sh; c.beginPath(); c.ellipse(r * .1, 0, r * 1.15, r * .3, 0, 0, 6.283); c.fill();
    const pal = { kevad: ['#3f8a3e', '#55a24a', '#7cc35c'], suvi: ['#2c6a34', '#3a8242', '#5aa452'], sygis: ['#9a4a2a', '#c06a2a', '#d8a040'], talv: null }[sk];
    if (!pal || snow) {
      c.strokeStyle = '#5a3a24'; c.lineWidth = Math.max(.6, S0 * .012); for (let i = 0; i < 9; i++) { const a = -Math.PI * (.15 + rnd() * .7); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * r * .5, Math.sin(a) * r * .5, Math.cos(a) * r * (.9 + rnd() * .3), Math.sin(a) * r * (.9 + rnd() * .3)); c.stroke() }
      if (snow) { c.fillStyle = 'rgba(248,252,255,.92)'; c.beginPath(); c.ellipse(0, -r * .7, r * .8, r * .22, 0, 0, 6.283); c.fill() }
      if (ripe && !snow) for (let i = 0; i < 5; i++) { const bx = (rnd() - .5) * r * 1.4, by = -r * (.3 + rnd() * .6); c.fillStyle = '#c8344f'; c.beginPath(); c.arc(bx, by, S0 * .03, 0, 6.283); c.fill() }
      return;
    }
    // lehtedest küngas
    const cl = []; for (let i = 0; i < 11; i++) { const a = Math.PI + rnd() * Math.PI, d = Math.sqrt(rnd()); cl.push([Math.cos(a) * r * .8 * d, -r * .35 + Math.sin(a) * r * .7 * d, r * (.28 + rnd() * .15)]) }
    cl.sort((a, b) => a[1] - b[1]); for (const [lx, ly, rr] of cl) leafClump(c, lx, ly, rr, pal[Math.floor(rnd() * 2)], rnd, .8);
    for (let i = 0; i < 4; i++) { const [lx, ly, rr] = cl[Math.floor(rnd() * cl.length)]; leafClump(c, lx - rr * .2, ly - rr * .4, rr * .5, pal[2], rnd, .4) }
    // marjad: mustikad ja vaarikad
    const n = ripe ? 12 : 6;
    for (let i = 0; i < n; i++) {
      const a = Math.PI + rnd() * Math.PI, d = .3 + rnd() * .65, bx = Math.cos(a) * r * .85 * d, by = -r * .35 + Math.sin(a) * r * .7 * d, rasp = (i % 3) === 0, br = S0 * (rasp ? .034 : .028);
      if (!ripe) { c.fillStyle = i % 2 ? '#b8d880' : '#f4f0e0'; c.beginPath(); c.arc(bx, by, br * .7, 0, 6.283); c.fill(); continue }
      if (rasp) { for (let k2 = 0; k2 < 5; k2++) { c.fillStyle = k2 % 2 ? '#d02a48' : '#e8405e'; c.beginPath(); c.arc(bx + Math.cos(k2 * 1.3) * br * .45, by + Math.sin(k2 * 1.3) * br * .45, br * .5, 0, 6.283); c.fill() } }
      else { const g = c.createRadialGradient(bx - br * .35, by - br * .35, br * .1, bx, by, br); g.addColorStop(0, '#8a8ae0'); g.addColorStop(.5, '#3a3a9a'); g.addColorStop(1, '#1e1e5a'); c.fillStyle = g; c.beginPath(); c.arc(bx, by, br, 0, 6.283); c.fill() }
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(bx - br * .3, by - br * .35, br * .22, 0, 6.283); c.fill();
    }
  });
}
function stumpSprite(v, snow, s) {
  return natSprite(`s|${v}|${snow ? 1 : 0}`, s, (c, S0) => {
    const rnd = natRand(v * 331), w = S0 * .14, h = S0 * .16;
    const sh = c.createRadialGradient(0, 0, 0, 0, 0, w * 2); sh.addColorStop(0, 'rgba(10,25,15,.4)'); sh.addColorStop(1, 'rgba(10,25,15,0)'); c.fillStyle = sh; c.beginPath(); c.ellipse(w * .2, 0, w * 1.8, h * .45, 0, 0, 6.283); c.fill();
    const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, '#8a5a34'); g.addColorStop(.5, '#6b4528'); g.addColorStop(1, '#3e2614'); c.fillStyle = g;
    c.beginPath(); c.moveTo(-w * 1.25, 0); c.quadraticCurveTo(-w, -h * .3, -w, -h); c.lineTo(w, -h); c.quadraticCurveTo(w, -h * .3, w * 1.3, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,15,5,.5)'; c.lineWidth = Math.max(.5, S0 * .008); for (let i = 0; i < 4; i++) { const x = -w * .7 + i * w * .45; c.beginPath(); c.moveTo(x, -h * .95); c.lineTo(x + (rnd() - .5) * w * .2, -h * .1); c.stroke() }
    c.fillStyle = snow ? '#f4f8fa' : '#e0b27a'; c.beginPath(); c.ellipse(0, -h, w, w * .42, 0, 0, 6.283); c.fill();
    if (!snow) { c.strokeStyle = 'rgba(140,90,40,.6)'; for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(rnd() * w * .1, -h, w * i / 4, w * .42 * i / 4, 0, 0, 6.283); c.stroke() } if (rnd() < .6) { c.fillStyle = 'rgba(100,140,60,.8)'; c.beginPath(); c.ellipse(-w * .9, -h * .3, w * .35, h * .25, 0, 0, 6.283); c.fill() } }
  });
}
{
  const _dt = drawTile;
  drawTile = function (c, t, px, py, s, night) {
    const kind = t.t; if (kind !== 'tree' && kind !== 'rock' && kind !== 'goldvein' && kind !== 'bush' && kind !== 'stump') return _dt(c, t, px, py, s, night);
    const tx = Math.round(px / s), ty = Math.round(py / s), v = Math.abs((tx * 73856093) ^ (ty * 19349663)) % 4, x = px + s / 2, y = py + s * .86;
    const sk = S && S.time !== undefined ? season().k : 'suvi', snowy = S && (S.weather.t === 'lumi' || sk === 'talv' || (REGIONS[S.view] || {}).snowy);
    if (kind === 'tree') { const sway = Math.sin(tnow * 1.3 + px * .02 + py * .01) * (S.weather.t === 'vihm' ? 1.8 : S.weather.t === 'torm' ? 3 : 1); natBlit(c, treeSprite(t.k, t.s, sk, snowy, v, s), x + (th(tx, ty, 5) - .5) * s * .12, y, s, -sway * .018 * (t.s / 3)); return }
    if (kind === 'rock' || kind === 'goldvein') {
      const moss = ['pime', 'iidne', 'raba', 'org'].includes(S.view);
      natBlit(c, rockSprite(kind, kind === 'rock' ? t.c : 8, t.c > 0, moss, snowy, v, s), x, y, s, 0);
      if (kind === 'goldvein' && t.c > 0 && Math.sin(tnow * 3 + px) > .75) { c.save(); c.globalCompositeOperation = 'lighter'; circ(c, x + s * .08, y - s * .2, s * .05, 'rgba(255,240,180,.9)'); c.restore() }
      return;
    }
    if (kind === 'bush') { natBlit(c, bushSprite(t.ripe, sk, snowy, v, S.view, s), x, y, s, Math.sin(tnow * 1.1 + px * .03) * .01); return }
    if (kind === 'stump') { natBlit(c, stumpSprite(v, snowy, s), x, y, s, 0); return }
  };
  const _tr = drawTree;
  // istutamise eelvaade ja muud kohad kasutavad ka uut puud
  drawTree = function (c, kind, stage, x, y, s, sway) { const sk = S && S.time !== undefined ? season().k : 'suvi', snowy = S && S.weather && (S.weather.t === 'lumi' || sk === 'talv'); natBlit(c, treeSprite(kind, stage, sk, snowy, 1, s), x, y, s, -(sway || 0) * .018 * (stage / 3)) };
}
