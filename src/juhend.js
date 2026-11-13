/* =====================================================================
   Ülesannete teejuht: iga ülesande juures nupp „📍 Kuhu minna?“, mis selgitab samm-sammult,
   kuhu minna, mis sööt panna ja mis ajal, ning viib nupuvajutusega õigesse kohta.
   Lisaks uute ülesandetüüpide tekstid (diverse, favbait, junk, big1, lab, dna – schema.sql fx_quest_progress).
   ===================================================================== */
const QG = { cur: null };
const QG_DP = { hommik: 'hommikul (5–10)', 'päev': 'päeval (10–17)', 'õhtu': 'õhtul (17–21)', 'öö': 'öösel (21–5)' };

document.head.insertAdjacentHTML('beforeend', `<style>
.qg{display:grid;gap:12px}
.qg h2{margin:0;display:flex;gap:10px;align-items:center}
.qg-steps{list-style:none;margin:0;padding:0;display:grid;gap:8px;counter-reset:qg}
.qg-steps li{counter-increment:qg;display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.qg-steps li::before{content:counter(qg);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:rgba(90,200,232,.18);color:#bfefff;border:1px solid rgba(90,200,232,.45)}
.qg-steps li.ok::before{content:'✓';background:rgba(120,220,140,.2);color:#b8f5c4;border-color:rgba(120,220,140,.55)}
.qg-steps li.warn::before{content:'!';background:rgba(255,170,90,.2);color:#ffd2a0;border-color:rgba(255,170,90,.6)}
.qg-steps b{color:#fff}.qg-steps small{display:block;opacity:.75;margin-top:2px;line-height:1.35}
.qg-steps .ic{font-size:22px}
.qg-tip{margin:0;padding:10px 12px;border-radius:12px;background:rgba(242,181,82,.1);border:1px solid rgba(242,181,82,.3);font-size:13.5px;line-height:1.45}
.qg-btn{border:1px solid rgba(90,200,232,.5);background:rgba(90,200,232,.12);color:#cdf3ff;border-radius:999px;padding:5px 11px;font-weight:700;font-size:12.5px;cursor:pointer;white-space:nowrap}
.qg-btn:hover{background:rgba(90,200,232,.22)}
.qg-acts{display:flex;gap:6px;flex-wrap:wrap}
.qg-flash{animation:qgFlash 1.1s ease-in-out 3;position:relative;z-index:2}
@keyframes qgFlash{0%,100%{box-shadow:0 0 0 0 rgba(255,214,120,0)}50%{box-shadow:0 0 0 6px rgba(255,214,120,.55),0 0 26px rgba(255,200,90,.7)}}
@media (max-width:620px){.srow:has(> .qg-acts){grid-template-columns:1fr}.srow > .qg-acts{justify-content:flex-end}}
@media (prefers-reduced-motion:reduce){.qg-flash{animation:none;outline:3px solid #ffd27a}}
</style>`);

/* ---------- tekstid ---------- */
{
  const baseQText = questText;
  questText = function (q) {
    const t = fmt(+q.target);
    switch (q.kind) {
      case 'diverse': return `Püüa ${t} eri liiki kala`;
      case 'favbait': return `Püüa ${t} kala nende lemmiksöödaga`;
      case 'junk': return `Leia veest ${t} naljakat asja`;
      case 'big1': return `Püüa üks kala, mis kaalub vähemalt ${fKg(+q.target)}`;
      case 'lab': return `Areta geneetikalaboris ${t} hübriidi`;
      case 'dna': return `Alusta uurimiskeskuses ${t} DNA analüüsi`;
    }
    return baseQText(q);
  };
}
// ülesande rida + teejuhi nupp (kirjutab kalapuuk.js questRow üle)
questRow = function (q, per) {
  const prog = +q.progress, tgt = +q.target, ok = prog >= tgt, kg = q.kind === 'weight' || q.kind === 'big1';
  return `<div class="srow" style="${q.done ? 'opacity:.6' : ''}"><div><b>${questText(q)}</b><div class="bar ${ok ? 'green' : ''}" style="margin:5px 0"><i style="width:${Math.min(100, prog / tgt * 100).toFixed(1)}%"></i></div>
    <small class="num">${q.kind === 'big1' ? (prog ? 'Suurim täna ' + fKg(prog) : 'Veel pole') + ' / ' + fKg(tgt) : (kg ? fmt1(prog) : fmt(prog)) + ' / ' + fmt(tgt)} · Preemia: ${fmt(q.gold)} kulda, ${fmt(q.xp)} kogemust${q.item && q.qty ? ', ' + itemIcon(q.item) : ''}</small></div>
    <div class="qg-acts">${!q.done && !ok ? `<button class="qg-btn" type="button" data-qg="${per}:${q.idx}">📍 Kuhu minna?</button>` : ''}${q.done ? '<span class="pill ok">Tehtud</span>' : `<button class="btn sm" type="button" data-fa="qclaim" data-arg="${per}:${q.idx}" ${ok ? '' : 'disabled'}>Võta preemia</button>`}</div></div>`;
};

