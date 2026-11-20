/* =====================================================================
   Ilmasündmused ja „Tulemas“: torm, udu ja kalaparv (server teeb ajakava, kõigile ühine),
   ilus sündmusekaart jooksva taimeriga püügi lehe ülaosas, väike pill, kui kaart on kokku pandud,
   kokkuvõte pärast sündmust ning riba „Tulemas“ järgmistest sündmustest (ka Kalatund, Õhtukuma,
   nädalavahetuse sündmus).
   ===================================================================== */
const WV = { off: 0, min: {}, toasted: {}, seenLast: null, lastPhase: '' };
try { WV.seenLast = localStorage.getItem('mk.wevLast') } catch (e) { }
const WV_INFO = {
  torm: { n: 'Torm', ic: 'zap', col: '#a98bff', warn: 'Torm on tulekul!', on: 'Torm!',
    wfx: ['Kalad söövad enne tormi ahnelt – näkkab 30% kiiremini', 'Kohe tulevad Tormihaug ja Välgukala'],
    ofx: ['Tormihaug, Välgukala ja tormiangerjas võtavad', 'Haruldasi kalu tuleb rohkem', 'Tamiil katkeb kergemini – ole ettevaatlik'] },
  udu: { n: 'Udu', ic: 'cloud', col: '#9fc4cf', on: 'Udu laskus vee kohale', ofx: ['Uduhõbe ja Udukala tulevad välja', 'Haruldasi kalu tuleb natuke rohkem'] },
  parv: { n: 'Kalaparv', ic: 'fish', col: '#5ad6c4', on: 'Kalaparv!', ofx: ['Selles kohas näkkab 2× kiiremini'] }
};
Object.assign(LU, {
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  'cloud-lightning': '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/>',
  sunset: '<path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
  timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
  'chevron-up': '<path d="m18 15-6-6-6 6"/>', x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'calendar-clock': '<path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h5"/><path d="M17.5 17.5 16 16.3V14"/><circle cx="16" cy="16" r="6"/>'
});
function wvNow() { return Date.now() + WV.off }
function wvClock(ms) { ms = Math.max(0, ms); const m = Math.floor(ms / 60000), s = Math.floor(ms % 60000 / 1000); return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}` }
function wvIn(ms) { const m = Math.round(ms / 60000); return ms < 60000 ? 'kohe' : m < 60 ? `${m} min pärast` : `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min ' : ''}pärast` }
function wvAt(t) { return new Date(t).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit' }) }
function wvSpot(id) { return FD.spot && FD.spot[id] ? FD.spot[id].name : id }
function wvData() { const w = FS && FS.wev; if (w && w.now) { if (!FS._wvAt) FS._wvAt = Date.now(); WV.off = Date.parse(w.now) - FS._wvAt } return w }

// sündmusekaart (praegu käiv sündmus)
function wvCard() {
  const w = wvData(), e = w && w.cur; if (!e) return '';
  const t = wvNow(), I = WV_INFO[e.kind]; if (!I || t >= Date.parse(e.end)) return '';
  const warn = t < Date.parse(e.start), a = Date.parse(warn ? e.warn : e.start), b = Date.parse(warn ? e.start : e.end);
  if (WV.min[e.id + (warn ? 'w' : '')]) return `<button type="button" class="wv-pill wv-${e.kind}${warn ? ' warn' : ''}" data-wv="max" data-arg="${e.id + (warn ? 'w' : '')}" style="--wc:${I.col}">${luc(I.ic)}<b>${warn ? 'Torm tuleb' : I.n}</b><span data-wvt="${b}">${wvClock(b - t)}</span></button>`;
  const fx = warn ? I.wfx : I.ofx, title = warn ? I.warn : e.kind === 'parv' ? `${I.on} ${wvSpot(e.spot)}` : I.on;
  const here = e.kind !== 'parv' || FV.spot === e.spot, sp = e.kind === 'parv' && FD.spot[e.spot], can = sp && FS.level >= sp.min_level;
  const sub = warn ? `Torm jõuab kohale <b data-wvt="${b}">${wvClock(b - t)}</b> pärast` : e.kind === 'parv' ? (here ? 'Oled õiges kohas – viska õng!' : `Parv toitub kohas <b>${esc(wvSpot(e.spot))}</b>`) : 'Kõigil kalameestel üle kuningriigi';
  const R = 26, C = 2 * Math.PI * R, p = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return `<section class="wv-card wv-${e.kind}${warn ? ' warn' : ''}" style="--wc:${I.col}" aria-live="polite">
    <div class="wv-bg" aria-hidden="true">${e.kind === 'torm' ? '<i class="wv-rain"></i><i class="wv-flash"></i>' : e.kind === 'udu' ? '<i class="wv-fog"></i><i class="wv-fog b"></i>' : '<i class="wv-rip"></i><i class="wv-rip b"></i><i class="wv-rip c"></i>'}</div>
    <div class="wv-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="${R}" class="tr"/><circle cx="32" cy="32" r="${R}" class="pr" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * p).toFixed(1)}" data-wvr="${a}|${b}|${C.toFixed(1)}"/></svg><span>${luc(warn ? 'cloud-lightning' : I.ic)}</span></div>
    <div class="wv-tx"><h3>${esc(title)}</h3><p>${sub}</p>
      <div class="wv-fx">${fx.map(x => `<span>${esc(x)}</span>`).join('')}</div></div>
    <div class="wv-side"><b class="wv-time" data-wvt="${b}">${wvClock(b - t)}</b><small>${warn ? 'tormini' : 'lõpuni'}</small>
      ${e.kind === 'parv' && !here ? (can ? `<button class="btn sm" type="button" data-fa="spot" data-arg="${e.spot}">Mine sinna</button>` : `<small class="wv-lock">Avaneb ${sp ? sp.min_level : ''}. tasemel</small>`) : ''}</div>
    <button type="button" class="wv-min" data-wv="min" data-arg="${e.id + (warn ? 'w' : '')}" aria-label="Pane kokku">${luc('chevron-up')}</button>
  </section>`;
}
// kokkuvõte pärast sündmust
function wvSummary() {
  const w = wvData(), l = w && w.last; if (!l || !l.n || WV.seenLast === l.id) return '';
  const I = WV_INFO[l.kind], b = l.best && FD.sp[l.best.species];
  return `<section class="wv-sum" style="--wc:${I.col}">${luc(I.ic)}<p><b>${I.n} möödus.</b> Püüdsid sel ajal ${l.n} ${l.n === 1 ? 'kala' : 'kala'}${b ? `, parim oli <b>${esc(b.name.toLowerCase())}</b> (${fKg(+l.best.weight)})` : ''}.</p><button type="button" class="wv-min" data-wv="seen" data-arg="${l.id}" aria-label="Sulge">${luc('x')}</button></section>`;
}
// „Tulemas“: järgmised sündmused
function wvUpcoming() {
  const w = wvData(), t = wvNow(), L = [];
  ((w && w.next) || []).forEach(e => { const I = WV_INFO[e.kind]; if (I) L.push({ at: Date.parse(e.warn), ic: e.kind === 'torm' ? 'cloud-lightning' : I.ic, col: I.col, n: e.kind === 'parv' ? `Kalaparv · ${wvSpot(e.spot)}` : I.n, rel: 1 }) });
  if (typeof KT !== 'undefined' && KT.d) { const s = Date.parse(KT.d.active ? KT.d.next : KT.d.start); if (s > t && s - t < 36 * 3600e3) L.push({ at: s, ic: 'trophy', col: '#f2b552', n: 'Kalatund' }) }
  if (typeof kumaOn === 'function' && !kumaOn() && typeof kumaNext === 'function') L.push({ at: kumaNext(), ic: 'sunset', col: '#ff9f6a', n: 'Õhtukuma · topelt kogemus' });
  if (typeof EV !== 'undefined' && EV.d && EV.d.next && EV.d.next.starts && !EV.d.event) { const s = Date.parse(EV.d.next.starts), I = typeof EV_INFO !== 'undefined' && EV_INFO[EV.d.next.kind]; if (s > t && s - t < 4 * 864e5) L.push({ at: s, ic: 'swords', col: I ? I.col : '#4ac0e8', n: I ? I.n : 'Nädalavahetuse sündmus', day: 1 }) }
  const list = L.filter(x => x.at > t).sort((a, b) => a.at - b.at).slice(0, 5); if (!list.length) return '';
  const when = x => x.day ? new Date(x.at).toLocaleDateString('et-EE', { weekday: 'long' }) + ' ' + wvAt(x.at) : x.at - t < 3600e3 ? wvIn(x.at - t) : 'kell ' + wvAt(x.at);
  return `<div class="wv-next"><span class="wv-nh">${luc('calendar-clock')}Tulemas</span>${list.map(x => `<span class="wv-ni" style="--wc:${x.col}">${luc(x.ic)}<b>${esc(x.n)}</b><small${x.rel && x.at - t < 3600e3 ? ` data-wvin="${x.at}"` : ''}>${when(x)}</small></span>`).join('')}</div>`;
}
{
  const _tp = tabPuuk;
  tabPuuk = function () { let s = ''; try { s = wvCard() + wvSummary() + wvUpcoming() } catch (e) { } return s + _tp() };
  // FS värskenemise aeg kellaaja nihke jaoks
  if (typeof refreshFS === 'function') { const _r = refreshFS; refreshFS = async function () { const r = await _r.apply(this, arguments); if (FS) FS._wvAt = Date.now(); return r } }
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-wv]'); if (!b) return;
  const a = b.dataset.wv, id = b.dataset.arg;
  if (a === 'min') WV.min[id] = 1; else if (a === 'max') delete WV.min[id];
  else if (a === 'seen') { WV.seenLast = id; try { localStorage.setItem('mk.wevLast', id) } catch (er) { } }
  renderFV(true);
});
// taimerid iga sekund; faasi vahetusel uus olek serverist; teated „tulemas“ ja algus
setInterval(() => {
  const t = wvNow();
  document.querySelectorAll('[data-wvt]').forEach(el => { el.textContent = wvClock(+el.dataset.wvt - t) });
  document.querySelectorAll('[data-wvin]').forEach(el => { el.textContent = wvIn(+el.dataset.wvin - t) });
  document.querySelectorAll('[data-wvr]').forEach(el => { const [a, b, C] = el.dataset.wvr.split('|').map(Number); el.setAttribute('stroke-dashoffset', (C * Math.max(0, Math.min(1, (t - a) / (b - a)))).toFixed(1)) });
  const w = FS && FS.wev; if (!w || !CL.user) return;
  const e = w.cur, ph = e ? e.id + (t < Date.parse(e.start) ? 'w' : t < Date.parse(e.end) ? 'o' : 'x') : '';
  const nx = (w.next || [])[0], due = nx && Date.parse(nx.warn) <= t;
  if ((ph && ph !== WV.lastPhase && WV.lastPhase) || (e && ph.endsWith('x')) || due) {
    if (!WV.busy && Date.now() - (WV.refAt || 0) > 8000) { WV.busy = true; WV.refAt = Date.now(); refreshFS().then(() => { if (FV.open && FV.tab === 'puuk') renderFV(true) }).finally(() => { WV.busy = false }) }
  }
  if (ph !== WV.lastPhase) {
    if (e && !WV.toasted[ph]) {
      WV.toasted[ph] = 1; const I = WV_INFO[e.kind];
      if (ph.endsWith('w')) toast(`Torm on tulekul! Kalad söövad enne tormi ahnelt – kasuta võimalust.`, 'gold', 'fish');
      else if (ph.endsWith('o') && e.kind === 'parv' && FD.spot[e.spot] && FS.level >= FD.spot[e.spot].min_level) toast(`Kalaparv kohas ${wvSpot(e.spot)}! 90 sekundit näkkab 2× kiiremini.`, 'gold', 'fish');
      else if (ph.endsWith('o') && e.kind === 'udu') toast('Udu laskus vee kohale. Uduhõbe ja Udukala tulevad välja!', 'info', 'fish');
    }
    WV.lastPhase = ph;
  }
  // 3 min enne tormi: „tulemas“
  if (nx && nx.kind === 'torm' && Date.parse(nx.warn) - t < 180000 && !WV.toasted[nx.id + 'soon']) { WV.toasted[nx.id + 'soon'] = 1; toast('Tulemas: torm umbes 3 minuti pärast. Pane õng valmis!', 'info', 'fish') }
}, 1000);
document.head.insertAdjacentHTML('beforeend', `<style>
.wv-card{position:relative;overflow:hidden;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px 46px 16px 16px;margin-bottom:12px;border-radius:18px;
  border:1px solid color-mix(in srgb,var(--wc) 45%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--wc) 22%,#0c1d24),#0b171c 70%);box-shadow:0 14px 40px rgba(0,0,0,.4),0 0 30px color-mix(in srgb,var(--wc) 18%,transparent);animation:wvIn .6s cubic-bezier(.2,1.3,.35,1)}
.wv-card > *:not(.wv-bg):not(.wv-min){position:relative;z-index:1}
.wv-bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.wv-rain{position:absolute;inset:-40px 0 0;background:repeating-linear-gradient(105deg,transparent 0 14px,rgba(190,200,255,.16) 14px 15px);animation:wvRain .5s linear infinite}
.wv-torm.warn .wv-rain{opacity:.45;animation-duration:.9s}
.wv-flash{position:absolute;inset:0;background:radial-gradient(80% 90% at 70% 0%,rgba(230,225,255,.55),transparent 60%);opacity:0;animation:wvFlash 6s 1.5s infinite}
.wv-fog{position:absolute;inset:-20% -50%;background:radial-gradient(40% 50% at 30% 50%,rgba(220,235,240,.22),transparent 70%),radial-gradient(35% 45% at 75% 60%,rgba(220,235,240,.18),transparent 70%);animation:wvFog 14s ease-in-out infinite alternate}
.wv-fog.b{animation-duration:19s;animation-direction:alternate-reverse;opacity:.7}
.wv-rip{position:absolute;left:18%;top:55%;width:60px;height:22px;margin:-11px -30px;border-radius:50%;border:2px solid rgba(120,240,220,.45);opacity:0;animation:wvRip 2.4s ease-out infinite}
.wv-rip.b{left:62%;top:40%;animation-delay:.8s}.wv-rip.c{left:84%;top:72%;animation-delay:1.6s}
.wv-ring{position:relative;width:64px;height:64px}.wv-ring svg{width:64px;height:64px;transform:rotate(-90deg)}
.wv-ring .tr{fill:rgba(0,0,0,.25);stroke:rgba(255,255,255,.1);stroke-width:5}.wv-ring .pr{fill:none;stroke:var(--wc);stroke-width:5;stroke-linecap:round;transition:stroke-dashoffset 1s linear;filter:drop-shadow(0 0 4px var(--wc))}
.wv-ring span{position:absolute;inset:0;display:grid;place-items:center;color:#fff}.wv-ring .lu{width:26px;height:26px}
.wv-torm.warn .wv-ring span{animation:wvPulse 1.2s ease-in-out infinite}
.wv-tx h3{margin:0;font-size:19px;color:#fff;text-wrap:balance}.wv-tx p{margin:2px 0 6px;color:#cfe0e4;font-size:13.5px}.wv-tx p b{color:#fff}
.wv-fx{display:flex;flex-wrap:wrap;gap:5px}.wv-fx span{font-size:12px;font-weight:700;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--wc) 20%,rgba(0,0,0,.25));color:#eef6f7;border:1px solid color-mix(in srgb,var(--wc) 35%,transparent)}
.wv-side{display:grid;justify-items:end;gap:4px;text-align:right}.wv-time{font-size:28px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;line-height:1;text-shadow:0 0 14px var(--wc)}.wv-side small{color:#a9c4c8;font-size:12px}.wv-lock{color:#ffcf9a!important}
.wv-min{position:absolute;right:8px;top:8px;width:30px;height:30px;display:grid;place-items:center;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#dfe9eb;cursor:pointer;z-index:2}.wv-min:hover,.wv-min:focus-visible{background:rgba(255,255,255,.18)}.wv-min .lu{width:16px;height:16px}
.wv-pill{display:inline-flex;align-items:center;gap:7px;margin:0 0 10px;padding:7px 13px 7px 10px;border-radius:999px;border:1px solid color-mix(in srgb,var(--wc) 55%,transparent);background:color-mix(in srgb,var(--wc) 20%,#0c1d24);color:#fff;font:inherit;font-size:13.5px;cursor:pointer}
.wv-pill .lu{width:16px;height:16px;color:var(--wc)}.wv-pill span{font-variant-numeric:tabular-nums;font-weight:800}
.wv-sum{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center;padding:11px 46px 11px 14px;margin-bottom:12px;border-radius:14px;background:color-mix(in srgb,var(--wc) 14%,#0c1d24);border:1px solid color-mix(in srgb,var(--wc) 35%,transparent)}
.wv-sum > .lu{width:22px;height:22px;color:var(--wc)}.wv-sum p{margin:0;color:#dfeaec}.wv-sum .wv-min{top:50%;margin-top:-15px}
.wv-next{display:flex;gap:6px;align-items:center;overflow-x:auto;padding:2px 2px 8px;margin-bottom:8px;scrollbar-width:thin}
.wv-nh{display:inline-flex;align-items:center;gap:5px;flex:none;font-weight:800;font-size:13px;color:#cfe0e4;margin-right:2px}.wv-nh .lu{width:16px;height:16px;color:#7ec8e3}
.wv-ni{flex:none;display:inline-grid;grid-template-columns:auto auto;column-gap:6px;align-items:center;padding:5px 11px 5px 8px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid color-mix(in srgb,var(--wc) 30%,transparent)}
.wv-ni .lu{grid-row:span 2;width:18px;height:18px;color:var(--wc)}.wv-ni b{font-size:12.5px;color:#eef6f7;white-space:nowrap}.wv-ni small{font-size:11.5px;color:#a9c4c8;white-space:nowrap}
@keyframes wvIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
@keyframes wvRain{from{transform:translate(0,-20px)}to{transform:translate(-6px,0)}}
@keyframes wvFlash{0%,86%,100%{opacity:0}87%{opacity:1}89%{opacity:.1}91%{opacity:.8}94%{opacity:0}}
@keyframes wvFog{from{transform:translateX(-8%)}to{transform:translateX(8%)}}
@keyframes wvRip{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.6)}}
@keyframes wvPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
@media (max-width:560px){.wv-card{grid-template-columns:auto minmax(0,1fr);padding:14px 44px 14px 14px;gap:12px}.wv-side{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 8px;text-align:left}.wv-side .btn{margin-left:auto}.wv-time{font-size:24px}.wv-ring,.wv-ring svg{width:54px;height:54px}.wv-tx h3{font-size:17px}}
@media (prefers-reduced-motion:reduce){.wv-card,.wv-rain,.wv-flash,.wv-fog,.wv-rip,.wv-ring span{animation:none!important}.wv-flash,.wv-rip{display:none}}
</style>`);
