/* ===== Jõulud Metsakuningriigis (1. dets – 6. jaan) + tervitusaken päevapreemiaga ===== */
function xmDate() { return window.MK_XDATE ? new Date(window.MK_XDATE) : new Date() }
function xmOn() { const d = xmDate(); return d.getMonth() === 11 || (d.getMonth() === 0 && d.getDate() <= 6) }
function xmAdventOn() { return xmDate().getMonth() === 11 }
function xmToday() { return xmAdventOn() ? xmDate().getDate() : 0 }
function xmSt() {
  const d = xmDate(), y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
  if (!S.xmas || S.xmas.y !== y) S.xmas = { y, open: {}, sl: { d: '', n: 0 } };
  return S.xmas;
}
const XM_GIFT = [
  { ic: '🪵', r: { wood: 60, gold: 40 } }, { ic: '🫐', r: { berries: 60, gold: 40 } }, { ic: '🪨', r: { stone: 60, gold: 50 } }, { ic: '🍞', r: { food: 60, gold: 50 } },
  { ic: '⭐', r: { xp: 60, gold: 60 } }, { ic: '🎅', r: { gold: 200, berries: 80 }, t: 'Nikolausepäev' }, { ic: '💧', r: { water: 90, gold: 60 } }, { ic: '🪓', r: { wood: 120, stone: 60 } },
  { ic: '🍪', r: { food: 100, gold: 80 } }, { ic: '✨', r: { xp: 100, fame: 5 } }, { ic: '💰', r: { gold: 250 } }, { ic: '🗺️', r: { map: 1, gold: 100 } },
  { ic: '🕯️', r: { wood: 150, food: 80 }, t: 'Kolmas advent' }, { ic: '🪨', r: { stone: 150, gold: 100 } }, { ic: '🫐', r: { berries: 150, water: 100 } }, { ic: '⭐', r: { xp: 150, gold: 120 } },
  { ic: '🎁', r: { gold: 350, fame: 8 } }, { ic: '🍪', r: { food: 160, berries: 120 } }, { ic: '🗺️', r: { map: 1, xp: 120 } }, { ic: '🕯️', r: { gold: 300, wood: 150, stone: 150 }, t: 'Neljas advent' },
  { ic: '❄️', r: { water: 200, food: 150, gold: 150 }, t: 'Talvine pööripäev' }, { ic: '💰', r: { gold: 500, fame: 10 } }, { ic: '🦌', r: { xp: 250, map: 1, gold: 200 } },
  { ic: '🎄', r: { gold: 1200, xp: 400, fame: 40, map: 2, wood: 300, stone: 300, food: 200 }, t: 'Jõululaupäev' }];
function xmCanOpen() { if (!xmAdventOn()) return 0; const st = xmSt(), d = Math.min(24, xmToday()); let n = 0; for (let i = 1; i <= d; i++) if (!st.open[i]) n++; return n }
function xmGiftScale(r) { const o = {}, k = 1 + Math.min(2, (S.level - 1) * .06); for (const x in r) o[x] = (x === 'map' || x === 'fame') ? r[x] : Math.round(r[x] * k); return o }
function xmOpen(d) {
  const st = xmSt(); if (!xmAdventOn() || d > xmToday() || d > 24 || st.open[d]) return false;
  const g = XM_GIFT[d - 1], rew = xmGiftScale(g.r); give(rew); st.open[d] = 1;
  S.xmasBest = Math.max(S.xmasBest || 0, Object.keys(st.open).length);
  toast(`Advendikalender, ${d}. luuk${g.t ? ' (' + g.t + ')' : ''}: ${rewardText(rew)}`, 'gold', 'gold');
  sfx('bells'); save(); return true;
}
/* ---------- helid ---------- */
SFX.jingle = () => { for (let i = 0; i < 9; i++) { noise(.07, { f: 7500 + (i % 3) * 900, q: 5, vol: .05, at: i * .1 }); tone(NOTE(98 + (i % 2) * 2), .16, { vol: .025, at: i * .1, type: 'triangle' }) } };
SFX.bells = () => { [76, 76, 76, 0, 76, 76, 76, 0, 76, 79, 72, 74, 76].forEach((n, i) => { if (n) { tone(NOTE(n + 12), .5, { vol: .07, at: i * .14, type: 'triangle' }); tone(NOTE(n + 24), .25, { vol: .02, at: i * .14, type: 'sine' }) } }); SFX.jingle() };

