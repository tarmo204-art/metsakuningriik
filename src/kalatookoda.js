/* =====================================================================
   Kalatöökoda Kalurimajas: kalapuhastus klikkimisega, materjalid, retseptid (puhastuslaud, suitsuahi,
   söödalaud), kalalett (müük ja kõrtsi tellimused), tööriistad, töökoja tasemed, oskus, maine ja ülesanded.
   Kõik kogused ja tulemused arvutab server (proc_* funktsioonid). Klikke loetakse brauseris ja serverisse
   läheb ainult töö algus ja lõpp – server kontrollib, et klikke oli piisavalt ja et need polnud inimvõimetult kiired.
   ===================================================================== */
const KTK = { sub: 'maja', d: null, at: 0, loading: false, busy: false, job: null, sel: {}, times: {}, raf: 0, fx: [] };
try { const v = localStorage.getItem('mk.ktSub'); if (v) KTK.sub = v } catch (e) { }
const KT_Q = [['Tavaline', '#b8c4c4'], ['Hea', '#7fe0a0'], ['Suurepärane', '#6cb8ff'], ['Meisterlik', '#c08aff'], ['Legendaarne', '#ffc94a']];
const KT_REP = ['Tundmatu kalur', 'Tuntud kalur', 'Austatud kalur', 'Kuulus kalur', 'Legendaarne kalur'];
const KT_REPN = [0, 100, 400, 1000, 2500];
const KT_WS = ['Vana kalurimaja ja puhastuslaud', 'Uus töölaud – kõik tööd 10% vähemate klikkidega', 'Suitsuahi – suitsukala, kalasupp ja kuldne suitsufilee',
  'Söödalaud – kalasööt, soomuslant, erisööt ja kalaväetis', 'Kalalett – müü tooteid ja täida kõrtsi tellimusi', 'Suur töökoda – 15% rohkem materjale ja kala püsib kaks korda kauem värske'];
const KT_SUBS = [['maja', 'Maja', '🏚', 1], ['laud', 'Puhastuslaud', '🔪', 1], ['ahi', 'Suitsuahi', '🔥', 3], ['soot', 'Söödalaud', '🪱', 4], ['lett', 'Kalalett', '🏪', 5], ['ladu', 'Ladu', '📦', 1], ['tools', 'Tööriistad', '🛠', 1], ['quest', 'Ülesanded', '📜', 1]];
const KT_PERKS = [[1, 'Tavaline kalapuhastus'], [5, 'Kiirem puhastamine (−15% klikke)'], [10, 'Suurem materjalisaak (+20%)'], [15, 'Eepiliste kalade eritöötlus ja rohkem kuldseid soomuseid'], [20, 'Meisterpuhastaja – parem kvaliteet'], [30, 'Legendaarsete ja müütiliste kalade töötlemine']];
const KT_RES = { wood: ['🪵', 'puitu'], stone: ['🪨', 'kivi'], berries: ['🫐', 'marju'], food: ['🍞', 'toitu'] };

// materjalide ja toodete ikoonid (SVG)
const MAT_SVG = {
  filee: '<path d="M8 30c4-12 16-18 30-14 3 1 3 4 1 6-8 9-20 13-31 8z" fill="#f4a58a" stroke="#c8705a" stroke-width="1.5"/><path d="M15 27c5-3 11-5 18-6M14 31c6-2 12-4 19-8" stroke="#ffd6c8" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  filee_hea: '<path d="M8 30c4-12 16-18 30-14 3 1 3 4 1 6-8 9-20 13-31 8z" fill="#ffc0a0" stroke="#e8a040" stroke-width="1.8"/><path d="M15 27c5-3 11-5 18-6M14 31c6-2 12-4 19-8" stroke="#fff0d8" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M38 8l1.4 3.2 3.2 1.4-3.2 1.4L38 17.2l-1.4-3.2-3.2-1.4 3.2-1.4z" fill="#ffe27a"/>',
  luu: '<path d="M8 24h30" stroke="#f2ead8" stroke-width="2.6" stroke-linecap="round"/><path d="M14 24l-3-7M14 24l-3 7M20 24l-2.5-8M20 24l-2.5 8M26 24l-2-8M26 24l-2 8M32 24l-1.5-6M32 24l-1.5 6" stroke="#f2ead8" stroke-width="1.8" stroke-linecap="round"/><path d="M38 24l5-5v10z" fill="#f2ead8"/><circle cx="8" cy="24" r="3.4" fill="#f2ead8"/>',
  jaatmed: '<path d="M12 18h24l-3 22H15z" fill="#7a5a3a" stroke="#4a3420" stroke-width="1.5"/><path d="M11 18h26" stroke="#9a7a52" stroke-width="3" stroke-linecap="round"/><path d="M16 18c2-5 6-6 8-3 2-4 7-3 8 3" fill="#c0504a"/><circle cx="20" cy="15" r="2" fill="#e07a6a"/>',
  soomus: '<path d="M24 6c9 6 13 14 10 24-2 7-8 11-10 12-2-1-8-5-10-12C11 20 15 12 24 6z" fill="#a8c8dc" stroke="#6a90a8" stroke-width="1.5"/><path d="M24 12v26M18 20c4 2 8 2 12 0M17 28c5 2 9 2 14 0" stroke="#e0f0f8" stroke-width="1.4" fill="none"/>',
  kuldsoomus: '<circle cx="24" cy="24" r="18" fill="#ffd86a" opacity=".22"/><path d="M24 6c9 6 13 14 10 24-2 7-8 11-10 12-2-1-8-5-10-12C11 20 15 12 24 6z" fill="#f2c040" stroke="#b07810" stroke-width="1.6"/><path d="M24 12v26M18 20c4 2 8 2 12 0M17 28c5 2 9 2 14 0" stroke="#fff2c0" stroke-width="1.4" fill="none"/>',
  iidneluu: '<circle cx="24" cy="24" r="19" fill="#7ae8d8" opacity=".2"/><path d="M12 32L32 12" stroke="#e8fff8" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="31" r="4" fill="#e8fff8"/><circle cx="14" cy="35" r="4" fill="#e8fff8"/><circle cx="33" cy="10" r="4" fill="#e8fff8"/><circle cx="37" cy="14" r="4" fill="#e8fff8"/><path d="M14 30L30 14" stroke="#7ae8d8" stroke-width="1.4"/>',
  luukonks: '<path d="M26 6v20a8 8 0 1 1-16 0" stroke="#f2ead8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M10 26l-3-5" stroke="#f2ead8" stroke-width="4" stroke-linecap="round"/><circle cx="26" cy="6" r="3" fill="none" stroke="#c8b890" stroke-width="2"/>',
  suitsukala: '<path d="M6 24c6-9 18-11 28-5l7-5v20l-7-5c-10 6-22 4-28-5z" fill="#c07a2a" stroke="#7a4410" stroke-width="1.5"/><path d="M14 20c4 2 10 2 14 0M14 28c4-2 10-2 14 0" stroke="#e8b060" stroke-width="1.4" fill="none"/><circle cx="12" cy="23" r="1.4" fill="#3a2008"/><path d="M20 8c-2 3 2 4 0 7M26 6c-2 3 2 4 0 7" stroke="#c8d0d0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/>',
  kalasupp: '<path d="M8 24h32c0 9-7 15-16 15S8 33 8 24z" fill="#c8a070" stroke="#7a5a30" stroke-width="1.5"/><ellipse cx="24" cy="24" rx="16" ry="3.5" fill="#f2c890"/><circle cx="19" cy="24" r="1.6" fill="#e88a6a"/><circle cx="27" cy="23.5" r="1.4" fill="#7a3a8a"/><path d="M18 8c-2 3 2 5 0 9M24 6c-2 3 2 5 0 9M30 8c-2 3 2 5 0 9" stroke="#d8e0e0" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75"/>',
  kuldfilee: '<circle cx="24" cy="24" r="18" fill="#ffc94a" opacity=".18"/><path d="M8 30c4-12 16-18 30-14 3 1 3 4 1 6-8 9-20 13-31 8z" fill="#d88a2a" stroke="#8a4a10" stroke-width="1.6"/><path d="M15 27c5-3 11-5 18-6M14 31c6-2 12-4 19-8" stroke="#ffd27a" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  soomuskaunistus: '<circle cx="24" cy="24" r="15" fill="#2a4a5a" stroke="#f2c040" stroke-width="2"/><g fill="#a8c8dc" stroke="#6a90a8" stroke-width=".8"><path d="M24 11c3 2 4 5 3 8-1 2-2 3-3 3-1 0-2-1-3-3-1-3 0-6 3-8z"/><path d="M24 37c-3-2-4-5-3-8 1-2 2-3 3-3 1 0 2 1 3 3 1 3 0 6-3 8z"/><path d="M11 24c2-3 5-4 8-3 2 1 3 2 3 3 0 1-1 2-3 3-3 1-6 0-8-3z"/><path d="M37 24c-2 3-5 4-8 3-2-1-3-2-3-3 0-1 1-2 3-3 3-1 6 0 8 3z"/></g><circle cx="24" cy="24" r="4" fill="#f2c040"/>',
  kuningaamulett: '<circle cx="24" cy="26" r="19" fill="#ffd86a" opacity=".16"/><path d="M14 6l10 8 10-8" stroke="#f2c040" stroke-width="1.6" fill="none"/><path d="M24 14l11 7-4 15H17l-4-15z" fill="#e8f8f4" stroke="#f2c040" stroke-width="1.8"/><path d="M24 20l5 4-2 7h-6l-2-7z" fill="#5ad8c8" stroke="#2a8a80" stroke-width="1"/>',
  kalasoot: '<rect x="13" y="14" width="22" height="26" rx="4" fill="#8a6a4a" stroke="#4a3420" stroke-width="1.5"/><rect x="11" y="10" width="26" height="6" rx="2" fill="#5a4030"/><circle cx="20" cy="26" r="2.4" fill="#c86a50"/><circle cx="27" cy="30" r="2" fill="#d8b070"/><circle cx="24" cy="22" r="1.8" fill="#a85040"/>',
  soomuslant: '<path d="M14 10c10 0 18 8 18 18 0 6-4 10-9 10-9 0-12-9-9-18z" fill="#cfe4f0" stroke="#6a90a8" stroke-width="1.5"/><path d="M18 16c5 2 8 6 9 12" stroke="#ffffff" stroke-width="2" fill="none" opacity=".8"/><path d="M23 38v4a3 3 0 1 0 5 0" stroke="#8a9aa8" stroke-width="1.8" fill="none"/>',
  erisoot: '<circle cx="24" cy="26" r="18" fill="#c08aff" opacity=".16"/><rect x="13" y="14" width="22" height="26" rx="4" fill="#6a3a8a" stroke="#3a1a5a" stroke-width="1.5"/><rect x="11" y="10" width="26" height="6" rx="2" fill="#4a2a6a"/><path d="M24 20l1.6 3.6 3.6 1.6-3.6 1.6L24 30.4l-1.6-3.6-3.6-1.6 3.6-1.6z" fill="#ffe27a"/>',
  berries: '<path d="M12 16h24l-2 24H14z" fill="#b8925a" stroke="#6a5030" stroke-width="1.5"/><path d="M12 16c2-5 22-5 24 0" fill="#d0aa70"/><path d="M16 24h16M16 31h16" stroke="#8a6a3a" stroke-width="1.2"/><text x="24" y="30" text-anchor="middle" font-size="9" fill="#4a3018" font-weight="700">VÄETIS</text>'
};
function matIc(id, size) { return `<svg class="kt-ic" viewBox="0 0 48 48" width="${size || 40}" height="${size || 40}" aria-hidden="true">${MAT_SVG[id] || MAT_SVG.filee}</svg>` }
function knifeSvg(t) {
  const blade = ['#b8c0c8', '#dfe6ee', '#e0a060', '#ffd04a', '#8af0e8'][Math.max(0, Math.min(4, t - 1))], glow = t >= 4;
  return `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true">${glow ? `<circle cx="32" cy="32" r="26" fill="${blade}" opacity=".18"/>` : ''}<path d="M10 50 L40 20 C46 14 54 12 56 10 C54 18 50 26 44 30 L18 56 Z" fill="${blade}" stroke="#4a5058" stroke-width="1.5"/><path d="M14 52 L42 24" stroke="#ffffff" stroke-width="1.2" opacity=".7"/><rect x="2" y="50" width="16" height="7" rx="3" transform="rotate(-45 10 54)" fill="#6a4228" stroke="#3a2210" stroke-width="1.2"/></svg>`;
}
function ktMat(id) { return (KTK.d && KTK.d.catalog || []).find(m => m.id === id) || { id, name: id, price: 0, rarity: 1, descr: '' } }
function ktName(id) { const r = (KTK.d && KTK.d.recipes || []).find(x => x.out_id === id); return ktMat(id).name !== id ? ktMat(id).name : r ? r.name : (FD.bait && FD.bait[id] ? FD.bait[id].name : id) }
function ktHave(id) { return (KTK.d && KTK.d.mats && KTK.d.mats[id]) || 0 }

