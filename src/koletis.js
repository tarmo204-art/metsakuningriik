/* =====================================================================
   Järvekoletis: Kalatunni bossikala joonistatakse käsitsi – soomustatud madujas kehaga
   süvaveekoletis, lõugadega mis avanevad, helendav peibutis, ogaline seljauim, punased silmad.
   Reageerib löökidele (raputus, punane välgatus, kahju numbrid), raevub kui elusid on vähe,
   alistatuna hõljub kõhuli pinnale. Asendab kalapuuk.js ktPaint-i.
   ===================================================================== */
document.head.insertAdjacentHTML('beforeend', `<style>
.kt-boss canvas{height:270px}
.kt-boss{border-color:rgba(255,90,60,.45);box-shadow:0 0 0 1px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.45)}
.kt-boss .bn{font-size:22px;letter-spacing:.02em;color:#ffcfb0;text-shadow:0 0 14px rgba(255,60,30,.65),0 2px 6px #000}
.kt-boss.rage .bn{animation:ktRage 1.1s ease-in-out infinite}
@keyframes ktRage{50%{color:#ff7a5a;text-shadow:0 0 22px rgba(255,40,20,.95),0 2px 6px #000}}
@media (max-width:520px){.kt-boss canvas{height:220px}}
@media (prefers-reduced-motion:reduce){.kt-boss.rage .bn{animation:none}}
</style>`);

const KO = { hits: [], last: null, hitT: -9, snow: null, fry: null };

function koPaint(root) {
  const cv2 = root.querySelector('#ktBossCv'); if (KT.anim) { clearInterval(KT.anim); KT.anim = null } if (!cv2) return;
  const box = cv2.closest('.kt-boss');
  const w = cv2.clientWidth || 600, h = cv2.clientHeight || 270, dpr = Math.min(2, devicePixelRatio || 1) * 1.5; cv2.width = w * dpr; cv2.height = h * dpr;
  const c = cv2.getContext('2d');
  const B = KT.d && KT.d.boss, dead = !!(B && B.killed_at), frac = B ? Math.max(0, B.hp / Math.max(1, B.max_hp)) : 1, rage = !dead && frac < .35;
  if (box) box.classList.toggle('rage', rage);
  // löök: elud vähenesid võrreldes eelmise joonistusega
  const now = performance.now() / 1000;
  if (B && KO.last != null && B.hp < KO.last) { KO.hits.push({ n: KO.last - B.hp, t0: now, x: Math.random() }); KO.hitT = now; if (KO.hits.length > 6) KO.hits.shift() }
  KO.last = B ? B.hp : null;
  if (!KO.snow) KO.snow = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.6, v: .004 + Math.random() * .012, p: Math.random() * 6 }));
  if (!KO.fry) KO.fry = Array.from({ length: 7 }, (_, i) => ({ x: Math.random(), y: .15 + Math.random() * .7, s: .6 + Math.random() * .6, v: .05 + Math.random() * .06, p: i }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const draw = () => {
    if (!cv2.isConnected) { clearInterval(KT.anim); KT.anim = null; return }
    const t = reduce ? 1 : performance.now() / 1000, sp = rage ? 1.6 : 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // raputus löögi järel
    const hk = Math.max(0, 1 - (t - KO.hitT) / .45);
    if (hk > 0 && !reduce) c.translate((Math.random() - .5) * 10 * hk, (Math.random() - .5) * 6 * hk);
    koWater(c, w, h, t, dead, rage);
    // koletis
    const L = Math.min(w * .78, h * 1.9), dir = dead ? 1 : (Math.cos(t * .18) > -0.2 ? 1 : -1);
    let x = w / 2 + Math.sin(t * .35 * sp) * w * .07, y = h * .5 + Math.sin(t * .8 * sp) * 7;
    if (dead) { x = w / 2 + Math.sin(t * .2) * 6; y = h * .3 + Math.sin(t * .6) * 3 }
    c.save(); c.translate(x, y); c.scale(dir, 1);
    if (dead) { c.scale(1, -1); c.rotate(.06); c.filter = 'grayscale(.75) brightness(.85)' }
    koMonster(c, L, t * sp, dead, rage, hk);
    c.restore(); c.filter = 'none';
    // kahju numbrid
    for (const k of KO.hits) {
      const a = t - k.t0; if (a > 1.6) continue;
      c.globalAlpha = Math.max(0, 1 - a / 1.6); c.font = `900 ${20 + Math.min(14, k.n / 40)}px system-ui`; c.textAlign = 'center';
      c.lineWidth = 4; c.strokeStyle = 'rgba(40,0,0,.85)'; const tx = w * (.35 + k.x * .3), ty = h * .38 - a * 40;
      c.strokeText('−' + fmt(k.n), tx, ty); c.fillStyle = '#ff6a4a'; c.fillText('−' + fmt(k.n), tx, ty); c.globalAlpha = 1;
    }
    // punane välgatus
    if (hk > 0) { c.fillStyle = `rgba(255,40,20,${.22 * hk})`; c.fillRect(-20, -20, w + 40, h + 40) }
    // vinjett
    const vg = c.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, rage ? 'rgba(40,0,0,.7)' : 'rgba(0,0,0,.65)');
    c.fillStyle = vg; c.fillRect(-20, -20, w + 40, h + 40);
  };
  draw(); if (!reduce) KT.anim = setInterval(draw, 40);
}

