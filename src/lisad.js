/* =====================================================================
   Neli lisa kalapüügile:
   1) Püügipäevik – iga püügipäeva kokkuvõte (server fish_diary) ja hommikune teade eilsest päevast.
   2) Trofeesein – trofeekalad Kalurimaja seinal ja teiste mängijate akvaariumi külastusel.
   3) Hooajakalad – oma aastaajal võtavad 3× paremini (server fx_season_k); näidatakse püügis ja kalaraamatus.
   4) Helid – vee loksumine, konnad öösel ja välguga kokku käiv äike.
   ===================================================================== */
const DI = { d: null, at: 0, loading: false };
const SSN = { talv: ['❄️', 'talvel'], kevad: ['🌱', 'kevadel'], suvi: ['☀️', 'suvel'], 'sügis': ['🍂', 'sügisel'] };
const DI_WX = { paike: '☀️', pilves: '☁️', vihm: '🌧️', udu: '🌫️', torm: '⛈️', lumi: '🌨️' };
FTABS.paevik = '📔 Päevik';
FTAB_FN.paevik = diTab;
if (typeof FT_SVG !== 'undefined') FT_SVG.paevik = '<path d="M5.5 3.5h11a2 2 0 0 1 2 2v15h-11a2 2 0 0 1-2-2Z"/><path d="M5.5 18.5a2 2 0 0 1 2-2h11"/><path d="M13 3.5v6l2-1.4 2 1.4v-6"/>';

document.head.insertAdjacentHTML('beforeend', `<style>
.di-list{display:grid;gap:10px}
.di-day{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:12px;padding:14px 16px;border-radius:16px;
  background:linear-gradient(180deg,rgba(40,56,48,.55),rgba(16,28,26,.6));border:1px solid rgba(200,220,190,.14)}
.di-day.today{border-color:rgba(255,200,110,.5);box-shadow:0 0 0 1px rgba(255,200,110,.12),0 0 20px rgba(255,190,90,.1)}
.di-day h3{margin:0 0 6px;font-family:var(--f-head);font-size:18px;color:#f2efe4;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.di-day h3 small{font-family:inherit;font-size:12.5px;color:#a8c0b4;font-weight:700}
.di-chips{display:flex;gap:6px;flex-wrap:wrap}
.di-chips span{padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.28);font-size:12.5px;font-weight:800;color:#e8f2ec}
.di-chips span.new{background:rgba(120,220,140,.18);color:#bff5c8}
.di-big{display:grid;justify-items:center;align-content:center;gap:2px;text-align:center;padding:6px;border-radius:12px;background:radial-gradient(120% 100% at 50% 20%,rgba(255,255,255,.08),rgba(0,0,0,.2))}
.di-big canvas{width:150px;height:62px}
.di-big b{font-size:13.5px}.di-big small{font-size:12px;color:#c8d8d0}
.di-note{margin:8px 0 0;font-size:13px;color:#b8ccc2;font-style:italic}
@media (max-width:560px){.di-day{grid-template-columns:1fr}.di-big{grid-template-columns:auto 1fr;justify-items:start;text-align:left}}
.tw-wall{position:relative;padding:18px 14px 20px;border-radius:14px;
  background:repeating-linear-gradient(180deg,#6a4a2e 0 30px,#5a3e26 30px 32px),linear-gradient(90deg,#6e4e30,#5e4228);
  box-shadow:inset 0 0 40px rgba(0,0,0,.55),inset 0 2px 0 rgba(255,255,255,.06)}
.tw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px 12px}
.tw-pl{display:grid;justify-items:center;gap:6px}
.tw-sh{position:relative;width:100%;max-width:170px;aspect-ratio:2/1;border-radius:50%;display:grid;place-items:center;
  background:radial-gradient(70% 60% at 45% 35%,#7a5634,#3e2614 75%);box-shadow:0 6px 12px rgba(0,0,0,.5),inset 0 2px 3px rgba(255,220,170,.25),inset 0 -6px 12px rgba(0,0,0,.45);border:3px solid #2e1c0e}
.tw-sh::before{content:'';position:absolute;top:-9px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff2c0,#b8862a);box-shadow:0 1px 2px rgba(0,0,0,.6)}
.tw-sh canvas{width:84%;height:70%;border-radius:50%}
.tw-plate{padding:3px 10px;border-radius:4px;background:linear-gradient(180deg,#f4d98a,#c8962e);color:#3a2408;font:800 11.5px/1.25 Georgia,serif;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,.45);max-width:100%}
.tw-plate small{display:block;font:700 10.5px system-ui;color:#5a3a10}
.tw-empty{color:#f2e6d0;text-align:center;padding:18px;font-size:14px;text-shadow:0 1px 2px rgba(0,0,0,.6)}
.ssn-strip{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;border-radius:14px;margin-bottom:12px;
  background:linear-gradient(90deg,rgba(120,180,90,.2),rgba(40,70,50,.25));border:1px solid rgba(160,220,140,.3)}
.ssn-strip b{color:#d8f5c8}.ssn-strip .sp{padding:3px 10px;border-radius:999px;background:rgba(0,0,0,.25);font-weight:800;font-size:12.5px;cursor:pointer}
.bcell small.ssn{color:#d8f0b0!important;font-weight:700}
</style>`);