document.head.insertAdjacentHTML('beforeend', `<style>
.kt-sub{display:flex;gap:6px;overflow-x:auto;padding:4px 2px 8px;margin-bottom:6px;scrollbar-width:none}
.kt-sub::-webkit-scrollbar{display:none}
.kt-sub button{flex:none;display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:12px;border:1px solid rgba(134,205,224,.16);background:rgba(255,255,255,.045);color:#e6efec;font:inherit;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap}
.kt-sub button.on{background:linear-gradient(180deg,#2f9a96,#1d6a6c);border-color:rgba(130,245,230,.75);box-shadow:0 0 14px rgba(70,208,198,.3);color:#fff}
.kt-sub button.lk{opacity:.55}
.kt-sub button:focus-visible{outline:2px solid #e8b65a;outline-offset:2px}
.kt-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center}
.kt-lv{width:58px;height:58px;border-radius:16px;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#2f7486,#14343f 75%);box-shadow:0 0 0 2px #e8b65a;text-align:center;line-height:1}
.kt-lv b{font-size:22px;color:#fff6dc}.kt-lv small{font-size:9.5px;color:#e8cf98;font-weight:800}
.kt-bar{height:9px;border-radius:999px;background:rgba(0,0,0,.4);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(134,205,224,.18);margin:5px 0 3px}
.kt-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c88a2a,#ffd27a)}
.kt-rep{text-align:right;font-size:13px;color:#a9c4c8}.kt-rep b{display:block;color:#ffe0a0;font-size:15px}
.kt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.kt-card{position:relative;display:grid;gap:8px;padding:12px;border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.18));border:1px solid rgba(134,205,224,.16)}
.kt-card.r3{border-color:rgba(108,184,255,.4)}.kt-card.r4{border-color:rgba(192,138,255,.45)}.kt-card.r5,.kt-card.r6{border-color:rgba(255,201,74,.55);box-shadow:0 0 16px rgba(255,201,74,.15)}
.kt-card.lock{opacity:.6}
.kt-row{display:flex;align-items:center;gap:10px}
.kt-row canvas{width:84px;height:46px;flex:none}
.kt-row h3{margin:0;font-size:16px}.kt-row small{display:block;color:#a9c4c8;font-size:12.5px;line-height:1.4}
.kt-chips{display:flex;flex-wrap:wrap;gap:5px}
.kt-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 4px;border-radius:999px;background:rgba(0,0,0,.28);font-size:12.5px;font-weight:700}
.kt-chip .kt-ic{width:20px;height:20px}.kt-chip.no{color:#ffb4a0;box-shadow:inset 0 0 0 1px rgba(255,120,90,.45)}.kt-chip.ok{color:#c8f0d0}
.kt-act{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.kt-step{display:inline-flex;align-items:center;border-radius:999px;background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(134,205,224,.18)}
.kt-step button{border:0;background:none;color:#e6efec;font:inherit;font-weight:800;width:30px;height:30px;cursor:pointer;border-radius:50%}
.kt-step b{min-width:26px;text-align:center}
.kt-fresh{font-size:11.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:rgba(127,224,160,.15);color:#9ff0b8}
.kt-fresh.mid{background:rgba(255,201,74,.15);color:#ffe08a}.kt-fresh.old{background:rgba(255,120,90,.15);color:#ffb4a0}
.kt-stage{position:relative;overflow:hidden;border-radius:18px;min-height:260px;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;
  background:radial-gradient(120% 90% at 50% 0%,rgba(255,230,180,.16),transparent 60%),repeating-linear-gradient(90deg,#7a5432 0 38px,#6e4a2b 38px 40px,#82593a 40px 78px,#6a4628 78px 80px);
  box-shadow:inset 0 0 0 3px #4a2e18,inset 0 10px 30px rgba(0,0,0,.35),0 10px 24px rgba(0,0,0,.35);display:grid;place-items:center}
.kt-stage:focus-visible{outline:3px solid #e8b65a;outline-offset:3px}
.kt-stage .obj{position:relative;display:grid;place-items:center;transition:transform .08s}
.kt-stage .obj canvas{width:min(78vw,340px);height:auto;aspect-ratio:2/1;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.kt-stage .obj .kt-ic{width:150px;height:150px;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.kt-stage .obj.hit{transform:scale(.97) translateY(2px)}
.kt-stage .knife{position:absolute;right:20%;top:12%;transform-origin:20% 85%;transform:rotate(-12deg);transition:transform .12s cubic-bezier(.3,1.6,.5,1);pointer-events:none;filter:drop-shadow(0 6px 6px rgba(0,0,0,.45))}
.kt-stage .knife svg{width:110px;height:110px}
@media (max-width:600px){.kt-stage .knife svg{width:80px;height:80px}.kt-stage .knife{right:8%}}
.kt-stage .knife.cut{transform:rotate(-58deg) translate(-26px,24px)}
.kt-stage .pt{position:absolute;pointer-events:none;width:9px;height:12px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;animation:ktPt .7s ease-out forwards}
.kt-stage .hint{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-weight:800;color:#fff3dc;text-shadow:0 2px 6px rgba(0,0,0,.7);font-size:14px;pointer-events:none}
.kt-stage .pf{position:absolute;top:14px;left:50%;transform:translateX(-50%);font-weight:900;font-size:18px;color:#7fffb0;text-shadow:0 2px 8px rgba(0,0,0,.6);pointer-events:none;animation:ktPf .6s ease-out forwards}
.kt-prec{position:relative;height:16px;border-radius:999px;background:rgba(0,0,0,.4);box-shadow:inset 0 0 0 1px rgba(134,205,224,.2);overflow:hidden}
.kt-prec .z{position:absolute;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,rgba(127,224,160,.35),rgba(127,224,160,.7),rgba(127,224,160,.35));box-shadow:0 0 10px rgba(127,224,160,.5)}
.kt-prec .m{position:absolute;top:-2px;bottom:-2px;width:5px;margin-left:-2px;border-radius:3px;background:#fff6dc;box-shadow:0 0 8px #ffe08a}
.kt-prog{height:14px;border-radius:999px;background:rgba(0,0,0,.4);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(134,205,224,.2)}
.kt-prog i{display:block;height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#2fb5c4,#7fe8e0);transition:width .12s}
.kt-res{display:grid;gap:10px;justify-items:center;text-align:center}
.kt-qb{display:inline-block;padding:6px 16px;border-radius:999px;font-weight:900;font-size:18px;color:#10201c;animation:ktQ .6s cubic-bezier(.2,1.5,.4,1) both}
.kt-got{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.kt-got div{display:grid;justify-items:center;gap:2px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.05);min-width:76px;animation:ktIn .5s cubic-bezier(.2,1.4,.4,1) both}
.kt-got div.rare{background:radial-gradient(circle,rgba(255,210,100,.25),rgba(255,255,255,.05));box-shadow:0 0 14px rgba(255,201,74,.3)}
.kt-got b{font-size:17px;color:#ffe0a0}.kt-got small{font-size:11.5px;color:#a9c4c8}
.kt-tool{display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px;align-items:center}
.kt-ws{display:grid;gap:6px}
.kt-ws div{display:grid;grid-template-columns:28px minmax(0,1fr);gap:8px;align-items:center;font-size:13.5px;padding:6px 8px;border-radius:10px;background:rgba(0,0,0,.18)}
.kt-ws div.on{background:rgba(127,224,160,.1);color:#d8f8e0}.kt-ws div.nx{box-shadow:inset 0 0 0 1px rgba(232,182,90,.5)}
.kt-ws b{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.08)}
.kt-ws div.on b{background:#2f9a96;color:#fff}
.kt-q{display:grid;gap:6px}
.kt-q .kt-bar i{background:linear-gradient(90deg,#2fb5c4,#7fe8e0)}
.kt-q.done{border-color:rgba(127,224,160,.5)}
.kt-empty{padding:18px;text-align:center;color:#a9c4c8;border-radius:14px;border:1px dashed rgba(134,205,224,.2)}
@keyframes ktPt{to{transform:translate(var(--dx),var(--dy)) rotate(var(--r));opacity:0}}
@keyframes ktPf{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-16px)}}
@keyframes ktQ{from{opacity:0;transform:scale(.5)}}
@keyframes ktIn{from{opacity:0;transform:translateY(10px) scale(.9)}}
@media (max-width:600px){.kt-head{grid-template-columns:auto minmax(0,1fr)}.kt-rep{grid-column:1 / -1;text-align:left}.kt-stage{min-height:220px}.kt-stage .obj .kt-ic{width:120px;height:120px}.kt-grid{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.kt-stage .pt,.kt-stage .pf,.kt-qb,.kt-got div{animation:none}.kt-stage .knife{transition:none}}
</style>`);