/* ---------- stiilid ---------- */
{
  const st = document.createElement('style'); st.textContent = `
.xmbtn{position:absolute;left:8px;top:48px;z-index:6;display:flex;align-items:center;gap:6px;padding:6px 12px 6px 8px;border-radius:999px;border:1px solid rgba(255,214,120,.7);background:linear-gradient(180deg,rgba(150,26,30,.92),rgba(96,14,20,.92));color:#fff4dc;font:700 13px system-ui;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35)}
.xmbtn span{font-size:18px}.xmbtn i{font-style:normal;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#ffd25e;color:#5a0e12;font-size:12px;display:grid;place-items:center}
.xmbtn.pulse{animation:xmPulse 1.8s ease-in-out infinite}@keyframes xmPulse{0%,100%{box-shadow:0 4px 14px rgba(0,0,0,.35)}50%{box-shadow:0 0 0 7px rgba(255,210,94,.28),0 4px 14px rgba(0,0,0,.35)}}
@media (max-width:640px){.xmbtn b{display:none}.xmbtn{padding:6px 8px}}
.modal-card.xmmodal{max-width:760px;background:radial-gradient(120% 70% at 50% 0%,#5b1418 0%,#2c0c10 55%,#160a0c 100%);border-color:rgba(255,214,120,.45);position:relative;overflow:hidden}
.xmmodal h2{font-family:var(--f-head);color:#ffe2a0;margin:0;font-size:28px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
.xmmodal .lead{color:#f1d9c4}
.xmsnow{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(2px 2px at 20px 30px,#fff8,transparent),radial-gradient(2px 2px at 140px 80px,#fff6,transparent),radial-gradient(1.5px 1.5px at 260px 40px,#fff9,transparent),radial-gradient(2px 2px at 380px 120px,#fff5,transparent),radial-gradient(1.5px 1.5px at 90px 160px,#fff7,transparent);background-size:420px 200px;animation:xmFall 9s linear infinite;opacity:.8}
@keyframes xmFall{from{background-position:0 0}to{background-position:60px 200px}}
.xmhd{display:flex;gap:14px;align-items:center;position:relative}.xmhd .big{font-size:46px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.5))}
.xmcount{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 4px}.xmcount span{padding:4px 11px;border-radius:999px;background:rgba(0,0,0,.35);border:1px solid rgba(255,214,120,.3);font-size:13px;color:#ffe9c2}
.xmgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;margin:14px 0 6px;position:relative;perspective:900px}
@media (max-width:640px){.xmgrid{grid-template-columns:repeat(4,1fr);gap:7px}.xmmodal h2{font-size:22px}}
.xmd{position:relative;aspect-ratio:1/1.08;border-radius:10px;cursor:default}
.xmd .in{position:absolute;inset:0;border-radius:10px;background:radial-gradient(circle at 50% 40%,#fff3cf,#e7c27a 70%,#b98a3e);display:grid;place-items:center;align-content:center;gap:2px;box-shadow:inset 0 2px 8px rgba(0,0,0,.35);padding:4px;text-align:center}
.xmd .in em{font-style:normal;font-size:28px;line-height:1}.xmd .in small{font-size:10.5px;line-height:1.15;color:#4a2a0c;font-weight:700}
.xmd .fl{position:absolute;inset:0;border-radius:10px;transform-origin:0 50%;transition:transform .9s cubic-bezier(.3,.7,.3,1.2);display:grid;place-items:center;backface-visibility:hidden;
 background:linear-gradient(135deg,rgba(255,255,255,.14),transparent 45%),var(--dc);border:2px solid rgba(255,214,120,.55);box-shadow:0 4px 10px rgba(0,0,0,.4),inset 0 0 0 4px rgba(0,0,0,.12)}
.xmd .fl::before,.xmd .fl::after{content:'';position:absolute;background:rgba(255,214,120,.55)}.xmd .fl::before{left:50%;top:0;bottom:0;width:4px;transform:translateX(-50%)}.xmd .fl::after{top:50%;left:0;right:0;height:4px;transform:translateY(-50%)}
.xmd .fl b{position:relative;z-index:1;font-family:var(--f-head);font-size:26px;color:#fff2c8;text-shadow:0 2px 0 rgba(0,0,0,.45);background:var(--dc);border-radius:50%;width:44px;height:44px;display:grid;place-items:center;border:2px solid rgba(255,214,120,.7)}
.xmd .fl small{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:10px;color:#ffe9c2;z-index:1}
.xmd.lock .fl{filter:saturate(.45) brightness(.7)}
.xmd.can{cursor:pointer}.xmd.can .fl{animation:xmGlow 1.6s ease-in-out infinite}.xmd.can:hover .fl{transform:rotateY(-14deg)}
@keyframes xmGlow{0%,100%{box-shadow:0 4px 10px rgba(0,0,0,.4),0 0 0 0 rgba(255,214,120,.0)}50%{box-shadow:0 4px 10px rgba(0,0,0,.4),0 0 16px 3px rgba(255,214,120,.65)}}
.xmd.open .fl,.xmd.opening .fl{transform:rotateY(-108deg)}.xmd.open .fl{opacity:.0}
.xmd.d24 .fl{border-color:#ffd25e;background:radial-gradient(circle at 50% 35%,rgba(255,230,140,.35),transparent 60%),linear-gradient(135deg,#c42a2e,#7a1018)}.xmd.d24 .fl b{background:#b8861e;border-color:#ffe9a8;color:#fff8e0}.xmd.d24 .fl::before,.xmd.d24 .fl::after{background:#ffd25e}
.xmwel{display:grid;gap:12px;position:relative}
.xmday{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.xmday div{display:grid;justify-items:center;gap:3px;padding:8px 2px;border-radius:11px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);font-size:11px;text-align:center;color:#d8c9b4}
.xmday div em{font-style:normal;font-size:20px}.xmday div.got{background:rgba(110,180,100,.18);border-color:rgba(140,210,120,.4);color:#c8f0bc}
.xmday div.now{background:linear-gradient(180deg,rgba(255,210,94,.35),rgba(255,210,94,.12));border-color:#ffd25e;color:#fff2c8;animation:xmGlow 1.6s infinite}
.welmodal{max-width:600px}
.xmcard{background:linear-gradient(135deg,#5b1418,#2e0c10)!important;border-color:rgba(255,214,120,.45)!important;position:relative;overflow:hidden}
.xmcard .sec-h{color:#ffe2a0}`; document.head.appendChild(st);
}

