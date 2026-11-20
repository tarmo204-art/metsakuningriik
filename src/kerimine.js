/* =====================================================================
   Sujuv kerimine telefonis: kui mängija parasjagu kerib (sõrm ekraanil või leht alles liigub),
   ei joonistata kalapüügi lehte taustal uuesti – uuendus tehakse kohe pärast kerimise lõppu.
   Mängija enda vajutused (renderFV(true)) joonistatakse alati kohe.
   ===================================================================== */
const SCR = { touch: false, last: 0, pending: false, timer: 0 };
// ainult sõrme liigutamine (mitte lihtne puudutus/vajutus) loeb kerimiseks – nupuvajutused jäävad kiireks
document.addEventListener('touchmove', e => { if (e.target.closest && e.target.closest('#fishView')) { SCR.touch = true; SCR.last = Date.now() } }, { passive: true, capture: true });
document.addEventListener('touchend', () => { if (SCR.touch) { SCR.touch = false; SCR.last = Date.now(); scrFlush() } }, { passive: true, capture: true });
document.addEventListener('touchcancel', () => { SCR.touch = false; SCR.last = Date.now(); scrFlush() }, { passive: true, capture: true });
document.addEventListener('scroll', e => { if (e.target && e.target.id === 'fishView') { SCR.last = Date.now(); if (SCR.pending) scrFlush() } }, { passive: true, capture: true });
function scrBusy() { return SCR.touch || Date.now() - SCR.last < 700 }
function scrFlush() {
  clearTimeout(SCR.timer);
  SCR.timer = setTimeout(() => { if (!SCR.pending) return; if (scrBusy()) return scrFlush(); SCR.pending = false; renderFV() }, 750);
}
{
  const _r = renderFV;
  renderFV = function (force) {
    if (!force && scrBusy()) { SCR.pending = true; scrFlush(); return }
    SCR.pending = false; return _r.apply(this, arguments);
  };
}
// kerimise ajal peatatakse kalapüügi lehe kaunistuste animatsioonid (pealkirja tilgad, vilkuvad täpid, kuma-riba),
// et telefon saaks kogu jõu kerimisele anda; kohe pärast kerimist liiguvad need edasi
document.head.insertAdjacentHTML('beforeend', `<style>#fishView.scr-on *,#fishView.scr-on *::before,#fishView.scr-on *::after{animation-play-state:paused!important}</style>`);
{
  let t = 0;
  const on = () => { const fv = document.getElementById('fishView'); if (!fv) return; if (!fv.classList.contains('scr-on')) fv.classList.add('scr-on'); clearTimeout(t); t = setTimeout(function off() { if (scrBusy()) { t = setTimeout(off, 300); return } fv.classList.remove('scr-on') }, 750) };
  document.addEventListener('touchmove', e => { if (e.target.closest && e.target.closest('#fishView')) on() }, { passive: true, capture: true });
  document.addEventListener('scroll', e => { if (e.target && e.target.id === 'fishView') on() }, { passive: true, capture: true });
}
