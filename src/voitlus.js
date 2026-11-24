/* =====================================================================
   Kalaga võitlus (uus kerimine)
   - Hoia „KERI“ nuppu all (või tühikut / puuduta veepilti) – nööri pinge tõuseb, lase lahti – pinge langeb.
   - Hoia valge osuti rohelisel alal: kala kaotab jõudu (lendavad numbrid), järjest rohelisel = kombo x2…x5.
   - Kala sööstab aeg-ajalt (hüüumärk tema kohal) – siis tõuseb pinge kiiresti. Punasel liiga kaua → nöör katkeb.
   - Liiga lõdvalt (vasakus servas) liiga kaua → kala ujub minema.
   Server jääb samaks: kui kala jõud on otsas, kutsutakse fish_land nagu enne.
   ===================================================================== */
// kala jõud: suurem ja haruldasem kala võitleb kauem (ahven ~2 s, haug ~5 s, hiiglased kuni ~30 s)
function fightHp(h, heavy) {
  if (h.kind && h.kind !== 'fish') return 60;
  const kg = Math.max(.01, +h.est || .5), rar = +h.rarity || Math.max(1, h.need - 1), dif = +h.difficulty || 3;
  const hp = (35 + 62 * Math.sqrt(kg)) * (1 + .32 * (rar - 1)) * (1 + dif * .035) * (1 + Math.min(1, heavy) * .3);
  return Math.round(Math.max(55, Math.min(1900, hp)));
}
function fightInit(h) {
  const heavy = Math.max(0, Math.min(1.5, (+h.est || 1) / Math.max(.1, +h.strength || 1)));
  Object.assign(h, {
    hpMax: fightHp(h, heavy), ten: .35, hold: false, pulseUntil: 0, combo: 1, cT: 0, redT: 0, slackT: 0,
    surgeT: rnd(1.3, 2.4), surgeLeft: 0, surgePow: 0, fx: .5, fv: rnd(-.2, .2), tick: 0, floats: [], comboAt: 0, done: false,
    heavy, gzW: Math.max(.17, Math.min(.42, h.zw * 1.15)), gz: .5, ft: 0
  });
  h.hp = h.hpMax;
}
function fightHold(on) { const h = FV.hook; if (FV.phase !== 'reel' || !h) return; h.hold = on }
function fightTick(h, dt) {
  if (h.done || FV.busy) return;
  h.ft += dt;
  const hold = h.hold || performance.now() < h.pulseUntil;
  // roheline ala triivib aeglaselt
  h.gz = .52 + Math.sin(h.ft * .55 * (.8 + h.sp * .15)) * .12;
  // kala sööstud
  h.surgeT -= dt;
  if (h.surgeLeft > 0) h.surgeLeft -= dt;
  else if (h.surgeT <= 0) {
    h.surgeLeft = rnd(.6, 1.2) * (1 + h.heavy * .4); h.surgePow = rnd(.35, .7) * (.85 + h.sp * .12) * (1 + h.heavy * .5);
    h.surgeT = rnd(1.5, 3.2) / (.85 + h.sp * .1); h.fv = (Math.random() < .5 ? -1 : 1) * rnd(.35, .6);
    if (typeof sfx === 'function') sfx('splash');
    try { if (navigator.vibrate) navigator.vibrate(35) } catch (e) { } // telefon väriseb, kui kala sööstab
    if (Math.random() < .45 + h.heavy * .15) h.leap = performance.now(); // kala hüppab veest välja ja siputab
  }
  const pull = h.surgeLeft > 0 ? h.surgePow : .06;
  h.ten += ((hold ? .6 : -.58) + pull * (hold ? 1 : .4)) * dt;
  h.ten = Math.max(0, Math.min(1, h.ten));
  // kala ujub vees
  h.fx += h.fv * dt * (h.surgeLeft > 0 ? 1 : .35);
  if (h.fx < .12 || h.fx > .88) { h.fv = -h.fv; h.fx = Math.max(.12, Math.min(.88, h.fx)) }
  if (Math.random() < dt * .6) h.fv += rnd(-.15, .15);
  // alad
  const lo = h.gz - h.gzW / 2, hi = h.gz + h.gzW / 2, inG = h.ten >= lo && h.ten <= hi, red = h.ten >= .93, slack = h.ten <= .07;
  if (inG && hold) { h.cT += dt; const c2 = Math.min(5, 1 + Math.floor(h.cT / 1.1)); if (c2 > h.combo) { h.combo = c2; h.comboAt = performance.now(); if (typeof sfx === 'function') sfx('chime') } }
  else if (!inG) { h.cT = 0; h.combo = 1 }
  // kahju
  h.tick += dt;
  if (h.tick >= .22) {
    h.tick = 0;
    if (hold && !red) {
      const crit = inG && Math.random() < .12, amt = Math.max(1, Math.round((inG ? 30 : 9) * .22 * h.combo * (crit ? 2 : 1) * rnd(.85, 1.15)));
      h.hp -= amt; h.floats.push({ v: amt, x: h.fx + rnd(-.03, .03), life: 1, crit });
      if (h.floats.length > 8) h.floats.shift();
    }
  }
  // punane: nöör katkeb / lõtv: kala pääseb
  if (red) { h.redT += dt; if (h.redT > .9) { h.done = true; FV.loss = { k: 'slack' }; doLose('Nöör läks liiga pingule ja katkes! Kui osuti jõuab punasesse, lase nupp hetkeks lahti.'); return } }
  else h.redT = Math.max(0, h.redT - dt * 2);
  if (slack && !hold) { h.slackT += dt; if (h.slackT > 2.2) { h.done = true; FV.loss = { k: 'slack' }; doLose('Nöör jäi liiga lõdvaks ja kala ujus minema. Hoia „KERI“ all, et pinge püsiks.'); return } }
  else h.slackT = Math.max(0, h.slackT - dt * 2);
  h.needle = h.ten;
  if (h.hp <= 0) { h.hp = 0; h.done = true; h.hits = h.need; doLand() }
}
function fightDraw(c, w, h, t, tip) {
  const hk = FV.hook; if (!hk || hk.hpMax == null) return;
  const fxp = w * (.22 + .56 * hk.fx), fy = h * .64, L = Math.min(w * .3, 50 + (+hk.est) * 3), surging = hk.surgeLeft > 0;
  // pingul nöör kalani (punaseks, kui pinge suur)
  const tc = hk.ten > .8 ? `rgba(255,${Math.round(200 - (hk.ten - .8) * 800)},${Math.round(180 - (hk.ten - .8) * 800)},.9)` : 'rgba(240,240,240,.75)';
  c.strokeStyle = tc; c.lineWidth = hk.ten > .8 ? 1.8 : 1.1; c.beginPath(); c.moveTo(tip[0], tip[1]);
  const sag = (1 - hk.ten) * h * .18; c.quadraticCurveTo((tip[0] + fxp) / 2, (tip[1] + fy) / 2 + sag, fxp, fy - 6); c.stroke();
  // kala (tume vari) ja vahtu
  // kala siputab: keha väriseb ja pöördub, sööstu ajal hüppab vahel veest välja
  const lk = hk.leap ? (performance.now() - hk.leap) / 900 : 2, wig = Math.sin(t * (surging ? 26 : 15)) * (surging ? .28 : .16), dir = hk.fv > 0 ? 1 : -1;
  if (lk < 1) {
    const ly = fy - Math.sin(lk * Math.PI) * h * .2, rot = (lk - .5) * 1.4 * dir + wig;
    if (!hk.leapOut) { hk.leapOut = true; fxDrops(fxp, fy - 8, 14, 1); fxRing(fxp, fy, 50) }
    c.save(); c.translate(fxp, ly); c.rotate(-rot); c.filter = 'brightness(.55) saturate(.6)'; drawLook(c, 0, 0, L, {}, t * 3, dir); c.filter = 'none'; c.restore();
    if (Math.random() < .6) FX.drops.push({ x: fxp + rnd(-L * .3, L * .3), y: ly + rnd(-5, 5), vx: rnd(-40, 40), vy: rnd(-20, 30), life: .7, r: rnd(1, 2.4) });
  } else {
    if (hk.leapOut) { hk.leapOut = false; fxDrops(fxp, fy - 8, 22, 1.3); fxRing(fxp, fy, 70); fxRing(fxp, fy, 44); if (typeof sfx === 'function') sfx('splash') }
    c.save(); c.translate(fxp, fy); c.rotate(wig * .6); c.globalAlpha = .55; c.filter = 'brightness(0)'; drawLook(c, 0, 0, L, {}, t * (surging ? 3 : 1.6), dir); c.filter = 'none'; c.globalAlpha = 1; c.restore();
  }
  if (Math.random() < (surging ? .7 : .3)) fxDrops(fxp + rnd(-L * .45, L * .45), fy - h * .08 + rnd(-6, 6), surging ? 6 : 3, surging ? .9 : .6);
  c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(fxp, fy - 4, L * .45 + Math.sin(t * 6) * 4, 5, 0, 0, 7); c.stroke();
  // kala eluriba (nagu ikoon + riba)
  const hb = Math.min(110, w * .2), hx = fxp - hb / 2 + 12, hy = fy - L * .55 - 26;
  c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.roundRect(hx - 2, hy - 2, hb + 4, 12, 6); c.fill();
  const hpK = Math.max(0, hk.hp / hk.hpMax); c.fillStyle = hpK > .5 ? '#6ee06a' : hpK > .25 ? '#ffd25a' : '#ff6a5a'; c.beginPath(); c.roundRect(hx, hy, hb * hpK, 8, 4); c.fill();
  circ(c, hx - 10, hy + 4, 13, 'rgba(10,30,40,.9)'); c.strokeStyle = '#9ad8e8'; c.lineWidth = 2; c.beginPath(); c.arc(hx - 10, hy + 4, 13, 0, 7); c.stroke();
  c.font = '15px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🐟', hx - 10, hy + 5); c.textBaseline = 'alphabetic';
  // sööstu hoiatus
  if (hk.surgeT < .4 || surging) { c.font = '900 22px "Alegreya Sans", system-ui, sans-serif'; c.fillStyle = surging ? '#ff8a6a' : '#ffd25a'; c.strokeStyle = 'rgba(30,10,0,.8)'; c.lineWidth = 4; c.strokeText('!', fxp, hy - 10); c.fillText('!', fxp, hy - 10) }
  // lendavad numbrid
  for (const f of hk.floats) {
    f.life -= .016; if (f.life <= 0) continue;
    const yy = hy - 18 - (1 - f.life) * 40, xx = w * (.22 + .56 * f.x);
    c.globalAlpha = Math.min(1, f.life * 2); c.font = `900 ${f.crit ? 26 : 20}px "Alegreya Sans", system-ui, sans-serif`; c.textAlign = 'center';
    c.lineWidth = 4; c.strokeStyle = 'rgba(40,0,0,.75)'; c.strokeText('-' + f.v, xx, yy); c.fillStyle = f.crit ? '#ffd25a' : '#ff6a5a'; c.fillText('-' + f.v, xx, yy); c.globalAlpha = 1;
  }
  hk.floats = hk.floats.filter(f => f.life > 0);
  // pingeriba üleval
  const x0 = w * .12, bw = w * .76, yb = Math.max(10, h * .05), bh = 16, lo = hk.gz - hk.gzW / 2;
  c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.roundRect(x0 - 3, yb - 3, bw + 6, bh + 6, 6); c.fill();
  c.fillStyle = '#1c2c44'; c.fillRect(x0, yb, bw, bh);
  c.fillStyle = 'rgba(120,150,190,.35)'; c.fillRect(x0, yb, bw * .07, bh);
  let g = c.createLinearGradient(0, yb, 0, yb + bh); g.addColorStop(0, '#8af07a'); g.addColorStop(1, '#3fae4a'); c.fillStyle = g; c.fillRect(x0 + lo * bw, yb, hk.gzW * bw, bh);
  g = c.createLinearGradient(x0 + bw * .93, 0, x0 + bw, 0); g.addColorStop(0, '#b82a2a'); g.addColorStop(1, '#ff4a3a'); c.fillStyle = g; c.fillRect(x0 + bw * .93, yb, bw * .07, bh);
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(x0 + bw * i / 10, yb + bh * .6); c.lineTo(x0 + bw * i / 10, yb + bh); c.stroke() }
  const mx = x0 + hk.ten * bw; c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.strokeRect(mx - 7, yb - 4, 14, bh + 8);
  // rulli ikoon vasakul, keerleb hoides
  const rx = x0 - 22, ry = yb + bh / 2, spin = (hk.hold ? t * 14 : t * 2);
  circ(c, rx, ry, 13, 'rgba(10,30,40,.9)'); c.strokeStyle = '#c8d4da'; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, 9, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(spin) * 9, ry + Math.sin(spin) * 9); c.stroke();
  // kombo
  if (hk.combo > 1) {
    const k = Math.min(1, (performance.now() - hk.comboAt) / 250), s = 1 + (1 - k) * .6;
    c.save(); c.translate(w * .8, h * .3); c.scale(s, s); c.font = '900 38px "Alegreya Sans", system-ui, sans-serif'; c.textAlign = 'center';
    c.lineWidth = 6; c.strokeStyle = 'rgba(60,30,0,.8)'; c.strokeText('x' + hk.combo, 0, 0); g = c.createLinearGradient(0, -30, 0, 4); g.addColorStop(0, '#fff2a0'); g.addColorStop(1, '#ffb030'); c.fillStyle = g; c.fillText('x' + hk.combo, 0, 0); c.restore();
  }
  // hoiatused keskel
  const red = hk.ten >= .93, slack = hk.ten <= .07;
  if ((red || slack) && Math.sin(t * 14) > -.3) {
    const txt = red ? 'LASE LAHTI!' : 'KERI!'; c.font = `900 ${Math.max(20, w * .045)}px "Alegreya Sans", system-ui, sans-serif`; c.textAlign = 'center';
    c.lineWidth = 6; c.strokeStyle = 'rgba(30,0,0,.8)'; c.strokeText(txt, w / 2, h * .42); c.fillStyle = red ? '#ff7a6a' : '#9ad8ff'; c.fillText(txt, w / 2, h * .42);
  }
  // kaal / õng
  const over = +hk.est > +hk.strength, txt = `~${fmt1(+hk.est)} kg / õng ${fmt1(+hk.strength)} kg`;
  c.font = '800 13px "Alegreya Sans", system-ui, sans-serif'; c.textAlign = 'center'; const tw = c.measureText(txt).width + 18;
  c.textAlign = 'left'; rect(c, x0, yb + bh + 8, tw, 20, over ? 'rgba(170,30,20,.9)' : 'rgba(0,0,0,.55)'); c.fillStyle = over ? '#ffd8d0' : '#eaf6fa'; c.fillText(txt, x0 + 9, yb + bh + 23);
}
/* ---------- nupp ja juhtimine ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.fight-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px}
.fight-btn{justify-self:center;width:112px;height:112px;border-radius:50%;border:0;cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;
  font:900 22px/1 var(--f-body);letter-spacing:.04em;color:#0e2a10;background:radial-gradient(circle at 50% 30%,#a8ff8a,#3fbf4a 60%,#1f7a2a);
  box-shadow:0 0 0 7px rgba(210,225,230,.85),0 0 0 9px rgba(60,80,90,.9),0 8px 24px rgba(0,0,0,.45);transition:transform .08s}
.fight-cut{position:absolute;right:10px;bottom:6px;background:rgba(6,18,24,.6)}
.fight-cut.warn{border-color:#ff8a78;color:#ffd8d0;box-shadow:0 0 12px rgba(255,90,60,.45)}
.fight-btn small{display:block;font-size:11px;font-weight:700;letter-spacing:0;opacity:.75;margin-top:3px}
.fight-btn.on{transform:scale(.94);background:radial-gradient(circle at 50% 30%,#d4ffb8,#5fe06a 60%,#2a9a35)}
.fight-help{font-size:13px;color:var(--muted);line-height:1.4;padding:2px 2px}
@media (max-width:600px){.fight-btn{width:92px;height:92px;font-size:20px}.fight-cut{font-size:12px;padding:6px 9px}}
</style>`);
function fightButtons() {
  const warn = FV.hook && +FV.hook.est > +FV.hook.strength;
  return `<button class="fight-btn ${FV.hook && FV.hook.hold ? 'on' : ''}" type="button" id="fvPull" aria-label="Keri – hoia all">KERI<small>hoia all</small></button>
    <button class="btn ghost sm fight-cut ${warn ? 'warn' : ''}" type="button" data-fa="cut">✋ Lase lahti</button>`;
}
function fightHelp() { return '<div class="fight-help">🎣 Hoia <b>KERI</b> all – pinge tõuseb, lase lahti – pinge langeb. Hoia valge osuti <b style="color:#8af07a">rohelisel</b> alal. Kui kala kohal on <b style="color:#ffd25a">!</b>, sööstab ta – lase hetkeks lahti.</div>' }
document.addEventListener('pointerdown', e => {
  if (FV.phase !== 'reel') return;
  const b = e.target.closest('#fvPull'), sc = e.target === sceneCv;
  if (!b && !sc) return;
  e.preventDefault(); e.stopPropagation(); FV.pdAt = Date.now(); fightHold(true); if (b) b.classList.add('on');
}, true);
const fightUp = () => { if (FV.hook && FV.hook.hold) { fightHold(false); const b = document.getElementById('fvPull'); if (b) b.classList.remove('on') } };
['pointerup', 'pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, fightUp, true));
document.addEventListener('keydown', e => { if (e.key === ' ' && FV.open && FV.phase === 'reel' && !e.repeat) { e.preventDefault(); e.stopImmediatePropagation(); fightHold(true) } else if (e.key === ' ' && FV.phase === 'reel') { e.preventDefault(); e.stopImmediatePropagation() } }, true);
document.addEventListener('keyup', e => { if (e.key === ' ') fightUp() }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('#fvPull')) e.preventDefault() });