/* ---------- advendikalender ---------- */
const XM_COL = ['#a3242b', '#1f5d3a', '#7a1a40', '#235070', '#8a5a1a', '#2d6b4a'];
function xmDaysToEve() { const d = xmDate(), e = new Date(d.getFullYear(), 11, 24); return Math.ceil((e - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5) }
function openAdvent() {
  showModal(() => {
    const st = xmSt(), today = xmToday(), opened = Object.keys(st.open).length, eve = xmDaysToEve();
    const door = d => {
      const g = XM_GIFT[d - 1], isOpen = st.open[d], can = !isOpen && xmAdventOn() && d <= today, lock = !isOpen && !can;
      return `<div class="xmd ${isOpen ? 'open' : can ? 'can' : 'lock'} ${d === 24 ? 'd24' : ''}" ${can ? `data-act="xmOpen" data-arg="${d}" role="button" tabindex="0" aria-label="Ava ${d}. luuk"` : ''} style="--dc:${XM_COL[(d * 7) % XM_COL.length]}">
        <div class="in"><em>${g.ic}</em><small>${rewardText(xmGiftScale(g.r))}</small></div>
        <div class="fl"><b>${d}</b>${can ? '<small>Ava!</small>' : lock ? `<small>${d}. dets</small>` : ''}</div></div>`;
    };
    // 24 on lõpus suurena
    return `<div class="xmsnow"></div><div class="xmhd"><span class="big">🎄</span><div><h2>Advendikalender</h2><p class="lead">Iga päev 1.–24. detsembrini avaneb üks luuk ja selle taga on kingitus. Kui mõni päev vahele jäi, saad selle luugi hiljem avada.</p></div></div>
      <div class="xmcount"><span>Avatud ${opened} / 24</span>${eve > 0 ? `<span>Jõululaupäevani ${eve} ${eve === 1 ? 'päev' : 'päeva'}</span>` : eve === 0 ? '<span>Häid jõule! 🎄</span>' : ''}<span>Jõuluvana kingid täna ${st.sl.d === dateKey() ? st.sl.n : 0} / 3</span></div>
      ${xmAdventOn() ? '' : '<p class="lead">Advendikalendri luuke saab avada ainult detsembris.</p>'}
      <div class="xmgrid">${Array.from({ length: 24 }, (_, i) => door(i + 1)).join('')}</div>
      <p class="lead" style="position:relative;font-size:13px">Vihje: jõuluvana lendab vahel saaniga üle kuningriigi. Klõpsa saanil, siis viskab ta sulle kingi (kuni 3 korda päevas). Külaplatsil seisvale jõulukuusele klõpsates avaneb see kalender.</p>
      <div class="mbtns" style="position:relative"><button class="btn" type="button" data-act="closeModal">Sulge</button></div>`;
  }, 'xmmodal');
}
ACT.xmas = () => openAdvent();
ACT.xmOpen = (a, el) => {
  const d = +a; if (!el || el.classList.contains('opening')) return;
  el.classList.add('opening'); el.classList.remove('can'); UI.modalBusy = true;
  setTimeout(() => { xmOpen(d); UI.modalBusy = false; RATES = computeRates(); hudUpdate(); renderPanel(true); renderModal(true) }, 850);
};
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('xmd') && e.target.dataset.act) { e.preventDefault(); e.target.click() } });

/* ---------- tervitusaken: päevapreemia (+ jõulude ajal advent) ---------- */
const DAY_IC = ['🪵', '🫐', '🪨', '🍞', '💧', '🧱', '👑'];
function openWelcome() {
  showModal(() => {
    const d = dailyState(), cur = d.can ? d.idx : (S.daily.streak - 1) % 7, xm = xmAdventOn() ? xmCanOpen() : 0;
    return `${xmOn() ? '<div class="xmsnow"></div>' : ''}<div class="xmwel"><div class="xmhd"><span class="big">${xmOn() ? '🎅' : '👑'}</span><div><h2>Tere tulemast tagasi, ${esc(S.name)}!</h2><p class="lead">${xmOn() ? 'Kuningriigis on jõuluaeg. Majadel põlevad tuled ja külaplatsil seisab jõulukuusk.' : 'Sinu kuningriik ootas sind.'}</p></div></div>
      <div class="sec-h" style="margin:0">Päevapreemia <small>${d.can ? (d.streakNext > 1 ? `${d.streakNext}. päev järjest!` : 'alusta uut seeriat') : 'tänane on võetud'}</small></div>
      <div class="xmday">${DAILY.map((r, i) => `<div class="${(d.can ? i < cur : i <= cur) ? 'got' : d.can && i === cur ? 'now' : ''}"><em>${(d.can ? i < cur : i <= cur) ? '✅' : DAY_IC[i]}</em><b>${i + 1}. päev</b><span>${rewardText(r)}</span></div>`).join('')}</div>
      <p class="lead" style="margin:0;font-size:13px">Tule iga päev tagasi: mida pikem seeria, seda suurem kingitus. 7. päeval ootab kõige suurem auhind.</p>
      ${d.can ? `<button class="btn" type="button" data-act="welDaily">Võta päevapreemia: ${rewardText(DAILY[d.idx])}</button>` : ''}
      ${xm ? `<div class="sec-h" style="margin:4px 0 0">Advendikalender 🎄 <small>${xm} ${xm === 1 ? 'luuk ootab' : 'luuki ootavad'}</small></div><button class="btn" type="button" data-act="welXmas" style="background:linear-gradient(180deg,#d8414a,#9a1c24);color:#fff">Ava advendikalender</button>` : ''}
      <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Hiljem</button></div></div>`;
  }, xmOn() ? 'xmmodal welmodal' : 'welmodal');
}
ACT.welDaily = () => { claimDaily(); sfx('coin'); if (!(xmAdventOn() && xmCanOpen())) setTimeout(closeModal, 700) };
ACT.welXmas = () => { if (dailyState().can) claimDaily(); closeModal(); setTimeout(openAdvent, 150) };
{
  const _eg = enterGame;
  enterGame = function () {
    _eg.apply(this, arguments);
    let tries = 0; const iv = setInterval(() => {
      if (++tries > 40) return clearInterval(iv);
      if (!S || document.getElementById('game').hidden || UI.modalView) return;
      clearInterval(iv); if (S.welDay === dateKey() || Date.now() - (S.created || 0) < 3600e3) return; if (dailyState().can || (xmAdventOn() && xmCanOpen())) { S.welDay = dateKey(); openWelcome() }
    }, 1500);
  };
}

