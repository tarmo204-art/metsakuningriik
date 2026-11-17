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
/* --- Pood: kategooriad ja filter --- */
#fvIn .ui-shopbar{position:sticky;top:0;z-index:5;display:grid;gap:8px;padding:10px;border-radius:16px;background:linear-gradient(180deg,rgba(12,34,42,.97),rgba(9,26,26,.97));border:1px solid var(--ui-line);box-shadow:0 8px 20px rgba(0,0,0,.35)}
#fvIn .ui-shopcats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#fvIn .ui-shopcats button{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:6px 8px;border-radius:12px;border:1px solid var(--ui-line);background:rgba(255,255,255,.045);color:#e6efec;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;transition:background .18s,border-color .18s}
#fvIn .ui-shopcats button:hover{background:rgba(255,255,255,.08)}
#fvIn .ui-shopcats button svg{width:20px;height:20px;color:var(--ui-gold);flex:none}
#fvIn .ui-shopcats button.on{background:linear-gradient(180deg,#2f9a96,#1d6a6c);border-color:rgba(130,245,230,.75);box-shadow:0 0 14px rgba(70,208,198,.3);color:#fff}
#fvIn .ui-shopcats button.on svg{color:#fff6dc}
#fvIn .ui-shopcats .n{position:absolute;top:-6px;right:-5px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#3aa86a;color:#fff;font-size:10.5px;line-height:18px;font-weight:800;box-shadow:0 0 0 2px #0d2228}
#fvIn .ui-shoprow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#fvIn .ui-shopf{display:inline-flex;padding:3px;border-radius:999px;background:rgba(0,0,0,.3);border:1px solid var(--ui-line)}
#fvIn .ui-shopf button{border:0;background:none;color:#b8d0d2;font:inherit;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;cursor:pointer}
#fvIn .ui-shopf button.on{background:var(--ui-gold);color:#2a1a06}
#fvIn .ui-shopgold{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-weight:800;color:#ffe0a0;font-size:14px}
#fvIn .ui-shophide{display:none!important}
#fvIn .ui-shopempty{padding:18px;text-align:center;color:var(--ui-muted);border-radius:14px;border:1px dashed var(--ui-line)}
#fvIn .ui-shopcats button:focus-visible,#fvIn .ui-shopf button:focus-visible{outline:2px solid var(--ui-gold);outline-offset:2px}
@media (max-width:600px){#fvIn .ui-shopcats{grid-template-columns:repeat(2,minmax(0,1fr))}#fvIn .ui-shopcats button{min-height:40px;font-size:13.5px}#fvIn .ui-shopgold{margin-left:0}}
/* --- Kuldne „Kalapüük“ pealkiri ja hüppav kala --- */
#fvIn .ui-title{display:flex;align-items:center;gap:2px;margin-right:auto;min-width:0}
#fvIn .ui-title h1{margin:0;font-weight:700;font-size:clamp(28px,4.2vw,40px);line-height:1.05;letter-spacing:.01em;
  background:linear-gradient(180deg,#fff6cc 0%,#ffe08a 30%,#f2b445 58%,#c27a1e 82%,#8a4e10 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 1px 0 #3a2006) drop-shadow(0 -1px 0 #3a2006) drop-shadow(1px 0 0 #3a2006) drop-shadow(-1px 0 0 #3a2006) drop-shadow(0 3px 4px rgba(0,0,0,.55)) drop-shadow(0 0 12px rgba(255,190,90,.3))}
#fvIn .ui-leap{position:relative;width:84px;height:62px;flex:none;margin:-10px 0 -8px}
#fvIn .ui-leap .fl{position:absolute;inset:0;transform:scaleX(-1)}
#fvIn .ui-leap canvas{position:absolute;left:6px;top:0;width:76px;height:42px;transform-origin:50% 60%;animation:uiLeap 3.4s cubic-bezier(.45,.05,.4,1) infinite;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))}
#fvIn .ui-leap svg{position:absolute;left:4px;bottom:0;width:78px;height:30px;overflow:visible}
#fvIn .ui-leap .dr{animation:uiDrop 3.4s ease-out infinite;transform-box:fill-box;transform-origin:center}
#fvIn .ui-leap .rp{animation:uiRipple 3.4s ease-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes uiLeap{0%,100%{transform:translate(4px,12px) rotate(38deg)}45%{transform:translate(-2px,-4px) rotate(16deg)}72%{transform:translate(-6px,4px) rotate(-6deg)}}
@keyframes uiDrop{0%,100%{opacity:.95;transform:translateY(0)}45%{opacity:.55;transform:translateY(-5px)}75%{opacity:.9;transform:translateY(1px)}}
@keyframes uiRipple{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:.35;transform:scale(1.18)}}
@media (max-width:600px){#fvIn .ui-title h1{font-size:21px}#fvIn .ui-leap{width:42px;height:38px;margin:-6px -2px -4px -6px}#fvIn .ui-leap canvas{left:2px;width:40px;height:22px}#fvIn .ui-leap svg{left:0;width:42px;height:18px}#fvIn .ui-title{order:5;flex-basis:100%;justify-content:center;margin:2px 0 0}#fvIn .ui-title h1{font-size:28px}#fvIn .ui-leap{width:52px;height:44px}#fvIn .ui-leap canvas{width:50px;height:28px}#fvIn .ui-leap svg{width:52px;height:20px}#fvIn .fv-top:first-child > .btn{margin-right:auto;white-space:nowrap}}
@media (prefers-reduced-motion:reduce){#fvIn .ui-leap canvas,#fvIn .ui-leap .dr,#fvIn .ui-leap .rp{animation:none}}
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

// Pood: neli kategooriat (üks korraga) ja filter „Kõik / Saan osta / Minu omad“
const UI_SHOP = [
  ['rod', 'Õngeridvad', /Õngeridvad/, '<path d="M4 20 18 6"/><path d="M18 6v8.5c0 1.6-1.2 2.6-2.6 2.6"/><circle cx="15.4" cy="17.6" r="1"/>'],
  ['bait', 'Söödad', /Söödad/, '<path d="M13 3v9.5a4.5 4.5 0 1 1-4.5-4.5"/><path d="M13 3l-2.4 2.4"/>'],
  ['gear', 'Varustus', /Kalamehe varustus/, '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V8M3 13h18"/>'],
  ['trap', 'Püünised', /Püünised/, '<path d="M4 7h16l-2 12H6z"/><path d="M8 7l1 12M12 7v12M16 7l-1 12M5 12h14"/>']
];
const UIS = { cat: 'rod', f: 'all' };
try { const v = JSON.parse(localStorage.getItem('mk.shop') || '{}'); if (v.cat) UIS.cat = v.cat; if (v.f) UIS.f = v.f } catch (e) { }
function uiShopSave() { try { localStorage.setItem('mk.shop', JSON.stringify(UIS)) } catch (e) { } }
function uiRowState(el) {
  const btns = [...el.querySelectorAll('button')];
  const mine = !!el.querySelector('.pill.ok') || el.classList.contains('own') || /Sinu oma|sul on [1-9]/.test(el.textContent) || btns.some(b => b.dataset.fa === 'baitUse');
  const buy = btns.some(b => !b.disabled && (b.dataset.kv === 'buy' || b.dataset.fa === 'bait10' || b.dataset.fa === 'bait50' || b.dataset.fa === 'lure' || (b.dataset.fa === 'rod' && /Osta/.test(b.textContent))));
  return { mine, buy };
}
function uiShop(root) {
  if (FV.tab !== 'pood') return;
  const body = root.querySelector('.fv-body'); if (!body || body.querySelector('.ui-shopbar')) return;
  const cards = [...body.querySelectorAll(':scope > .fv-card')], map = {};
  cards.forEach(c => { const h = c.querySelector('h2'); const t = h ? h.textContent : ''; const cat = UI_SHOP.find(x => x[2].test(t)); if (cat) { c.dataset.shop = cat[0]; (map[cat[0]] = map[cat[0]] || []).push(c) } });
  if (!Object.keys(map).length) return;
  if (!map[UIS.cat]) UIS.cat = UI_SHOP.find(x => map[x[0]])[0];
  const rowsOf = c => [...c.querySelectorAll('.srow, .kv-item')];
  const cnt = k => (map[k] || []).reduce((a, c) => a + rowsOf(c).filter(r => uiRowState(r).buy).length, 0);
  const bar = document.createElement('div'); bar.className = 'ui-shopbar';
  bar.innerHTML = `<div class="ui-shopcats" role="tablist" aria-label="Poe osakonnad">${UI_SHOP.filter(x => map[x[0]]).map(([k, n, , ic]) => { const c = cnt(k); return `<button type="button" role="tab" aria-selected="${UIS.cat === k}" class="${UIS.cat === k ? 'on' : ''}" data-shopcat="${k}">${uiSvg(ic)}${n}${c ? `<span class="n" title="Saad kohe osta">${c}</span>` : ''}</button>` }).join('')}</div>
    <div class="ui-shoprow"><div class="ui-shopf">${[['all', 'Kõik'], ['buy', 'Saan osta'], ['mine', 'Minu omad']].map(([k, n]) => `<button type="button" class="${UIS.f === k ? 'on' : ''}" data-shopf="${k}">${n}</button>`).join('')}</div><span class="ui-shopgold">🪙 ${fmt(FS.gold)} kulda</span></div>`;
  body.insertBefore(bar, body.firstChild);
  // katkise õnge teade jääb alati üles
  const broken = cards.find(c => !c.dataset.shop); if (broken) body.insertBefore(broken, bar);
  for (const c of cards) {
    if (!c.dataset.shop) continue;
    if (c.dataset.shop !== UIS.cat) { c.classList.add('ui-shophide'); continue }
    let shown = 0;
    rowsOf(c).forEach(r => { const st = uiRowState(r), ok = UIS.f === 'all' || (UIS.f === 'buy' ? st.buy : st.mine); r.classList.toggle('ui-shophide', !ok); if (ok) shown++ });
    c.querySelectorAll('.kv-grp').forEach(g => g.classList.toggle('ui-shophide', UIS.f !== 'all' && !g.querySelector('.kv-item:not(.ui-shophide)')));
    if (!shown && rowsOf(c).length) c.insertAdjacentHTML('beforeend', `<p class="ui-shopempty">${UIS.f === 'buy' ? 'Siin pole praegu midagi, mida saaksid osta. Kogu kulda või tõuse tasemel!' : 'Sul pole veel ühtegi asja sellest osakonnast.'}</p>`);
  }
}
document.addEventListener('click', e => {
  const c = e.target.closest('[data-shopcat]'), f = e.target.closest('[data-shopf]');
  if (c) { UIS.cat = c.dataset.shopcat; uiShopSave(); renderFV(true); const fv = document.getElementById('fishView'), bar = document.querySelector('#fvIn .ui-shopbar'); if (fv && bar && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ block: 'start' }); return }
  if (f) { UIS.f = f.dataset.shopf; uiShopSave(); renderFV(true); return }
  // Püüniste vaatest „Osta poest“ avab kohe püüniste osakonna
  if (e.target.closest('[data-kv="shop"]')) { UIS.cat = 'trap'; UIS.f = 'all'; uiShopSave() }
}, true);

// pealkiri: hüppav kala (mängu enda kalajoonistus) ja kuldne „Kalapüük“
const UI_SPLASH = '<svg viewBox="0 0 78 30" aria-hidden="true"><ellipse class="rp" cx="34" cy="24" rx="26" ry="4.5" fill="none" stroke="rgba(150,230,240,.55)" stroke-width="1.6"/><ellipse class="rp" cx="34" cy="24" rx="15" ry="2.6" fill="none" stroke="rgba(220,250,255,.75)" stroke-width="1.3"/>'
  + '<g class="dr" fill="rgba(200,245,255,.9)"><path d="M14 22c-3-4-2-9 1-12 0 4 2 7 3 9z"/><path d="M52 21c3-4 2-8-1-11 0 4-1 6-3 8z"/><circle cx="22" cy="9" r="1.6"/><circle cx="47" cy="7" r="1.4"/><circle cx="9" cy="14" r="1.1"/><circle cx="58" cy="13" r="1.1"/><path d="M28 23c-1-5 1-9 4-11-1 4-1 7 0 10z"/><path d="M40 23c1-5-1-8-3-10 1 4 1 6 0 9z"/></g></svg>';
function uiTitle(root) {
  const h1 = root.querySelector('.fv-top > h1'); if (!h1 || h1.closest('.ui-title')) return;
  const wrap = document.createElement('div'); wrap.className = 'ui-title'; h1.replaceWith(wrap);
  const delay = -((performance.now() / 1000) % 3.4);
  wrap.innerHTML = `<span class="ui-leap" aria-hidden="true"><span class="fl"><canvas data-fl="ahven" data-r="1" data-nobg="1" style="animation-delay:${delay}s"></canvas></span>${UI_SPLASH.replace(/class="(dr|rp)"/g, `class="$1" style="animation-delay:${delay}s"`)}</span>`;
  wrap.appendChild(h1);
  if (FD.sp && FD.sp.ahven) paintFishCanvases(wrap);
}
{
  const _r = renderFV;
  renderFV = function (force) {
    // kerimisasend jäetakse meelde enne ümberjoonistamist ja taastatakse pärast kõiki paigutusmuudatusi,
    // et leht ei hüppaks (nt kui püügi alguses või taustal uueneva info tõttu vaade uuesti joonistatakse)
    const fv = document.getElementById('fishView'), st = fv ? fv.scrollTop : 0, tab0 = FV.tab;
    const r = _r.apply(this, arguments);
    try { const root = document.getElementById('fvIn'); if (root && FV.open) { uiDecorate(root); uiTitle(root); uiPuuk(root); uiShop(root) } } catch (e) { console.warn('kujundus', e) }
    if (fv && FV.tab === tab0 && fv.scrollTop !== st) fv.scrollTop = st;
    return r;
  };
}
