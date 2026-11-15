/* =====================================================================
   Kala kaotsimise teavitused püügivaates: igal sündmusel oma pealkiri, tekst, värv ja animatsioon.
   Ebaõnnestumine – oranž/punane, kala vabastamine – rahulik roheline, õnge murdumine – eraldi
   pragunemise animatsioon ja heli. Õnge parandamise taimer käib päris aja järgi.
   Tekstid on kirjutanud mängija ise.
   ===================================================================== */
const LOSS = {
  early: { t: 'LIIGA VARA!', b: 'Kala ehmus ja ujus minema! Oota, kuni ujuk vee alla tõmmatakse, ning haagi kala õigel hetkel.', c: '#ffb15a', ic: '⏱️', fx: 'fail' },
  late: { t: 'LIIGA HILJA!', b: 'Kala jõudis minema ujuda! Järgmine kord reageeri kiiremini.', c: '#ffb15a', ic: '⏳', fx: 'fail' },
  bait: { t: 'SÖÖT LÄINUD!', b: 'Kala sõi sööda ära ja ujus minema. Sa ei jõudnud õigel ajal reageerida.', c: '#ffb15a', ic: '🪱', fx: 'fail' },
  slack: { t: 'NÖÖR LÄKS LÕDVAKS!', b: 'Kala kasutas võimalust ja rebis end õnge otsast lahti!', c: '#ff7a68', ic: '〰️', fx: 'fail' },
  last: { t: 'VIIMASEL HETKEL PÄÄSES!', b: n => `${n || 'Kala'} oli juba peaaegu sinu saak, kuid pääses viimasel hetkel õnge otsast!`, c: '#ff7a68', ic: '💨', fx: 'fail' },
  gone: { t: 'KALA PÄÄSES!', b: 'Kala osutus sinust kavalamaks ja ujus tagasi järvesügavustesse.', c: '#ff7a68', ic: '🌊', fx: 'fail' },
  release: { t: 'KALA VABASTATUD!', b: 'Lasid kala tagasi vette. Õng jäi terveks ja kala saab rahulikult edasi ujuda.', c: '#7fe0a0', ic: '🌿', fx: 'calm' },
  broken: { t: 'KRÕKS! ÕNG MURDUS!', b: 'Sinu õnge otsa sattus tõeline hiiglane!', c: '#ff5a48', ic: '💥', fx: 'break' }
};
document.head.insertAdjacentHTML('beforeend', `<style>
.fvmsg.ls{display:grid;gap:6px;padding:14px 16px;border-radius:16px;color:#f4f2ee;font-weight:600;
  background:radial-gradient(120% 140% at 0% 0%,color-mix(in srgb,var(--lc) 26%,transparent),transparent 60%),rgba(10,20,26,.82);
  border:1px solid color-mix(in srgb,var(--lc) 55%,transparent);box-shadow:0 8px 24px rgba(0,0,0,.3),0 0 22px color-mix(in srgb,var(--lc) 22%,transparent)}
.ls h4{margin:0;display:flex;align-items:center;gap:10px;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:26px;line-height:1.05;color:var(--lc);text-shadow:0 2px 10px rgba(0,0,0,.45)}
.ls h4 i{font-style:normal;font-size:24px}
.ls p{margin:0;font-size:15px;line-height:1.45;color:#eef2f0;font-weight:600}
.ls ul{margin:2px 0;padding-left:20px;display:grid;gap:2px;font-size:14.5px;color:#f2e8e4}
.ls ul b{color:#fff}
.ls .wh{font-weight:800;color:#ffd8c8;margin-top:4px}
.ls .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.ls .tm{font-weight:800;color:#ffe2a6;font-variant-numeric:tabular-nums}
.ls.fail{animation:lsShake .5s cubic-bezier(.36,.07,.19,.97) both}
.ls.calm{animation:lsCalm .7s ease both}
.ls.break{animation:lsBreak .65s cubic-bezier(.2,1.4,.4,1) both}
.ls.break h4{letter-spacing:.02em}
@keyframes lsShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
@keyframes lsCalm{from{opacity:0;transform:translateY(8px)}}
@keyframes lsBreak{0%{opacity:0;transform:scale(1.15)}30%{opacity:1;transform:scale(.97)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.ls.fail,.ls.calm,.ls.break{animation:none}}
</style>`);

