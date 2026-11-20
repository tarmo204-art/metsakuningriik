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
