/* =====================================================================
   Kalapüügi avalehe kujundus: mängija info, statistikakaardid ja kahetasemeline menüü.
   Muudab ainult välimust ja paigutust – kõik nupud jäävad samadeks elementideks (data-fa="tab"),
   nii et klikid, teavituste numbrid ja vahekaartide loogika töötavad täpselt nagu enne.
   ===================================================================== */
const UI_PRIMARY = ['puuk', 'saak', 'maja', 'tookoda', 'kaardid', 'tellimus'];
const UIK = { secX: 0, lastTab: null };
const UI_STAT_SVG = [
  '<path d="M3 12c3-4.5 9-5.5 13-2l4-3v10l-4-3c-4 3.5-10 2.5-13-2z"/><circle cx="8" cy="11.2" r=".9" fill="currentColor"/>',
  '<circle cx="12" cy="5.6" r="2.3"/><path d="M6.4 8.5h11.2l2.2 11.5H4.2z"/><path d="M9.5 14h5"/>',
  '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4 7.6 9 12 20l4.4-11L15 4"/>',
  '<path d="M4 20 17 7"/><path d="M17 7v7.5c0 1.6-1.2 2.6-2.6 2.6"/><path d="M8.5 3.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z"/><path d="M20 3.5l.4.9.9.4-.9.4-.4.9-.4-.9-.9-.4.9-.4z"/>',
  '<path d="M13 3v9.5a4.5 4.5 0 1 1-4.5-4.5"/><path d="M13 3l-2.4 2.4"/><circle cx="8.5" cy="12.5" r="1" fill="currentColor"/>'
];
const UI_STAT_CLS = ['st-n', 'st-w', 'st-rare', 'st-rod', 'st-bait'];

