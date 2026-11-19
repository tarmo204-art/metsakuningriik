/* =====================================================================
   Kaluri statistika: oma vahekaart kuue sektsiooniga – kalasaak, kaluri tegevused, isiklikud rekordid,
   kalapüügi saavutused, kalakogu ja bosside statistika. Kõik numbrid tulevad mängija enda
   päris püükidest (server fish_stats); puuduvate andmete korral „Pole veel saavutatud“.
   ===================================================================== */
const KS = { d: null, at: 0, loading: false, anim: '' };
{ // vahekaart kohe Kalaraamatu järele
  const e = Object.entries(FTABS); for (const [k] of e) delete FTABS[k];
  for (const [k, v] of e) { FTABS[k] = v; if (k === 'raamat') FTABS.stats = '📊 Statistika' }
  if (!FTABS.stats) FTABS.stats = '📊 Statistika';
  FTAB_FN.stats = ksTab;
}
const KS_IC = {
  age: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/><path d="M4 4l2.5 2.5M20 4l-2.5 2.5"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M9.5 8v4M13 8v3M16.5 8v4"/>',
  stats: '<path d="M4 20.5h16"/><path d="M6.5 20.5v-6M11 20.5V8M15.5 20.5v-9M20 20.5V5"/>',
  fish: '<path d="M2.5 12c3.2-5 10.5-5.2 14.5 0-4 5.2-11.3 5-14.5 0Z"/><path d="M17 12l4.5-3.5v7Z"/><circle cx="7" cy="11.2" r=".6" fill="currentColor"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  boot: '<path d="M7 3.5h6v8.5l6.2 2.6a2 2 0 0 1 1.3 1.9v1.5H4.5V9.5Z"/><path d="M4.5 18h16"/><path d="M7 7h6"/>',
  chest: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 9a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4"/><path d="M3.5 13h17"/><rect x="10.5" y="11.5" width="3" height="3.5" rx=".6"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 13h15a3 3 0 1 1-3 3"/><path d="M3 17h7"/>',
  rod: '<path d="M4 20 11 12"/><path d="M13 10l2.5-2.5"/><path d="M17 6l3-2.5"/><path d="M11.5 9.5l2 2"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z"/><path d="M3.5 7.5 12 12l8.5-4.5"/><path d="M12 12v9"/>',
  check: '<path d="M8 4.5H6A1.5 1.5 0 0 0 4.5 6v14A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 18 4.5h-2"/><rect x="8" y="3" width="8" height="3.2" rx="1"/><path d="m8.5 13.5 2.3 2.3 4.7-4.8"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H4.5a3 3 0 0 0 3.5 4"/><path d="M16 6h3.5a3 3 0 0 1-3.5 4"/><path d="M12 13v4"/><path d="M8.5 20.5h7l-.8-3.5H9.3Z"/>',
  weight: '<path d="M7 7.5h10l2.5 13h-15Z"/><circle cx="12" cy="5" r="2"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 6.8v10.4M14.5 9.3c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.7 1.1 1.6 2.5 1.8 2.5.8 2.5 1.8-1.1 1.7-2.5 1.7-2.5-.7-2.5-1.7"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.8 3.4-5.6 4.2-9.5 2.9 1.8 3.3 4.4 3.1 6.3 1-.7 1.7-1.9 2-3.1 2 1.7 3.7 3.9 3.7 6.3 0 3.4-2.6 6-6.5 6Z"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>',
  deep: '<path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M3 19c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/>',
  watch: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2"/><path d="M9.5 2.5h5"/><path d="M12 2.5V6"/>',
  crown: '<path d="M3.5 18.5h17"/><path d="M4.5 16 3 7.5l5 4 4-6.5 4 6.5 5-4-1.5 8.5Z"/>',
  gem: '<path d="M6 3.5h12l3.5 5L12 20.5 2.5 8.5Z"/><path d="M2.5 8.5h19"/><path d="M9 3.5 7.5 8.5 12 20.5l4.5-12L15 3.5"/>',
  monster: '<path d="M4 20V12a8 8 0 0 1 16 0v8l-2.3-1.6-2 1.6-1.7-1.6-2 1.6-2-1.6-1.7 1.6-2-1.6Z"/><path d="M9 10.5l1.5 1M15 10.5l-1.5 1"/><path d="M9.5 15.5c1.5.8 3.5.8 5 0"/>',
  bolt: '<path d="M13 2.5 5 14h6l-1 7.5L19 10h-6Z"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M15.5 4.9a3 3 0 0 1 0 5.9"/><path d="M17 13.6a5.5 5.5 0 0 1 4 6.4"/>',
  gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8"/><path d="M12 8.5v12"/><path d="M12 8.5c-1-3-5-4-5-1.5 0 1.5 3 1.5 5 1.5Zm0 0c1-3 5-4 5-1.5 0 1.5-3 1.5-5 1.5Z"/>',
  heart: '<path d="M12 21s-7.5-4.5-7.5-10.5a4.3 4.3 0 0 1 7.5-2.8 4.3 4.3 0 0 1 7.5 2.8C19.5 16.5 12 21 12 21Z"/>',
  book: '<path d="M12 6.5C10 4.9 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 4.9 12 6.5Z"/><path d="M12 6.5V20"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'
};
if (typeof FT_SVG !== 'undefined') FT_SVG.stats = KS_IC.stats;
const ksI = (k, cls = '') => `<svg class="ks-i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${KS_IC[k] || ''}</svg>`;

