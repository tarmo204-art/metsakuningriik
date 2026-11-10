/* ================= KUNINGA NÕUANDJA: mis on tegemata (ja kuidas), mis on tulekul ================= */
function advTodo() {
  const out = [], R = RATES || computeRates(), add = (pri, ic, t, how, go, lbl) => out.push({ pri, ic, t, how, go, lbl });
  const bt = t => S.buildings.filter(b => b.type === t && (!b.done || b.up)).length;
  // kiired võidud
  if (dailyState().can) add(9, '🎁', 'Päevapreemia ootab', 'Iga päev saad tasuta kingituse. Mida rohkem päevi järjest, seda suurem.', 'tab:kuningriik', 'Võta');
  const qd = QUESTS.filter(q => !S.quests[q.id] && q.get(S) >= q.goal).length;
  if (qd) add(9, '📜', `${qd} ülesannet on täidetud`, 'Preemiad ootavad vahekaardil Ülesanded.', 'tab:ylesanded', 'Võta preemiad');
  if (S.life) {
    const ex = S.life.exp.filter(x => Date.now() >= x.end).length;
    if (ex) add(9, '🧭', `${ex} maadeuurija${ex > 1 ? 't' : ''} on tagasi`, 'Vaata, milliseid aardeid nad tõid.', 'tab:seiklused', 'Vaata saaki');
    const rq = S.life.req.filter(q => S.res[q.k] >= q.amt);
    if (rq.length) add(8, '🙋', `${rq[0].who}${rq.length > 1 ? ' ja teised' : ''} ootavad abi`, `Sul on olemas, mida ${rq[0].who} vajab (${rq[0].amt} ${RES[rq[0].k].g}). Abi teeb elanikud õnnelikuks.`, 'tab:kuningriik', 'Aita');
    if (S.life.ev) { const E = EVENTS[S.life.ev.k]; add(10, E.ic, E.n + ' käib praegu', E.d, S.life.ev.reg && S.life.ev.reg !== S.view ? 'view:' + S.life.ev.reg : '', S.life.ev.reg && S.life.ev.reg !== S.view ? 'Mine' : '') }
    if (S.life.exp.length < expSlots() && S.level >= 1) { const E = EXPEDS.filter(e => S.level >= e.lvl && canAfford(e.cost)).pop(); if (E) add(4, '🧭', 'Maadeuurija ootab tööd', `Saada ta retkele „${E.n}“. Ta tuleb tagasi ${fmtTime(expDur(E) / 1000)} pärast kauba ja aaretega, ka siis, kui mäng on kinni.`, 'tab:seiklused', 'Saada') }
  }
  if (S.raid) add(10, '🐺', 'Hundid on Kodumetsas!', 'Klõpsa huntidel, et nad minema peletada, enne kui nad südaööl toitu varastavad. Vahitorn kaitseb neist jäädavalt.', 'view:kodu', 'Peleta');
  if (S.merchant) add(6, '🛒', 'Rändkaupmees on külas', `Tal on häid pakkumisi. Ta lahkub ${fmtTime(S.merchant.until - S.time)} pärast.`, 'tab:turg', 'Vaata');
  // probleemid
  const stalled = S.buildings.filter(b => R.status[b.id] && R.status[b.id].s === 'stall');
  if (stalled.length) { const b = stalled[0], why = R.status[b.id].why; let fix = 'Vaata hoonet, et näha, mis puudu on.'; if (/kuld/i.test(why)) fix = 'Kuld on otsas. Müü turul kaupa või ehita elumaju, mis maksavad makse.'; else if (/vesi/i.test(why)) fix = 'Vesi on otsas. Ehita kaev või too ämbriga tiigist vett.'; else if (/puit/i.test(why)) fix = 'Puit on otsas. Langeta puid või ehita metsamaja.'; else if (/kivi/i.test(why)) fix = 'Kivi on otsas. Raiu kive või ehita kivimurd.'; add(9, '⚠️', `${BUILD[b.type].n} seisab${stalled.length > 1 ? ` (ja veel ${stalled.length - 1})` : ''}`, `${why}. ${fix}`, 'tab:ehita', 'Ehita') }
  const full = RES_KEYS.filter(k => k !== 'gold' && S.res[k] >= R.cap - .5);
  if (full.length) add(7, '📦', 'Ladu on täis: ' + full.map(k => RES[k].n.toLowerCase()).join(', '), 'Tootmine raisku läheb. Müü üleliigne turul või ehita elumaju, turg või loss, et laomahtu suurendada.', bt('turg') ? 'tab:turg' : 'tab:ehita', bt('turg') ? 'Müü' : 'Ehita');
  if (R.residents > 0 && R.net.food < 0 && S.res.food < 30) add(9, '🍞', 'Toit saab varsti otsa', `Elanikud söövad ${fmt1(-R.net.food)} toitu minutis. Ehita põld${S.level < 3 ? ' (avaneb 3. tasemel)' : ''} või valmista lõkkel marjadest toitu.`, 'tab:kuningriik', 'Küpseta');
  if (R.net.gold < 0 && S.res.gold < 40) add(8, '💰', 'Kuld kahaneb', 'Ülalpidamine maksab rohkem, kui sisse tuleb. Ehita elumaju või müü turul kaupa.', 'tab:ehita', 'Ehita');
  if (!R.guard && S.level >= 3) add(3, '🗼', 'Öösiti käivad hundid', `Vahitorn${S.level < 6 ? ' (avaneb 6. tasemel)' : ''} või sõbralik hunt kaitseb kuningriiki.`, S.level >= 6 ? 'build:vahitorn' : 'tab:loomad', S.level >= 6 ? 'Ehita' : 'Loomad');
  // järgmised sammud
  const first = BUILD_ORDER.find(k => BUILD[k].lvl <= S.level && !(S.st.built[k] || bt(k)) && !S.buildings.some(b => b.type === k));
  if (first) { const D = BUILD[first]; add(canAfford(D.cost) ? 6 : 3, '🏗️', `Ehita esimene ${D.n.toLowerCase()}`, `${D.d} Vaja: ${rewardText(D.cost).replace(/\+/g, '')}.${canAfford(D.cost) ? '' : ' Kogu enne puudu olev kaup kaardilt.'}`, 'build:' + first, 'Ehita') }
  const reg = REGION_ORDER.find(k => !S.regions[k] && regionReq(k).every(x => x.ok));
  if (reg) add(7, '🗺️', `Uus piirkond on avatav: ${REGIONS[reg].n}`, REGIONS[reg].d, 'tab:kaart', 'Ava');
  const up = UPG_ORDER.find(k => upgRank(k) < UPG[k].max && S.level >= UPG[k].lvl && S.fame >= upgFame(k) && canAfford(upgCost(k)));
  if (up) add(5, '👑', `Nõukogu pakub: ${UPG[up].n}`, UPG[up].d, 'tab:noukogu', 'Vaata');
  if ((S.maps || 0) > 0 && !S.hunt) add(5, '🗺️', 'Sul on aardekaart', 'Alusta aardejahti vahekaardil Seiklused. Kaart näitab, millisesse piirkonda aare on maetud.', 'tab:seiklused', 'Otsi aaret');
  if (S.hunt) add(6, '⛏️', 'Aardejaht käib', `Aare on piirkonnas ${REGIONS[S.hunt.region].n}. Vali labidas ja kaeva.`, 'hunt', 'Mine kaevama');
  const ripe = Object.values(S.regions[S.view].tiles).filter(t => t.t === 'bush' && t.ripe).length;
  if (S.level <= 3 && ripe >= 3) add(2, '🫐', `${ripe} põõsal on küpsed marjad`, 'Klõpsa põõsastel, et marju korjata. Marjadest saab lõkkel toitu.', 'tool:kogu', 'Korja');
  return out.sort((a, b) => b.pri - a.pri);
}
function advSoon() {
  const out = [], now = Date.now(), add = (sec, ic, t) => out.push({ sec, ic, t });
  for (const b of S.buildings) if (b.done) add((b.done - now) / 1000, '🔨', `${BUILD[b.type].n}${b.up ? ' ' + (b.lvl + 1) + '. tasemele' : ''} valmib${b.region !== S.view ? ' (' + REGIONS[b.region].n + ')' : ''}`);
  if (S.life) {
    for (const x of S.life.exp) if (now < x.end) { const E = EXPEDS.find(e => e.id === x.id); add((x.end - now) / 1000, '🧭', `${x.who} naaseb retkelt „${E.n}“`) }
    if (S.life.req.length < 3 && RATES && RATES.residents > 0) add((S.life.nextReq - now) / 1000, '🙋', 'Mõni elanik tuleb uue palvega');
    const nx = RANKS[S.life.rank + 1]; if (nx) { const miss = rankReqs(S.life.rank + 1).filter(x => !x.ok); add(-1, '🏰', `Auaste „${nx.n}“: veel vaja ${miss.map(x => x.t + (x.g > 1 ? ` (${fmt(x.v)}/${x.g})` : '')).join(', ')}`) }
  }
  // järgmised tasemed
  for (let l = S.level + 1; l <= S.level + 3; l++) { const u = unlocksBetween(l, l); if (u.length) add(-2 - l / 100, '⭐', `${l}. tasemel avaneb: ${u.join(', ')}`) }
  const xpL = xpNeed(S.level) - S.xp; add(-3, '✨', `Järgmise tasemeni on veel ${fmt(xpL)} kogemust`);
  // aeg ja aastaajad (üks päev = ${DAY} sekundit)
  const p = (S.time % DAY) / DAY, se = season(), dleft = 3 - ((dayNum() - 1) % 3);
  if (p < .7) add((.7 - p) * DAY, '🌙', `Öö saabub${!RATES.guard && S.level >= 3 ? ' – hundid võivad tulla!' : ''}`);
  else add((1 - p) * DAY, '🌅', 'Uus päev algab');
  const nextSe = SEASONS[(SEASONS.indexOf(se) + 1) % 4]; add((dleft - p) * DAY, '🍂', `${nextSe.n} algab: ${nextSe.fx}`);
  if (S.merchant) add(S.merchant.until - S.time, '🛒', 'Rändkaupmees lahkub');
  if (S.life && S.life.ev) add((S.life.ev.until - now) / 1000, EVENTS[S.life.ev.k].ic, EVENTS[S.life.ev.k].n + ' lõpeb');
  return out.sort((a, b) => (a.sec < 0 ? 1e9 - a.sec : a.sec) - (b.sec < 0 ? 1e9 - b.sec : b.sec));
}
function openAdvisor() {
  showModal(() => {
    const todo = advTodo(), soon = advSoon();
    return `<div class="advhd"><span class="advem">🦉</span><div><h2>Kuninga nõuandja</h2><p class="lead">Vana öökull Ülo hoiab silma peal ja ütleb, mida teha ning mis on tulekul.</p></div></div>
      <div class="sec-h">Tee ära <small>${todo.length ? todo.length + ' asja' : 'kõik on korras'}</small></div>
      ${todo.length ? `<div class="advlist">${todo.map(x => `<div class="advit ${x.pri >= 8 ? 'hot' : ''}"><span class="aic">${x.ic}</span><div><b>${esc(x.t)}</b><small>${esc(x.how)}</small></div>${x.go ? `<button class="btn sm" type="button" data-act="advGo" data-arg="${x.go}">${x.lbl || 'Näita'}</button>` : ''}</div>`).join('')}</div>` : '<p class="lead">Suurepärane! Praegu pole midagi pakilist. Kogu kaupa, ehita ja avasta uusi piirkondi.</p>'}
      <div class="sec-h">Tulekul</div>
      <div class="advsoon">${soon.map(x => `<div><span class="aic">${x.ic}</span><span>${esc(x.t)}</span><b class="num">${x.sec >= 0 ? fmtTime(x.sec) : ''}</b></div>`).join('')}</div>
      <div class="mbtns"><button class="btn" type="button" data-act="closeModal">Selge!</button></div>`;
  }, 'advmodal');
}
ACT.advGo = a => {
  closeModal(); const [k, v] = a.split(':');
  if (k === 'tab') { UI.tab = v; renderTabs(true); renderPanel(true); if (isMobile()) $('#panel').scrollIntoView({ behavior: 'smooth' }) }
  else if (k === 'view') { setView(v); if (isMobile()) $('#mapWrap').scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  else if (k === 'build') { UI.tab = 'ehita'; renderTabs(true); renderPanel(true); ACT.build(v) }
  else if (k === 'tool') { setTool(v); if (isMobile()) $('#mapWrap').scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  else if (k === 'hunt' && ACT.huntGo) ACT.huntGo();
};
ACT.advisor = () => openAdvisor();
function advBtn() {
  if (!S || !document.getElementById('mapWrap')) return;
  let b = document.getElementById('advBtn');
  if (!b) { b = document.createElement('button'); b.id = 'advBtn'; b.type = 'button'; b.className = 'advbtn'; b.dataset.act = 'advisor'; b.setAttribute('aria-label', 'Kuninga nõuandja'); document.getElementById('mapWrap').appendChild(b) }
  const todo = advTodo(), hot = todo.filter(x => x.pri >= 6).length;
  const html = `<span>🦉</span><b>Nõuandja</b>${hot ? `<i>${hot}</i>` : ''}`;
  if (b.dataset.h !== html) { b.innerHTML = html; b.dataset.h = html; b.classList.toggle('pulse', hot > 0) }
}
setInterval(() => { if (typeof running !== 'undefined' && running && S) try { advBtn() } catch (e) { } }, 1000);
// uus mängija saab nõuandja kohe alguses
{ const _dn = doNewGame; doNewGame = function () { _dn(); setTimeout(() => toast('Tere! Mina olen nõuandja Ülo. Klõpsa kaardi nurgas nupul 🦉 Nõuandja, kui ei tea, mida edasi teha.', 'info'), 4000) } }
