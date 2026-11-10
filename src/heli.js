/* ================= HELI: kõik helid tehakse brauseris (ei vaja helifaile) ================= */
const SND = { ctx: null, master: null, fxG: null, musG: null, ambG: null, on: true, fx: .7, mus: .35, amb: .5, noise: null, rain: null, wind: null, lastPhase: '', reelT: 0, nextNote: 0, nextBird: 0, nextCricket: 0, fireT: 0 };
try { const s = JSON.parse(localStorage.getItem('mk.sound') || 'null'); if (s) Object.assign(SND, { on: s.on !== false, fx: s.fx ?? .7, mus: s.mus ?? .35, amb: s.amb ?? .5 }) } catch (e) { }
function sndSave() { try { localStorage.setItem('mk.sound', JSON.stringify({ on: SND.on, fx: SND.fx, mus: SND.mus, amb: SND.amb })) } catch (e) { } }
function sndInit() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume().catch(() => { }); return true }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
  try {
    const c = SND.ctx = new AC();
    SND.master = c.createGain(); SND.master.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(SND.master);
    SND.fxG = c.createGain(); SND.musG = c.createGain(); SND.ambG = c.createGain();
    // pehme kaja muusikale
    const dl = c.createDelay(1); dl.delayTime.value = .32; const fb = c.createGain(); fb.gain.value = .3; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    SND.musG.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(comp);
    [SND.fxG, SND.musG, SND.ambG].forEach(g => g.connect(comp));
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; SND.noise = buf;
    // pidevad taustahelid: vihm ja tuul
    const loop = (type, f, q) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(SND.ambG); s.start(); return { g, fl } };
    SND.rain = loop('highpass', 1800, .5); SND.wind = loop('lowpass', 420, .7); SND.fire = loop('bandpass', 900, 1.2); SND.water = loop('bandpass', 600, .8);
    sndVol(); return true;
  } catch (e) { SND.ctx = null; return false }
}
function sndVol() { if (!SND.ctx) return; const t = SND.ctx.currentTime; SND.master.gain.setTargetAtTime(SND.on ? 1 : 0, t, .05); SND.fxG.gain.setTargetAtTime(SND.fx, t, .05); SND.musG.gain.setTargetAtTime(SND.mus * .55, t, .3); SND.ambG.gain.setTargetAtTime(SND.amb * .6, t, .3) }
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => sndInit(), { passive: true }));
const sndOk = () => SND.ctx && SND.on && SND.ctx.state === 'running';
// põhiosad
function tone(f, dur, o = {}) {
  if (!sndOk()) return; const c = SND.ctx, t = c.currentTime + (o.at || 0), os = c.createOscillator(), g = c.createGain();
  os.type = o.type || 'sine'; os.frequency.setValueAtTime(f, t); if (o.to) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = f * .03; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + .1) }
  const v = o.vol ?? .25, a = o.a ?? .005;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let out = g; if (o.lp) { const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; g.connect(f2); out = f2 }
  os.connect(g); out.connect(o.bus || SND.fxG); os.start(t); os.stop(t + dur + .05);
}
function noise(dur, o = {}) {
  if (!sndOk()) return; const c = SND.ctx, t = c.currentTime + (o.at || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = SND.noise; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur); f.Q.value = o.q || 1;
  const v = o.vol ?? .3; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (o.a || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(o.bus || SND.fxG); s.start(t, Math.random()); s.stop(t + dur + .05);
}
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// heliefektid
const SFX = {
  click: () => tone(1800, .03, { vol: .05, type: 'triangle' }),
  chop: () => { noise(.12, { f: 1400, q: 2, vol: .45 }); tone(140, .14, { to: 70, vol: .35, type: 'triangle' }); noise(.25, { f: 3500, q: .8, vol: .06, at: .05, type: 'highpass' }) },
  stone: () => { tone(1100, .06, { to: 700, vol: .2, type: 'square', lp: 2500 }); noise(.07, { f: 3000, q: 3, vol: .3 }); tone(900, .05, { to: 600, vol: .12, type: 'square', lp: 2200, at: .08 }); noise(.06, { f: 2600, q: 3, vol: .18, at: .08 }) },
  pick: () => { tone(NOTE(84), .12, { vol: .16 }); tone(NOTE(88), .1, { vol: .1, at: .04 }); noise(.04, { f: 2000, q: 2, vol: .08 }) },
  water: () => { for (let i = 0; i < 3; i++) tone(320 + i * 90, .09, { to: 700 + i * 150, vol: .14, at: i * .06 }); noise(.25, { f: 700, q: .7, vol: .12, type: 'lowpass' }) },
  coin: () => { tone(NOTE(88), .12, { vol: .16, type: 'triangle' }); tone(NOTE(95), .3, { vol: .16, type: 'triangle', at: .07 }) },
  chime: () => [76, 80, 83, 88].forEach((n, i) => tone(NOTE(n), .5, { vol: .1, at: i * .08, type: 'sine' })),
  bad: () => { tone(220, .25, { to: 150, vol: .14, type: 'triangle' }); tone(165, .3, { to: 120, vol: .1, type: 'triangle', at: .12 }) },
  build: () => { for (let i = 0; i < 3; i++) { tone(200, .08, { to: 120, vol: .25, type: 'triangle', at: i * .16 }); noise(.05, { f: 1800, q: 2, vol: .2, at: i * .16 }) } [60, 64, 67, 72].forEach((n, i) => tone(NOTE(n + 12), .7, { vol: .08, at: .5 + i * .02, type: 'triangle' })) },
  levelup: () => { [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(NOTE(n + 12), .35, { vol: .12, at: i * .07, type: 'triangle' })); [72, 76, 79].forEach(n => tone(NOTE(n + 12), 1.4, { vol: .07, at: .55, type: 'sine' })) },
  animal: () => { tone(NOTE(86), .08, { vol: .1 }); tone(NOTE(90), .12, { vol: .1, at: .08 }); tone(NOTE(93), .16, { vol: .08, at: .16 }) },
  cast: () => { noise(.35, { f: 600, to: 2400, q: 1.5, vol: .18 }); noise(.18, { f: 500, q: .8, vol: .3, at: .42, type: 'lowpass' }); tone(240, .12, { to: 520, vol: .1, at: .42 }) },
  bite: () => { noise(.12, { f: 600, q: 1, vol: .3, type: 'lowpass' }); tone(NOTE(81), .25, { vol: .16, at: .02 }); tone(NOTE(88), .35, { vol: .14, at: .1 }) },
  ratchet: () => noise(.025, { f: 3200, q: 6, vol: .12 }),
  hit: () => { tone(NOTE(79), .1, { vol: .14, type: 'triangle' }); noise(.06, { f: 900, q: 1, vol: .15, type: 'lowpass' }) },
  splash: () => { noise(.45, { f: 900, to: 300, q: .7, vol: .35, type: 'lowpass' }); for (let i = 0; i < 4; i++) tone(500 + Math.random() * 600, .06, { to: 1200, vol: .05, at: .05 + i * .05 }) },
  catch: r => { SFX.splash(); const sc = [72, 76, 79, 84, 88, 91, 96]; for (let i = 0; i < 2 + (r || 1); i++) tone(NOTE(sc[i]), .4, { vol: .11, at: .25 + i * .08, type: 'triangle' }); if (r >= 5) for (let i = 0; i < 8; i++) tone(NOTE(96 + (i % 3) * 4), .25, { vol: .05, at: .9 + i * .06 }) },
  lost: () => { [67, 64, 60].forEach((n, i) => tone(NOTE(n), .3, { vol: .1, at: i * .12, type: 'triangle' })) },
  snap: () => { noise(.08, { f: 2500, q: 4, vol: .5 }); tone(400, .3, { to: 90, vol: .2, type: 'sawtooth', lp: 900 }) },
  fire: () => noise(.05, { f: 1500 + Math.random() * 1500, q: 3, vol: .08 }),
  hiss: () => noise(.6, { f: 3000, to: 1200, q: .6, vol: .25, type: 'highpass' }),
  event: () => { [72, 79, 84].forEach((n, i) => tone(NOTE(n), .6, { vol: .1, at: i * .12, type: 'triangle' })) },
  deer: () => [88, 91, 95, 100, 103].forEach((n, i) => tone(NOTE(n), .5, { vol: .07, at: i * .05 })),
};
function sfx(n, a) { try { if (SFX[n]) SFX[n](a) } catch (e) { } }

/* ---------- taustamuusika: rahulik pentatooniline meloodia ---------- */
const MUS_DAY = [62, 64, 66, 69, 71, 74, 76, 78, 81], MUS_NIGHT = [57, 60, 62, 64, 67, 69, 72, 74];
let musStep = 0, musChord = 0;
function musicTick() {
  if (!sndOk() || SND.mus <= 0) return; const c = SND.ctx; if (c.currentTime < SND.nextNote) return;
  const night = typeof skyState === 'function' && S && skyState().dark > .5, sc = night ? MUS_NIGHT : MUS_DAY, beat = night ? 1.1 : .8;
  if (musStep % 8 === 0) { musChord = (musChord + 1) % 4; const root = [50, 45, 47, 43][musChord] + (night ? -2 : 0); [0, 7, 12, 16].forEach((iv, i) => tone(NOTE(root + iv), beat * 8, { vol: .035, a: 1.2, type: 'sine', bus: SND.musG, at: i * .02 })) }
  if (Math.random() < .7) { const n = sc[Math.floor(Math.random() * sc.length)]; tone(NOTE(n), beat * 2.2, { vol: .07, a: .01, type: 'triangle', bus: SND.musG, lp: 2400 }); if (Math.random() < .25) tone(NOTE(n + 12), beat * 1.5, { vol: .025, at: beat / 2, bus: SND.musG }) }
  musStep++; SND.nextNote = c.currentTime + beat;
}
/* ---------- looduse helid ---------- */
function bird() { const b = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) tone(b * (1 + Math.random() * .2), .09, { to: b * (1.3 + Math.random() * .4), vol: .035, at: i * .11, bus: SND.ambG }) }
function cricket() { for (let i = 0; i < 6; i++) tone(4300, .025, { vol: .02, at: i * .045, bus: SND.ambG, type: 'triangle' }) }
function ambientTick() {
  if (!sndOk()) return; const c = SND.ctx, t = c.currentTime;
  const inFish = typeof FV !== 'undefined' && FV.open;
  const w = S && S.weather ? S.weather.t : 'paike', fw = typeof FS !== 'undefined' && FS && FS.weather;
  const weather = inFish ? fw : w, night = typeof skyState === 'function' && S ? skyState().dark > .5 : false;
  const rainV = weather === 'vihm' ? .35 : weather === 'torm' ? .55 : 0, windV = weather === 'torm' ? .5 : weather === 'udu' || weather === 'pilves' ? .18 : .08;
  SND.rain.g.gain.setTargetAtTime(rainV, t, 1); SND.wind.g.gain.setTargetAtTime(windV * (1 + .4 * Math.sin(t * .3)), t, 1.5);
  const fireOn = S && S.life && S.life.ev && S.life.ev.k === 'tuli' && S.life.ev.reg === S.view && !inFish;
  SND.fire.g.gain.setTargetAtTime(fireOn ? .25 : 0, t, .4); if (fireOn && Math.random() < .5) sfx('fire');
  SND.water.g.gain.setTargetAtTime(inFish ? .1 : 0, t, .8);
  if (!rainV && t > SND.nextBird && !night) { bird(); SND.nextBird = t + 2.5 + Math.random() * 6 }
  if (night && t > SND.nextCricket && weather !== 'lumi') { cricket(); SND.nextCricket = t + .6 + Math.random() * 1.6 }
  if (weather === 'torm' && Math.random() < .004) { noise(2.5, { f: 120, q: .5, vol: .6, type: 'lowpass', bus: SND.ambG }); }
}
/* ---------- haakimine mängu sündmustesse ---------- */
{
  const _ar = addRes; addRes = function (k, amt, x, y) { const got = _ar(k, amt, x, y); if (got > 0) sfx({ wood: 'chop', stone: 'stone', berries: 'pick', food: 'pick', water: 'water', gold: 'coin' }[k] || 'pick'); return got };
  const _fb = finishBuild; finishBuild = function (b) { _fb(b); if (!SILENT) sfx('build') };
  const _lu = onLevelUp; onLevelUp = function (a, b) { _lu(a, b); if (!SILENT) setTimeout(() => sfx('levelup'), 150) };
  const _to = toast; toast = function (msg, kind, icon) { const r = _to(msg, kind, icon); if (kind === 'gold') sfx('chime'); else if (kind === 'bad') sfx('bad'); return r };
  if (typeof tryTame === 'function') { const _tt = tryTame; tryTame = function (a) { const r = _tt(a); if (a && a.deer) sfx('deer'); else if (a && !a.folk) sfx('animal'); return r } }
  if (typeof startEvent === 'function') { const _se = startEvent; startEvent = function (k) { _se(k); sfx(k === 'tuli' ? 'bad' : 'event') } }
  if (typeof fireAt === 'function') { const _fa = fireAt; fireAt = function (x, y) { const n = S.life.ev && S.life.ev.fires ? S.life.ev.fires.length : 0; const r = _fa(x, y); if (r && (!S.life.ev || !S.life.ev.fires || S.life.ev.fires.length < n)) sfx('hiss'); return r } }
}
document.addEventListener('click', e => { if (e.target.closest('[data-act],[data-fa],[data-cl],.tab,.rtab')) sfx('click') }, true);
// kalapüügi faasid
function fishSndTick() {
  if (typeof FV === 'undefined' || !FV.open) { SND.lastPhase = ''; return }
  const p = FV.phase;
  if (p !== SND.lastPhase) {
    if (p === 'casting' || (p === 'waiting' && SND.lastPhase !== 'casting')) sfx('cast');
    else if (p === 'bite') sfx('bite');
    else if (p === 'reel') sfx('hit');
    else if (p === 'result' && FV.result) { const r = FV.result; if (r.kind === 'fish') sfx('catch', r.rarity); else sfx('splash'); if (r.kind === 'chest') setTimeout(() => sfx('coin'), 500) }
    else if (p === 'lost') sfx(/murd|katki/i.test(FV.msg || '') ? 'snap' : 'lost');
    SND.lastPhase = p;
  }
  if (p === 'reel' && performance.now() - SND.reelT > 90) { SND.reelT = performance.now(); sfx('ratchet') }
}
setInterval(() => { if (!SND.ctx) return; try { musicTick(); ambientTick(); fishSndTick() } catch (e) { } }, 60);