document.head.insertAdjacentHTML('beforeend', `<style>
#fvIn{--ui-gold:#e8b65a;--ui-teal:#46d0c6;--ui-line:rgba(134,205,224,.16);--ui-muted:#8fb0b6;--ui-card:linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.18))}
/* --- ülemine rida --- */
#fvIn .fv-top h1{font-size:clamp(22px,3.4vw,30px)}
#fvIn .fv-top + .fv-top{gap:12px 18px;margin-top:2px}
#fvIn .fv-lvl{gap:12px}
#fvIn .fv-badge{width:58px;height:62px;border:2px solid var(--ui-gold);background:radial-gradient(circle at 50% 28%,#2f7486,#14343f 75%);
  box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 0 0 2px rgba(0,0,0,.35),0 0 14px rgba(232,182,90,.18)}
#fvIn .fv-badge b{font-size:26px;color:#fff6dc;text-shadow:0 1px 6px rgba(0,0,0,.5)}
#fvIn .fv-badge small{color:#e8cf98}
#fvIn .fv-lvl > div > b{font-size:16px!important;color:#f2f6f4}
#fvIn .fv-xp{width:clamp(190px,24vw,300px);height:11px;border-radius:999px;background:rgba(0,0,0,.45);box-shadow:inset 0 1px 3px rgba(0,0,0,.6),0 0 0 1px var(--ui-line);overflow:hidden}
#fvIn .fv-xp:not(.star) i{background:linear-gradient(90deg,#1f9fb0,#46d0c6 60%,#a8f4ea);box-shadow:0 0 10px rgba(70,208,198,.55)}
#fvIn .fv-xp i{position:relative;border-radius:999px}
#fvIn .fv-xp i::after{content:"";position:absolute;inset:1px 3px auto;height:35%;border-radius:999px;background:rgba(255,255,255,.35)}
#fvIn .fv-lvl small.num{font-size:12px;color:var(--ui-muted)!important}
#fvIn .fv-top + .fv-top > .chips{margin-left:0!important}
#fvIn .fv-top + .fv-top .chip{background:rgba(0,0,0,.28);border:1px solid var(--ui-line)}
/* --- statistikakaardid --- */
#fvIn .fv-stats{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:stretch}
#fvIn .fv-stat{display:grid;grid-template-columns:36px minmax(0,1fr);align-items:center;gap:10px;min-height:60px;padding:9px 12px;border-radius:14px;background:var(--ui-card);border:1px solid var(--ui-line);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05);transition:border-color .2s,transform .2s}
#fvIn .fv-stat:hover{border-color:rgba(134,205,224,.32)}
#fvIn .fv-stat .st-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;color:#9fdcd6;background:rgba(70,208,198,.1);box-shadow:inset 0 0 0 1px rgba(70,208,198,.18)}
#fvIn .fv-stat .st-ic svg{width:20px;height:20px}
#fvIn .fv-stat .st-tx{min-width:0;display:grid;gap:1px}
#fvIn .fv-stat small{font-size:12px;letter-spacing:0;text-transform:none;color:var(--ui-muted);font-weight:600}
#fvIn .fv-stat b{font-size:16.5px;color:#f4f8f6}
#fvIn .fv-stat.st-w .st-ic{color:var(--ui-gold);background:rgba(232,182,90,.1);box-shadow:inset 0 0 0 1px rgba(232,182,90,.22)}
#fvIn .fv-stat.st-rare,#fvIn .fv-stat.st-rod{border-color:rgba(176,140,255,.24);background:radial-gradient(120% 140% at 0% 0%,rgba(150,110,255,.13),transparent 60%),var(--ui-card)}
#fvIn .fv-stat.st-rare .st-ic,#fvIn .fv-stat.st-rod .st-ic{color:#d2bcff;background:rgba(150,110,255,.14);box-shadow:inset 0 0 0 1px rgba(176,140,255,.3),0 0 12px rgba(150,110,255,.25)}
#fvIn .fv-stat.st-bait .st-ic{color:#f0b88a;background:rgba(240,150,100,.1);box-shadow:inset 0 0 0 1px rgba(240,150,100,.22)}
/* --- menüü: põhitegevused --- */
#fvIn .fv-tabs{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;padding:8px;border-radius:16px;background:linear-gradient(180deg,rgba(10,30,40,.75),rgba(8,24,22,.75));border:1px solid var(--ui-line);box-shadow:0 6px 18px rgba(0,0,0,.25)}
#fvIn .fv-tabs .ui-prim{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
#fvIn .fv-tabs .ui-prim button{display:flex;align-items:center;justify-content:center;gap:9px;min-height:48px;padding:8px 10px;border-radius:12px;font-size:15px;font-weight:800;color:#e6efec;
  background:rgba(255,255,255,.045);border:1px solid var(--ui-line);transition:background .18s,border-color .18s,transform .15s,box-shadow .18s}
#fvIn .fv-tabs .ui-prim .ft-ic,#fvIn .fv-tabs .ui-prim .ft-ic svg{width:21px;height:21px}
#fvIn .fv-tabs .ui-prim .ft-ic{color:var(--ui-gold);opacity:1}
#fvIn .fv-tabs .ui-prim button:hover{background:rgba(255,255,255,.08);border-color:rgba(134,205,224,.32);transform:translateY(-1px)}
/* --- menüü: muud tegevused --- */
#fvIn .fv-tabs .ui-sec{position:relative;padding-top:8px;border-top:1px solid rgba(134,205,224,.1)}
#fvIn .fv-tabs .ui-sec-in{display:grid;grid-template-columns:repeat(var(--cols,7),minmax(0,1fr));gap:4px 6px}
#fvIn .fv-tabs .ui-sec button{position:relative;justify-self:start;display:flex;align-items:center;justify-content:flex-start;gap:7px;padding:7px 10px;border-radius:10px;font-size:13.5px;font-weight:700;color:#a9c4c8;background:transparent;border:1px solid transparent;white-space:nowrap;transition:background .18s,color .18s,border-color .18s}
#fvIn .fv-tabs .ui-sec .ft-ic,#fvIn .fv-tabs .ui-sec .ft-ic svg{width:17px;height:17px}
#fvIn .fv-tabs .ui-sec button:hover{background:rgba(255,255,255,.06);color:#e6efec}
/* --- aktiivne menüü: hele sinakasroheline ja õrn helendus --- */
#fvIn .fv-tabs button.on{color:#fff!important;background:linear-gradient(180deg,#2f9a96,#1d6a6c)!important;border-color:rgba(130,245,230,.75)!important;
  box-shadow:0 0 0 1px rgba(130,245,230,.25),0 0 16px rgba(70,208,198,.35),inset 0 1px 0 rgba(255,255,255,.2)}
#fvIn .fv-tabs button.on .ft-ic{color:#fff6dc!important;filter:drop-shadow(0 0 5px rgba(255,220,150,.6))}
#fvIn .fv-tabs button:focus-visible{outline:2px solid var(--ui-gold);outline-offset:2px}
#fvIn .fv-tabs .dot{top:-6px;right:-5px;min-width:18px;height:18px;line-height:18px;font-size:10.5px;font-weight:800;box-shadow:0 0 0 2px #0d2228}
/* --- tahvel: muud tegevused ühel kerival real --- */
@media (max-width:900px){
  #fvIn .fv-stats{grid-template-columns:repeat(6,minmax(0,1fr))}
  #fvIn .fv-stat{grid-column:span 2}#fvIn .fv-stat.st-rod,#fvIn .fv-stat.st-bait{grid-column:span 3}
  #fvIn .fv-tabs .ui-sec{margin:0 -8px;padding:0}
  #fvIn .fv-tabs .ui-prim button{flex-direction:column;gap:4px;min-height:58px;padding:7px 4px;font-size:13.5px}
  #fvIn .fv-tabs .ui-sec-in{display:flex;gap:6px;overflow-x:auto;padding:10px 8px 6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  #fvIn .fv-tabs .ui-sec-in::-webkit-scrollbar{display:none}
  #fvIn .fv-tabs .ui-sec button{flex:none;background:rgba(255,255,255,.04);border-color:rgba(134,205,224,.1)}
  #fvIn .fv-tabs .ui-sec::before,#fvIn .fv-tabs .ui-sec::after{content:"";position:absolute;top:0;bottom:0;width:26px;pointer-events:none;z-index:1;transition:opacity .2s}
  #fvIn .fv-tabs .ui-sec::before{left:0;background:linear-gradient(90deg,#0b1f24,transparent)}
  #fvIn .fv-tabs .ui-sec::after{right:0;background:linear-gradient(270deg,#0b1f24,transparent)}
  #fvIn .fv-tabs .ui-sec.at-start::before,#fvIn .fv-tabs .ui-sec.at-end::after{opacity:0}
}
/* --- telefon --- */
@media (max-width:600px){
  #fvIn .fv-top + .fv-top{gap:10px}
  #fvIn .fv-badge{width:52px;height:56px}#fvIn .fv-badge b{font-size:22px}
  #fvIn .fv-xp{width:min(240px,58vw)}
  #fvIn .fv-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  #fvIn .fv-stat{grid-column:auto!important;min-height:54px;padding:8px 10px;grid-template-columns:32px minmax(0,1fr);gap:8px}
  #fvIn .fv-stat .st-ic{width:32px;height:32px}#fvIn .fv-stat .st-ic svg{width:18px;height:18px}
  #fvIn .fv-stat b{font-size:15px}
  #fvIn .fv-stat.st-n{order:1}#fvIn .fv-stat.st-rare{order:2}#fvIn .fv-stat.st-w{order:3;grid-column:1 / -1!important}#fvIn .fv-stat.st-rod{order:4}#fvIn .fv-stat.st-bait{order:5}
  #fvIn .fv-tabs{padding:7px}
  #fvIn .fv-tabs .ui-prim{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  #fvIn .fv-tabs .ui-prim button{flex-direction:column;gap:3px;min-height:56px;padding:7px 4px;font-size:13px}
  #fvIn .fv-tabs .ui-sec{margin:0 -7px}
  #fvIn .fv-tabs .ui-sec button{flex-direction:row;padding:7px 10px;font-size:13px;line-height:1.2;text-align:left}
}
/* --- Püük: ainult püüdmine, lisainfo kokkupandud plokis all --- */
#fvIn .ui-extra{margin-top:4px;border-radius:16px;border:1px solid var(--ui-line);background:linear-gradient(180deg,rgba(10,30,40,.55),rgba(8,24,22,.55))}
#fvIn .ui-extra > summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;font-weight:800;color:#e6efec}
#fvIn .ui-extra > summary::-webkit-details-marker{display:none}
#fvIn .ui-extra > summary:hover{background:rgba(255,255,255,.04)}
#fvIn .ui-extra > summary:focus-visible{outline:2px solid var(--ui-gold);outline-offset:2px}
#fvIn .ui-extra > summary small{display:block;font-weight:600;font-size:12.5px;color:var(--ui-muted)}
#fvIn .ui-extra > summary .ux-ic{width:36px;height:36px;flex:none;border-radius:10px;display:grid;place-items:center;color:var(--ui-gold);background:rgba(232,182,90,.1);box-shadow:inset 0 0 0 1px rgba(232,182,90,.22)}
#fvIn .ui-extra > summary .ux-ic svg{width:20px;height:20px}
#fvIn .ui-extra > summary .ux-ch{margin-left:auto;transition:transform .2s;color:var(--ui-muted)}
#fvIn .ui-extra[open] > summary .ux-ch{transform:rotate(180deg)}
#fvIn .ui-extra-in{display:grid;gap:12px;padding:4px 12px 14px}
@media (prefers-reduced-motion:reduce){#fvIn .fv-tabs button,#fvIn .fv-stat{transition:none}#fvIn .fv-tabs .ui-prim button:hover{transform:none}}
</style>`);

