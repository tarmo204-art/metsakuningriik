/* =====================================================================
   Kalapüügi stseeni elavaks: ilm (pilv, vihmaringid, äike välguga, udupangad, päikese sätendus),
   koidu- ja õhtuvalgus, aastaajad (lumi, rändlinnud, kiilid, langevad lehed, kajakad),
   öö (kuu peegeldus, tulikärbsed, lõke kaugel kaldal) ja haruldase kala väljatõmbamise hetk
   (veekroon, harulduse värvi sädemejälg, legendaarse kala välgatus ja kullasadu).
   Kõik on ainult välimus – mängu reegleid see ei muuda.
   ===================================================================== */
const ST = { rip: [], bolt: null, nextBolt: 0, flash: 0, leapT0: 0, spark: [], glit: [], birdT: 0, landed: false };
const ST_SEA = ['meri', 'saarestik', 'avameri', 'sugavik'];
function stSeason() { const m = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Tallinn' })).getMonth() + 1; return m === 12 || m <= 2 ? 'talv' : m <= 5 ? 'kevad' : m <= 8 ? 'suvi' : 'sügis' }
function stH(i, k) { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x) }
const stReduce = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

{
  const _bd = drawBackdrop;
  drawBackdrop = function (c, w, h, t, night, d, wTop, wBot) {
    _bd(c, w, h, t, night, d, wTop, wBot);
    try { stLayer(c, w, h, t, night) } catch (e) { }
  };
  const _fx = drawFx;
  drawFx = function (c, w, h, dt, t) {
    try { stCatch(c, w, h, dt, t) } catch (e) { }
    _fx(c, w, h, dt, t);
    try { stCatchTop(c, w, h, dt) } catch (e) { }
  };
}