/* ---------- heli seaded ---------- */
function soundCard() {
  return `<div class="card"><div class="sec-h" style="margin:0">Heli <small>${SND.on ? 'sees' : 'väljas'}</small></div><p class="lead">Kõik helid ja muusika tehakse mängus endas. Telefonis peab heli jaoks olema vaikne režiim välja lülitatud.</p>
    <div class="sndrow"><label>Heliefektid</label><input type="range" min="0" max="100" value="${Math.round(SND.fx * 100)}" data-snd="fx"></div>
    <div class="sndrow"><label>Muusika</label><input type="range" min="0" max="100" value="${Math.round(SND.mus * 100)}" data-snd="mus"></div>
    <div class="sndrow"><label>Loodushelid</label><input type="range" min="0" max="100" value="${Math.round(SND.amb * 100)}" data-snd="amb"></div>
    <button class="btn sm ${SND.on ? 'ghost' : ''}" type="button" data-act="sndToggle">${SND.on ? 'Lülita heli välja' : 'Lülita heli sisse'}</button></div>`;
}
document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.snd; if (!k) return; SND[k] = +e.target.value / 100; sndInit(); sndVol(); sndSave(); if (k === 'fx') sfx('coin') });
ACT.sndToggle = () => { SND.on = !SND.on; sndInit(); sndVol(); sndSave(); sndBtn() };
{ const _kr = TABS.kuningriik.r; TABS.kuningriik.r = () => _kr() + soundCard() }
// kiirnupp kaardi nurgas
function sndBtn() {
  let b = document.getElementById('sndBtn');
  if (!b) { const mw = document.getElementById('mapWrap'); if (!mw) return; b = document.createElement('button'); b.id = 'sndBtn'; b.type = 'button'; b.className = 'sndbtn'; b.addEventListener('click', e => { e.stopPropagation(); SND.on = !SND.on; sndInit(); sndVol(); sndSave(); sndBtn(); if (UI.tab === 'kuningriik') renderPanel(true) }); mw.appendChild(b) }
  b.textContent = SND.on ? '🔊' : '🔇'; b.title = SND.on ? 'Heli on sees. Klõpsa, et vaigistada.' : 'Heli on väljas. Klõpsa, et sisse lülitada.'; b.setAttribute('aria-label', b.title);
}
setTimeout(sndBtn, 300);