async function ktLoad(silent) {
  if (KTK.loading) return; KTK.loading = true; KTK.at = Date.now();
  try { const d = await rpc('proc_state'); ktSet(d) } catch (e) { if (!silent) toast('Kalatöökoda ei laadinud: ' + e.message, 'bad') }
  KTK.loading = false; if (FV.open && FV.tab === 'kalurimaja') renderFV(true);
}
function ktSet(d) {
  KTK.d = d; KTK.at = Date.now();
  if (d.job && !KTK.job) KTK.job = { kind: d.job.kind, need: d.job.clicks, clicks: 0, precise: 0, payload: d.job.payload, t0: Date.now() };
}
function ktNav() {
  const ws = KTK.d ? KTK.d.proc.ws : 1;
  return `<nav class="kt-sub" aria-label="Kalurimaja">${KT_SUBS.map(([k, n, ic, need]) => `<button type="button" class="${KTK.sub === k ? 'on' : ''} ${ws < need ? 'lk' : ''}" data-kt="sub" data-arg="${k}">${ic} ${n}${ws < need ? ' 🔒' : ''}</button>`).join('')}</nav>`;
}
function ktHead() {
  const P = KTK.d.proc, pct = P.next ? Math.min(100, (P.xp - P.cur) / Math.max(1, P.next - P.cur) * 100) : 100;
  const tn = P.tier < 4 ? KT_REPN[P.tier + 1] : null;
  return `<div class="fv-card"><div class="kt-head"><div class="kt-lv"><div><b>${P.lvl}</b><br><small>TASE</small></div></div>
    <div><b>Kalatöötlemise oskus</b><div class="kt-bar"><i style="width:${pct.toFixed(1)}%"></i></div><small class="lead" style="font-size:12.5px">${P.next ? `${fmt(P.xp)} / ${fmt(P.next)} kogemust` : 'Maksimaalne tase!'} · Töökoja tase ${P.ws}/6</small></div>
    <div class="kt-rep">Kaluri maine<b>⭐ ${fmt(P.rep)} · ${KT_REP[P.tier]}</b>${tn ? `<small>Järgmine tiitel ${fmt(tn)} juures</small>` : ''}</div></div></div>`;
}
function ktReqChips(needs, res, times) {
  const R = KTK.d.res || {};
  return Object.entries(needs || {}).map(([k, q]) => { const n = q * times, h = ktHave(k); return `<span class="kt-chip ${h >= n ? 'ok' : 'no'}" title="${esc(ktMat(k).name)}">${matIc(k, 20)}${h}/${n}</span>` }).join('')
    + Object.entries(res || {}).map(([k, q]) => { const n = q * times, h = R[k] || 0, [ic, nm] = KT_RES[k] || ['•', k]; return `<span class="kt-chip ${h >= n ? 'ok' : 'no'}" title="Kuningriigi ${nm}">${ic} ${h}/${n}</span>` }).join('');
}
function ktCanMake(r) {
  const R = KTK.d.res || {}; let m = 10;
  for (const [k, q] of Object.entries(r.needs || {})) m = Math.min(m, Math.floor(ktHave(k) / q));
  for (const [k, q] of Object.entries(r.res || {})) m = Math.min(m, Math.floor((R[k] || 0) / q));
  return m;
}
function ktRecipes(st) {
  const P = KTK.d.proc, list = KTK.d.recipes.filter(r => r.station === st);
  return `<div class="kt-grid">${list.map(r => {
    const lockWs = P.ws < r.ws, lockLv = P.lvl < r.skill, lockRep = P.rep < r.rep_need, lock = lockWs || lockLv || lockRep;
    const max = ktCanMake(r), t = Math.max(1, Math.min(max || 1, KTK.times[r.id] || 1));
    const outName = r.out_kind === 'bait' ? (FD.bait && FD.bait[r.out_id] ? FD.bait[r.out_id].name : r.name) : r.out_kind === 'inbox' ? 'marja kuningriigile' : ktMat(r.out_id).name;
    return `<div class="kt-card ${lock ? 'lock' : ''}"><div class="kt-row">${matIc(r.out_kind === 'inbox' ? 'berries' : r.out_id, 48)}<div><h3>${esc(r.name)}</h3><small>${esc(r.descr)}</small></div></div>
      <div class="kt-chips">${ktReqChips(r.needs, r.res, t)}</div>
      <small class="lead" style="font-size:12.5px">Tulemus: <b>${r.out_qty * t} × ${esc(outName)}</b> · ${Math.max(3, Math.round(r.clicks * t * P.cmult / (1 - 0.12 * (P.knife - 1))))} klikki · +${r.xp * t} kogemust</small>
      ${lock ? `<small class="lead" style="font-size:12.5px">🔒 ${lockWs ? `Vajab töökoja ${r.ws}. taset` : lockLv ? `Vajab kalatöötlemise ${r.skill}. taset` : `Vajab ${r.rep_need} mainet`}</small>`
        : `<div class="kt-act"><span class="kt-step"><button type="button" data-kt="t-" data-arg="${r.id}" aria-label="Vähem">−</button><b>${t}</b><button type="button" data-kt="t+" data-arg="${r.id}" aria-label="Rohkem">+</button></span>
          <button class="btn sm" type="button" data-kt="craft" data-arg="${r.id}" ${!max || KTK.busy || KTK.job ? 'disabled' : ''}>🛠 Valmista</button>${!max ? '<small class="lead" style="font-size:12px">Materjale jääb puudu</small>' : ''}</div>`}</div>`;
  }).join('')}</div>`;
}
function ktFresh(f) { const p = Math.round(f * 100); return `<span class="kt-fresh ${p >= 95 ? '' : p >= 75 ? 'mid' : 'old'}">${p >= 100 ? '❄ Värske' : `⏳ ${p}% värske`}</span>` }
function ktClean() {
  const P = KTK.d.proc, groups = {};
  KTK.d.fish.forEach(f => { (groups[f.species] = groups[f.species] || []).push(f) });
  const keys = Object.keys(groups).sort((a, b) => (FD.sp[a] || {}).name > (FD.sp[b] || {}).name ? 1 : -1);
  if (!keys.length) return '<div class="kt-empty">Saagis pole ühtegi kala, mida puhastada. Mine püüdma ja tule tagasi!</div>';
  return `<div class="kt-grid">${keys.map(sp => {
    const L = groups[sp].slice().sort((a, b) => a.fresh - b.fresh || b.weight - a.weight), s = FD.sp[sp] || { name: sp }, r = L[0].rarity;
    const lock = (r >= 5 && P.lvl < 30) || (r === 4 && P.lvl < 15), n = Math.max(1, Math.min(10, L.length, KTK.sel[sp] || 1));
    const pick = L.slice(0, n), cl = Math.max(3, Math.round(pick.reduce((t, x) => t + x.clicks, 0) * P.cmult)), fr = Math.min(...L.map(x => +x.fresh));
    return `<div class="kt-card r${r} ${lock ? 'lock' : ''}"><div class="kt-row"><canvas data-fl="${sp}" data-r="${r}" data-nobg="1"></canvas><div><h3>${esc(s.name)} <small style="display:inline;color:${RAR2[r][1]}">· ${RAR2[r][0]}</small></h3>
      <small>${L.length} tk · ${fKg(Math.min(...L.map(x => +x.weight)))}–${fKg(Math.max(...L.map(x => +x.weight)))}</small>${ktFresh(fr)}</div></div>
      ${lock ? `<small class="lead" style="font-size:12.5px">🔒 ${r >= 5 ? 'Legendaarseid ja müütilisi kalu saab töödelda 30. tasemel' : 'Eepilisi kalu saab töödelda 15. tasemel'}</small>`
        : `<div class="kt-act"><span class="kt-step"><button type="button" data-kt="n-" data-arg="${sp}" aria-label="Vähem">−</button><b>${n}</b><button type="button" data-kt="n+" data-arg="${sp}" aria-label="Rohkem">+</button></span>
          <button class="btn sm" type="button" data-kt="clean" data-arg="${sp}" ${KTK.busy || KTK.job ? 'disabled' : ''}>🔪 Puhasta (${cl} klikki)</button></div>`}</div>`;
  }).join('')}</div>`;
}
function ktStage() {
  const J = KTK.job, P = KTK.d.proc; let obj;
  if (J.kind === 'clean') return csStage(J, P);
  if (J.kind === 'clean') { const id = (J.payload.ids || [])[0], f = KTK.d.fish.find(x => x.id === +id) || {}; obj = `<canvas data-fl="${f.species || 'ahven'}" data-r="${f.rarity || 1}" data-nobg="1"></canvas>` }
  else { const r = KTK.d.recipes.find(x => x.id === J.payload.recipe) || {}; obj = matIc(r.out_kind === 'inbox' ? 'berries' : r.out_id, 150) }
  const title = J.kind === 'clean' ? `🔪 Puhastad ${(J.payload.ids || []).length} kala` : `🛠 Valmistad: ${esc((KTK.d.recipes.find(x => x.id === J.payload.recipe) || {}).name || '')}`;
  return `<div class="fv-card"><h2 style="margin-bottom:6px">${title}</h2><p class="lead" style="margin-top:0">Klikka või toksa laual. Kui klikkad siis, kui valge märk on rohelises alas, on liigutus täpne – täpsus parandab kvaliteeti.</p>
    <div class="kt-stage" id="ktStage" role="button" tabindex="0" aria-label="Tööliigutus (klikka või vajuta tühikut)"><div class="obj" id="ktObj">${obj}</div><span class="knife" id="ktKnife">${knifeSvg(J.kind === 'clean' ? P.knife : 2)}</span><span class="hint" id="ktHint">${J.clicks}/${J.need}</span></div>
    <div style="display:grid;gap:8px;margin-top:10px"><div class="kt-prec" aria-hidden="true"><span class="z" id="ktZone"></span><span class="m" id="ktMark"></span></div>
    <div class="kt-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${J.need}" aria-valuenow="${J.clicks}"><i id="ktProg" style="width:${(J.clicks / J.need * 100).toFixed(1)}%"></i></div>
    <div class="kt-act" style="justify-content:space-between"><small class="lead" id="ktAcc">Täpsus: ${J.clicks ? Math.round(J.precise / J.clicks * 100) : 0}%</small><button class="btn sm ghost" type="button" data-kt="cancel">Katkesta</button></div></div></div>`;
}
function ktLadu() {
  const cat = KTK.d.catalog.filter(m => ktHave(m.id) > 0);
  const baits = ['kalasoot', 'soomuslant', 'erisoot'].filter(b => (FS.baits || {})[b] > 0);
  if (!cat.length && !baits.length) return '<div class="kt-empty">Ladu on tühi. Puhasta kalu, et saada fileed, luid, jäätmeid ja soomuseid!</div>';
  return `<div class="kt-grid">${cat.map(m => `<div class="kt-card ${m.rarity >= 3 ? 'r' + m.rarity : ''}"><div class="kt-row">${matIc(m.id, 48)}<div><h3>${esc(m.name)} <b style="color:#ffe0a0">× ${fmt(ktHave(m.id))}</b></h3><small>${esc(m.descr)}</small></div></div>
    ${m.id === 'kalasupp' ? `<div class="kt-act"><button class="btn sm" type="button" data-kt="feed">🍲 Saada 1 kuningriigi kööki (+20 toitu)</button>${ktHave('kalasupp') > 1 ? `<button class="btn sm ghost" type="button" data-kt="feedall">Saada kõik</button>` : ''}</div>` : ''}</div>`).join('')}
    ${baits.map(b => `<div class="kt-card"><div class="kt-row">${matIc(b, 48)}<div><h3>${esc(FD.bait[b] ? FD.bait[b].name : b)} <b style="color:#ffe0a0">× ${fmt(FS.baits[b])}</b></h3><small>Söödakastis – vali see püügi juures söödaks.</small></div></div></div>`).join('')}</div>`;
}
function ktLett() {
  const P = KTK.d.proc; if (P.ws < 5) return ktLocked(5);
  const ord = KTK.d.orders || [];
  let h = `<div class="fv-card"><h2>🍺 Kõrtsi tellimused</h2><p class="lead">Kõrts ja kuningriigi köögid tellivad iga päev sinu tooteid. Tellimus maksab tavahinnast rohkem ja tõstab mainet. Mida kuulsam oled, seda rohkem tellimusi tuleb.</p>
    <div class="kt-grid">${ord.map(o => `<div class="kt-card ${o.done ? '' : ''}"><div class="kt-row">${matIc(o.mat, 44)}<div><h3>${o.qty} × ${esc(ktMat(o.mat).name)}</h3><small>Laos: ${fmt(ktHave(o.mat))}</small></div></div>
      <div class="kt-chips"><span class="kt-chip ok">🪙 ${fmt(o.gold)}</span><span class="kt-chip ok">⭐ ${o.rep}</span><span class="kt-chip ok">✨ ${o.xp}</span></div>
      ${o.done ? '<span class="pill ok">✓ Täidetud</span>' : `<div class="kt-act"><button class="btn sm" type="button" data-kt="order" data-arg="${o.idx}" ${ktHave(o.mat) < o.qty || KTK.busy ? 'disabled' : ''}>📦 Täida tellimus</button></div>`}</div>`).join('')}</div></div>`;
  const sell = KTK.d.catalog.filter(m => ktHave(m.id) > 0), bonus = 1 + 0.05 * P.tier;
  h += `<div class="fv-card"><h2>🏪 Kalalett</h2><p class="lead">Müü fileed, suitsukala ja meisterdatud tooteid. Maine tõstab hindu (praegu +${Math.round((bonus - 1) * 100)}%).</p>
    ${sell.length ? `<div class="kt-grid">${sell.map(m => `<div class="kt-card"><div class="kt-row">${matIc(m.id, 40)}<div><h3>${esc(m.name)} × ${fmt(ktHave(m.id))}</h3><small>${fmt(Math.round(m.price * bonus))} kulda tükk</small></div></div>
      <div class="kt-act"><button class="btn sm ghost" type="button" data-kt="sell1" data-arg="${m.id}">Müü 1</button><button class="btn sm" type="button" data-kt="sellall" data-arg="${m.id}">Müü kõik (${fmt(Math.round(m.price * bonus * ktHave(m.id)))} 🪙)</button></div></div>`).join('')}</div>` : '<div class="kt-empty">Laos pole midagi müüa.</div>'}</div>`;
  return h;
}
function ktLocked(l) { return `<div class="kt-empty">🔒 See avaneb Kalurimaja töökoja <b>${l}. tasemel</b>.<br><button class="btn sm" type="button" data-kt="sub" data-arg="tools" style="margin-top:8px">🛠 Vaata töökoja täiustamist</button></div>` }
function ktCost(c) {
  if (!c) return ''; const R = KTK.d.res || {};
  return `<div class="kt-chips">${c.gold ? `<span class="kt-chip ${FS.gold >= c.gold ? 'ok' : 'no'}">🪙 ${fmt(c.gold)}</span>` : ''}${c.wood ? `<span class="kt-chip ${(R.wood || 0) >= c.wood ? 'ok' : 'no'}">🪵 ${R.wood || 0}/${c.wood}</span>` : ''}${c.stone ? `<span class="kt-chip ${(R.stone || 0) >= c.stone ? 'ok' : 'no'}">🪨 ${R.stone || 0}/${c.stone}</span>` : ''}${Object.entries(c.mats || {}).map(([k, q]) => `<span class="kt-chip ${ktHave(k) >= q ? 'ok' : 'no'}">${matIc(k, 20)}${ktHave(k)}/${q}</span>`).join('')}</div>`;
}
function ktTools() {
  const P = KTK.d.proc, T = KTK.d.tools, nx = KTK.d.ws_cost[P.ws];
  const KN = ['Raudnuga', 'Terasnuga', 'Pronksnuga', 'Kuldnuga', 'Müütiline nuga'];
  return `<div class="fv-card"><h2>🏚 Kalurimaja töökoda</h2><p class="lead">Arenda vana kalurimaja järk-järgult suureks kalatöötlemise töökojaks. Iga tase avab uusi töökohti ja boonuseid.</p>
    <div class="kt-ws">${KT_WS.map((t, i) => `<div class="${P.ws > i ? 'on' : P.ws === i ? 'nx' : ''}"><b>${i + 1}</b><span>${esc(t)}</span></div>`).join('')}</div>
    ${P.ws < 6 ? `<div style="display:grid;gap:8px;margin-top:10px"><b>Järgmine: ${P.ws + 1}. tase</b>${ktCost(nx)}<div class="kt-act"><button class="btn" type="button" data-kt="up" data-arg="ws" ${KTK.busy ? 'disabled' : ''}>🔨 Täienda töökoda</button></div></div>` : '<p class="lead">✓ Töökoda on täielikult välja ehitatud!</p>'}</div>
    <div class="kt-grid" style="margin-top:12px">
      <div class="kt-card"><div class="kt-tool">${knifeSvg(P.knife)}<div><h3 style="margin:0">${KN[P.knife - 1]} (${P.knife}/5)</h3><small class="lead">Parem nuga vähendab puhastamiseks vajalike klikkide arvu (praegu −${(P.knife - 1) * 12}%) ja parandab kvaliteeti.</small></div></div>
        ${T.knife ? `${ktCost(T.knife)}<button class="btn sm" type="button" data-kt="up" data-arg="knife" ${KTK.busy ? 'disabled' : ''}>⬆ ${KN[P.knife]}</button>` : '<span class="pill ok">✓ Parim nuga</span>'}</div>
      <div class="kt-card"><div class="kt-tool"><svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><rect x="8" y="20" width="48" height="32" rx="5" fill="#5a3a22" stroke="#e8b65a" stroke-width="${1 + P.kit}"/><path d="M24 20v-6h16v6" stroke="#e8b65a" stroke-width="3" fill="none"/><path d="M8 32h48" stroke="#3a2212" stroke-width="2"/></svg><div><h3 style="margin:0">Meisterlik tööriistakomplekt (${P.kit}/3)</h3><small class="lead">Annab võimaluse saada lisamaterjale ja kuldseid soomuseid (${P.kit * 10}%).</small></div></div>
        ${T.kit ? `${ktCost(T.kit)}<button class="btn sm" type="button" data-kt="up" data-arg="kit" ${KTK.busy ? 'disabled' : ''}>⬆ Täienda komplekti</button>` : '<span class="pill ok">✓ Täielik komplekt</span>'}</div>
      <div class="kt-card"><div class="kt-tool"><svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#c08aff" opacity="${P.rarekit ? '.3' : '.12'}"/><rect x="14" y="22" width="36" height="26" rx="5" fill="#3a2a5a" stroke="#c08aff" stroke-width="2"/><path d="M32 26l2.4 5.2 5.6 2.4-5.6 2.4L32 41.2l-2.4-5.2-5.6-2.4 5.6-2.4z" fill="#ffe27a"/></svg><div><h3 style="margin:0">Eriline puhastuskomplekt</h3><small class="lead">Parandab eepiliste ja haruldasemate kalade töötlemise kvaliteeti.</small></div></div>
        ${T.rarekit ? `${ktCost(T.rarekit)}<button class="btn sm" type="button" data-kt="up" data-arg="rarekit" ${KTK.busy ? 'disabled' : ''}>🛒 Hangi komplekt</button>` : '<span class="pill ok">✓ Olemas</span>'}</div>
    </div>
    <div class="fv-card" style="margin-top:12px"><h2>📈 Oskuse tasemed</h2><div class="kt-ws">${KT_PERKS.map(([l, t]) => `<div class="${P.lvl >= l ? 'on' : ''}"><b>${l}</b><span>${esc(t)}</span></div>`).join('')}</div></div>`;
}
function ktQuests() {
  return `<div class="kt-grid">${KTK.d.quests.map(q => { const done = q.have >= q.goal, p = Math.min(100, q.have / q.goal * 100);
    return `<div class="kt-card kt-q ${q.claimed ? 'done' : ''}"><h3 style="margin:0">${q.claimed ? '✓ ' : ''}${esc(q.name)}</h3><small class="lead">${esc(q.descr)}</small>
      <div class="kt-bar"><i style="width:${p.toFixed(1)}%"></i></div><small class="lead">${Math.min(q.have, q.goal)}/${q.goal}</small>
      <div class="kt-chips">${q.gold ? `<span class="kt-chip ok">🪙 ${fmt(q.gold)}</span>` : ''}${q.xp ? `<span class="kt-chip ok">✨ ${q.xp}</span>` : ''}${q.rep ? `<span class="kt-chip ok">⭐ ${q.rep}</span>` : ''}${Object.entries(q.mats || {}).map(([k, n]) => `<span class="kt-chip ok">${matIc(k, 20)}${n}</span>`).join('')}</div>
      ${q.claimed ? '' : `<button class="btn sm" type="button" data-kt="quest" data-arg="${q.id}" ${!done || KTK.busy ? 'disabled' : ''}>${done ? '🎁 Võta preemia' : 'Pooleli'}</button>`}</div>` }).join('')}</div>`;
}
function ktView() {
  if (!KTK.d) { ktLoad(); return '<div class="fv-card"><p class="lead">Laen kalatöökoda…</p></div>' }
  if (Date.now() - KTK.at > 30000 && !KTK.job) ktLoad(true);
  if (KTK.job) return ktHead() + ktStage();
  const P = KTK.d.proc, sub = KTK.sub;
  let h = ktHead();
  if (sub === 'laud') h += `<div class="fv-card"><h2>🔪 Kalapuhastuslaud</h2><p class="lead">Vali kala ja kogus ning puhasta see klikkides. Puhastatud kala kaob Saagist, aga sinu statistika ja rekordid jäävad alles. Materjalid lähevad lattu. Värskem kala annab rohkem materjali.</p>${ktClean()}</div>
    <div class="fv-card"><h2>🦴 Meisterdamine</h2><p class="lead">Luudest ja soomustest saab teha konkse, kaunistusi ja meistriteoseid.</p>${ktRecipes('laud')}</div>`;
  else if (sub === 'ahi') h += P.ws < 3 ? ktLocked(3) : `<div class="fv-card"><h2>🔥 Suitsuahi</h2><p class="lead">Suitsutatud kala ei rikne ja müüb palju kallimalt. Puit tuleb kuningriigi varudest.</p>${ktRecipes('ahi')}</div>`;
  else if (sub === 'soot') h += P.ws < 4 ? ktLocked(4) : `<div class="fv-card"><h2>🪱 Sööda valmistamise laud</h2><p class="lead">Jäätmetest ja fileest saab head sööta – see läheb otse sinu söödakasti. Väetis teeb kuningriigi marjapõõsad lopsakaks.</p>${ktRecipes('soot')}</div>`;
  else if (sub === 'lett') h += ktLett();
  else if (sub === 'ladu') h += `<div class="fv-card"><h2>📦 Ladu</h2><p class="lead">Kõik sinu materjalid ja tooted. Igal asjal on kasutus: retseptides, tööriistade täiustamisel, kõrtsi tellimustes või müügiks.</p>${ktLadu()}</div>`;
  else if (sub === 'tools') h += ktTools();
  else if (sub === 'quest') h += `<div class="fv-card"><h2>📜 Kalatöötlemise ülesanded</h2><p class="lead">Ülesanded uuenevad ise sinu tegevuste põhjal.</p>${ktQuests()}</div>`;
  return h;
}
// Kalurimaja vahekaart: alammenüü + kas vana maja vaade või töökoja vaated
{
  const _cb = cbTab;
  cbTab = function () { if (!KTK.d && !KTK.loading) ktLoad(true); return ktNav() + (KTK.sub === 'maja' ? _cb() : ktView()) };
  FTAB_FN.kalurimaja = cbTab;
}

