/* =====================================================================
   Eellaadimine: et kalapüük ja selle vahekaardid avaneksid kohe
   - mängu alguses (kui oled sisse logitud) laetakse taustal kalapüügi andmed
   - kui kalapüük on lahti, laetakse tasapisi ette ka teiste vahekaartide andmed
     (Kalurimaja, Töökoda, Suitsuahi, Äripartnerid, Sadam, Sündmused, Varustus, Kaardid)
   Päringud tehakse ükshaaval väikese vahega, et server ei saaks korraga liiga palju.
   ===================================================================== */
const EEL = { start: false, tabs: false };
function eelIdle(fn, ms) { setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : fn()), ms) }
// 1) mängu alguses: kalapüügi põhiandmed
(function eelBoot() {
  if (EEL.start) return;
  if (typeof CL === 'undefined' || !CL.user || document.hidden) { setTimeout(eelBoot, 2500); return }
  EEL.start = true;
  eelIdle(async () => { try { await loadFD(); if (!FS) await refreshFS() } catch (e) { } }, 1500);
})();
// 2) kui kalapüük avatakse: teiste vahekaartide andmed ükshaaval
function eelTabs() {
  if (EEL.tabs) return; EEL.tabs = true;
  const list = [
    () => typeof KTK !== 'undefined' && !KTK.d && typeof ktLoad === 'function' && ktLoad(true),
    () => typeof CB !== 'undefined' && !CB.d && typeof cbLoad === 'function' && cbLoad(),
    () => typeof BZ !== 'undefined' && !BZ.d && typeof bzLoad === 'function' && bzLoad(true),
    () => typeof SM !== 'undefined' && !SM.d && typeof smLoad === 'function' && smLoad(true),
    () => typeof SD !== 'undefined' && !SD.d && typeof sdLoad === 'function' && sdLoad(true),
    () => typeof EV !== 'undefined' && !EV.d && typeof evLoad === 'function' && evLoad(),
    () => typeof KV !== 'undefined' && !KV.d && typeof kvLoad === 'function' && kvLoad(),
    () => typeof KA !== 'undefined' && !KA.d && typeof kaLoad === 'function' && kaLoad(),
    () => typeof OSK !== 'undefined' && !OSK.d && typeof oskLoad === 'function' && oskLoad(),
    () => typeof DR !== 'undefined' && !DR.d && typeof drLoad === 'function' && drLoad()
  ];
  let i = 0;
  const next = () => { if (i >= list.length || !FV.open) { if (i < list.length) EEL.tabs = false; return } const f = list[i++]; try { const p = f(); if (p && p.then) p.catch(() => { }) } catch (e) { } eelIdle(next, 900) };
  eelIdle(next, 2500);
}
{
  const _o = openFishView;
  openFishView = async function () { const r = _o.apply(this, arguments); eelTabs(); return r };
}