function lossHtml(L) {
  const D = LOSS[L.k]; if (!D) return '';
  const body = typeof D.b === 'function' ? D.b(esc(L.name || '')) : D.b;
  let h = `<h4><i>${D.ic}</i>${D.t}</h4><p>${body}</p>`;
  if (L.k === 'broken') {
    h += `<ul><li>Kala tegelik kaal: <b>${fKg(L.w)}</b></li>${L.est ? `<li>Sinu hinnang kala kaalule: <b>~${fKg(L.est)}</b></li>` : ''}<li>Sinu õnge kandevõime: <b>${fKg(L.str)}</b></li></ul>
      <p>Õng ei pidanud kala raskusele vastu ja murdus!</p><p class="wh">Mida nüüd teha?</p>
      <p>Meister saab sinu õnge tasuta parandada 2 tunni jooksul või võid selle koheselt parandada.</p><p><b>Nii suurte kalade püüdmiseks vajad tugevamat õnge!</b></p>`;
    const at = typeof rodRepairAt === 'function' ? rodRepairAt(FS.rod) : 0;
    if (FS.rod_broken) h += `<div class="acts">${at > Date.now() ? `<span class="tm" data-lstm="${at}">🔧 Meister parandab: valmis ${lsLeft(at - Date.now())} pärast</span>` : `<button class="btn sm ghost" type="button" data-fa="repairFree">🔧 Meister parandab tasuta (2 h)</button>`}
      <button class="btn sm" type="button" data-fa="repair" ${FS.gold < repairCost2() ? 'disabled' : ''}>⚡ Paranda kohe (${fmt(repairCost2())} kulda)</button></div>`;
    else h += `<p class="tm">✓ Õng on jälle terve!</p>`;
  }
  return h;
}
function lsLeft(ms) { const s = Math.max(0, Math.ceil(ms / 1000)), hh = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return hh ? `${hh} h ${String(m).padStart(2, '0')} min` : `${m} min ${String(x).padStart(2, '0')} s` }
{
  const _r = renderFV;
  renderFV = function (force) {
    const r = _r(force);
    const L = FV.loss, el = document.getElementById('fvMsg');
    if (el && FV.phase === 'lost' && L && LOSS[L.k]) {
      const D = LOSS[L.k], fresh = !L.shown; L.shown = true;
      el.className = `fvmsg ls ${fresh ? D.fx : ''}`; el.style.setProperty('--lc', D.c); el.innerHTML = lossHtml(L);
    }
    return r;
  };
}
// parandamise taimer käib päris aja järgi
setInterval(() => {
  document.querySelectorAll('[data-lstm]').forEach(el => { const at = +el.dataset.lstm, left = at - Date.now();
    if (left <= 0) { el.textContent = '✓ Meister parandas õnge ära!'; refreshFS().then(() => renderFV(true)).catch(() => { }) } else el.textContent = `🔧 Meister parandab: valmis ${lsLeft(left)} pärast` });
}, 1000);

// püügivaate värviefekt: punakas/oranž ebaõnnestumisel, roheline vabastamisel, õnge murdumisel pragunemine
{
  const _fx = drawFx;
  drawFx = function (c, w, h, dt, t) {
    _fx(c, w, h, dt, t);
    const L = FV.loss; if (!L || FV.phase !== 'lost' || !L.at) return;
    const D = LOSS[L.k], a = (performance.now() - L.at) / 1000; if (!D || a > 2.2) return;
    const k = Math.max(0, 1 - a / 2.2);
    if (D.fx === 'calm') {
      c.save(); c.globalCompositeOperation = 'screen'; const g = c.createRadialGradient(FX.bx, FX.by, 0, FX.bx, FX.by, w * .6); g.addColorStop(0, `rgba(120,230,150,${.35 * k})`); g.addColorStop(1, 'rgba(120,230,150,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) { const yy = FX.by - a * 40 - i * 10, xx = FX.bx + Math.sin(a * 3 + i) * 20; c.fillStyle = `rgba(190,255,200,${.6 * k})`; c.beginPath(); c.arc(xx, yy, 2, 0, 6.283); c.fill() }
      c.restore(); return;
    }
    // oranž / punane serv
    const col = D.c === '#ffb15a' ? '255,160,70' : '255,80,60';
    const vg = c.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, w * .7); vg.addColorStop(0, `rgba(${col},0)`); vg.addColorStop(1, `rgba(${col},${.45 * k})`); c.fillStyle = vg; c.fillRect(0, 0, w, h);
    if (D.fx === 'break') {
      // välgatus ja praod üle pildi
      if (a < .25) { c.fillStyle = `rgba(255,240,230,${(.25 - a) * 2.4})`; c.fillRect(0, 0, w, h) }
      if (!L.cracks) { L.cracks = []; for (let i = 0; i < 6; i++) { const pts = [[w * .5, h * .45]]; let x = w * .5, y = h * .45, ang = i / 6 * Math.PI * 2 + Math.random() * .5; for (let s = 0; s < 6; s++) { ang += (Math.random() - .5) * .9; x += Math.cos(ang) * w * .06; y += Math.sin(ang) * h * .1; pts.push([x, y]) } L.cracks.push(pts) } }
      c.save(); c.strokeStyle = `rgba(255,255,255,${.85 * k})`; c.lineWidth = 2; c.shadowColor = 'rgba(255,90,60,.9)'; c.shadowBlur = 8;
      const grow = Math.min(1, a / .3);
      for (const pts of L.cracks) { const n = Math.max(2, Math.round(pts.length * grow)); c.beginPath(); pts.slice(0, n).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke() }
      c.restore();
      if (a < .05 && !L.sfx) { L.sfx = true; FX.shake = .45; if (typeof sfx === 'function') { sfx('snap'); setTimeout(() => sfx('snap'), 120) } }
    }
  };
}