// --- klikkimine ---
function ktMarker(t) { const sp = KTK.job && KTK.job.st ? CS_ST[ktCur(KTK.job)].sp : 420; return (Math.sin(t / sp) + 1) / 2 }
function ktZoneW() { return KTK.job && KTK.job.st ? CS_ST[ktCur(KTK.job)].z : .12 }
function ktLoop() {
  cancelAnimationFrame(KTK.raf);
  const tick = ts => {
    const m = document.getElementById('ktMark'), z = document.getElementById('ktZone');
    if (!KTK.job || !m) { KTK.raf = 0; return }
    if (KTK.zone == null) KTK.zone = .5;
    m.style.left = (ktMarker(ts) * 100).toFixed(2) + '%';
    if (z) { const w = ktZoneW(); z.style.left = ((KTK.zone - w) * 100) + '%'; z.style.width = (w * 200) + '%' }
    KTK.raf = requestAnimationFrame(tick);
  };
  KTK.raf = requestAnimationFrame(tick);
}
function ktHit(ev) {
  const J = KTK.job; if (!J || J.sending) return;
  const now = performance.now(); if (now - (J.last || 0) < 55) return; J.last = now; // kuni ~18 klikki sekundis
  const pos = ktMarker(now), zw = ktZoneW(), precise = Math.abs(pos - (KTK.zone == null ? .5 : KTK.zone)) <= zw;
  J.clicks++; if (precise) { J.precise++; KTK.zone = zw + .03 + Math.random() * (1 - 2 * zw - .06) }
  let stDone = null;
  if (J.st) { const i = ktCur(J), S0 = J.st[i]; S0.clicks++; if (precise) S0.precise++; if (S0.clicks >= S0.need && i < J.st.length - 1) stDone = i; csUpdate(J) }
  const st = document.getElementById('ktStage'), kn = document.getElementById('ktKnife'), ob = document.getElementById('ktObj');
  if (kn) { kn.classList.remove('cut'); void kn.offsetWidth; kn.classList.add('cut'); setTimeout(() => kn.classList.remove('cut'), 110) }
  if (ob) { ob.classList.add('hit'); setTimeout(() => ob.classList.remove('hit'), 80) }
  if (st) {
    const r = st.getBoundingClientRect(), x = ev && ev.clientX ? ev.clientX - r.left : r.width / 2, y = ev && ev.clientY ? ev.clientY - r.top : r.height / 2;
    const cols = J.st ? CS_ST[Math.min(J.st.length - 1, ktCur(J, true))].cols : ['#e8b060', '#c8d0d0', '#ffe08a'];
    for (let i = 0; i < (precise ? 7 : 4); i++) { const p = document.createElement('span'); p.className = 'pt'; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = cols[i % cols.length];
      p.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); p.style.setProperty('--dy', (-30 - Math.random() * 70) + 'px'); p.style.setProperty('--r', (Math.random() * 360) + 'deg'); st.appendChild(p); setTimeout(() => p.remove(), 720) }
    if (precise) { const f = document.createElement('span'); f.className = 'pf'; f.textContent = 'Täpne!'; st.appendChild(f); setTimeout(() => f.remove(), 620) }
  }
  if (typeof sfx === 'function') sfx(precise ? 'pick' : 'click');
  const pg = document.getElementById('ktProg'), hn = document.getElementById('ktHint'), ac = document.getElementById('ktAcc');
  if (pg) pg.style.width = Math.min(100, J.clicks / J.need * 100).toFixed(1) + '%';
  if (hn) hn.textContent = `${Math.min(J.clicks, J.need)}/${J.need}`;
  if (ac) ac.textContent = `Täpsus: ${Math.round(J.precise / J.clicks * 100)}%`;
  if (stDone != null) csStageDone(J, stDone);
  if (J.clicks >= J.need) ktFinish();
}
async function ktFinish() {
  const J = KTK.job; if (!J || J.sending) return; J.sending = true;
  const minMs = J.need / 16 * 1000 - (Date.now() - J.t0); if (minMs > 0) await new Promise(r => setTimeout(r, minMs + 150));
  try {
    const d = await rpc('proc_finish', { p_clicks: J.clicks, p_precise: J.precise, p_stages: J.st ? J.st.map(x => x.clicks ? +(x.precise / x.clicks).toFixed(3) : null) : null });
    KTK.job = null; ktSet(d); await refreshFS(); if (d.result && d.result.kind === 'craft' && d.result.res && Object.keys(d.result.res).length && S && S.res) {
      for (const [k, q] of Object.entries(d.result.res)) S.res[k] = Math.max(0, (S.res[k] || 0) - q * (d.result.times || 1)); save(); if (typeof cloudSave === 'function') cloudSave(true) }
    ktkResult(d.result);
  } catch (e) { J.sending = false; toast(e.message, 'bad') }
  renderFV(true);
}
function ktkResult(r) {
  if (!r) return;
  const got = Object.entries(r.got || {}).filter(([, n]) => n > 0), Q = r.kind === 'clean' && r.best ? KT_Q[r.best - 1] : null;
  const nm = k => r.kind === 'craft' && r.out_kind === 'bait' ? (FD.bait[k] ? FD.bait[k].name : k) : r.out_kind === 'inbox' ? 'marja kuningriigile' : ktMat(k).name;
  showModal(() => `<div class="kt-res"><h2 style="margin:0">${r.kind === 'clean' ? '🔪 Puhastus valmis!' : '🛠 Valmis!'}</h2>
    ${Q ? `<span class="kt-qb" style="background:${Q[1]}">${Q[0]} kvaliteet</span>` : ''}
    ${r.kind === 'clean' && r.q && r.q.length > 1 ? `<small class="lead">Kalade kvaliteedid: ${r.q.map(q => KT_Q[q - 1][0]).join(', ')}</small>` : ''}
    ${r.stages ? `<div class="cs-res">${CS_ST.map((c, i) => `<span><i>${c.ic}</i>${c.n}<b>${Math.round(r.stages[i] * 100)}%</b></span>`).join('')}</div>` : ''}
    ${r.gall ? '<p style="margin:0;color:#ffb4a0;font-weight:700">💥 Hooletu rookimine – sapipõis lõhkes ja osa fileest läks raisku!</p>' : ''}
    <div class="kt-got">${got.map(([k, n], i) => `<div class="${['kuldsoomus', 'iidneluu', 'filee_hea'].includes(k) ? 'rare' : ''}" style="animation-delay:${i * 80}ms">${matIc(r.out_kind === 'inbox' ? 'berries' : k, 44)}<b>+${fmt(n)}</b><small>${esc(nm(k))}</small></div>`).join('')}</div>
    <p class="lead" style="margin:0">✨ +${r.xp} oskuse kogemust · ⭐ +${r.rep} mainet${r.kind === 'clean' ? ` · 🎯 täpsus ${Math.round(r.acc * 100)}%` : ''}</p>
    ${r.lvlup ? `<p style="margin:0;font-weight:900;color:#ffe08a">🎉 Kalatöötlemise oskus tõusis ${r.lvlup}. tasemele!</p>` : ''}
    <div class="mbtns" style="justify-content:center"><button class="btn" type="button" data-act="closeModal">Tore!</button></div></div>`, 'ktmodal');
  if (typeof sfx === 'function') sfx(r.best >= 4 || r.lvlup ? 'levelup' : 'chime');
}
document.addEventListener('pointerdown', e => { const st = e.target.closest('#ktStage'); if (!st) return; e.preventDefault(); ktHit(e) });
document.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && document.activeElement && document.activeElement.id === 'ktStage') { e.preventDefault(); ktHit(null) } });