function uiSvg(p) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` }
function uiDecorate(root) {
  // statistikakaardid: ikoon ja tekstiplokk ümber olemasoleva sisu
  root.querySelectorAll('.fv-stats > .fv-stat').forEach((el, i) => {
    if (el.querySelector('.st-ic')) return;
    const tx = document.createElement('div'); tx.className = 'st-tx'; while (el.firstChild) tx.appendChild(el.firstChild);
    el.insertAdjacentHTML('afterbegin', `<span class="st-ic">${uiSvg(UI_STAT_SVG[i] || UI_STAT_SVG[0])}</span>`); el.appendChild(tx);
    if (UI_STAT_CLS[i]) el.classList.add(UI_STAT_CLS[i]);
  });
  // menüü kahte ritta: samad nupud tõstetakse ümber, midagi ei looda uuesti
  const nav = root.querySelector('nav.fv-tabs'); if (!nav || nav.querySelector('.ui-prim')) return;
  const btns = [...nav.querySelectorAll(':scope > button')], prim = document.createElement('div'), sec = document.createElement('div'), secIn = document.createElement('div');
  prim.className = 'ui-prim'; sec.className = 'ui-sec'; secIn.className = 'ui-sec-in';
  UI_PRIMARY.forEach(k => { const b = btns.find(x => x.dataset.arg === k); if (b) prim.appendChild(b) });
  btns.filter(b => !UI_PRIMARY.includes(b.dataset.arg)).forEach(b => secIn.appendChild(b));
  secIn.style.setProperty('--cols', Math.max(1, Math.ceil(secIn.children.length / 2)));
  sec.appendChild(secIn); nav.appendChild(prim); if (secIn.children.length) nav.appendChild(sec);
  nav.setAttribute('aria-label', 'Kalapüügi menüü');
  // kerimisasend jääb alles; uue vahekaardi korral tuuakse aktiivne nupp nähtavale
  const edge = () => { sec.classList.toggle('at-start', secIn.scrollLeft < 4); sec.classList.toggle('at-end', secIn.scrollLeft + secIn.clientWidth >= secIn.scrollWidth - 4) };
  secIn.scrollLeft = UIK.secX;
  const on = secIn.querySelector('button.on');
  if (on && UIK.lastTab !== FV.tab && secIn.scrollWidth > secIn.clientWidth) { const l = on.offsetLeft - secIn.clientWidth / 2 + on.offsetWidth / 2; secIn.scrollLeft = Math.max(0, l) }
  UIK.lastTab = FV.tab; UIK.secX = secIn.scrollLeft; edge();
  secIn.addEventListener('scroll', () => { UIK.secX = secIn.scrollLeft; edge() }, { passive: true });
}

// Püük-vahekaardil on üleval ainult püüdmine; ilm, hooajakalad, riietuse soovitus ja kaluri päev on all kokkupandavas plokis
let UIK_EXTRA = false; try { UIK_EXTRA = localStorage.getItem('mk.puukExtra') === '1' } catch (e) { }
function uiPuuk(root) {
  if (FV.tab !== 'puuk') return;
  const body = root.querySelector('.fv-body'); if (!body || body.querySelector(':scope > .ui-extra')) return;
  const parts = [...body.querySelectorAll(':scope > .ssn-strip, :scope > .wx, :scope > .rd-ban, :scope > .rem')]; if (!parts.length) return;
  const d = document.createElement('details'); d.className = 'ui-extra'; d.open = UIK_EXTRA;
  d.innerHTML = `<summary><span class="ux-ic">${uiSvg('<path d="M7 18a4.5 4.5 0 1 1 .6-9 6 6 0 0 1 11.4 2.5A3.3 3.3 0 0 1 18 18z"/><path d="M12 3v1.5M5.6 5.6l1 1M3 12h1.5"/>')}</span><span>Ilm, hooaeg ja kaluri päev<small>Ilmajaam, hooajakalad, riietuse soovitus ja tänased meeldetuletused</small></span><span class="ux-ch">▾</span></summary><div class="ui-extra-in"></div>`;
  const inner = d.querySelector('.ui-extra-in'); parts.forEach(el => inner.appendChild(el));
  const fishing = [...body.querySelectorAll(':scope > .fv-card')].pop();
  if (fishing && fishing.nextSibling) body.insertBefore(d, fishing.nextSibling); else body.appendChild(d);
  d.addEventListener('toggle', () => { UIK_EXTRA = d.open; try { localStorage.setItem('mk.puukExtra', d.open ? '1' : '0') } catch (e) { } });
}
{
  const _r = renderFV;
  renderFV = function (force) {
    const r = _r.apply(this, arguments);
    try { const root = document.getElementById('fvIn'); if (root && FV.open) { uiDecorate(root); uiPuuk(root) } } catch (e) { console.warn('kujundus', e) }
    return r;
  };
}
