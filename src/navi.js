/* =====================================================================
   Ühine menüü: kuningriik ja kalapüük on üks mäng. All on alati menüüriba
   (🏡 Kodu · 🎣 Püük · 🎒 Saak · 🎪 Sündmused · 👥 Sõbrad), vahetus käib ühe puudutusega.
   Sisseloginud mängija jõuab mängu avades sinna, kus ta viimati oli (vaikimisi kalapüük).
   ===================================================================== */
const MN = { last: '' };
const MN_ITEMS = [
  ['kodu', '🏡', 'Kodu'], ['puuk', '🎣', 'Püük'], ['saak', '🎒', 'Saak'], ['sundmused', '🎪', 'Sündmused'], ['sobrad', '👥', 'Sõbrad']
];
document.head.insertAdjacentHTML('beforeend', `<style>
.mnav{position:fixed;z-index:35;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 10px);display:flex;gap:4px;padding:5px;
  border-radius:20px;background:linear-gradient(180deg,rgba(18,40,34,.94),rgba(8,22,20,.96));border:1px solid rgba(160,220,190,.18);
  box-shadow:0 12px 34px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(10px)}
.mnav[hidden]{display:none}
.mnav button{position:relative;display:grid;justify-items:center;gap:1px;min-width:74px;padding:7px 10px 6px;border:0;border-radius:15px;background:transparent;
  color:#b8cfc4;font:700 11.5px/1.1 inherit;cursor:pointer;transition:background .18s,color .18s,transform .12s}
.mnav button i{font-style:normal;font-size:21px;line-height:1.1;transition:transform .2s}
.mnav button:hover{background:rgba(255,255,255,.06);color:#eaf6ef}
.mnav button:active{transform:scale(.95)}
.mnav button.on{color:#fff;background:linear-gradient(180deg,rgba(255,200,110,.22),rgba(255,170,70,.1));box-shadow:inset 0 0 0 1px rgba(255,200,120,.38)}
.mnav button.on i{transform:translateY(-1px) scale(1.12)}
.mnav button.on::after{content:'';position:absolute;bottom:2px;left:30%;right:30%;height:3px;border-radius:3px;background:#ffc86e;box-shadow:0 0 8px rgba(255,190,90,.8)}
.mnav button:focus-visible{outline:2px solid #ffd28a;outline-offset:1px}
.mnav .dot{position:absolute;top:2px;right:12px;min-width:17px;height:17px;padding:0 4px;border-radius:9px;background:#e8463a;color:#fff;font:800 10.5px/17px system-ui;text-align:center;box-shadow:0 0 0 2px #0c1d18}
body.has-mnav .game{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 78px)}
body.has-mnav .fv{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 92px)}
body.has-mnav .sk-bar{bottom:calc(env(safe-area-inset-bottom,0px) + 84px)}
.fv.mn-in{animation:mnIn .28s cubic-bezier(.2,.8,.3,1)}
.game.mn-in{animation:mnFade .28s ease}
@keyframes mnIn{from{opacity:0;transform:translateY(14px)}}
@keyframes mnFade{from{opacity:.4}}
@media (max-width:600px){
  .mnav{left:0;right:0;transform:none;bottom:0;border-radius:18px 18px 0 0;padding:5px 6px calc(env(safe-area-inset-bottom,0px) + 5px);justify-content:space-around;gap:0}
  .mnav button{min-width:0;flex:1;padding:6px 2px 5px;font-size:10.5px}
  .mnav .dot{right:calc(50% - 22px)}
  body.has-mnav .game{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 66px)}
  body.has-mnav .fv{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 80px)}
  body.has-mnav .sk-bar{bottom:calc(env(safe-area-inset-bottom,0px) + 70px)}
}
@media (prefers-reduced-motion:reduce){.fv.mn-in,.game.mn-in{animation:none}.mnav button.on i{transform:none}}
</style>`);
document.body.insertAdjacentHTML('beforeend', '<nav class="mnav" id="mnav" hidden aria-label="Peamenüü"></nav>');