/* ---------- kaardi nupp, nõuandja, saavutused, kuningriigi kaart ---------- */
function xmBtn() {
  const w = document.getElementById('mapWrap'); if (!S || !w) return;
  let b = document.getElementById('xmBtn');
  if (!xmOn()) { if (b) b.remove(); return }
  if (!b) { b = document.createElement('button'); b.id = 'xmBtn'; b.type = 'button'; b.className = 'xmbtn'; b.dataset.act = 'xmas'; b.setAttribute('aria-label', 'Advendikalender'); w.appendChild(b) }
  const n = xmCanOpen(), html = `<span>🎄</span><b>Jõulud</b>${n ? `<i>${n}</i>` : ''}`;
  if (b.dataset.h !== html) { b.innerHTML = html; b.dataset.h = html; b.classList.toggle('pulse', n > 0) }
}
setInterval(() => { if (typeof running !== 'undefined' && running && S) try { xmBtn() } catch (e) { } }, 1000);
{
  const _at = advTodo;
  advTodo = function () { const o = _at(); const n = xmCanOpen(); if (n) { o.push({ pri: 8, ic: '🎄', t: n > 1 ? `Advendikalendris ootab ${n} luuki` : 'Tänane advendikalendri luuk ootab', how: 'Ava luuk ja saad kingituse. Kalendri leiad kaardi nurgast või klõpsates külaplatsi jõulukuusele.', go: 'xmas:', lbl: 'Ava' }); o.sort((a, b) => b.pri - a.pri) } return o };
  const _ag = ACT.advGo; ACT.advGo = a => { if (a && a.startsWith('xmas')) { closeModal(); setTimeout(openAdvent, 120); return } _ag(a) };
}
ACH.push({ id: 'a50', n: 'Advendirõõm', d: 'Ava advendikalendris kõik 24 luuki', ok: s => (s.xmasBest || 0) >= 24, fame: 30 },
  { id: 'a51', n: 'Jõuluvana sõber', d: 'Püüa kinni 10 jõuluvana kinki', ok: s => (s.xmasGifts || 0) >= 10, fame: 15 });
{
  const _kr = TABS.kuningriik.r;
  TABS.kuningriik.r = () => {
    const base = _kr(); if (!xmOn()) return base;
    const st = xmSt(), n = xmCanOpen(), eve = xmDaysToEve();
    const card = `<div class="card xmcard"><div class="sec-h" style="margin:0">🎄 Jõulud Metsakuningriigis <small>${eve > 0 ? `jõululaupäevani ${eve} p` : 'häid pühi!'}</small></div>
      <p class="lead">Advendikalendris on avatud ${Object.keys(st.open).length} / 24 luuki. Jõuluvana kingid täna ${st.sl.d === dateKey() ? st.sl.n : 0} / 3.</p>
      <button class="btn" type="button" data-act="xmas" style="background:linear-gradient(180deg,#d8414a,#9a1c24);color:#fff">${n ? `Ava advendikalender (${n})` : 'Vaata advendikalendrit'}</button></div>`;
    const i = base.indexOf('<div class="card">'); return i < 0 ? card + base : base.slice(0, i) + card + base.slice(i);
  };
}