async function ktAct(a, arg) {
  if (a === 'sub') { KTK.sub = arg; try { localStorage.setItem('mk.ktSub', arg) } catch (e) { } renderFV(true); return }
  if (a === 'n+' || a === 'n-') { KTK.sel[arg] = Math.max(1, Math.min(10, (KTK.sel[arg] || 1) + (a === 'n+' ? 1 : -1))); renderFV(true); return }
  if (a === 't+' || a === 't-') { KTK.times[arg] = Math.max(1, Math.min(10, (KTK.times[arg] || 1) + (a === 't+' ? 1 : -1))); renderFV(true); return }
  if (KTK.busy) return; KTK.busy = true; renderFV(true);
  try {
    if (a === 'clean') {
      const L = KTK.d.fish.filter(f => f.species === arg).sort((x, y) => x.fresh - y.fresh || y.weight - x.weight), n = Math.max(1, Math.min(10, L.length, KTK.sel[arg] || 1));
      const ids = L.slice(0, n).map(f => f.id), r = await rpc('proc_start', { p_kind: 'clean', p_ids: ids });
      KTK.job = { kind: 'clean', need: r.clicks, clicks: 0, precise: 0, payload: { ids }, t0: Date.now() }; KTK.zone = .5;
    } else if (a === 'craft') {
      const rc = KTK.d.recipes.find(x => x.id === arg), t = Math.max(1, Math.min(ktCanMake(rc) || 1, KTK.times[arg] || 1));
      if (Object.keys(rc.res || {}).length && typeof cloudSave === 'function') await cloudSave(true); // server peab teadma kuningriigi praeguseid varusid
      const r = await rpc('proc_start', { p_kind: 'craft', p_recipe: arg, p_times: t });
      KTK.job = { kind: 'craft', need: r.clicks, clicks: 0, precise: 0, payload: { recipe: arg, times: t }, t0: Date.now() }; KTK.zone = .5;
    } else if (a === 'cancel') { await rpc('proc_cancel'); KTK.job = null }
    else if (a === 'up') {
      if (arg === 'ws' && typeof cloudSave === 'function') await cloudSave(true);
      const d = await rpc('proc_upgrade', { p_what: arg }); ktSet(d);
      if (d.spent && S && S.res) { if (d.spent.wood) S.res.wood = Math.max(0, S.res.wood - d.spent.wood); if (d.spent.stone) S.res.stone = Math.max(0, S.res.stone - d.spent.stone); save(); if (typeof cloudSave === 'function') cloudSave(true) }
      toast(arg === 'ws' ? `🔨 Töökoda on nüüd ${d.proc.ws}. tasemel: ${KT_WS[d.proc.ws - 1]}` : '⬆ Tööriist täiustatud!', 'good', 'gold'); if (typeof sfx === 'function') sfx('build');
    } else if (a === 'sell1' || a === 'sellall') { const d = await rpc('proc_sell', { p_mat: arg, p_qty: a === 'sell1' ? 1 : ktHave(arg) }); ktSet(d); toast(`🪙 Müüdud: ${d.sold.qty} × ${ktMat(arg).name} – ${fmt(d.sold.gold)} kulda`, 'gold', 'gold') }
    else if (a === 'order') { const d = await rpc('proc_order', { p_idx: +arg }); ktSet(d); toast(`🍺 Tellimus täidetud! +${fmt(d.delivered.gold)} kulda, +${d.delivered.rep} mainet`, 'gold', 'gold'); if (typeof sfx === 'function') sfx('chime') }
    else if (a === 'quest') { const d = await rpc('proc_quest', { p_q: arg }); ktSet(d); toast(`🎁 ${d.claimed.name}: preemia käes!`, 'gold', 'gold'); if (typeof sfx === 'function') sfx('build') }
    else if (a === 'feed' || a === 'feedall') { const d = await rpc('proc_feed', { p_qty: a === 'feed' ? 1 : ktHave('kalasupp') }); ktSet(d); toast(`🍲 Kuningriigi köök sai ${d.fed} toitu!`, 'good'); if (typeof claimInbox === 'function') claimInbox() }
    await refreshFS();
  } catch (e) { toast(e.message, 'bad') }
  KTK.busy = false; renderFV(true);
  if (KTK.job) { ktLoop(); setTimeout(() => { const st = document.getElementById('ktStage'); if (st) st.focus({ preventScroll: true }) }, 50) }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-kt]'); if (!b || b.disabled) return; ktAct(b.dataset.kt, b.dataset.arg) });