function stLayer(c, w, h, t, night) {
  if (!FS) return;
  const wx = FS.weather || 'paike', spot = FV.spot || 'metsajarv', sea = ST_SEA.includes(spot), wl = h * .32, season = stSeason(), red = stReduce();
  const dp = FS.daypart || '', kuma = typeof kumaOn === 'function' && kumaOn();
  c.save();
  // --- pilv, vihm ja torm teevad taeva ja vee tumedamaks ---
  const dim = { pilves: .16, vihm: .3, torm: .48, udu: .06 }[wx] || 0;
  const sky = { pilves: [150, 160, 172, .38], vihm: [96, 106, 120, .58], torm: [44, 52, 66, .74], udu: [200, 206, 208, .3] }[wx];
  if (sky) { const g = c.createLinearGradient(0, 0, 0, wl + 2); g.addColorStop(0, `rgba(${sky[0]},${sky[1]},${sky[2]},${sky[3]})`); g.addColorStop(1, `rgba(${sky[0] + 30},${sky[1] + 30},${sky[2] + 30},${sky[3] * .75})`); c.fillStyle = g; c.fillRect(0, 0, w, wl + 2);
    if (wx === 'vihm' || wx === 'torm') { c.fillStyle = wx === 'torm' ? 'rgba(30,36,46,.55)' : 'rgba(80,88,100,.45)'; for (let i = 0; i < 7; i++) { const x = ((i * 190 + t * (wx === 'torm' ? 16 : 6)) % (w + 300)) - 150, y = wl * (.12 + (i % 3) * .14); c.beginPath(); c.ellipse(x, y, 130, 26, 0, 0, 6.283); c.ellipse(x + 60, y + 8, 90, 20, 0, 0, 6.283); c.fill() } } }
  if (dim) { c.globalCompositeOperation = 'multiply'; const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(110,120,134,${dim})`); g.addColorStop(.32, `rgba(120,130,140,${dim * .9})`); g.addColorStop(1, `rgba(90,100,110,${dim * .6})`); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over' }
  // --- koit ja õhtu ---
  if (!night && !kuma && (dp === 'hommik' || dp === 'õhtu') && (wx === 'paike' || wx === 'pilves')) {
    const eve = dp === 'õhtu', sx = eve ? w * .82 : w * .16;
    c.globalCompositeOperation = 'screen';
    const g = c.createLinearGradient(0, 0, 0, wl); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, eve ? 'rgba(255,140,90,.35)' : 'rgba(255,190,170,.32)'); c.fillStyle = g; c.fillRect(0, 0, w, wl);
    const s = c.createRadialGradient(sx, wl, 0, sx, wl, h * .5); s.addColorStop(0, eve ? 'rgba(255,170,90,.55)' : 'rgba(255,214,180,.5)'); s.addColorStop(1, 'rgba(255,150,90,0)'); c.fillStyle = s; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { const y = wl + 5 + i * (h - wl) / 9, ww = w * .04 * (1 - i / 11) * (1 + .3 * Math.sin(t * 2 + i)); c.fillStyle = eve ? `rgba(255,190,120,${.35 - i * .035})` : `rgba(255,220,200,${.3 - i * .03})`; c.beginPath(); c.ellipse(sx + Math.sin(t + i) * 3, y, ww, 1.5 + i * .2, 0, 0, 6.283); c.fill() }
    c.globalCompositeOperation = 'source-over';
  }
  // --- päikese sätendus veel ---
  if (wx === 'paike' && !night && !red) {
    for (let i = 0; i < 22; i++) { const x = stH(i, 1) * w, y = wl + 8 + stH(i, 2) * (h - wl - 14), a = Math.max(0, Math.sin(t * (1.5 + stH(i, 3) * 2) + i * 2)); if (a < .55) continue;
      const r = 1.5 + (a - .55) * 7; c.fillStyle = `rgba(255,255,240,${(a - .55) * 2})`; c.beginPath(); c.moveTo(x - r, y); c.lineTo(x, y - r * .35); c.lineTo(x + r, y); c.lineTo(x, y + r * .35); c.closePath(); c.fill(); c.fillRect(x - .6, y - r * .9, 1.2, r * 1.8) }
  }
  // --- kuu peegeldus ---
  if (night && wx !== 'torm') {
    const mx = w * .82; c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 12; i++) { const y = wl + 4 + i * (h - wl) / 13, ww = w * .03 * (1 + i * .08) * (.7 + .3 * Math.sin(t * 1.7 + i * 1.3)); c.fillStyle = `rgba(240,236,200,${.32 - i * .022})`; c.beginPath(); c.ellipse(mx + Math.sin(t * .9 + i) * 3, y, ww, 1.2 + i * .18, 0, 0, 6.283); c.fill() }
    c.globalCompositeOperation = 'source-over';
  }
  // --- lõke kaugel kaldal (öösel mageveel, kui ei saja) ---
  if (night && !sea && wx !== 'vihm' && wx !== 'torm' && spot !== 'jaa') {
    const fx = w * .2, fy = wl - 1, fl = .8 + .2 * Math.sin(t * 11) * Math.sin(t * 4.3);
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, 26); g.addColorStop(0, `rgba(255,170,80,${.55 * fl})`); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(fx - 26, fy - 26, 52, 52);
    c.fillStyle = '#ffcf6a'; c.beginPath(); c.moveTo(fx - 2.5, fy); c.quadraticCurveTo(fx - 1, fy - 5 * fl, fx, fy - 7 * fl); c.quadraticCurveTo(fx + 1.2, fy - 4 * fl, fx + 2.5, fy); c.fill();
    c.fillStyle = `rgba(255,170,80,${.4 * fl})`; for (let i = 0; i < 5; i++) c.fillRect(fx - 3 + Math.sin(t * 3 + i) * 1.5, fy + 3 + i * 3, 6 - i, 1.2);
    if (!red) for (let i = 0; i < 3; i++) { const a = (t * .8 + i / 3) % 1; c.fillStyle = `rgba(255,200,120,${1 - a})`; c.fillRect(fx + Math.sin(a * 8 + i) * 3, fy - 8 - a * 18, 1.2, 1.2) }
  }
  // --- vihmaringid ja tormilained ---
  if ((wx === 'vihm' || wx === 'torm') && !red) {
    const n = wx === 'torm' ? 4 : 2; for (let i = 0; i < n; i++) if (Math.random() < .7) ST.rip.push({ x: Math.random() * w, y: wl + 6 + Math.random() * (h - wl - 8), t0: t });
    ST.rip = ST.rip.filter(r => t - r.t0 < .9);
    c.lineWidth = 1; for (const r of ST.rip) { const k = (t - r.t0) / .9, s = .3 + (r.y - wl) / (h - wl); c.strokeStyle = `rgba(220,235,250,${.5 * (1 - k)})`; c.beginPath(); c.ellipse(r.x, r.y, 10 * k * s + 1, 3 * k * s + .4, 0, 0, 6.283); c.stroke() }
    if (wx === 'torm') { c.strokeStyle = 'rgba(230,240,250,.22)'; c.lineWidth = 1.4; for (let i = 0; i < 12; i++) { const y = wl + 10 + i * (h - wl) / 12, ph = t * 2.4 + i * 1.7; c.beginPath(); for (let x = 0; x <= w; x += 22) { const xx = x + Math.sin(ph + x * .03) * 8; c.moveTo(xx, y); c.quadraticCurveTo(xx + 6, y - 3, xx + 12, y) } c.stroke() } }
  }
  // --- äike: välk ja valgussähvatus ---
  if (wx === 'torm') {
    if (!ST.nextBolt) ST.nextBolt = t + 2 + Math.random() * 4;
    if (t >= ST.nextBolt) { const x0 = w * (.15 + Math.random() * .7), pts = [[x0, 0]]; let x = x0; for (let y = 0; y < wl; y += wl / 9) { x += (Math.random() - .5) * 30; pts.push([x, y + wl / 9]) } ST.bolt = { pts, t0: t }; ST.flash = 1; ST.nextBolt = t + 4 + Math.random() * 6 }
    if (ST.bolt && t - ST.bolt.t0 < .35) { const a = 1 - (t - ST.bolt.t0) / .35; c.strokeStyle = `rgba(230,240,255,${a})`; c.lineWidth = 2.4; c.shadowColor = 'rgba(180,210,255,.9)'; c.shadowBlur = 14; c.beginPath(); ST.bolt.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.shadowBlur = 0 }
    if (ST.flash > 0 && !red) { c.fillStyle = `rgba(235,240,255,${ST.flash * .38})`; c.fillRect(0, 0, w, h); ST.flash = Math.max(0, ST.flash - .06) }
  } else ST.nextBolt = 0;
  // --- udupangad ---
  if (wx === 'udu') {
    const g = c.createLinearGradient(0, wl - h * .14, 0, wl + h * .1); g.addColorStop(0, 'rgba(232,238,238,0)'); g.addColorStop(.6, 'rgba(232,238,238,.6)'); g.addColorStop(1, 'rgba(232,238,238,.2)'); c.fillStyle = g; c.fillRect(0, wl - h * .14, w, h * .24);
    for (let i = 0; i < 6; i++) { const x = ((t * (7 + i * 3) + i * 260) % (w + 500)) - 250, y = h * (.26 + i * .12), rw = 200 + i * 30;
      const fg = c.createRadialGradient(x, y, 0, x, y, rw); fg.addColorStop(0, `rgba(240,244,244,${night ? .12 : .32})`); fg.addColorStop(1, 'rgba(240,244,244,0)'); c.fillStyle = fg; c.beginPath(); c.ellipse(x, y, rw, rw * .2, 0, 0, 6.283); c.fill() }
  }
  // --- aastaajad ---
  if (!red) {
    if (season === 'talv' && wx !== 'vihm' && wx !== 'torm') {
      c.fillStyle = 'rgba(200,220,255,.08)'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { const sp = 18 + stH(i, 4) * 26, x = (stH(i, 5) * w + Math.sin(t * .8 + i) * 14 + t * 6) % w, y = (stH(i, 6) * h + t * sp) % h, r = .8 + stH(i, 7) * 1.8;
        c.fillStyle = `rgba(255,255,255,${.55 + stH(i, 8) * .4})`; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill() }
    } else if (season === 'sügis' && !sea) {
      const cols = ['#e8a23a', '#d8582a', '#c83a2a', '#f0c84a', '#b8742a'];
      for (let i = 0; i < 12; i++) { const sp = 14 + stH(i, 4) * 16, x = (stH(i, 5) * w + Math.sin(t * .9 + i) * 26 + t * 12) % w, y = (stH(i, 6) * h * .9 + t * sp) % (h * .9), rot = t * (1 + stH(i, 7) * 2) + i;
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, Math.abs(Math.cos(t * 2 + i)) * .6 + .4); c.fillStyle = cols[i % 5]; c.beginPath(); c.ellipse(0, 0, 4, 2.2, 0, 0, 6.283); c.fill(); c.restore() }
      for (let i = 0; i < 6; i++) { const x = w * (.1 + stH(i, 9) * .6) + Math.sin(t * .4 + i) * 6, y = wl + 14 + stH(i, 10) * (h - wl) * .7 + Math.sin(t * 1.2 + i) * 1.5; c.fillStyle = cols[(i + 2) % 5]; c.globalAlpha = .85; c.beginPath(); c.ellipse(x, y, 4.5, 1.8, stH(i, 11) * 3, 0, 6.283); c.fill(); c.globalAlpha = 1 }
    } else if (season === 'kevad' && !night) {
      // rändlinnud (hanede kiil) lendavad aeg-ajalt üle
      const per = 22, k = (t % per) / per; if (k < .55) { const x = -60 + k / .55 * (w + 120), y = h * .1 + Math.sin(k * 6) * 6;
        c.strokeStyle = 'rgba(40,46,56,.7)'; c.lineWidth = 1.4; for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1, n = Math.ceil(i / 2), bx = x - n * 12, by = y + side * n * 7, fl = Math.sin(t * 9 + i) * 2.5; c.beginPath(); c.moveTo(bx - 5, by - fl); c.quadraticCurveTo(bx - 2, by - 2, bx, by); c.quadraticCurveTo(bx + 2, by - 2, bx + 5, by - fl); c.stroke() } }
    }
    // suvi: kiilid mageveel päeval, kajakad merel
    if ((season === 'suvi' || season === 'kevad') && !night && wx !== 'vihm' && wx !== 'torm') {
      if (!sea) for (let i = 0; i < 3; i++) { const x = w * (.15 + i * .25) + Math.sin(t * 1.3 + i * 2) * w * .08 + Math.sin(t * 5.1 + i) * 6, y = wl + 18 + i * 14 + Math.sin(t * 2.2 + i) * 10;
        c.fillStyle = i === 1 ? '#3a7ad8' : '#2a9a8a'; c.fillRect(x - 6, y - .8, 12, 1.6); c.fillStyle = 'rgba(220,240,255,.55)'; const fl = Math.abs(Math.sin(t * 40 + i));
        c.beginPath(); c.ellipse(x - 1, y - 2.5 * fl, 5, 1.4, -.3, 0, 6.283); c.ellipse(x + 1, y - 2.5 * fl, 5, 1.4, .3, 0, 6.283); c.fill() }
      else for (let i = 0; i < 3; i++) { const x = (t * (18 + i * 6) + i * 300) % (w + 80) - 40, y = h * (.08 + i * .05) + Math.sin(t * 1.5 + i) * 6, fl = Math.sin(t * 6 + i) * 4;
        c.strokeStyle = 'rgba(250,250,250,.9)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x - 9, y - fl); c.quadraticCurveTo(x - 3, y - 4, x, y); c.quadraticCurveTo(x + 3, y - 4, x + 9, y - fl); c.stroke() }
    }
    // öö: tulikärbsed kaldaroos (mitte talvel)
    if (night && !sea && season !== 'talv' && wx !== 'vihm' && wx !== 'torm') {
      c.globalCompositeOperation = 'screen';
      for (let i = 0; i < 18; i++) { const x = (stH(i, 12) * w + Math.sin(t * .5 + i) * 30) % w, y = wl - 10 + stH(i, 13) * h * .22 + Math.sin(t * .8 + i * 2) * 10, a = Math.max(0, Math.sin(t * (1.2 + stH(i, 14)) + i * 3));
        if (a < .2) continue; const g = c.createRadialGradient(x, y, 0, x, y, 7); g.addColorStop(0, `rgba(220,255,140,${a})`); g.addColorStop(1, 'rgba(200,255,120,0)'); c.fillStyle = g; c.fillRect(x - 7, y - 7, 14, 14) }
      c.globalCompositeOperation = 'source-over';
    }
  }
  c.restore();
}

/* ---------- kala väljatõmbamise hetk ---------- */
function stLeapPos(L2, w, h) {
  const u = (performance.now() - L2.t0) / 2300, k = u >= 1 ? 1 : u < .3 ? u / .3 * .38 : u < .78 ? .38 + (u - .3) / .48 * .24 : .62 + (u - .78) / .22 * .38;
  const x0 = FX.bx, x1 = FX.bx + w * .16, top = h * .1; return [x0 + (x1 - x0) * k, FX.by - Math.sin(k * Math.PI) * (FX.by - top), k];
}
function stCatch(c, w, h, dt, t) {
  const L2 = FX.leap;
  if (L2 && L2.t0 !== ST.leapT0) {
    ST.leapT0 = L2.t0; ST.landed = false; ST.rar = L2.rar; ST.col = RAR2[L2.rar] ? RAR2[L2.rar][1] : '#ffffff';
    // veekroon: kõrge pritsmesammas, kust kala välja hüppab
    const n = 18 + Math.min(5, L2.rar) * 8;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 1.1; const v = 140 + Math.random() * 260; ST.spark.push({ x: FX.bx + (Math.random() - .5) * 16, y: FX.by, vx: Math.cos(a) * v * .6, vy: Math.sin(a) * v, life: .7 + Math.random() * .5, r: 1.5 + Math.random() * 2.4, col: 'rgba(235,248,255,.95)', g: 520 }) }
  }
  // harulduse värvi sädemejälg kala järel
  if (L2 && L2.rar >= 3 && !stReduce()) {
    const [x, y, k] = stLeapPos(L2, w, h);
    if (k < 1) for (let i = 0; i < (L2.rar >= 5 ? 4 : 2); i++) ST.spark.push({ x: x + (Math.random() - .5) * 20, y: y + (Math.random() - .5) * 14, vx: (Math.random() - .5) * 30, vy: (Math.random() - .5) * 30 + 10, life: .6 + Math.random() * .4, r: 1 + Math.random() * 2, col: ST.col, g: 40, glow: true });
    if (k >= .98 && !ST.landed) { ST.landed = true; if (L2.rar >= 5 || L2.giant) { ST.flash2 = 1; for (let i = 0; i < 60; i++) ST.glit.push({ x: Math.random() * w, y: -10 - Math.random() * h * .4, vy: 40 + Math.random() * 60, ph: Math.random() * 6, life: 2.4 + Math.random(), col: Math.random() < .7 ? '#ffd86a' : '#fff6d0' }) } }
  }
  // pritsmed ja sädemed
  ST.spark = ST.spark.filter(p => (p.life -= dt) > 0);
  for (const p of ST.spark) { p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; c.globalAlpha = Math.min(1, p.life * 2);
    if (p.glow) { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3); g.addColorStop(0, p.col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(p.x - p.r * 3, p.y - p.r * 3, p.r * 6, p.r * 6); c.globalCompositeOperation = 'source-over' }
    else { c.fillStyle = p.col; c.beginPath(); c.ellipse(p.x, p.y, p.r * .8, p.r * 1.3, 0, 0, 6.283); c.fill() } }
  c.globalAlpha = 1;
}
function stCatchTop(c, w, h, dt) {
  // legendaarse ja müütilise kala välgatus ning kullasadu
  if (ST.flash2 > 0) { c.fillStyle = `rgba(255,250,230,${ST.flash2 * .55})`; c.fillRect(0, 0, w, h); ST.flash2 = Math.max(0, ST.flash2 - dt * 2.2) }
  if (!ST.glit.length) return;
  ST.glit = ST.glit.filter(p => (p.life -= dt) > 0 && p.y < h + 10);
  for (const p of ST.glit) { p.y += p.vy * dt; p.ph += dt * 6; const x = p.x + Math.sin(p.ph) * 4, s = Math.abs(Math.cos(p.ph)) * 3 + 1;
    c.globalAlpha = Math.min(1, p.life); c.fillStyle = p.col; c.fillRect(x - s / 2, p.y - 1.5, s, 3) }
  c.globalAlpha = 1;
}

/* ---------- Kalaraamat: kalad kogumiskaartidena ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.book{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.bcell.cc{position:relative;overflow:hidden;padding:9px 9px 10px;border-radius:14px;border:2px solid var(--fr)!important;background:var(--wbg);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),inset 0 -30px 40px rgba(0,0,0,.35),0 6px 14px rgba(0,0,0,.3)}
.bcell.cc canvas{background:radial-gradient(120% 90% at 50% 30%,rgba(255,255,255,.1),transparent 70%);border-radius:9px}
.bcell.cc b{font-family:var(--f-head);font-size:14.5px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.bcell.cc small{color:#c8dce2}
.bcell.cc::before{content:attr(data-gem);position:absolute;top:6px;right:7px;font-size:10px;font-weight:900;letter-spacing:.06em;padding:2px 6px;border-radius:7px;background:var(--fr);color:#1a1206;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.bcell.cc.got::after{content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.22) 48%,transparent 60%);transform:translateX(-120%);transition:transform .7s ease;pointer-events:none}
.bcell.cc.got:hover::after{transform:translateX(120%)}
.bcell.cc.r1{--fr:#b98a5a}.bcell.cc.r2{--fr:#c8d2dc}.bcell.cc.r3{--fr:#e9b83a}.bcell.cc.r4{--fr:#b77aff}
.bcell.cc.r5{--fr:#ffcf5a;animation:ccGlow 2.6s ease-in-out infinite}.bcell.cc.r6{--fr:#ff8ad8;animation:ccRain 4s linear infinite}
@keyframes ccGlow{50%{box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),inset 0 -30px 40px rgba(0,0,0,.3),0 0 18px rgba(255,200,80,.55)}}
@keyframes ccRain{0%{--fr:#ff8ad8}25%{--fr:#8ad8ff}50%{--fr:#9aff8a}75%{--fr:#ffd86a}100%{--fr:#ff8ad8}}
.bcell.cc.unk{--fr:rgba(255,255,255,.14)!important;border-style:dashed!important;animation:none;filter:saturate(.25) brightness(.85)}
.bcell.cc.unk::before{background:rgba(255,255,255,.18);color:#d8e4e8}
.bcell.cc.w-mage{--wbg:linear-gradient(180deg,#24525a,#0e2a30)}.bcell.cc.w-meri{--wbg:linear-gradient(180deg,#1e4870,#0a1a30)}
.bcell.cc.w-jaa{--wbg:linear-gradient(180deg,#5a7a8a,#1c2c36)}.bcell.cc.w-sugav{--wbg:linear-gradient(180deg,#141a34,#04060e)}
.bcell.cc.w-salajane{--wbg:linear-gradient(180deg,#3e2c62,#150a26)}.bcell.cc.w-muu{--wbg:linear-gradient(180deg,#3a4a3a,#141c14)}
@media (prefers-reduced-motion:reduce){.bcell.cc.r5,.bcell.cc.r6{animation:none}}
</style>`);
{
  const GEM = { 1: 'TAV', 2: 'EBA', 3: 'HAR', 4: 'EEP', 5: 'LEG', 6: 'MÜÜ' };
  const wt = sp => { const s = (sp && sp.spots || [])[0]; return !s ? 'muu' : s === 'jaa' ? 'jaa' : s === 'sugavik' ? 'sugav' : s === 'salajane' ? 'salajane' : ST_SEA.includes(s) ? 'meri' : 'mage' };
  const _tr = tabRaamat;
  tabRaamat = function () {
    return _tr().replace(/<div class="bcell fcbtn"([^>]*)><canvas data-fl="([^"]+)" data-r="(\d)" data-unk="(\d)"/g, (m, attrs, id, r, unk) =>
      `<div class="bcell fcbtn cc r${r} ${unk === '1' ? 'unk' : 'got'} w-${wt(FD.sp[id])}" data-gem="${GEM[r] || ''}"${attrs}><canvas data-fl="${id}" data-r="${r}" data-unk="${unk}"`);
  };
}

