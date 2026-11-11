/* ===== Äpina paigaldamine (PWA) – ainult veebiversioonis ===== */
const PWA = { ev: null, done: false };
const pwaStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const pwaIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if ('serviceWorker' in navigator && location.protocol === 'https:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PWA.ev = e; if (S && UI.tab === 'kuningriik') renderPanel(true) });
window.addEventListener('appinstalled', () => { PWA.ev = null; PWA.done = true; try { localStorage.setItem('mk.pwaDone', '1') } catch (e) { } toast('Metsakuningriik on nüüd sinu avaekraanil! Ava mäng sealt nagu tavalist äppi.', 'good', 'gold'); hidePwaBar(); if (S) renderPanel(true) });
{
  const st = document.createElement('style'); st.textContent = `
.pwacard{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}
.pwacard img{width:58px;height:58px;border-radius:14px;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.pwasteps{display:grid;gap:6px;margin:8px 0 0;padding:0;list-style:none;counter-reset:s}
.pwasteps li{counter-increment:s;display:flex;gap:8px;align-items:center;font-size:13.5px}
.pwasteps li::before{content:counter(s);flex:none;width:22px;height:22px;border-radius:50%;background:#f2b552;color:#1a1208;font-weight:800;display:grid;place-items:center;font-size:12px}
.pwabar{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:60;display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:rgba(14,30,22,.97);border:1px solid rgba(242,181,82,.55);box-shadow:0 10px 30px rgba(0,0,0,.5);color:#f4ead0;max-width:520px;margin:0 auto;animation:pwaIn .4s ease-out}
.pwabar img{width:44px;height:44px;border-radius:11px}.pwabar div{flex:1;font-size:13px;line-height:1.3}.pwabar b{display:block;font-size:14px}
@keyframes pwaIn{from{transform:translateY(30px);opacity:0}}`; document.head.appendChild(st);
}
function pwaHow() {
  if (PWA.ev) return `<button class="btn" type="button" data-act="pwaInstall">📲 Paigalda äpina</button>`;
  if (pwaIOS()) return `<ol class="pwasteps"><li><span>Ava mäng <b>Safari</b> brauseris.</span></li><li><span>Vajuta all keskel <b>jagamise nuppu</b> (ruut, millest tuleb nool üles ⬆️).</span></li><li><span>Keri alla ja vali <b>„Lisa avaekraanile“</b>.</span></li><li><span>Vajuta üleval paremal <b>„Lisa“</b>.</span></li></ol>`;
  return `<ol class="pwasteps"><li><span>Ava mäng <b>Chrome</b> või <b>Edge</b> brauseris.</span></li><li><span>Vajuta üleval paremal <b>kolme täpi menüüd</b> ⋮.</span></li><li><span>Vali <b>„Lisa avaekraanile“</b> või <b>„Installi rakendus“</b>.</span></li></ol>`;
}
function pwaCard() {
  if (pwaStandalone()) return '';
  return `<div class="card"><div class="pwacard"><img src="icons/icon-192.png" alt=""><div><div class="sec-h" style="margin:0">Mäng telefoni avaekraanile</div><p class="lead" style="margin:2px 0 0">Pane Metsakuningriik avaekraanile nagu päris äpp: avaneb ühe puudutusega, täisekraanil ja ilma brauseri ribadeta.</p></div></div>${pwaHow()}</div>`;
}
ACT.pwaInstall = async () => {
  const e = PWA.ev; if (!e) { showModal(() => `<h2>Mäng avaekraanile</h2>${pwaHow()}<div class="mbtns"><button class="btn" type="button" data-act="closeModal">Selge</button></div>`); return }
  hidePwaBar(); e.prompt(); try { const r = await e.userChoice; if (r.outcome !== 'accepted') toast('Kui mõtled ümber, leiad paigaldamise nupu Kuningriigi vahekaardilt.', 'info') } catch (x) { }
  PWA.ev = null; if (S) renderPanel(true);
};
ACT.pwaLater = () => { hidePwaBar(); try { localStorage.setItem('mk.pwaLater', Date.now()) } catch (e) { } };
function hidePwaBar() { const b = document.getElementById('pwaBar'); if (b) b.remove() }
function showPwaBar() {
  if (pwaStandalone() || document.getElementById('pwaBar')) return;
  let later = 0, done = 0; try { later = +localStorage.getItem('mk.pwaLater') || 0; done = localStorage.getItem('mk.pwaDone') } catch (e) { }
  if (done || Date.now() - later < 7 * 864e5) return;
  if (!PWA.ev && !pwaIOS()) return; // muudel brauseritel ainult kaardil
  const b = document.createElement('div'); b.id = 'pwaBar'; b.className = 'pwabar';
  b.innerHTML = `<img src="icons/icon-192.png" alt=""><div><b>Pane mäng avaekraanile</b>Siis avaneb Metsakuningriik ühe puudutusega nagu päris äpp.</div><button class="btn sm" type="button" data-act="${PWA.ev ? 'pwaInstall' : 'pwaIos'}">${PWA.ev ? 'Paigalda' : 'Kuidas?'}</button><button class="btn sm ghost" type="button" data-act="pwaLater" aria-label="Hiljem">✕</button>`;
  document.body.appendChild(b);
}
ACT.pwaIos = () => { hidePwaBar(); showModal(() => `<h2>Mäng avaekraanile</h2>${pwaHow()}<div class="mbtns"><button class="btn" type="button" data-act="closeModal">Selge</button></div>`) };
{
  const _kr = TABS.kuningriik.r; TABS.kuningriik.r = () => _kr() + pwaCard();
  const _eg = enterGame; enterGame = function () { _eg.apply(this, arguments); if (matchMedia('(max-width:900px)').matches) setTimeout(showPwaBar, 25000) };
}