function koWater(c, w, h, t, dead, rage) {
  const g = c.createLinearGradient(0, 0, 0, h);
  if (dead) { g.addColorStop(0, '#2c4a52'); g.addColorStop(1, '#0a161c') }
  else { g.addColorStop(0, '#0b3142'); g.addColorStop(.55, '#06202c'); g.addColorStop(1, '#020a10') }
  c.fillStyle = g; c.fillRect(-20, -20, w + 40, h + 40);
  if (rage) { c.fillStyle = `rgba(120,10,10,${.12 + .1 * Math.sin(t * 3)})`; c.fillRect(-20, -20, w + 40, h + 40) }
  // valgusvihud pinnalt
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x0 = w * (.08 + i * .22) + Math.sin(t * .25 + i * 1.7) * 26, lg = c.createLinearGradient(0, 0, 0, h * .9);
    lg.addColorStop(0, `rgba(120,210,235,${dead ? .2 : .11})`); lg.addColorStop(1, 'rgba(120,210,235,0)'); c.fillStyle = lg;
    c.beginPath(); c.moveTo(x0 - 12, 0); c.lineTo(x0 + 22, 0); c.lineTo(x0 + 110, h); c.lineTo(x0 + 30, h); c.closePath(); c.fill();
  }
  // pinna virvendus
  c.strokeStyle = 'rgba(170,230,250,.18)'; c.lineWidth = 1;
  for (let i = 0; i < 9; i++) { const yy = 4 + i * 3; c.beginPath(); for (let x = 0; x <= w; x += 12) c.lineTo(x, yy + Math.sin(x * .04 + t * 1.5 + i) * 1.4); c.stroke() }
  c.restore();
  // kauge varjuline kala
  c.fillStyle = 'rgba(0,0,0,.25)'; const fx = ((t * 14) % (w + 300)) - 150;
  c.beginPath(); c.ellipse(w - fx, h * .22, 46, 9, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(w - fx + 44, h * .22); c.lineTo(w - fx + 62, h * .22 - 10); c.lineTo(w - fx + 62, h * .22 + 10); c.fill();
  // põhjataimed ja kivid
  for (let i = 0; i < 18; i++) {
    const bx = (i / 17) * w + Math.sin(i * 7.3) * 14, bh = h * (.14 + ((i * 37) % 10) / 45), sw = Math.sin(t * .9 + i) * 8;
    c.strokeStyle = i % 3 ? 'rgba(14,44,30,.95)' : 'rgba(26,62,38,.9)'; c.lineWidth = 3 + (i % 3);
    c.beginPath(); c.moveTo(bx, h + 2); c.quadraticCurveTo(bx + sw * .4, h - bh * .5, bx + sw, h - bh); c.stroke();
  }
  c.fillStyle = '#071410'; c.beginPath(); c.moveTo(-20, h + 20);
  for (let x = -20; x <= w + 20; x += 20) c.lineTo(x, h - 8 - Math.abs(Math.sin(x * .021)) * 12); c.lineTo(w + 20, h + 20); c.fill();
  // hõljuvad osakesed
  for (const s of KO.snow) {
    s.y += s.v / 25 * (dead ? -0.6 : 1); if (s.y > 1.02) { s.y = -.02; s.x = Math.random() } if (s.y < -.02) { s.y = 1.02 }
    c.fillStyle = `rgba(200,230,220,${.18 + .15 * Math.sin(t + s.p)})`; c.beginPath(); c.arc(s.x * w + Math.sin(t * .5 + s.p) * 6, s.y * h, s.r, 0, 6.283); c.fill();
  }
  // väikesed kalad põgenevad
  if (!dead) for (const f of KO.fry) {
    const fx2 = ((f.x + t * f.v) % 1.2 - .1) * w, fy = f.y * h + Math.sin(t * 3 + f.p) * 3, s = 7 * f.s;
    c.fillStyle = 'rgba(160,200,200,.45)'; c.beginPath(); c.ellipse(fx2, fy, s, s * .38, 0, 0, 6.283); c.fill();
    c.beginPath(); c.moveTo(fx2 - s * .9, fy); c.lineTo(fx2 - s * 1.5, fy - s * .4); c.lineTo(fx2 - s * 1.5, fy + s * .4); c.fill();
  }
}