/* ---------- 3) hooajakalad ---------- */
function ssNow() { return typeof stSeason === 'function' ? stSeason() : 'sügis' }
function ssIn(s) { return s && s.season && s.season.includes(ssNow()) }
function ssStrip() {
  if (!FD.loaded) return '';
  const now = ssNow(), here = FD.species.filter(s => ssIn(s) && s.spots.includes(FV.spot) && s.min_level <= FS.level);
  const all = FD.species.filter(s => ssIn(s) && s.min_level <= FS.level);
  if (!all.length) return '';
  const list = here.length ? here : all;
  return `<div class="ssn-strip"><span>${SSN[now][0]}</span><b>Hooajal ${here.length ? 'siin' : 'praegu'}:</b>${list.map(s => `<span class="sp" data-fcard="${s.id}" title="Võtab ${SSN[now][1]} kolm korda paremini">${esc(s.name)}</span>`).join('')}<small class="lead">võtavad praegu 3× paremini${here.length ? '' : ' (teistes püügikohtades)'}</small></div>`;
}
{
  const _tp = tabPuuk; tabPuuk = function () { let s = ''; try { s = ssStrip() } catch (e) { } return s + _tp() };
}

/* ---------- 1) püügipäevik ---------- */
async function diLoad(force) {
  if (DI.loading || (!force && DI.d && Date.now() - DI.at < 60000)) return DI.d;
  DI.loading = true; try { DI.d = await rpc('fish_diary'); DI.at = Date.now() } catch (e) { DI.err = e.message } DI.loading = false;
  if (FV.open && FV.tab === 'paevik') renderFV(true); return DI.d;
}
function diDate(iso) { const d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('et-EE', { weekday: 'long', day: 'numeric', month: 'long' }) }
function diToday() { return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Tallinn' }) }
function diTab() {
  if (!DI.d) { diLoad(); return '<div class="fv-card"><p class="lead">Laen püügipäevikut…</p></div>' }
  if (Date.now() - DI.at > 60000) diLoad();
  const today = diToday();
  let h = `<div class="fv-card"><h2>📔 Püügipäevik</h2><p class="lead">Iga püügipäeva kokkuvõte: mitu kala, suurim ja haruldaseim, uued liigid, ilm ja kohad. Siin on viimased 30 päeva, mil kala püüdsid.</p>`;
  if (!DI.d.length) return h + '<p class="lead">Päevik on veel tühi. Püüa esimene kala ja see tuleb siia kirja!</p></div>';
  h += `<div class="di-list">${DI.d.map(d => {
    const big = d.big && FD.sp[d.big.species], rare = d.rare && FD.sp[d.rare.species], ss = SSN[d.season] || ['', ''];
    const spots = (d.spots || []).map(x => FD.spot[x] ? FD.spot[x].name : x).join(', ');
    const note = d.n >= 50 ? 'Väga tubli püügipäev!' : d.new ? 'Kalaraamatusse tuli uusi liike.' : d.night > d.n / 2 ? 'Öine kalastaja.' : '';
    return `<div class="di-day ${d.day === today ? 'today' : ''}"><div><h3>${d.day === today ? 'Täna' : esc(diDate(d.day))} <small>${ss[0]} ${d.weather ? (DI_WX[d.weather] || '') : ''} ${d.day === today ? esc(diDate(d.day)) : ''}</small></h3>
      <div class="di-chips"><span>🐟 ${d.n} ${d.n === 1 ? 'kala' : 'kala'}</span><span>⚖️ ${fKg(+d.kg)}</span><span>🔢 ${d.species} liiki</span>${d.new ? `<span class="new">📖 ${d.new} uut liiki</span>` : ''}${d.night ? `<span>🌙 ${d.night} öösel</span>` : ''}${d.sold ? `<span>🪙 ${d.sold} müüdud</span>` : ''}</div>
      ${rare && d.rare.rarity >= 3 && (!d.big || d.rare.species !== d.big.species) ? `<p class="di-note" style="font-style:normal">✨ Haruldaseim: <b style="color:${RAR2[d.rare.rarity][1]}">${esc(rare.name)}</b> ${fKg(+d.rare.weight)}</p>` : ''}
      ${spots ? `<p class="di-note" style="font-style:normal">📍 ${esc(spots)}</p>` : ''}${note ? `<p class="di-note">${note}</p>` : ''}</div>
      ${big ? `<div class="di-big"><canvas data-fl="${d.big.species}" data-r="${d.big.rarity}"></canvas><div><b>🏆 ${esc(big.name)}</b><br><small>${fSize(big, +d.big.weight)}</small></div></div>` : '<div></div>'}</div>` }).join('')}</div></div>`;
  return h;
}
// hommikune teade eilsest püügipäevast (kord päevas)
async function diMorning() {
  let seen = ''; try { seen = localStorage.getItem('mk.diarySeen') || '' } catch (e) { }
  const today = diToday(); if (seen === today) return;
  const d = await diLoad(true); if (!d) return;
  try { localStorage.setItem('mk.diarySeen', today) } catch (e) { }
  const last = d.find(x => x.day < today); if (!last || last.day <= seen) return;
  const big = last.big && FD.sp[last.big.species];
  toast(`📔 Eelmine püügipäev: ${last.n} kala${big ? `, suurim ${big.name.toLowerCase()} ${fKg(+last.big.weight)}` : ''}${last.new ? `, ${last.new} uut liiki` : ''}. Vaata Päevikut!`, 'info', 'fish');
}
{
  const _of = openFishView; openFishView = async function (tab) { const r = await _of(tab); if (FV.open) setTimeout(() => diMorning().catch(() => { }), 2500); return r };
  // kalaraamatu kaartidele hooaja märge
  const _r = renderFV;
  renderFV = function (force) {
    const r = _r(force);
    if (FV.open && FV.tab === 'raamat') document.querySelectorAll('#fvIn .bcell[data-fcard]').forEach(el => { if (el.querySelector('.ssn')) return; const s = FD.sp[el.dataset.fcard]; if (!s || !s.season) return;
      el.insertAdjacentHTML('beforeend', `<small class="ssn">${s.season.map(x => SSN[x] ? SSN[x][0] + ' ' + SSN[x][1] : x).join(', ')} hooajal${ssIn(s) ? ' · praegu!' : ''}</small>`) });
    return r;
  };
}

/* ---------- 2) trofeesein ---------- */
function twWall(list, own) {
  if (!list.length) return own ? '<div class="tw-wall"><p class="tw-empty">Sein ootab trofeesid! Pane Saagi vahekaardil oma parimad kalad trofeeriiulile – siis riputatakse need siia seinale.</p></div>' : '';
  return `<div class="tw-wall"><div class="tw-grid">${list.map(x => { const s = FD.sp[x.species] || { name: x.species };
    return `<div class="tw-pl"><div class="tw-sh"><canvas data-fl="${x.species}" data-r="${x.rarity}" data-nobg="1"></canvas></div><div class="tw-plate">${esc(s.name)}<small>${fKg(+x.weight)}${x.giant ? ' · rekord' : ''}</small></div></div>` }).join('')}</div></div>`;
}
{
  if (typeof cbTab === 'function') {
    const _cb = cbTab;
    cbTab = function () {
      const h = _cb(); if (!CB.d) return h;
      const tro = (FS.inventory || []).filter(x => x.trophy).sort((a, b) => b.rarity - a.rarity || b.weight - a.weight);
      return h + `<div class="fv-card"><h2>🏆 Trofeesein <small class="lead">${tro.length} / 12</small></h2><p class="lead">Sinu trofeekalad ripuvad Villemi maja seinal. Teised mängijad näevad neid, kui külastavad sinu akvaariumi.</p>${twWall(tro, true)}</div>`;
    };
    FTAB_FN.kalurimaja = cbTab;
  }
  const _vh = visitHtml;
  visitHtml = function () { const h = _vh(), v = AQ.visit; if (!v || !(v.trophies || []).length) return h; return h + `<div class="fv-card"><h2>🏆 ${esc(v.name)} trofeesein</h2>${twWall(v.trophies, false)}</div>` };
}

/* ---------- 4) helid: vee loksumine, konnad öösel, äike koos välguga ---------- */
const SN2 = { lap: null, nextFrog: 0, bolt: 0 };
function sn2Init() {
  if (SN2.lap || !SND.ctx || !SND.noise) return;
  const c = SND.ctx, s = c.createBufferSource(); s.buffer = SND.noise; s.loop = true;
  const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = .8;
  const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(SND.ambG); s.start();
  SN2.lap = { g, f };
}
function frog() {
  const base = 150 + Math.random() * 70, n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) { tone(base, .11, { to: base * .78, vol: .05, type: 'sawtooth', lp: 900, at: i * .16, bus: SND.ambG }); tone(base * 2.02, .08, { to: base * 1.5, vol: .015, type: 'square', lp: 1400, at: i * .16 + .01, bus: SND.ambG }) }
}
setInterval(() => {
  try {
    if (!sndOk()) return; sn2Init(); if (!SN2.lap) return;
    const c = SND.ctx, t = c.currentTime, open = typeof FV !== 'undefined' && FV.open && !document.hidden;
    const wx = FS && FS.weather, spot = FV.spot || '', sea = typeof ST_SEA !== 'undefined' && ST_SEA.includes(spot);
    const lapV = !open ? 0 : (wx === 'torm' ? .32 : sea ? .2 : .11) * (1 + .45 * Math.sin(t * .9) * Math.sin(t * .37));
    SN2.lap.g.gain.setTargetAtTime(lapV, t, .6); SN2.lap.f.frequency.setTargetAtTime(sea || wx === 'torm' ? 620 : 420, t, 1);
    // konnad: öösel mageveel, mitte talvel ega tormiga
    if (open && FS && FS.is_night && !sea && ssNow() !== 'talv' && wx !== 'torm' && t > SN2.nextFrog) { frog(); SN2.nextFrog = t + 1.4 + Math.random() * 4 }
    // äike kõlab pärast nähtavat välku (heli tuleb valgusest hiljem)
    if (open && typeof ST !== 'undefined' && ST.bolt && ST.bolt.t0 !== SN2.bolt) {
      SN2.bolt = ST.bolt.t0; const delay = .5 + Math.random() * 1.6;
      noise(.35, { f: 900, q: .7, vol: .35, type: 'lowpass', at: delay, bus: SND.ambG });
      noise(3.2, { f: 85, q: .4, vol: .75, type: 'lowpass', at: delay + .05, bus: SND.ambG });
    }
  } catch (e) { }
}, 150);