/* ---------- jõulutuled ja lumi hoonete katusel ---------- */
const XM_SIL = {};
function xmSil(type) {
  if (XM_SIL[type]) return XM_SIL[type];
  const S0 = 60, U = S0 / 20, cv = document.createElement('canvas'); cv.width = S0 * 2; cv.height = S0 * 2; const c = cv.getContext('2d');
  const ox = S0 * .5, oy = S0 * .9; let pts = [];
  try {
    c.translate(ox, oy); drawBuildingBase(c, type, 0, 0, S0, { lvl: 1, night: 0 });
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    for (let gx = -2; gx <= 22; gx += .8) {
      const px = Math.round(ox + gx * U); if (px < 0 || px >= cv.width) continue;
      for (let py = 0; py < cv.height; py++) if (d[(py * cv.width + px) * 4 + 3] > 220) { const gy = (py - oy) / U; if (gy < 13) pts.push([gx, gy]); break }
    }
    // eemalda teravikud (korstnad, lipud)
    pts = pts.filter((p, i) => { const a = pts[i - 1], b = pts[i + 1]; if (!a || !b) return true; return !(p[1] < a[1] - 2.2 && p[1] < b[1] - 2.2) });
    // tükelda lõikudeks, kus x hüppab
  } catch (e) { pts = [] }
  return XM_SIL[type] = pts;
}
const XM_BULB = ['#ff4a4a', '#ffd84a', '#4ac8ff', '#6cff7a', '#ff7ae0'];
function xmLights(c, type, px, py, s, lvl, night) {
  const pts = xmSil(type); if (pts.length < 3) return;
  const u = s / 20, sc = .88 + .06 * (Math.min(5, lvl || 1) - 1), X = v => px + (10 + (v - 10) * sc) * u, Y = v => py + (18 + (v - 18) * sc) * u, t = tnow;
  // lumi katusel
  if (season().k !== 'talv') {
    c.fillStyle = 'rgba(248,252,255,.93)'; c.beginPath(); c.moveTo(X(pts[0][0]), Y(pts[0][1] + .2));
    for (const p of pts) c.lineTo(X(p[0]), Y(p[1] - .15)); for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; c.lineTo(X(p[0]), Y(p[1] + .55 + (i % 3 === 0 ? .35 : 0))) }
    c.closePath(); c.fill();
  }
  // tulede juhe ja pirnid
  c.strokeStyle = 'rgba(30,40,30,.8)'; c.lineWidth = Math.max(.6, .18 * u); c.beginPath();
  let prev = null; const bulbs = [];
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i], x = X(p[0]), y = Y(p[1] + 1.0);
    if (!prev) c.moveTo(x, y); else { const mx = (prev[0] + x) / 2, my = Math.max(prev[1], y) + .9 * u; c.quadraticCurveTo(mx, my, x, y); bulbs.push([mx, my - .45 * u]) }
    bulbs.push([x, y]); prev = [x, y];
  }
  c.stroke();
  bulbs.forEach(([x, y], i) => {
    const col = XM_BULB[(i + Math.floor(px / s)) % XM_BULB.length], on = .55 + .45 * Math.sin(t * 2.4 + i * 1.7);
    if (night > .15) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = on * night * .75; const g = c.createRadialGradient(x, y, 0, x, y, 2.2 * u); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 2.2 * u, y - 2.2 * u, 4.4 * u, 4.4 * u); c.restore() }
    c.globalAlpha = .55 + on * .45; c.fillStyle = col; c.beginPath(); c.ellipse(x, y + .15 * u, .42 * u, .55 * u, 0, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(x - .12 * u, y, .14 * u, 0, 6.283); c.fill(); c.globalAlpha = 1;
  });
  // pärg uksele (keskel all)
  const wx = X(10), wy = Y(12.6);
  c.strokeStyle = '#1f6b34'; c.lineWidth = .7 * u; c.beginPath(); c.arc(wx, wy, .9 * u, 0, 6.283); c.stroke();
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c.fillStyle = i % 2 ? '#d8302c' : '#2e8a44'; c.beginPath(); c.arc(wx + Math.cos(a) * .9 * u, wy + Math.sin(a) * .9 * u, .25 * u, 0, 6.283); c.fill() }
  c.fillStyle = '#d8302c'; c.beginPath(); c.moveTo(wx, wy + .9 * u); c.lineTo(wx - .5 * u, wy + 1.7 * u); c.lineTo(wx + .5 * u, wy + 1.7 * u); c.fill();
}
{
  const _db = drawBuilding;
  drawBuilding = function (c, type, px, py, s, o = {}) {
    _db(c, type, px, py, s, o);
    const b = o.b; if (!b || !xmOn() || (b.done && !b.up)) return;
    try { xmLights(c, type, px, py, s, o.lvl, o.night || 0) } catch (e) { }
  };
}