// koletis: lokaalsed koordinaadid, nina paremal (+x), keha keskpunkt 0,0
function koMonster(c, L, t, dead, rage, hk) {
  const N = 44;
  const th = u => u < .8 ? L * (.022 + .155 * Math.pow(Math.sin(Math.PI * .5 * Math.min(1, u / .8)), 1.25)) : L * (.177 - (u - .8) / .2 * .06);
  const amp = dead ? 0 : L * .055;
  const sp = u => [(-.56 + u * .82) * L, amp * Math.pow(1 - u, 1.4) * Math.sin(t * 2.3 - u * 5.2)];
  const P = [], T = [], Bt = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N * .82, [px, py] = sp(u), [qx, qy] = sp(u + .01), dx = qx - px, dy = qy - py, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, r = th(u);
    P.push([px, py, nx, ny, r, u]); T.push([px - nx * r, py - ny * r]); Bt.push([px + nx * r, py + ny * r]);
  }
  const at = (u, v) => { const i = Math.max(0, Math.min(N, Math.round(u / .82 * N))), p = P[i]; return [p[0] + p[2] * p[4] * v, p[1] + p[3] * p[4] * v] };
  const hinge = P[N], hx = hinge[0], hy = hinge[1], ha = Math.atan2(hinge[3], hinge[2]) - Math.PI / 2;

  // varjuline helendus koletise ümber
  const gl = c.createRadialGradient(0, 0, L * .1, 0, 0, L * .75);
  gl.addColorStop(0, dead ? 'rgba(0,0,0,0)' : rage ? 'rgba(255,40,20,.28)' : 'rgba(255,90,40,.16)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gl; c.fillRect(-L, -L * .7, L * 2, L * 1.4);

  // sabauim (rebenenud)
  { const [tx, ty] = sp(0), sw = dead ? 0 : Math.sin(t * 2.3) * .25;
    c.save(); c.translate(tx, ty); c.rotate(sw);
    const tg = c.createLinearGradient(0, 0, -L * .2, 0); tg.addColorStop(0, '#2a1a18'); tg.addColorStop(1, 'rgba(120,30,24,.75)'); c.fillStyle = tg;
    c.beginPath(); c.moveTo(L * .02, -L * .02);
    const rag = [[-.1, -.17], [-.13, -.13], [-.17, -.19], [-.16, -.09], [-.12, -.03], [-.16, .02], [-.12, .06], [-.17, .12], [-.12, .11], [-.15, .19], [-.08, .15]];
    for (const [a, b] of rag) c.lineTo(a * L, b * L); c.lineTo(L * .02, L * .02); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.2; for (const [a, b] of rag) { c.beginPath(); c.moveTo(0, 0); c.lineTo(a * L * .95, b * L * .95); c.stroke() }
    c.restore() }

  // seljauim: teravad ogad ja punakas nahk nende vahel
  { const tips = []; for (let u = .22; u <= .76; u += .045) { const i = Math.round(u / .82 * N), p = P[i], len = L * (.07 + .05 * Math.sin((u - .22) / .54 * Math.PI)) * (1 + (dead ? 0 : .08 * Math.sin(t * 3 + u * 9))); tips.push([T[i][0] - p[2] * len - L * .025, T[i][1] - p[3] * len, T[i][0], T[i][1]]) }
    c.fillStyle = rage ? 'rgba(150,20,16,.75)' : 'rgba(110,26,22,.62)'; c.beginPath(); c.moveTo(tips[0][2], tips[0][3]);
    tips.forEach((q, k) => { c.lineTo(q[0], q[1]); if (k < tips.length - 1) { const n2 = tips[k + 1]; c.quadraticCurveTo((q[0] + n2[0]) / 2, (q[1] + n2[1]) / 2 + L * .04, n2[0], n2[1]) } });
    c.lineTo(tips[tips.length - 1][2], tips[tips.length - 1][3]); c.closePath(); c.fill();
    for (const q of tips) { const bw = L * .009, sg2 = c.createLinearGradient(q[2], q[3], q[0], q[1]); sg2.addColorStop(0, '#2a2018'); sg2.addColorStop(.6, '#8a7a60'); sg2.addColorStop(1, '#f2e6c8');
      c.fillStyle = sg2; c.beginPath(); c.moveTo(q[2] - bw, q[3] + 2); c.quadraticCurveTo((q[0] + q[2]) / 2 + L * .01, (q[1] + q[3]) / 2, q[0], q[1]); c.lineTo(q[2] + bw, q[3] + 2); c.closePath(); c.fill() } }

  // kõhu-uim
  { const [ax, ay] = at(.5, 1); c.fillStyle = 'rgba(100,30,24,.6)'; c.beginPath(); c.moveTo(ax - L * .05, ay - 2); c.lineTo(ax - L * .1, ay + L * .08); c.lineTo(ax + L * .02, ay + L * .05); c.lineTo(ax + L * .04, ay - 2); c.fill() }

  // keha
  c.beginPath(); c.moveTo(T[0][0], T[0][1]); for (const q of T) c.lineTo(q[0], q[1]); for (let i = N; i >= 0; i--) c.lineTo(Bt[i][0], Bt[i][1]); c.closePath();
  const bg = c.createLinearGradient(0, -L * .2, 0, L * .2);
  bg.addColorStop(0, '#121c18'); bg.addColorStop(.35, '#24332a'); bg.addColorStop(.62, '#3c4630'); bg.addColorStop(1, '#8a7a56');
  c.fillStyle = bg; c.fill();
  c.save(); c.clip();
  // soomused keha kaarte järgi
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(.8, L * .003);
  for (let i = 2; i < N; i += 2) for (let v = -.85; v <= .85; v += .28) {
    const p = P[i], r = p[4], ox = p[0] + p[2] * r * v + ((i / 2) % 2 ? 0 : r * .0), oy = p[1] + p[3] * r * v, s = r * .2 + L * .006;
    c.beginPath(); c.arc(ox, oy, s, -Math.PI * .5, Math.PI * .5); c.stroke();
  }
  // luuplaadid seljal
  for (let k = 0; k < 12; k++) { const [px2, py2] = at(.14 + k * .053, -.78), r2 = L * .016;
    c.fillStyle = '#3e3a2c'; c.beginPath(); c.moveTo(px2 - r2, py2); c.lineTo(px2, py2 - r2 * .7); c.lineTo(px2 + r2, py2); c.lineTo(px2, py2 + r2 * .7); c.closePath(); c.fill();
    c.fillStyle = 'rgba(230,220,190,.25)'; c.beginPath(); c.moveTo(px2 - r2 * .6, py2); c.lineTo(px2, py2 - r2 * .45); c.lineTo(px2 + r2 * .2, py2 - r2 * .1); c.closePath(); c.fill() }
  // lõpusekaas ogadega
  { const [g1x, g1y] = at(.79, -.85), [g2x, g2y] = at(.75, .2), [g3x, g3y] = at(.79, .9);
    c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = Math.max(2, L * .008); c.beginPath(); c.moveTo(g1x, g1y); c.quadraticCurveTo(g2x - L * .02, g2y, g3x, g3y); c.stroke();
    c.strokeStyle = 'rgba(140,40,30,.7)'; c.lineWidth = Math.max(1, L * .004); c.beginPath(); c.moveTo(g1x - L * .008, g1y + L * .01); c.quadraticCurveTo(g2x - L * .028, g2y, g3x - L * .008, g3y - L * .01); c.stroke() }
  // tumedad laigud seljal
  c.fillStyle = 'rgba(0,0,0,.28)'; for (let k = 0; k < 9; k++) { const [sx2, sy2] = at(.15 + k * .07, -.55 + (k % 3) * .2); c.beginPath(); c.ellipse(sx2, sy2, L * .018, L * .011, 0, 0, 6.283); c.fill() }
  // armid
  c.strokeStyle = 'rgba(230,200,170,.45)'; c.lineWidth = Math.max(1, L * .004);
  for (const [u0, v0] of [[.38, -.3], [.55, .1], [.66, -.55]]) { const [a1, b1] = at(u0, v0), [a2, b2] = at(u0 + .07, v0 + .25); c.beginPath(); c.moveTo(a1, b1); c.lineTo((a1 + a2) / 2 + L * .008, (b1 + b2) / 2 - L * .01); c.lineTo(a2, b2); c.stroke() }
  // raevu punased sooned
  if (rage) { c.strokeStyle = `rgba(255,50,30,${.35 + .3 * Math.sin(t * 6)})`; c.lineWidth = Math.max(1, L * .004);
    for (let k = 0; k < 6; k++) { c.beginPath(); let [a1, b1] = at(.2 + k * .1, -.2); c.moveTo(a1, b1); for (let s2 = 1; s2 < 5; s2++) { const [a2, b2] = at(.2 + k * .1 + s2 * .02, -.2 + Math.sin(k + s2) * .4); c.lineTo(a2, b2) } c.stroke() } }
  // löögi valgus
  if (hk > 0) { c.fillStyle = `rgba(255,70,50,${.28 * hk})`; c.fillRect(-L, -L, L * 2, L * 2) }
  c.restore();
  // külgjoone helendavad täpid
  if (!dead) { c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 13; k++) { const u = .14 + k * .05, [lx, ly] = at(u, .1), a = .45 + .4 * Math.sin(t * 3 - k * .7), r = L * .0055;
      const g2 = c.createRadialGradient(lx, ly, 0, lx, ly, r * 3.2); g2.addColorStop(0, `rgba(150,255,235,${a})`); g2.addColorStop(.35, `rgba(90,230,210,${a * .45})`); g2.addColorStop(1, 'rgba(90,230,210,0)'); c.fillStyle = g2; c.beginPath(); c.arc(lx, ly, r * 3.2, 0, 6.283); c.fill() }
    c.restore() }
  c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(T[0][0], T[0][1]); for (const q of T) c.lineTo(q[0], q[1]); c.stroke();

  // rinnauim (lehvib)
  { const [fx, fy] = at(.66, .35), fl = dead ? .3 : Math.sin(t * 3.2) * .35;
    c.save(); c.translate(fx, fy); c.rotate(.5 + fl);
    const fg = c.createLinearGradient(0, 0, -L * .14, L * .08); fg.addColorStop(0, '#3a2a22'); fg.addColorStop(1, 'rgba(140,40,30,.55)'); c.fillStyle = fg;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-L * .06, L * .1, -L * .16, L * .07); c.lineTo(-L * .12, L * .03); c.lineTo(-L * .15, -L * .005); c.quadraticCurveTo(-L * .07, -L * .02, 0, 0); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-L * (.15 - k * .004), L * (.07 - k * .018)); c.stroke() }
    c.restore() }

  // PEA: kolju ja lõualuu pöörduvad liigendi ümber
  c.save(); c.translate(hx, hy); c.rotate(ha);
  const open = dead ? .25 : rage ? .3 + .18 * Math.max(0, Math.sin(t * 2.4)) : .14 + .17 * Math.max(0, Math.sin(t * 1.3));
  const H0 = th(.82) / L;
  // kurgu sisemus
  c.fillStyle = '#3a0608'; c.beginPath(); c.moveTo(-L * .01, 0); c.lineTo(L * .2, -L * .012);
  c.lineTo(L * .2 * Math.cos(open), L * .2 * Math.sin(open) + L * .012); c.closePath(); c.fill();
  const tg2 = c.createRadialGradient(L * .04, L * .02, 0, L * .04, L * .02, L * .12); tg2.addColorStop(0, rage ? 'rgba(255,60,30,.6)' : 'rgba(200,30,20,.35)'); tg2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = tg2; c.beginPath(); c.arc(L * .04, L * .02, L * .12, 0, 6.283); c.fill();
  // alalõug
  c.save(); c.rotate(open);
  const jg = c.createLinearGradient(0, 0, 0, L * H0); jg.addColorStop(0, '#2e2a1e'); jg.addColorStop(.6, '#5a5038'); jg.addColorStop(1, '#7a6a4a'); c.fillStyle = jg;
  c.beginPath(); c.moveTo(-L * .005, L * .01); c.lineTo(L * .215, L * .006); c.quadraticCurveTo(L * .22, L * .05, L * .17, L * .085);
  c.quadraticCurveTo(L * .08, L * (H0 + .01), -L * .01, L * H0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.2; c.stroke();
  // alumised hambad
  c.fillStyle = '#efe6cf'; c.strokeStyle = 'rgba(60,40,20,.6)'; c.lineWidth = .8;
  for (let k = 0; k < 9; k++) { const x0 = L * (.025 + k * .021), len = L * (k === 7 ? .05 : k % 2 ? .022 : .032);
    c.beginPath(); c.moveTo(x0 - L * .007, L * .008); c.lineTo(x0 + L * .002, L * .008 - len); c.lineTo(x0 + L * .008, L * .008); c.closePath(); c.fill(); c.stroke() }
  // poised
  c.strokeStyle = '#2a201a'; c.lineWidth = Math.max(1.5, L * .006); c.lineCap = 'round';
  for (const s2 of [0, 1]) { const ph = dead ? 0 : Math.sin(t * 1.7 + s2 * 2); c.beginPath(); c.moveTo(L * (.16 - s2 * .03), L * .07);
    c.bezierCurveTo(L * (.12 - s2 * .03), L * (.16 + ph * .02), L * (.02 - s2 * .02), L * (.2 + ph * .04), -L * (.06 + s2 * .03), L * (.22 + ph * .05)); c.stroke() }
  c.lineCap = 'butt';
  c.restore();
  // kolju
  const sg = c.createLinearGradient(0, -L * H0, 0, 0); sg.addColorStop(0, '#0e1612'); sg.addColorStop(1, '#3a4430'); c.fillStyle = sg;
  c.beginPath(); c.moveTo(-L * .012, -L * H0); c.quadraticCurveTo(L * .12, -L * (H0 + .015), L * .2, -L * .07); c.quadraticCurveTo(L * .235, -L * .03, L * .22, L * .004);
  c.lineTo(-L * .012, L * .012); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.2; c.stroke();
  // kolju muhud ja sarvjad kühmud
  c.fillStyle = '#2a3226'; for (let k = 0; k < 4; k++) { const bx = L * (.03 + k * .04), by = -L * (H0 - .01 - k * .025); c.beginPath(); c.moveTo(bx - L * .012, by + L * .008); c.lineTo(bx, by - L * .022); c.lineTo(bx + L * .012, by + L * .008); c.fill() }
  // ülemised hambad (eest pikad kihvad)
  c.fillStyle = '#f4ecd6'; c.strokeStyle = 'rgba(60,40,20,.6)'; c.lineWidth = .8;
  for (let k = 0; k < 10; k++) { const x0 = L * (.015 + k * .02), len = L * (k >= 8 ? .062 : k === 5 ? .045 : k % 2 ? .024 : .034);
    c.beginPath(); c.moveTo(x0 - L * .007, L * .002); c.quadraticCurveTo(x0 - L * .002, L * .002 + len * .6, x0 + L * .002, L * .002 + len); c.lineTo(x0 + L * .008, L * .002); c.closePath(); c.fill(); c.stroke() }
  // silm
  { const ex = L * .085, ey = -L * .075, er = L * .028;
    if (dead) { c.strokeStyle = '#ddd'; c.lineWidth = Math.max(2, L * .008); c.beginPath(); c.moveTo(ex - er, ey - er); c.lineTo(ex + er, ey + er); c.moveTo(ex + er, ey - er); c.lineTo(ex - er, ey + er); c.stroke() }
    else {
      c.save(); c.globalCompositeOperation = 'lighter'; const eg = c.createRadialGradient(ex, ey, 0, ex, ey, er * (rage ? 5 : 3.5)); eg.addColorStop(0, rage ? 'rgba(255,60,20,.75)' : 'rgba(255,120,30,.5)'); eg.addColorStop(1, 'rgba(255,60,20,0)'); c.fillStyle = eg; c.beginPath(); c.arc(ex, ey, er * 5, 0, 6.283); c.fill(); c.restore();
      c.fillStyle = '#0a0404'; c.beginPath(); c.arc(ex, ey, er * 1.15, 0, 6.283); c.fill();
      const ig = c.createRadialGradient(ex - er * .3, ey - er * .3, 0, ex, ey, er); ig.addColorStop(0, '#ffe08a'); ig.addColorStop(.5, rage ? '#ff3a12' : '#ff7a1a'); ig.addColorStop(1, '#6a0a04'); c.fillStyle = ig; c.beginPath(); c.arc(ex, ey, er, 0, 6.283); c.fill();
      const blink = Math.sin(t * .7) > .985 ? .15 : 1;
      c.fillStyle = '#000'; c.beginPath(); c.ellipse(ex + er * .1, ey, er * .2, er * .85 * blink, 0, 0, 6.283); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ex - er * .35, ey - er * .4, er * .18, 0, 6.283); c.fill();
      // kortsus kulm silma kohal
      c.strokeStyle = '#05080a'; c.lineWidth = Math.max(2, L * .009); c.beginPath(); c.moveTo(ex - er * 1.6, ey - er * 1.5); c.lineTo(ex + er * 1.4, ey - er * .9); c.stroke();
    } }
  // peibutis: vars otsaesiselt ja helendav pirn
  { const bob = dead ? 0 : Math.sin(t * 2.1) * L * .015, bx = L * .27, by = -L * .2 + bob;
    c.strokeStyle = '#1a201a'; c.lineWidth = Math.max(1.5, L * .006); c.beginPath(); c.moveTo(L * .06, -L * (H0 - .005)); c.bezierCurveTo(L * .09, -L * .3, L * .22, -L * .31, bx, by - L * .018); c.stroke();
    if (!dead) { c.save(); c.globalCompositeOperation = 'lighter'; const pulse = .7 + .3 * Math.sin(t * 4);
      const lg2 = c.createRadialGradient(bx, by, 0, bx, by, L * .16); lg2.addColorStop(0, `rgba(210,255,140,${.55 * pulse})`); lg2.addColorStop(.3, `rgba(140,255,170,${.2 * pulse})`); lg2.addColorStop(1, 'rgba(120,255,160,0)');
      c.fillStyle = lg2; c.beginPath(); c.arc(bx, by, L * .16, 0, 6.283); c.fill(); c.restore() }
    c.fillStyle = dead ? '#556' : '#f0ffb0'; c.beginPath(); c.arc(bx, by, L * .016, 0, 6.283); c.fill() }
  c.restore();
}
ktPaint = koPaint;