/* ---------- abi ---------- */
function qgOwned(id) { const b = FD.bait[id]; if (!b) return false; return b.price === 0 || id === FS.bait || (b.consumable ? ((FS.baits || {})[id] || 0) > 0 : (FS.baits || {})[id] !== undefined) }
function qgSpotOk(id) { const p = FD.spot[id]; return p && p.min_level <= FS.level && (!p.boat || (FS.boats || []).includes(p.boat)) }
function qgSpots() { return FD.spots.filter(p => qgSpotOk(p.id)) }
function qgTopSpot() { return qgSpots().sort((a, b) => b.min_level - a.min_level)[0] }
function qgSpName(id) { return FD.spot[id] ? FD.spot[id].name : id }
function qgBaitName(id) { return FD.bait[id] ? FD.bait[id].name : id }
function qgHour() { return +new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Tallinn' }) }
function qgUntil(h) { const now = new Date(), cur = qgHour() + now.getMinutes() / 60, d = ((h - cur) + 24) % 24; const hh = Math.floor(d), mm = Math.round((d - hh) * 60); return hh ? `${hh} h ${mm} min` : `${mm} min` }
function qgW(s) { return s.weather ? [].concat(s.weather) : [] }
function qgWName(s) { return qgW(s).map(w => (WTH2[w] || [w])[0]).join(' või ') }
function qgSpLive(s) { // kas see kala saab praegu üldse tulla
  if (s.night_only && !FS.is_night) return false; if (s.winter_only && !FS.is_winter) return false; if (qgW(s).length && !qgW(s).includes(FS.weather)) return false; return true;
}
// parim sööt: lemmiksööt (kui olemas), muidu kalleim olemasolev; lant suurte kalade jaoks
function qgBestBait(list) { const own = (list || []).filter(qgOwned); return own[0] || null }
function qgPriciest(lure) { return FD.baits.filter(b => qgOwned(b.id) && (!lure || (!b.consumable && b.price > 0))).sort((a, b) => b.price - a.price)[0] }
function qgBaitStep(want, why) {
  if (!want) return null;
  if (FS.bait === want) return { ok: 1, ic: '🪱', t: `Sööt: <b>${qgBaitName(want)}</b>`, s: 'See on juba pandud.' };
  if (qgOwned(want)) return { ic: '🪱', t: `Pane söödaks <b>${qgBaitName(want)}</b>`, s: why || 'Nupp all paneb selle sinu eest.' };
  const b = FD.bait[want];
  return { warn: 1, ic: '🛒', t: `Osta poest <b>${qgBaitName(want)}</b>`, s: b ? `Hind ${fmt(b.price)} kulda${b.consumable ? ' (tükk)' : ''}.` : '' };
}

/* ---------- teejuhi sisu ---------- */
function qgBuild(q) {
  const steps = [], go = { tab: 'puuk' }, prm = q.param; let tip = '';
  const spotStep = (id, why) => { if (!id) return; go.spot = id; steps.push(FV.spot === id ? { ok: 1, ic: '📍', t: `Koht: <b>${qgSpName(id)}</b>`, s: 'Oled juba õiges kohas.' } : { ic: '📍', t: `Mine kohta <b>${qgSpName(id)}</b>`, s: why || '' }) };
  const baitStep = (id, why) => { const st = qgBaitStep(id, why); if (!st) return; steps.push(st); if (qgOwned(id)) go.bait = id; else if (!st.ok) go.shop = 1 };
  switch (q.kind) {
    case 'species': {
      const s = FD.sp[prm]; if (!s) break; go.fish = s.id;
      const sp = (s.spots || []).filter(qgSpotOk), spot = sp.includes(FV.spot) ? FV.spot : sp[0];
      if (!spot) { steps.push({ warn: 1, ic: '🔒', t: `${esc(s.name)} ujub kohtades, kuhu sa veel ei pääse`, s: (s.spots || []).map(qgSpName).join(', ') }); break }
      spotStep(spot, sp.length > 1 ? `Sobivad ka: ${sp.filter(x => x !== spot).map(qgSpName).join(', ')}` : '');
      const fav = qgBestBait(s.baits); baitStep(fav || (s.baits || [])[0], 'Lemmiksöödaga tuleb see kala neli korda sagedamini.');
      if ((s.times || []).length) { const now = typeof fdpNow === 'function' ? fdpNow() : ''; const good = s.times.includes(now); steps.push({ ok: good ? 1 : 0, ic: '🕐', t: `Parim aeg: <b>${s.times.map(x => QG_DP[x] || x).join(', ')}</b>`, s: good ? 'Praegu on just õige aeg!' : 'Ka muul ajal võib tulla, aga harvem.' }) }
      if (s.night_only) steps.push(FS.is_night ? { ok: 1, ic: '🌙', t: 'Ujub ainult öösel', s: 'Praegu on öö.' } : { warn: 1, ic: '🌙', t: 'Ujub ainult öösel', s: `Öö algab kell 21 (veel ${qgUntil(21)}).` });
      if (qgW(s).length) steps.push(qgW(s).includes(FS.weather) ? { ok: 1, ic: '🌦️', t: `Ujub ainult ilmaga: ${qgWName(s)}`, s: 'Praegu on just see ilm!' } : { warn: 1, ic: '🌦️', t: `Ujub ainult ilmaga: ${qgWName(s)}`, s: 'Ilm vahetub iga 3 tunni järel.' });
      tip = `Püüa ${fmt(+q.target)} tükki. Kalakaardilt näed selle kala kohta veel rohkem.`;
      break;
    }
    case 'spot': spotStep(prm); tip = 'Kõik selles kohas püütud kalad lähevad arvesse.'; break;
    case 'rarity': case 'weight': case 'big1': {
      const top = qgTopSpot(); spotStep(top && top.id, 'Sinu kõige kaugem koht – seal on suuremad ja haruldasemad kalad.');
      const lure = q.kind === 'rarity' ? null : qgPriciest(true), b = lure || qgPriciest(false); if (b) baitStep(b.id, lure ? 'Lant meelitab suuri röövkalu.' : 'Sinu parim sööt.');
      tip = q.kind === 'rarity' ? `Haruldasi kalu tuleb rohkem vihma ja udu ajal ning Kalatunni ajal (kell 20–21). Praegu: ${(WTH2[FS.weather] || ['?', ''])[0]} – ${(WTH2[FS.weather] || ['', ''])[1]}.`
        : 'Suured kalad on tugevad – vajuta „Tõmba“ õigel hetkel ja ära lase õngel murduda.';
      break;
    }
    case 'count': case 'junk': case 'chest': {
      steps.push({ ok: 1, ic: '📍', t: `Võid püüda kohas <b>${qgSpName(FV.spot)}</b>`, s: 'Sobib iga koht.' });
      tip = q.kind === 'count' ? `Vihmaga võtavad kalad kiiremini${FS.weather === 'vihm' ? ' – praegu sajab!' : '.'}` : q.kind === 'junk' ? 'Naljakad leiud (saapad, pudelid, purgid) tulevad juhuslikult viskega. Mida rohkem viskad, seda rohkem neid tuleb.' : 'Aardekirstud tulevad juhuslikult viskega. Mida rohkem viskad, seda rohkem võimalusi.';
      break;
    }
    case 'diverse': {
      const cnt = id => FD.species.filter(s => (s.spots || []).includes(id) && s.min_level <= FS.level && qgSpLive(s)).length;
      const best = qgSpots().sort((a, b) => cnt(b.id) - cnt(a.id))[0];
      spotStep(best && best.id, best ? `Seal ujub praegu ${cnt(best.id)} eri liiki kala.` : '');
      tip = 'Vaheta vahepeal kohta ja sööta – iga koht ja sööt toob eri kalu.';
      break;
    }
    case 'favbait': {
      const here = FD.species.filter(s => (s.spots || []).includes(FV.spot) && s.min_level <= FS.level && qgSpLive(s)), score = {};
      here.forEach(s => (s.baits || []).forEach(b => { if (qgOwned(b)) score[b] = (score[b] || 0) + 1 }));
      const b = Object.keys(score).sort((x, y) => score[y] - score[x])[0];
      steps.push({ ok: 1, ic: '📍', t: `Koht: <b>${qgSpName(FV.spot)}</b>` });
      if (b) baitStep(b, `See on lemmiksööt ${score[b]} kalale selles kohas: ${here.filter(s => (s.baits || []).includes(b)).slice(0, 4).map(s => s.name).join(', ')}.`);
      else steps.push({ warn: 1, ic: '🛒', t: 'Osta poest uss, mais või lant', s: 'Sul pole ühtegi sööta, mis siinsetele kaladele meeldiks.' }), go.shop = 1;
      tip = 'Püügilehe vihjeriba ja kalakaart näitavad iga kala lemmiksööta. ❤ märk tähendab, et kala tuli lemmiksöödaga.';
      break;
    }
    case 'night': {
      steps.push(FS.is_night ? { ok: 1, ic: '🌙', t: 'Praegu ongi öö!', s: 'Püüa kuni kella 5-ni.' } : { warn: 1, ic: '🌙', t: 'Oota ööd', s: `Öö algab kell 21 (veel ${qgUntil(21)}). Ülesanne kestab terve nädala.` });
      tip = 'Öösel tulevad välja ka öised kalad, näiteks angerjas ja luts.';
      break;
    }
    case 'weather': {
      const live = FD.species.filter(s => qgW(s).includes(FS.weather) && s.min_level <= FS.level && (s.spots || []).some(qgSpotOk));
      if (live.length) { const s = live[0], sp = s.spots.filter(qgSpotOk); spotStep(sp.includes(FV.spot) ? FV.spot : sp[0], `Praegu ujub siin ${live.map(x => x.name).join(' ja ')}.`); baitStep(qgBestBait(s.baits)); go.fish = s.id }
      else steps.push({ warn: 1, ic: '🌦️', t: 'Praegu ilmakalu pole', s: `Ilm vahetub iga 3 tunni järel (järgmine kell ${(Math.floor(qgHour() / 3) * 3 + 3) % 24}). Ülesanne kestab terve nädala.` });
      tip = 'Ilmakalad: päikesega Päikesekarp, pilves Pilvekala, vihmaga Vihmaforell ja Vikerkaarekala, udus Uduhõbe, tormiga Tormihaug.';
      break;
    }
    case 'lab': go.tab = 'labor'; go.sub = 'labor'; steps.push({ ic: '🧬', t: 'Ava <b>Labor</b>', s: 'Kalapüügi vahekaart „🧬 Labor“.' }, { ic: '🐟', t: 'Vali kaks kala ja vajuta „Ühenda kalad“', s: 'Iga ühendamine annab ühe hübriidi.' }); tip = 'Muinasjutukalad annavad tugevamad elemendid.'; break;
    case 'dna': go.tab = 'labor'; go.sub = 'uurimine'; steps.push({ ic: '🔬', t: 'Ava labori vaheleht <b>Uurimine</b>' }, { ic: '🐟', t: 'Vali kala ja vajuta „Alusta analüüsi“', s: 'Ülesanne loeb kohe, kui analüüs algab.' }); tip = 'Haruldasema kala DNA annab rohkem uurimispunkte.'; break;
    default: steps.push({ ic: '🎣', t: 'Mine püüdma' });
  }
  if (go.tab === 'puuk' && !steps.some(s => s.ic === '🎣')) steps.push({ ic: '🎣', t: 'Viska õng ja püüa', s: 'Edenemine läheb kirja kohe pärast kala väljatoomist.' });
  return { steps, go, tip };
}

/* ---------- aken ja liikumine ---------- */
function qgOpen(per, idx) {
  const Q = FV.quests; if (!Q) return; const q = (per === 'w' ? Q.weekly : Q.daily).find(x => x.idx === idx); if (!q) return;
  const g = qgBuild(q); QG.cur = g;
  const left = +q.target - +q.progress;
  showModal(() => `<div class="qg"><h2><span style="font-size:28px">📍</span>Kuhu minna?</h2>
    <p class="lead" style="margin:0"><b>${questText(q)}</b><br>${q.kind === 'big1' ? '' : `Veel jäänud: ${q.kind === 'weight' ? fmt1(left) + ' kg' : fmt(Math.ceil(left))}`}</p>
    <ol class="qg-steps">${g.steps.map(s => `<li class="${s.ok ? 'ok' : s.warn ? 'warn' : ''}"><div>${s.t}${s.s ? `<small>${s.s}</small>` : ''}</div><span class="ic" aria-hidden="true">${s.ic}</span></li>`).join('')}</ol>
    ${g.tip ? `<p class="qg-tip">💡 ${g.tip}</p>` : ''}
    <div class="mbtns">${g.go.fish && typeof fishCard === 'function' ? `<button class="btn ghost" type="button" data-qgo="card">Kalakaart</button>` : ''}<button class="btn ghost" type="button" data-act="closeModal">Sulge</button>
      <button class="btn" type="button" data-qgo="go">${g.go.shop ? 'Vii mind poodi' : 'Vii mind sinna'}</button></div></div>`);
}
async function qgGo() {
  const g = QG.cur; if (!g) return; const go = g.go; closeModal();
  if (go.tab === 'labor') { FV.tab = 'labor'; if (typeof LAB !== 'undefined') { LAB.sub = go.sub || 'labor'; labLoad(true) } if (go.sub === 'uurimine' && typeof rsLoad === 'function') rsLoad(); renderFV(true); qgFlash(go.sub === 'uurimine' ? '[data-rs="pick"]' : '.lab-fuse'); return }
  if (go.shop) { FV.tab = 'pood'; renderFV(true); qgFlash('.fv-body'); return }
  FV.tab = 'puuk';
  if (go.spot && go.spot !== FV.spot && qgSpotOk(go.spot)) { FV.spot = go.spot; FV.result = null; FV.phase = 'idle'; FV.msg = '' }
  renderFV(true);
  if (go.bait && go.bait !== FS.bait && qgOwned(go.bait)) { try { await fShop('equip_bait', go.bait) } catch (e) { } }
  FV.oddsKey = ''; try { await loadOdds() } catch (e) { } renderFV(true);
  qgFlash('[data-fa="cast"]');
  toast(`Valmis! ${qgSpName(FV.spot)} · ${qgBaitName(FS.bait)}. Viska õng!`, 'info', 'fish');
}
function qgFlash(sel) {
  setTimeout(() => { const el = document.querySelector('#fishView ' + sel) || document.querySelector(sel); if (!el) return; el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); el.classList.add('qg-flash'); setTimeout(() => el.classList.remove('qg-flash'), 3600) }, 250);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-qg]'); if (b) { const [per, idx] = b.dataset.qg.split(':'); qgOpen(per, +idx); return }
  const o = e.target.closest('[data-qgo]'); if (!o) return;
  if (o.dataset.qgo === 'go') qgGo();
  if (o.dataset.qgo === 'card' && QG.cur && QG.cur.go.fish) { closeModal(); fishCard(QG.cur.go.fish) }
});