function mnWhere() {
  if (FV.open) return FV.tab === 'saak' ? 'saak' : FV.tab === 'sundmused' ? 'sundmused' : 'puuk';
  return UI.tab === 'sobrad' ? 'sobrad' : 'kodu';
}
function mnSum(o, skip) { let n = 0; for (const k in o) if (!skip.includes(k)) n += +o[k] || 0; return n }
function mnBadges() {
  const b = {};
  try { const kb = S ? badges() : {}; b.kodu = mnSum(kb, ['sobrad']); b.sobrad = +kb.sobrad || 0 } catch (e) { }
  try { if (FS) { const fb = fvBadges(); b.saak = +fb.saak || 0; b.sundmused = +fb.sundmused || 0; b.puuk = mnSum(fb, ['saak', 'sundmused', 'uudised']) } } catch (e) { }
  return b;
}
function mnRender() {
  const nav = document.getElementById('mnav'), g = document.getElementById('game');
  const show = !!(g && !g.hidden && S);
  nav.hidden = !show; document.body.classList.toggle('has-mnav', show);
  if (!show) return;
  const on = mnWhere(), b = mnBadges();
  const html = MN_ITEMS.map(([k, ic, n]) => `<button type="button" data-mn="${k}" class="${on === k ? 'on' : ''}" aria-current="${on === k ? 'page' : 'false'}"><i>${ic}</i>${n}${b[k] ? `<span class="dot">${b[k] > 99 ? '99+' : b[k]}</span>` : ''}</button>`).join('');
  if (html !== MN.last) { nav.innerHTML = html; MN.last = html }
}
function mnRemember(k) { try { localStorage.setItem('mk.place', k === 'kodu' || k === 'sobrad' ? 'kodu' : 'kala') } catch (e) { } }
async function mnGo(k) {
  if (k === 'kodu' || k === 'sobrad') {
    if (FV.open) { closeFishView(); const g = $('#game'); g.classList.remove('mn-in'); void g.offsetWidth; g.classList.add('mn-in') }
    UI.tab = k === 'sobrad' ? 'sobrad' : (UI.tab === 'sobrad' ? 'ehita' : UI.tab);
    renderTabs(true); renderPanel(true);
    if (k === 'sobrad' && typeof loadCoop === 'function') loadCoop();
    // telefonis on paneel kaardi all – keri see nähtavale (Kodu puhul tagasi üles)
    if (innerWidth <= 900) setTimeout(() => { if (k === 'sobrad') { const p = document.getElementById('tabs'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }) } else scrollTo({ top: 0, behavior: 'smooth' }) }, 60);
  } else {
    if (!CL.user) { openFishView(k); return }
    if (FV.open) { if (FV.tab !== k) { FV.tab = k; renderFV(true); $('#fishView').scrollTop = 0 } }
    else { const fv = $('#fishView'); fv.classList.remove('mn-in'); void fv.offsetWidth; fv.classList.add('mn-in'); await openFishView(k) }
  }
  mnRemember(k); mnRender();
}
document.getElementById('mnav').addEventListener('click', e => { const b = e.target.closest('[data-mn]'); if (b) mnGo(b.dataset.mn) });
// mäng avaneb sinna, kus mängija viimati oli (sisseloginul vaikimisi kalapüük)
{
  const _eg = enterGame;
  enterGame = function () {
    _eg();
    let p = 'kala'; try { p = localStorage.getItem('mk.place') || 'kala' } catch (e) { }
    if (CL.user && p === 'kala' && !UI.modalView) setTimeout(() => { if (!FV.open && !UI.modalView) openFishView('puuk') }, 300);
    mnRender();
  };
  const _cf = closeFishView; closeFishView = function () { _cf(); mnRemember('kodu'); mnRender() };
  const _of = openFishView; openFishView = async function (tab) { const r = await _of(tab); if (FV.open) mnRemember('puuk'); mnRender(); return r };
}
setInterval(mnRender, 1000);