document.head.insertAdjacentHTML('beforeend', `<style>
.ks{display:grid;gap:14px}
.ks-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:20px 22px;border-radius:20px;
  background:radial-gradient(90% 140% at 100% 0%,rgba(90,170,210,.28),transparent 60%),linear-gradient(160deg,#0f3446,#071a26 70%);border:1px solid rgba(140,210,235,.22);box-shadow:0 14px 34px rgba(0,0,0,.35)}
.ks-hero h2{margin:0;font-family:var(--f-display);font-weight:400;font-size:30px;color:#f0f8fb}
.ks-hero p{margin:4px 0 0;color:#a8c8d4}
.ks-big{text-align:right}.ks-big b{display:block;font-family:var(--f-display);font-weight:400;font-size:48px;line-height:1;color:#ffe2a6;text-shadow:0 0 22px rgba(255,200,110,.35);font-variant-numeric:tabular-nums}
.ks-big small{color:#a8c8d4;font-weight:700}
.ks-sec{padding:16px;border-radius:18px;background:linear-gradient(180deg,rgba(14,36,48,.85),rgba(8,22,30,.88));border:1px solid rgba(134,205,224,.14);box-shadow:0 8px 22px rgba(0,0,0,.22)}
.ks-sh{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid rgba(134,205,224,.12)}
.ks-sh .ks-i{width:26px;height:26px;color:#8fd8f0}
.ks-sh h3{margin:0;font-family:var(--f-head);font-size:19px;color:#eaf6fa}
.ks-sh small{margin-left:auto;color:#8fb0bc;font-weight:700;font-size:12.5px}
.ks-i{width:22px;height:22px;flex:none}
.ks-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.ks-rc{position:relative;display:grid;gap:4px;padding:12px 12px 10px;border-radius:14px;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.06);border-left:3px solid var(--rc)}
.ks-rc .hd{display:flex;align-items:center;gap:7px;color:var(--rc);font-weight:800;font-size:13px}
.ks-rc .ks-i{width:20px;height:20px}
.ks-rc b{font-size:28px;line-height:1.05;color:#fff;font-variant-numeric:tabular-nums}
.ks-bar{height:6px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden}
.ks-bar i{display:block;height:100%;border-radius:6px;background:var(--rc,#7fd0e8)}
.ks-anim .ks-bar i{animation:ksGrow .9s cubic-bezier(.2,.8,.3,1) both}
@keyframes ksGrow{from{width:0}}
.ks-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
.ks-sum div{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04)}
.ks-sum small{display:block;color:#8fb0bc;font-weight:700;font-size:12px}
.ks-sum b{font-size:17px;color:#eaf6fa}
.ks-tile{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 10px;align-items:center;padding:12px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06)}
.ks-tile .ic{grid-row:span 2;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(120,200,230,.1);color:#9fdcf0}
.ks-tile b{font-size:22px;line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.ks-tile small{color:#9fb8c2;font-weight:700;font-size:12.5px}
.ks-recs{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.ks-rec{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:12px;border-radius:14px;background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.06)}
.ks-rec .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(255,200,110,.1);color:#ffd28a}
.ks-rec small{display:block;color:#9fb8c2;font-weight:700;font-size:12px}
.ks-rec b{font-size:15.5px;color:#fff}
.ks-rec em{display:block;font-style:normal;font-size:12.5px;color:#c8dce2}
.ks-rec canvas{width:76px;height:36px}
.ks-rec.none{opacity:.6}.ks-rec.none b{color:#9fb8c2;font-weight:700;font-size:13.5px}
.ks-achs{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.ks-ach{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px 12px;padding:12px;border-radius:14px;background:rgba(0,0,0,.24);border:1px solid rgba(255,255,255,.07)}
.ks-ach .ic{grid-row:span 3;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.05);color:#8fa4ac;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.ks-ach.got{border-color:rgba(255,200,110,.45);background:linear-gradient(180deg,rgba(255,200,110,.1),rgba(0,0,0,.2))}
.ks-ach.got .ic{color:#ffd28a;background:radial-gradient(circle,rgba(255,200,110,.25),rgba(255,200,110,.05));box-shadow:0 0 14px rgba(255,190,90,.35),inset 0 0 0 1px rgba(255,210,140,.5)}
.ks-ach b{font-size:14.5px;color:#fff;display:flex;gap:6px;align-items:center}
.ks-ach b .ks-i{width:15px;height:15px;color:#8fa4ac}
.ks-ach small{color:#9fb8c2;font-size:12.5px}
.ks-ach .rw{display:flex;gap:5px;flex-wrap:wrap}.ks-ach .rw span{padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.07);font-size:11.5px;font-weight:800;color:#e8eef0}
.ks-ach .pg{grid-column:2;display:grid;gap:3px}.ks-ach .pg small{font-variant-numeric:tabular-nums}
.ks-ach:not(.got){filter:saturate(.6)}
.ks-book{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
.ks-book b{font-size:20px;color:#fff}
.ks-book .ks-bar{height:10px;margin-top:6px}
@media (max-width:600px){.ks-hero{grid-template-columns:1fr}.ks-big{text-align:left}.ks-hero h2{font-size:25px}.ks-big b{font-size:40px}.ks-sum{grid-template-columns:1fr}
  .ks-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ks-book{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.ks-anim .ks-bar i{animation:none}}
</style>`);