// joonistus jätkub ka pärast ümberjoonistamist
{
  const _r = renderFV;
  renderFV = function () { const r = _r.apply(this, arguments); if (KTK.job && FV.open && FV.tab === 'kalurimaja' && document.getElementById('ktStage') && !KTK.raf) ktLoop(); return r };
}
// meisterdatud söödad (kalasööt, soomuslant, erisööt) saavad oma pildi
{
  const _db = drawBait;
  drawBait = function (c, S2, id, t) {
    if (!MAT_SVG[id] || !['kalasoot', 'soomuslant', 'erisoot'].includes(id)) return _db(c, S2, id, t);
    const img = KT_IMG[id] || (KT_IMG[id] = Object.assign(new Image(), { src: 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${MAT_SVG[id]}</svg>`) }));
    if (img.complete) c.drawImage(img, -S2 * .4, -S2 * .4, S2 * .8, S2 * .8); else img.onload = () => { try { renderFV(true) } catch (e) { } };
  };
}
const KT_IMG = {};
// Saak: värskuse märk igal kalal
{
  const _r2 = renderFV;
  renderFV = function () {
    const r = _r2.apply(this, arguments);
    if (FV.open && FV.tab === 'saak' && FS && FS.inventory) document.querySelectorAll('#fvIn .fcell[data-arg]').forEach(el => {
      const c = FS.inventory.find(x => x.id === +el.dataset.arg); if (!c || c.fresh == null || c.trophy || el.querySelector('.kt-fresh')) return;
      const p = Math.round(+c.fresh * 100); if (p >= 100) return;
      el.insertAdjacentHTML('beforeend', `<span class="kt-fresh ${p >= 75 ? 'mid' : 'old'}" style="position:absolute;left:6px;bottom:6px" title="Kala on kaotanud värskust – puhasta või müü see varsti">⏳ ${p}%</span>`);
    });
    return r;
  };
}
// Ülesanded-vahekaardil viide kalatöötlemise ülesannetele
{
  const _t = typeof tabTellimus === 'function' ? tabTellimus : null;
  if (_t) {
    tabTellimus = function () {
      const h = _t.apply(this, arguments); if (!KTK.d) { if (!KTK.loading) ktLoad(true); return h }
      const open = KTK.d.quests.filter(q => !q.claimed), ready = open.filter(q => q.have >= q.goal).length;
      return h + `<div class="fv-card"><h2>🔪 Kalatöötlemise ülesanded</h2><p class="lead">${open.length ? `Pooleli ${open.length} ülesannet${ready ? `, neist <b>${ready}</b> ootab preemiat` : ''}.` : 'Kõik kalatöötlemise ülesanded on tehtud!'}</p>
        <button class="btn sm" type="button" data-kt-go="quest">📜 Ava Kalurimaja ülesanded</button></div>`;
    };
    if (FTAB_FN.tellimus) FTAB_FN.tellimus = tabTellimus;
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-kt-go]'); if (!b) return; KTK.sub = b.dataset.ktGo; FV.tab = 'kalurimaja'; renderFV(true); const fv = document.getElementById('fishView'); if (fv) fv.scrollTop = 0 });
// alammenüüs aktiivne nupp nähtavale; Kalurimaja märgil ka valmis ülesanded ja täidetavad tellimused; Saagis värskuse selgitus
{
  const _r3 = renderFV;
  renderFV = function () {
    const r = _r3.apply(this, arguments);
    if (FV.open && FV.tab === 'kalurimaja') { const nav = document.querySelector('#fvIn .kt-sub'), on = nav && nav.querySelector('button.on'); if (on && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = Math.max(0, on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2) }
    if (FV.open && FV.tab === 'saak') { const lead = document.querySelector('#fvIn .fv-body > .fv-card .lead'); if (lead && !lead.dataset.fresh) { lead.dataset.fresh = 1; lead.insertAdjacentHTML('afterend', '<p class="lead" style="font-size:12.5px;margin-top:-4px">⏳ Kala on esimesed 24 tundi täiesti värske, siis kaotab ta 10% väärtusest päevas (kõige rohkem poole). Puhasta või suitsuta kala Kalurimajas – tooted ei rikne.</p>') } }
    return r;
  };
  const _b = fvBadges;
  fvBadges = function () {
    const b = _b(); if (!KTK.d) return b;
    const n = KTK.d.quests.filter(q => !q.claimed && q.have >= q.goal).length + (KTK.d.orders || []).filter(o => !o.done && ktHave(o.mat) >= o.qty).length;
    if (n) b.kalurimaja = (b.kalurimaja || 0) + n; return b;
  };
}

/* ---------- Detailne kalapuhastus: soomustamine → rookimine → pea ja uimed → fileerimine ---------- */
const CS_ST = [
  { k: 'soom', n: 'Soomustamine', ic: '🪮', tool: 'scaler', hint: 'Kraabi soomused maha – sabast pea poole.', mat: 'soomus', z: .14, sp: 430, share: .25, cols: ['#cfe4f0', '#a8c8dc', '#e8f4fa'] },
  { k: 'rook', n: 'Rookimine', ic: '🔪', tool: 'knife', hint: 'Lõika kõht lahti ja võta sisikond välja. Ettevaatust sapipõiega!', mat: 'jaatmed', z: .12, sp: 400, share: .2, cols: ['#a83a32', '#7a4a2a', '#c86a50'] },
  { k: 'pea', n: 'Pea ja uimed', ic: '🪓', tool: 'cleaver', hint: 'Lõika pea ja uimed ühe kindla liigutusega ära.', mat: 'luu', z: .13, sp: 380, share: .15, cols: ['#f2ead8', '#d8c8a8', '#e07a6a'] },
  { k: 'fil', n: 'Fileerimine', ic: '🐟', tool: 'fillet', hint: 'Lõika filee mööda selgroogu – nii lähedalt luule kui saad.', mat: 'filee', z: .09, sp: 340, share: .4, cols: ['#f4a58a', '#ffd6c8', '#f2ead8'] }
];
function csInit(J) {
  if (J.st) return; const N = J.need, n = N >= 4 ? CS_ST.map(s => Math.max(1, Math.round(N * s.share))) : [N, 0, 0, 0].map((x, i) => i < N ? 1 : 0);
  let diff = N - n.reduce((a, b) => a + b, 0); n[3] += diff; if (n[3] < 1 && N >= 4) { n[0] += n[3] - 1; n[3] = 1 }
  J.st = n.map(need => ({ need, clicks: 0, precise: 0 }));
  // juba tehtud klikid (nt pärast lehe uuendamist) jagatakse etappide vahel
}
function ktCur(J, any) { if (!J.st) return 0; for (let i = 0; i < J.st.length; i++) if (J.st[i].clicks < J.st[i].need) return i; return J.st.length - 1 }
function csP(J, i) { const s = J.st[i]; return s.need ? Math.min(1, s.clicks / s.need) : 1 }
function csTool(t, tier) {
  const blade = ['#b8c0c8', '#dfe6ee', '#e0a060', '#ffd04a', '#8af0e8'][Math.max(0, Math.min(4, tier - 1))];
  if (t === 'scaler') return `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><rect x="22" y="6" width="22" height="20" rx="3" fill="${blade}" stroke="#4a5058" stroke-width="1.5"/><path d="M25 26v5M29 26v5M33 26v5M37 26v5M41 26v5" stroke="#4a5058" stroke-width="2"/><rect x="29" y="30" width="8" height="30" rx="4" fill="#6a4228" stroke="#3a2210" stroke-width="1.2"/></svg>`;
  if (t === 'cleaver') return `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><path d="M10 8h34v26H10z" fill="${blade}" stroke="#4a5058" stroke-width="1.5"/><circle cx="38" cy="14" r="2.6" fill="#4a5058"/><path d="M10 33h34" stroke="#fff" stroke-width="1.2" opacity=".6"/><rect x="40" y="16" width="20" height="8" rx="4" fill="#6a4228" stroke="#3a2210" stroke-width="1.2"/></svg>`;
  if (t === 'fillet') return `<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><path d="M6 54 C20 40 38 22 58 6 C52 16 40 30 14 56 Z" fill="${blade}" stroke="#4a5058" stroke-width="1.3"/><rect x="0" y="52" width="16" height="6" rx="3" transform="rotate(-40 8 55)" fill="#2a2a2a" stroke="#111" stroke-width="1"/></svg>`;
  return knifeSvg(tier);
}
const CS_FIL = '<svg viewBox="0 0 120 50" aria-hidden="true"><path d="M4 30C14 10 50 4 100 14c12 3 16 8 10 14-20 16-70 22-106 2z" fill="#f4a58a" stroke="#c8705a" stroke-width="2"/><path d="M20 26c20-6 44-10 70-8M18 32c22-4 48-8 76-10" stroke="#ffd6c8" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
const CS_SKEL = '<svg viewBox="0 0 160 50" aria-hidden="true"><path d="M20 25h118" stroke="#f2ead8" stroke-width="3.5" stroke-linecap="round"/><g stroke="#f2ead8" stroke-width="2.2" stroke-linecap="round"><path d="M34 25l-6-14M34 25l-6 14M50 25l-5-16M50 25l-5 16M66 25l-4-16M66 25l-4 16M82 25l-3-15M82 25l-3 15M98 25l-2-13M98 25l-2 13M114 25l-2-10M114 25l-2 10"/></g><path d="M138 25l16-12v24z" fill="#f2ead8"/></svg>';
function csStage(J, P) {
  csInit(J);
  const id = (J.payload.ids || [])[0], f = KTK.d.fish.find(x => x.id === +id) || {}, sp = f.species || 'ahven', i = ktCur(J), C = CS_ST[i];
  const steps = CS_ST.map((s, k) => { const st = J.st[k], done = st.clicks >= st.need, acc = st.clicks ? Math.round(st.precise / st.clicks * 100) : 0;
    return `<li class="${done ? 'done' : k === i ? 'on' : ''}"><span>${done ? '✓' : s.ic}</span><b>${s.n}</b>${done ? `<small>${acc}%</small>` : ''}</li>` }).join('');
  const n = (J.payload.ids || []).length;
  return `<div class="fv-card"><h2 style="margin-bottom:6px">🔪 Puhastad ${n === 1 ? esc((FD.sp[sp] || {}).name || 'kala') : n + ' kala'}</h2>
    <ol class="cs-steps" aria-label="Tööetapid">${steps}</ol>
    <p class="lead cs-hint" id="csHint"><b>${C.ic} ${C.n}:</b> ${C.hint}</p>
    <div class="kt-stage" id="ktStage" role="button" tabindex="0" aria-label="${C.n} (klikka või vajuta tühikut)">
      <div class="obj cs" id="ktObj" data-st="${i}" style="--p0:${csP(J, 0)};--p1:${csP(J, 1)};--p2:${csP(J, 2)};--p3:${csP(J, 3)}">
        <div class="cs-fish"><canvas class="cs-body" data-fl="${sp}" data-r="${f.rarity || 1}" data-nobg="1"></canvas><canvas class="cs-head" data-fl="${sp}" data-r="${f.rarity || 1}" data-nobg="1"></canvas>
          <svg class="cs-cut" viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path class="belly" pathLength="100" d="M48 66 C80 76 120 76 150 64"/><path class="spine" pathLength="100" d="M44 50 L168 50"/></svg></div>
        <div class="cs-out"><span class="fl a">${CS_FIL}</span><span class="fl b">${CS_FIL}</span><span class="sk">${CS_SKEL}</span></div>
        <span class="cs-bucket" title="Jäätmeämber">${matIc('jaatmed', 46)}</span>
      </div>
      <span class="knife" id="ktKnife">${csTool(C.tool, P.knife)}</span><span class="hint" id="ktHint">${J.clicks}/${J.need}</span></div>
    <div style="display:grid;gap:8px;margin-top:10px"><div class="kt-prec" aria-hidden="true"><span class="z" id="ktZone"></span><span class="m" id="ktMark"></span></div>
    <div class="kt-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${J.need}" aria-valuenow="${J.clicks}"><i id="ktProg" style="width:${(J.clicks / J.need * 100).toFixed(1)}%"></i></div>
    <div class="kt-act" style="justify-content:space-between"><small class="lead" id="ktAcc">Selle etapi täpsus: ${J.st[i].clicks ? Math.round(J.st[i].precise / J.st[i].clicks * 100) : 0}%</small><button class="btn sm ghost" type="button" data-kt="cancel">Katkesta</button></div></div></div>`;
}
function csUpdate(J) {
  const ob = document.getElementById('ktObj'); if (!ob) return;
  for (let k = 0; k < 4; k++) ob.style.setProperty('--p' + k, csP(J, k).toFixed(3));
  const i = ktCur(J), ac = document.getElementById('ktAcc');
  if (ac) setTimeout(() => { const S0 = J.st[ktCur(J)]; ac.textContent = `Selle etapi täpsus: ${S0.clicks ? Math.round(S0.precise / S0.clicks * 100) : 0}%` }, 0);
}
function csStageDone(J, i) {
  const s = J.st[i], acc = Math.round(s.precise / Math.max(1, s.clicks) * 100), st = document.getElementById('ktStage');
  if (st) { const b = document.createElement('span'); b.className = 'cs-done'; b.innerHTML = `✓ ${CS_ST[i].n} tehtud · täpsus ${acc}%`; st.appendChild(b); setTimeout(() => b.remove(), 1300) }
  if (typeof sfx === 'function') sfx('chime');
  // järgmise etapi tööriist ja juhend
  setTimeout(() => { if (KTK.job === J) renderFV(true) }, 420);
}
document.head.insertAdjacentHTML('beforeend', `<style>
.cs-res{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;width:100%}.cs-res span{display:grid;justify-items:center;gap:1px;padding:6px 4px;border-radius:10px;background:rgba(0,0,0,.22);font-size:11.5px;color:#a9c4c8}.cs-res i{font-style:normal;font-size:16px}.cs-res b{color:#fff;font-size:14px}
.cs-steps{list-style:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:0;margin:4px 0 8px}
.cs-steps li{display:grid;justify-items:center;gap:2px;padding:7px 4px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(134,205,224,.14);text-align:center;opacity:.6}
.cs-steps li span{font-size:18px;line-height:1}.cs-steps li b{font-size:12.5px}.cs-steps li small{font-size:11px;color:#9ff0b8;font-weight:800}
.cs-steps li.on{opacity:1;background:linear-gradient(180deg,#2f9a96,#1d6a6c);border-color:rgba(130,245,230,.75);box-shadow:0 0 14px rgba(70,208,198,.3)}
.cs-steps li.done{opacity:1;border-color:rgba(127,224,160,.45);background:rgba(127,224,160,.08)}
.cs-hint{margin:0 0 8px;font-size:14px}
.kt-stage .obj.cs{width:min(80vw,380px);aspect-ratio:2/1;position:relative}
.cs-fish{position:absolute;inset:0}
.cs-fish canvas{position:absolute;inset:0;width:100%!important;height:100%!important;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
/* soomustamine: kala muutub siledamaks ja heledamaks */
.cs-body,.cs-head{filter:saturate(calc(1 - var(--p0) * .5)) brightness(calc(1 + var(--p0) * .14)) drop-shadow(0 8px 10px rgba(0,0,0,.45))!important;transition:clip-path .15s,transform .2s,opacity .2s}
/* pea ja uimed: pea lõigatakse eest ära */
.cs-body{clip-path:inset(0 0 0 calc(var(--p2) * 24%));opacity:calc(1 - var(--p3) * .9)}
.cs-head{clip-path:inset(0 76% 0 0);transform:translate(calc(var(--p2) * -26px), calc(var(--p2) * 14px)) rotate(calc(var(--p2) * -14deg));opacity:calc(1 - var(--p3))}
/* lõikejooned: kõht (rookimine) ja selgroog (fileerimine) */
.cs-cut{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.cs-cut path{fill:none;stroke-linecap:round;stroke-dasharray:100}
.cs-cut .belly{stroke:#b8322a;stroke-width:2.4;stroke-dashoffset:calc(100 - var(--p1) * 100);opacity:calc(1 - var(--p3))}
.cs-cut .spine{stroke:#fff3dc;stroke-width:1.8;stroke-dashoffset:calc(100 - var(--p3) * 100);opacity:calc(var(--p3) * 1.4)}
/* fileerimine: kaks fileed ja luustik tulevad nähtavale */
.cs-out{position:absolute;inset:0;pointer-events:none}
.cs-out .fl,.cs-out .sk{position:absolute;left:50%;width:56%;opacity:var(--p3);transition:transform .2s}
.cs-out svg{width:100%;height:auto;display:block;filter:drop-shadow(0 6px 8px rgba(0,0,0,.4))}
.cs-out .fl.a{top:6%;transform:translate(-50%,calc(var(--p3) * -16px)) rotate(calc(var(--p3) * -4deg))}
.cs-out .fl.b{top:46%;transform:translate(-50%,calc(var(--p3) * 16px)) scaleY(-1) rotate(calc(var(--p3) * -4deg))}
.cs-out .sk{top:32%;width:62%;transform:translate(-50%,0);opacity:calc(var(--p3) * 1.6 - .6)}
.cs-bucket{position:absolute;right:-30%;bottom:-6%;opacity:calc(.35 + var(--p1) * .65);transform:scale(calc(.8 + var(--p1) * .25))}
.cs-done{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(20,60,40,.92);color:#bff5cf;font-weight:900;font-size:14px;box-shadow:0 0 16px rgba(127,224,160,.4);animation:ktIn .4s cubic-bezier(.2,1.4,.4,1) both;pointer-events:none;white-space:nowrap}
@media (max-width:600px){.cs-bucket{right:-14%;bottom:-22%}.cs-bucket svg{width:34px;height:34px}.cs-steps li b{font-size:11px}.cs-steps li{padding:6px 2px}}
</style>`);