/* ---------- jõulukuusk külaplatsil ---------- */
const XM = { treeTile: null, treeAt: 0, sl: null, nextSl: 0, flakes: null };
function xmFindTree() {
  if (S.view !== 'kodu') return null;
  const tiles = S.regions.kodu.tiles, st = xmSt();
  if (st.tree >= 0 && tiles[st.tree] && tiles[st.tree].t === 'grass') return tiles[st.tree];
  const bs = S.buildings.filter(b => (b.region || 'kodu') === 'kodu');
  let cx = W / 2, cy = H / 2; if (bs.length) { cx = bs.reduce((a, b) => a + b.x, 0) / bs.length; cy = bs.reduce((a, b) => a + b.y, 0) / bs.length }
  let best = -1, bd = 1e9;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const t = tiles[y * W + x]; if (t.t !== 'grass') continue;
    const up = tiles[(y - 1) * W + x]; let free = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) if (tiles[(y + dy) * W + x + dx].t === 'grass') free++;
    const dd = Math.hypot(x - cx, y - cy) - free * .6 + (up.t === 'b' ? 1.5 : 0); if (dd < bd) { bd = dd; best = y * W + x }
  }
  st.tree = best; return best >= 0 ? tiles[best] : null;
}
function xmTree(c, cx, by, s, t, night) {
  const u = s / 20, H0 = 34 * u;
  // vari ja lumi
  const g0 = c.createRadialGradient(cx, by, 0, cx, by, 10 * u); g0.addColorStop(0, 'rgba(250,252,255,.9)'); g0.addColorStop(.7, 'rgba(235,242,248,.6)'); g0.addColorStop(1, 'rgba(235,242,248,0)'); c.fillStyle = g0; c.beginPath(); c.ellipse(cx, by, 10 * u, 3 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#5a3a22'; c.fillRect(cx - 1.1 * u, by - 4 * u, 2.2 * u, 4 * u);
  // okstekorrused
  const tiers = 5;
  for (let i = 0; i < tiers; i++) {
    const k = i / (tiers - 1), yb = by - 3 * u - i * 5.6 * u, w = (9.5 - k * 6.2) * u, h = 9 * u;
    const g = c.createLinearGradient(cx - w, 0, cx + w, 0); g.addColorStop(0, '#0f4a2a'); g.addColorStop(.45, '#1f6e3e'); g.addColorStop(1, '#0b3820');
    c.fillStyle = g; c.beginPath(); c.moveTo(cx, yb - h);
    const n = 7; for (let j = 0; j <= n; j++) { const x = cx + w - j / n * 2 * w, yy = yb + (j % 2 ? -.9 * u : .4 * u) + Math.abs(j / n - .5) * -1.2 * u; c.lineTo(x, yy) }
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(248,252,255,.85)'; c.beginPath(); c.moveTo(cx - w * .9, yb - .2 * u); c.quadraticCurveTo(cx, yb - 2.2 * u, cx + w * .9, yb - .2 * u); c.quadraticCurveTo(cx, yb - 1 * u, cx - w * .9, yb - .2 * u); c.fill();
  }
  // vanik (kuldne)
  c.strokeStyle = 'rgba(255,214,110,.85)'; c.lineWidth = .45 * u;
  for (let i = 0; i < 4; i++) { const yb = by - 6 * u - i * 6 * u, w = (8 - i * 1.7) * u; c.beginPath(); c.moveTo(cx - w, yb - 2 * u); c.quadraticCurveTo(cx, yb + 1.2 * u, cx + w, yb - 3.4 * u); c.stroke() }
  // kuulid
  const BC = ['#d8302c', '#f0c040', '#3a7fd8', '#c8d0d8', '#b03aa8'];
  for (let i = 0; i < 16; i++) {
    const k = ((i * 37) % 16) / 16, yy = by - 5 * u - k * 24 * u, w = (8.6 - k * 7) * u, x = cx + (((i * 53) % 17) / 17 - .5) * 1.7 * w, r = .85 * u;
    const g = c.createRadialGradient(x - r * .35, yy - r * .35, 0, x, yy, r); g.addColorStop(0, '#fff'); g.addColorStop(.25, BC[i % 5]); g.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = g; c.beginPath(); c.arc(x, yy, r, 0, 6.283); c.fill();
  }
  // tuled
  for (let i = 0; i < 22; i++) {
    const k = ((i * 29) % 22) / 22, yy = by - 4.5 * u - k * 25 * u, w = (8.8 - k * 7.2) * u, x = cx + (((i * 71) % 19) / 19 - .5) * 1.8 * w, on = .5 + .5 * Math.sin(t * 3 + i * 2.3), col = XM_BULB[i % 5];
    if (night > .1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = on * night * .7; const g = c.createRadialGradient(x, yy, 0, x, yy, 2.4 * u); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - 2.4 * u, yy - 2.4 * u, 4.8 * u, 4.8 * u); c.restore() }
    c.globalAlpha = .5 + on * .5; c.fillStyle = col; c.beginPath(); c.arc(x, yy, .38 * u, 0, 6.283); c.fill(); c.globalAlpha = 1;
  }
  // täht
  const sy = by - H0 + 1.5 * u, pulse = .8 + .2 * Math.sin(t * 2);
  c.save(); c.globalCompositeOperation = 'lighter'; const sg = c.createRadialGradient(cx, sy, 0, cx, sy, 7 * u * pulse); sg.addColorStop(0, `rgba(255,230,140,${.55 + night * .35})`); sg.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = sg; c.fillRect(cx - 7 * u, sy - 7 * u, 14 * u, 14 * u); c.restore();
  c.fillStyle = '#ffd84a'; c.strokeStyle = '#c8901a'; c.lineWidth = .3 * u; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 1.1 : 2.6) * u; c.lineTo(cx + Math.cos(a) * r, sy + Math.sin(a) * r) } c.closePath(); c.fill(); c.stroke();
  // kingipakid
  const P = [[-6.5, '#c8302c', '#f0d060', 3.4, 2.8], [5.6, '#2e6ad0', '#f4f4f4', 3, 2.4], [-2.6, '#2e8a44', '#d8302c', 2.6, 2], [2.4, '#b03aa8', '#f0d060', 2.2, 1.8]];
  for (const [dx, col, rib, w, h] of P) {
    const x = cx + dx * u - w * u / 2, y = by - h * u + .6 * u;
    c.fillStyle = col; c.fillRect(x, y, w * u, h * u); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x, y, w * u, .5 * u);
    c.fillStyle = rib; c.fillRect(x + w * u / 2 - .25 * u, y, .5 * u, h * u); c.fillRect(x, y + h * u / 2 - .2 * u, w * u, .4 * u);
    c.beginPath(); c.ellipse(x + w * u / 2 - .5 * u, y - .3 * u, .55 * u, .35 * u, -.5, 0, 6.283); c.ellipse(x + w * u / 2 + .5 * u, y - .3 * u, .55 * u, .35 * u, .5, 0, 6.283); c.fill();
  }
}
{
  const _dt = drawTile;
  drawTile = function (c, tile, px, py, s, night) {
    _dt(c, tile, px, py, s, night);
    if (tile === XM.treeTile && xmOn() && S.view === 'kodu') try { xmTree(c, px + s / 2, py + s * .92, s * 1.05, tnow, night || 0) } catch (e) { }
  };
}