async function ksLoad(force) {
  if (KS.loading || (!force && KS.d && Date.now() - KS.at < 30000)) return;
  KS.loading = true; try { KS.d = await rpc('fish_stats'); KS.at = Date.now() } catch (e) { KS.err = e.message } KS.loading = false;
  if (KS.d && (KS.d.ach || []).length) { try { afterAch(KS.d.ach) } catch (e) { } try { await refreshFS() } catch (e) { } if (typeof sfx === 'function') sfx('levelup') }
  if (FV.open && FV.tab === 'stats') renderFV(true);
}
const KS_NONE = 'Pole veel saavutatud';
function ksN(v) { return `<span class="ks-n" data-v="${+v || 0}">${fmt(+v || 0)}</span>` }
function ksSp(id) { const s = FD.sp[id]; return s ? s.name : id }
function ksTab() {
  if (!KS.d) { ksLoad(); return '<div class="fv-card"><p class="lead">Laen statistikat…</p></div>' }
  if (Date.now() - KS.at > 30000) ksLoad();
  const d = KS.d; if (d.empty) return '<div class="fv-card"><p class="lead">Püüa esimene kala – siis hakkab statistika tekkima!</p></div>';
  const br = d.by_rarity || {}, tot = [1, 2, 3, 4, 5, 6].reduce((a, r) => a + (+br[r] || 0), 0), anim = KS.anim !== 'shown';
  const icR = ['', 'fish', 'fish', 'star', 'gem', 'crown', 'gem'];
  const freq = [1, 2, 3, 4, 5, 6].sort((a, b) => (+br[b] || 0) - (+br[a] || 0))[0], maxr = [6, 5, 4, 3, 2, 1].find(r => +br[r] > 0);
  let h = `<div class="ks ${anim ? 'ks-anim' : ''}">`;
  // pealkiri
  h += `<div class="ks-hero"><div><h2>Kaluri statistika</h2><p>Kalapüügi ${d.level}. tase${d.title ? ` · „${esc(d.title)}“` : ''} · kõik numbrid tulevad sinu enda püükidest</p></div><div class="ks-big"><b>${ksN(d.total)}</b><small>püütud kala kokku</small></div></div>`;
  // 1. kalasaak
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('fish')}<h3>Kalasaak</h3><small>harulduse järgi</small></div><div class="ks-grid">${[1, 2, 3, 4, 5, 6].map(r => { const n = +br[r] || 0, [rn, rc] = RAR2[r];
    return `<div class="ks-rc" style="--rc:${rc}"><div class="hd">${ksI(icR[r])}${rn}</div><b>${ksN(n)}</b><div class="ks-bar"><i style="width:${tot ? (n / tot * 100).toFixed(1) : 0}%"></i></div></div>` }).join('')}</div>
    <div class="ks-sum"><div><small>Kokku püütud kalu</small><b>${fmt(d.total)}</b></div><div><small>Kõige sagedamini püütud</small><b style="color:${tot ? RAR2[freq][1] : '#9fb8c2'}">${tot ? RAR2[freq][0] : KS_NONE}</b></div><div><small>Kõige haruldasem püütud klass</small><b style="color:${maxr ? RAR2[maxr][1] : '#9fb8c2'}">${maxr ? RAR2[maxr][0] : KS_NONE}</b></div></div></section>`;
  // 2. tegevused
  const act = [['moon', d.night, 'Öösel püütud kalu'], ['boot', d.junk, 'Naljakaid leide'], ['chest', d.chests, 'Leitud aardekirste'], ['wind', d.lost, 'Pääsenud kalu'], ['rod', d.broken, 'Murtud õngi'], ['box', d.orders, 'Täidetud tellimusi'], ['check', d.quests, 'Täidetud ülesandeid'], ['trophy', d.wins, 'Võidetud võistlusi']];
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('rod')}<h3>Kaluri tegevused</h3></div><div class="ks-grid">${act.map(([ic, v, l]) => `<div class="ks-tile"><span class="ic">${ksI(ic)}</span><b>${ksN(v)}</b><small>${l}</small></div>`).join('')}</div></section>`;
  // 3. rekordid
  const R = d.records || {}, fishRec = (o, extra) => o ? { v: `${esc(ksSp(o.species))} · ${fKg(+o.weight)}`, sub: extra, sp: o.species, r: o.rarity } : null;
  const recs = [
    ['weight', 'Suurim püütud kala', R.big ? fishRec(R.big, FD.spot[R.big.spot] ? FD.spot[R.big.spot].name : '') : null],
    ['coin', 'Kõige väärtuslikum kala', R.value ? fishRec(R.value, `tavahind ${fmt(R.value.v)} kulda`) : null],
    ['flame', 'Pikim püügiseeria', R.streak ? { v: `${R.streak} päeva järjest`, sub: 'järjestikused päevad, mil püüdsid kala' } : null],
    ['star', 'Kõige rohkem punkte andnud kala', R.pts ? fishRec(R.pts, `${R.pts.p} punkti oma liigi suuruse järgi`) : null],
    ['deep', 'Kõige sügavamast veest', R.deep ? fishRec(R.deep, FD.spot[R.deep.spot] ? FD.spot[R.deep.spot].name : '') : null],
    ['watch', 'Kiireim tabamine', R.fast != null ? { v: `${String(R.fast).replace('.', ',')} s`, sub: 'näkkamisest haakimiseni' } : null],
    ['trophy', 'Suurim võistluse punktisumma', R.comp ? { v: `${fmt(R.comp)} punkti`, sub: 'ühe Kalatunni jooksul' } : null],
    ['crown', 'Kõige haruldasem püütud kala', R.rare ? fishRec(R.rare, RAR2[R.rare.rarity][0]) : null],
    ['age', 'Vanim püütud kala', R.old ? { v: `${esc(ksSp(R.old.species))} · ${fAgeTxt(+R.old.age)}`, sub: `${fKg(+R.old.weight)}${R.old.len ? ' · ' + fLenTxt(+R.old.len) : ''}${FD.spot[R.old.spot] ? ' · ' + FD.spot[R.old.spot].name : ''}`, sp: R.old.species, r: R.old.rarity } : null],
    ['leaf', 'Vanim oma liigi kohta', R.oldrel ? { v: `${esc(ksSp(R.oldrel.species))} · ${fAgeTxt(+R.oldrel.age)}`, sub: `liigi tavaline eluiga ~${fmt(R.oldrel.max_age)} a – sinu kala on ${Math.round(R.oldrel.age / R.oldrel.max_age * 100)}% sellest`, sp: R.oldrel.species, r: R.oldrel.rarity } : null],
    ['ruler', 'Pikim püütud kala', R.long ? { v: `${esc(ksSp(R.long.species))} · ${fLenTxt(+R.long.len)}`, sub: `${fKg(+R.long.weight)}${R.long.age != null ? ' · ' + fAgeTxt(+R.long.age) : ''}`, sp: R.long.species, r: R.long.rarity } : null]
  ];
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('star')}<h3>Isiklikud rekordid</h3></div><div class="ks-recs">${recs.map(([ic, l, o]) => `<div class="ks-rec ${o ? '' : 'none'}"><span class="ic">${ksI(ic)}</span><div><small>${l}</small><b>${o ? o.v : KS_NONE}</b>${o && o.sub ? `<em>${esc(o.sub)}</em>` : ''}</div>${o && o.sp ? `<canvas data-fl="${o.sp}" data-r="${o.r}" data-nobg="1"></canvas>` : '<span></span>'}</div>`).join('')}</div></section>`;
  const OF = R.oldfish || { n: 0, list: [] };
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('age')}<h3>Erakordselt vanad kalad</h3><small>${fmt(OF.n)} püütud</small></div>${OF.list.length ? `<div class="ks-recs">${OF.list.map(o => `<div class="ks-rec"><span class="ic">👑</span><div><small>${esc(ksSp(o.species))}</small><b>${fAgeTxt(+o.age)}</b><em>${fKg(+o.weight)} · ${RAR2[o.rarity][0]}</em></div><canvas data-fl="${o.species}" data-r="${o.rarity}" data-nobg="1"></canvas></div>`).join('')}</div>` : `<p class="lead" style="margin:0">Sa pole veel püüdnud ühtegi erakordselt vana kala. Need on oma liigi kõige vanemad isendid – haruldane leid!</p>`}</section>`;
  // 4. saavutused
  const got = FS.ach || {}, A = id => FD.achs.find(a => a.id === id) || { name: id, descr: '' }, b = d.boss || {};
  const achs = [['esimene', 'fish', d.total, 1], ['kala100', 'fish', d.total, 100], ['kala1000', 'crown', d.total, 1000], ['legendaarne', 'crown', maxr >= 5 ? 1 : 0, 1], ['muutiline', 'gem', maxr >= 6 ? 1 : 0, 1],
    ['kirst10', 'chest', d.chests, 10], ['oo100', 'moon', d.night, 100], ['voit10', 'trophy', d.wins, 10], ['boss1', 'monster', b.killed || 0, 1], ['koik', 'book', d.species, d.species_all]];
  const nGot = achs.filter(([id]) => got[id]).length;
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('trophy')}<h3>Kalapüügi saavutused</h3><small>${nGot} / ${achs.length} avatud</small></div><div class="ks-achs">${achs.map(([id, ic, v, goal]) => { const a = A(id), ok = !!got[id], p = Math.min(1, (+v || 0) / goal);
    return `<div class="ks-ach ${ok ? 'got' : ''}"><span class="ic">${ksI(ic)}</span><b>${ok ? '' : ksI('lock')}${esc(a.name)}</b><small>${esc(a.descr)}</small>
      <div class="pg"><div class="ks-bar" style="--rc:${ok ? '#ffc86e' : '#6ab8d8'}"><i style="width:${(p * 100).toFixed(1)}%"></i></div><small>${ok ? '✓ Avatud' : `${fmt(Math.min(+v || 0, goal))} / ${fmt(goal)}`}</small>
      <div class="rw">${a.reward_gold ? `<span>🪙 ${fmt(a.reward_gold)}</span>` : ''}${a.reward_xp ? `<span>✨ ${fmt(a.reward_xp)} XP</span>` : ''}${a.title ? `<span>🏷 „${esc(a.title)}“</span>` : ''}</div></div></div>` }).join('')}</div></section>`;
  // 5. kalakogu
  const sp = +d.species || 0, all = +d.species_all || 1;
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('book')}<h3>Kalakogu</h3></div><div class="ks-book"><div><b>Avastatud kalaliigid: ${sp} / ${all}</b><div class="ks-bar" style="--rc:#7fe0a0"><i style="width:${(sp / all * 100).toFixed(1)}%"></i></div>
    <small class="lead">Kõigi kalaliikide avastamisel saad tiitli „Kalakuningas“ ja erilise preemia. Kalakaardil on pilt, haruldus, elupaik, lemmiksööt, parim püügiaeg, raskus ja suurim teadaolev kaal.</small></div>
    <button class="btn" type="button" data-fa="tab" data-arg="raamat">📖 Ava kalakogu</button></div></section>`;
  // 6. bossid
  const bt = [['monster', b.killed || 0, 'Alistatud järvekoletisi'], ['bolt', b.dmg || 0, 'Bossidele tehtud kahju kokku'], ['flame', b.best || 0, 'Suurim kahju ühes lahingus'], ['people', b.joined || 0, 'Osaletud bossijahte'], ['gift', b.prizes || 0, 'Bosside eest saadud auhindu']];
  h += `<section class="ks-sec"><div class="ks-sh">${ksI('monster')}<h3>Bosside statistika</h3><small>Kalatunni järvekoletis</small></div><div class="ks-grid">${bt.map(([ic, v, l]) => `<div class="ks-tile"><span class="ic">${ksI(ic)}</span><b>${ksN(v)}</b><small>${l}</small></div>`).join('')}
    <div class="ks-tile"><span class="ic">${ksI('heart')}</span><b style="font-size:${b.strongest ? 22 : 13.5}px">${b.strongest ? fmt(b.strongest) + ' elu' : KS_NONE}</b><small>Kõige tugevam alistatud boss</small></div></div></section>`;
  return h + '</div>';
}
// numbrid loevad end üles ja ribad kasvavad ainult vahekaardile tulles (mitte iga värskenduse ajal)
{
  const _r = renderFV;
  renderFV = function (force) {
    const r = _r(force);
    if (FV.open && FV.tab === 'stats' && KS.d && KS.anim !== 'shown') {
      KS.anim = 'shown';
      if (!stReduce()) document.querySelectorAll('#fvIn .ks-n').forEach(el => { const v = +el.dataset.v; if (v < 2) return; const t0 = performance.now();
        const step = ts => { const k = Math.min(1, (ts - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(v * e)); if (k < 1 && el.isConnected) requestAnimationFrame(step) }; requestAnimationFrame(step) });
    }
    if (!FV.open || FV.tab !== 'stats') KS.anim = '';
    return r;
  };
  // vana statistika kast kalaraamatust ära (see on nüüd oma vahekaardil)
  const _tr = tabRaamat;
  tabRaamat = function () { return _tr().replace(/<div class="fv-card"><h2>Statistika<\/h2>[\s\S]*?<\/dl><\/div>/, '') };
}