/* ---------- ühtne kujundus ja pehmed üleminekud ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.fv-card{border-radius:18px;background:linear-gradient(180deg,rgba(18,40,50,.8),rgba(10,26,32,.82));border-color:rgba(134,205,224,.16);box-shadow:0 8px 24px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.04)}
.fv-card h2{letter-spacing:.005em}
.fv .btn{transition:transform .12s ease,box-shadow .2s ease,background .2s ease,border-color .2s ease}
.fv .btn:not([disabled]):hover{transform:translateY(-1px)}
.fv .btn:not([disabled]):active{transform:translateY(0) scale(.98)}
.fv-body.st-in{animation:stIn .32s cubic-bezier(.2,.8,.3,1)}
@keyframes stIn{from{opacity:0;transform:translateY(8px)}}
.fv-tabs button{transition:background .2s,color .2s}
@media (prefers-reduced-motion:reduce){.fv-body.st-in{animation:none}.fv .btn:not([disabled]):hover{transform:none}}
</style>`);
{
  let lastTab = '';
  const _r = renderFV;
  renderFV = function (force) {
    const r = _r(force);
    if (FV.open && FV.tab !== lastTab) { lastTab = FV.tab; const b = document.querySelector('#fvIn .fv-body'); if (b) { b.classList.remove('st-in'); void b.offsetWidth; b.classList.add('st-in') } }
    if (!FV.open) lastTab = '';
    return r;
  };
}