/* ---------- jõuluvana saan + lumehelbed ---------- */
function xmSleighPos(sl) { const k = (Date.now() - sl.t0) / sl.dur, x = sl.dir > 0 ? -4 + k * (W + 8) : W + 4 - k * (W + 8), y = sl.y + Math.sin(k * 9) * .35; return { k, x, y } }
function xmDrawSleigh(c, s, night) {
  const sl = XM.sl; if (!sl) return; const { k, x, y } = xmSleighPos(sl); if (k >= 1) { XM.sl = null; return }
  const u = s / 20, t = tnow, X = x * s, Y = y * s;
  c.save(); c.translate(X, Y); if (sl.dir < 0) c.scale(-1, 1);
  // sädemejälg
  for (let i = 0; i < 14; i++) { const tx = -14 * u - i * 3.2 * u, ty = 3 * u + Math.sin(t * 6 + i) * u, a = 1 - i / 14; c.fillStyle = `rgba(255,${200 + i * 3},120,${a * .7})`; c.beginPath(); c.arc(tx, ty, (1.1 - i * .05) * u, 0, 6.283); c.fill() }
  // saan
  c.fillStyle = '#8a1a1e'; c.beginPath(); c.moveTo(-12 * u, -3 * u); c.lineTo(-2 * u, -3 * u); c.quadraticCurveTo(0, -3 * u, 0, 1 * u); c.lineTo(-11 * u, 3 * u); c.quadraticCurveTo(-13.5 * u, 2 * u, -12 * u, -3 * u); c.fill();
  c.fillStyle = '#c42a2e'; c.beginPath(); c.moveTo(-11.5 * u, -2.6 * u); c.lineTo(-2.4 * u, -2.6 * u); c.quadraticCurveTo(-.8 * u, -2.4 * u, -.8 * u, .4 * u); c.lineTo(-10.6 * u, 2.2 * u); c.closePath(); c.fill();
  c.strokeStyle = '#f0c040'; c.lineWidth = .7 * u; c.beginPath(); c.moveTo(-13 * u, 4.6 * u); c.lineTo(-1 * u, 4.6 * u); c.quadraticCurveTo(1.6 * u, 4.6 * u, 1.4 * u, 2.4 * u); c.stroke();
  c.lineWidth = .45 * u; c.beginPath(); c.moveTo(-10 * u, 2.6 * u); c.lineTo(-10 * u, 4.6 * u); c.moveTo(-3.5 * u, 1.6 * u); c.lineTo(-3.5 * u, 4.6 * u); c.stroke();
  // kingikott
  c.fillStyle = '#7a5a32'; c.beginPath(); c.ellipse(-10 * u, -4.4 * u, 2.6 * u, 2.4 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#2e8a44'; c.fillRect(-11.6 * u, -8 * u, 1.8 * u, 1.8 * u); c.fillStyle = '#2e6ad0'; c.fillRect(-9.6 * u, -7.6 * u, 1.6 * u, 1.6 * u);
  // jõuluvana
  c.fillStyle = '#c42a2e'; c.beginPath(); c.ellipse(-5.6 * u, -4.6 * u, 2 * u, 2.4 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#f4e2c8'; c.beginPath(); c.arc(-5.2 * u, -7.4 * u, 1.2 * u, 0, 6.283); c.fill();
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(-5 * u, -6.4 * u, 1.3 * u, 1.1 * u, 0, 0, 6.283); c.fill();
  c.fillStyle = '#c42a2e'; c.beginPath(); c.moveTo(-6.4 * u, -8 * u); c.quadraticCurveTo(-5.2 * u, -10.6 * u, -3 * u, -9.6 * u); c.lineTo(-4.2 * u, -8 * u); c.fill(); c.fillStyle = '#fff'; c.fillRect(-6.5 * u, -8.3 * u, 2.6 * u, .6 * u); c.beginPath(); c.arc(-3 * u, -9.6 * u, .45 * u, 0, 6.283); c.fill();
  // ohjad + põhjapõdrad
  c.strokeStyle = 'rgba(80,40,20,.9)'; c.lineWidth = .3 * u; c.beginPath(); c.moveTo(-4 * u, -4 * u); c.quadraticCurveTo(3 * u, -1 * u, 7 * u, -2.6 * u); c.moveTo(-4 * u, -4 * u); c.quadraticCurveTo(8 * u, -2 * u, 14 * u, -3.2 * u); c.stroke();
  const deer = (dx, ph, rud) => {
    const lg = Math.sin(t * 9 + ph) * .9 * u;
    c.save(); c.translate(dx * u, -2.4 * u);
    c.strokeStyle = '#5a3a20'; c.lineWidth = .45 * u; c.beginPath(); c.moveTo(-1.6 * u, .6 * u); c.lineTo(-2.2 * u + lg, 3 * u); c.moveTo(-1 * u, .6 * u); c.lineTo(-.6 * u - lg, 3 * u); c.moveTo(1.2 * u, .6 * u); c.lineTo(1.8 * u + lg, 3 * u); c.moveTo(1.6 * u, .6 * u); c.lineTo(2.4 * u - lg, 2.8 * u); c.stroke();
    c.fillStyle = '#8a5a32'; c.beginPath(); c.ellipse(0, 0, 2.4 * u, 1.2 * u, -.08, 0, 6.283); c.fill();
    c.beginPath(); c.moveTo(1.8 * u, -.4 * u); c.lineTo(2.8 * u, -2.2 * u); c.lineTo(3.5 * u, -1.8 * u); c.lineTo(2.6 * u, .2 * u); c.fill();
    c.beginPath(); c.ellipse(3.4 * u, -2.3 * u, 1 * u, .6 * u, .3, 0, 6.283); c.fill();
    c.strokeStyle = '#d8c09a'; c.lineWidth = .3 * u; c.beginPath(); c.moveTo(3 * u, -2.8 * u); c.lineTo(2.6 * u, -4.4 * u); c.lineTo(2 * u, -4.9 * u); c.moveTo(2.6 * u, -4.4 * u); c.lineTo(3.2 * u, -5 * u); c.moveTo(3.4 * u, -2.8 * u); c.lineTo(3.6 * u, -4.2 * u); c.lineTo(4.2 * u, -4.6 * u); c.stroke();
    if (rud) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(4.4 * u, -2.2 * u, 0, 4.4 * u, -2.2 * u, 2 * u); g.addColorStop(0, 'rgba(255,60,50,.8)'); g.addColorStop(1, 'rgba(255,0,0,0)'); c.fillStyle = g; c.fillRect(2.4 * u, -4.2 * u, 4 * u, 4 * u); c.restore(); c.fillStyle = '#ff3a30'; c.beginPath(); c.arc(4.4 * u, -2.2 * u, .45 * u, 0, 6.283); c.fill() }
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(3.3 * u, -2.5 * u, .15 * u, 0, 6.283); c.fill();
    c.restore();
  };
  deer(6, 0, false); deer(12.5, 1.6, true);
  c.restore();
}
function xmFlakes(c, s) {
  if (['lumi', 'torm', 'vihm'].includes(S.weather.t)) return;
  if (!XM.flakes) XM.flakes = Array.from({ length: 70 }, (_, i) => ({ a: Math.random(), b: Math.random(), sp: .25 + Math.random() * .5, r: .6 + Math.random() * 1.4 }));
  const t = tnow, w = W * s, h = H * s; c.fillStyle = 'rgba(255,255,255,.8)';
  for (const f of XM.flakes) { const y = ((f.b * h + t * f.sp * s) % h), x = (f.a * w + Math.sin(t * .8 + f.a * 9) * s * .3 + t * s * .05) % w; c.beginPath(); c.arc(x, y, f.r, 0, 6.283); c.fill() }
}
{
  const _lo = drawLifeOverlay;
  drawLifeOverlay = function (c, s) {
    _lo(c, s); if (!xmOn()) return;
    try {
      if (S.view === 'kodu') { const tt = xmFindTree(); if (tt !== XM.treeTile) XM.treeTile = tt }
      xmFlakes(c, s);
      const now = Date.now(); if (!XM.nextSl) XM.nextSl = now + 45000;
      if (!XM.sl && now > XM.nextSl) {
        XM.sl = { t0: now, dur: 17000, dir: Math.random() < .5 ? 1 : -1, y: 1.4 + Math.random() * 2.2, got: false }; XM.nextSl = now + 150000 + Math.random() * 150000;
        sfx('jingle'); const st = xmSt(); if ((st.sl.d === dateKey() ? st.sl.n : 0) < 3) toast('Jõuluvana lendab saaniga üle kuningriigi! Klõpsa kiiresti saanil, siis viskab ta sulle kingi.', 'info');
      }
      xmDrawSleigh(c, s, skyState().dark);
    } catch (e) { }
  };
}
function xmSleighHit(x, y) {
  const sl = XM.sl; if (!sl || sl.got || !xmOn()) return false;
  const p = xmSleighPos(sl), cx = p.x - sl.dir * .3; if (Math.abs(x + .5 - cx) > 1.9 || Math.abs(y + .5 - p.y) > 1.3) return false;
  sl.got = true; const st = xmSt(), today = dateKey(); if (st.sl.d !== today) st.sl = { d: today, n: 0 };
  if (st.sl.n >= 3) { toast('Jõuluvana lehvitab sulle! Tänased kingid on juba jagatud, homme jälle.', 'info'); return true }
  st.sl.n++; S.xmasGifts = (S.xmasGifts || 0) + 1;
  const L = S.level, opts = [{ gold: 40 + L * 12 }, { wood: 30 + L * 6, stone: 20 + L * 5 }, { food: 30 + L * 6, berries: 30 + L * 5 }, { xp: 20 + L * 4, gold: 20 + L * 5 }], rew = opts[Math.floor(Math.random() * opts.length)];
  give(rew); sfx('bells'); if (typeof sparkle === 'function') sparkle(x + .5, y + .5, '#ffd84a', 22);
  toast(`Jõuluvana viskas sulle kingipaki! ${rewardText(rew)} (täna ${st.sl.n} / 3)`, 'gold', 'gold'); return true;
}
{
  const _it = interactTile;
  interactTile = function (x, y) {
    if (xmSleighHit(x, y)) return;
    if (xmOn() && S.view === 'kodu' && XM.treeTile && S.regions.kodu.tiles[y * W + x] === XM.treeTile) { openAdvent(); return }
    return _it(x, y);
  };
}
