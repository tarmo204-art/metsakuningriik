/* ================= UI ================= */
const $ = s => document.querySelector(s);
const UI = { tool: 'kogu', placing: null, tab: 'ehita', lastPanel: '', panelBusy: false, modalView: null, lastModal: '', modalBusy: false, lastTabs: '' };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isMobile = () => matchMedia('(max-width:900px)').matches;

/* ---------- toasts ---------- */
const toastSeen = {};
function toast(msg, kind = 'info', icon) {
  if (SILENT) { silentLog.push(msg); return }
  const box = $('#toasts'); const el = document.createElement('div');
  // pealkiri = esimene lause, ülejäänu väiksemalt; preemiad (+50 kulda) esile tõstetud
  const m = String(msg), cut = m.search(/[!?.](\s|$)/), hasBody = cut > 0 && cut < m.length - 3 && cut < 90;
  const title = hasBody ? m.slice(0, cut + 1) : m, body = hasBody ? m.slice(cut + 1).trim() : '';
  const fmtT = t => esc(t).replace(/([+−-]\d[\d\s,.]*(?:\s?(?:kulda|kuulsust|kogemust|puitu|kivi|marju|toitu|vett|aardekaart|kg))?)/g, '<b class="tnum">$1</b>');
  const sym = { good: '✓', bad: '!', info: 'i', gold: '★' }[kind] || 'i';
  const dur = Math.min(11000, 5500 + m.length * 45);
  el.className = 'toast ' + kind;
  el.innerHTML = `<span class="tic">${icon && ICON[icon] ? ic(icon) : `<i>${sym}</i>`}</span><span class="ttx"><span class="tt">${fmtT(title)}</span>${body ? `<span class="tb">${fmtT(body)}</span>` : ''}</span><button class="tx" type="button" aria-label="Sulge teade">×</button><span class="tbar" style="animation-duration:${dur}ms"></span>`;
  box.appendChild(el); while (box.children.length > (isMobile() ? 3 : 4)) box.firstChild.remove();
  let left = dur, t0 = Date.now(), timer = null;
  const close = () => { clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), 450) };
  const arm = () => { t0 = Date.now(); timer = setTimeout(close, left) };
  el.addEventListener('pointerenter', () => { clearTimeout(timer); left -= Date.now() - t0; el.classList.add('hold') });
  el.addEventListener('pointerleave', () => { el.classList.remove('hold'); arm() });
  el.querySelector('.tx').addEventListener('click', e => { e.stopPropagation(); close() });
  arm();
}
function toastOnce(key, msg, kind) { const n = Date.now(); if (toastSeen[key] && n - toastSeen[key] < 20000) return; toastSeen[key] = n; toast(msg, kind) }
function info(msg) { const el = $('#mapInfo'); if (el) el.textContent = msg; UI.infoT = Date.now() }
function flashSave() { const d = $('#saveDot'); if (!d) return; d.classList.add('on'); setTimeout(() => d.classList.remove('on'), 700) }

/* ---------- HUD ---------- */
function buildHUD() {
  $('#resBar').innerHTML = RES_KEYS.map(k => `<div class="rchip" id="rc-${k}" title="${RES[k].n}">${ic(k)}<span class="v" id="rv-${k}">0</span><span class="r" id="rr-${k}"></span></div>`).join('');
  $('#fameIc').innerHTML = ICON.fame;
  $('#tools').innerHTML = [['kogu', 'Kogu'], ['istuta', 'Istuta puu'], ['ehita', 'Ehita'], ['pyua', 'Püüa'], ['kaeva', 'Kaeva']].map(([k, n]) => `<button class="tool" type="button" data-act="tool" data-arg="${k}" id="tool-${k}">${TOOL_ICON[k]}<span>${n}</span></button>`).join('');
}
function hudUpdate() {
  if (!S || !RATES) return;
  $('#lvlNum').textContent = S.level;
  $('#kName').textContent = S.kingdom; $('#pName').textContent = 'Valitseja ' + S.name;
  const need = xpNeed(S.level); $('#xpFill').style.width = (S.xp / need * 100).toFixed(1) + '%'; $('#xpText').textContent = `${fmt(S.xp)} / ${fmt(need)} kogemust`;
  for (const k of RES_KEYS) {
    $('#rv-' + k).textContent = fmt(S.res[k]);
    const r = RATES.net[k], el = $('#rr-' + k);
    el.textContent = Math.abs(r) < .05 ? '' : (r > 0 ? '+' : '−') + fmt1(Math.abs(r)) + '/min'; el.className = 'r ' + (r > 0 ? 'pos' : r < 0 ? 'neg' : '');
    $('#rc-' + k).classList.toggle('full', k !== 'gold' && S.res[k] >= RATES.cap - .5);
    $('#rc-' + k).title = `${RES[k].n}: ${fmt(S.res[k])}${k !== 'gold' ? ' / ' + fmt(RATES.cap) + ' (laomaht)' : ''}`;
  }
  $('#fameVal').textContent = fmt(S.fame);
  const sky = skyState();
  $('#dayTxt').textContent = `Päev ${dayNum()}, ${clockStr(sky.p)}`;
  $('#phaseTxt').textContent = phaseName(sky.p);
  const se = season(); $('#weatherTxt').textContent = se.n + ' · ' + WEATHER[S.weather.t].n;
  $('#weatherTxt').title = se.n + ': ' + se.fx + '. Ilm: ' + WEATHER_FX[S.weather.t] + '.';
  for (const k of ['kogu', 'istuta', 'ehita', 'pyua', 'kaeva']) $('#tool-' + k).classList.toggle('on', UI.tool === k);
  $('#tool-kaeva').hidden = !S.hunt; if (!S.hunt && UI.tool === 'kaeva') UI.tool = 'kogu';
  if (UI.infoT && Date.now() - UI.infoT > 9000) { UI.infoT = 0; info(hintText()) }
}
function hintText() {
  if (UI.tool === 'pyua') return 'Kalapüük: klõpsa veel, et õng visata. Eri piirkondades, öösel ja talvel on erinevad kalad.';
  if (UI.tool === 'kaeva' && S.hunt) return S.view === S.hunt.region ? `Aardejaht: klõpsa ruudul, et kaevata. Rist on piirkonna ${huntClue(S.hunt)}. Kaevamisi: ${S.hunt.digs}.` : `Aare on peidetud piirkonnas ${REGIONS[S.hunt.region].n}.`;
  if (UI.tool === 'istuta') return 'Istutamisrežiim: klõpsa vabal rohumaal või kännul. Iga istik vajab 1 vett.';
  if (UI.tool === 'ehita') return UI.placing ? `Vali vaba ruut: ${BUILD[UI.placing].n}.` : 'Vali paremalt menüüst hoone, mida ehitada.';
  if (S.raid && S.raid.n > 0) return `Hundid on Kodumetsas! Klõpsa neil, et nad minema peletada (${S.raid.n} alles).`;
  return 'Klõpsa puudel, kividel, põõsastel ja veel, et koguda. Loomale klõpsates saad teda marjadega toita.';
}

/* ---------- region tabs ---------- */
function renderRegionTabs() {
  $('#regionTabs').innerHTML = REGION_ORDER.map(k => {
    const open = !!S.regions[k];
    return `<button class="rtab ${S.view === k ? 'on' : ''} ${open ? '' : 'locked'}" type="button" data-act="${open ? 'region' : 'regionInfo'}" data-arg="${k}">${open ? '' : ICON.lock}${REGIONS[k].n}</button>`;
  }).join('');
}
function setView(k) {
  S.view = k; UI.placing = UI.tool === 'ehita' ? UI.placing : null;
  groundKey = ''; spawnView(); renderRegionTabs(); hover = null;
  const t = $('#regionTitle'); t.textContent = REGIONS[k].n; t.style.opacity = 1; clearTimeout(regionTitleT); regionTitleT = setTimeout(() => t.style.opacity = 0, 2600);
  info(REGIONS[k].d);
}
function setTool(t, quiet) {
  UI.tool = t; if (t !== 'ehita') UI.placing = null;
  const b = $('#placeBanner'); b.hidden = !UI.placing; if (UI.placing) $('#placeTxt').textContent = 'Ehita: ' + BUILD[UI.placing].n + '. Vali vaba ruut kaardil.';
  if (!quiet) info(hintText()); hudUpdate();
}

/* ---------- tabs ---------- */
const TABS = {
  ehita: { n: 'Ehita', r: renderBuildTab },
  ylesanded: { n: 'Ülesanded', r: renderQuestTab },
  turg: { n: 'Turg', r: renderMarketTab },
  loomad: { n: 'Loomad', r: renderAnimalTab },
  kaart: { n: 'Kaart', r: renderMapTab },
  saavutused: { n: 'Saavutused', r: renderAchTab },
  noukogu: { n: 'Nõukogu', r: renderCouncilTab },
  kuningriik: { n: 'Kuningriik', r: renderKingdomTab },
};
function badges() {
  const q = QUESTS.filter(q => !S.quests[q.id] && q.get(S) >= q.goal).length;
  const d = dailyState().can ? 1 : 0;
  const r = REGION_ORDER.filter(k => !S.regions[k] && regionReq(k).every(x => x.ok)).length;
  const n = UPG_ORDER.filter(k => upgRank(k) < UPG[k].max && S.level >= UPG[k].lvl && S.fame >= upgFame(k) && canAfford(upgCost(k))).length;
  return { ylesanded: q, kuningriik: d, kaart: r, noukogu: n, turg: S.merchant ? 1 : 0 };
}
function renderTabs(force) {
  const b = badges();
  const html = Object.keys(TABS).map(k => `<button class="tab ${UI.tab === k ? 'on' : ''}" type="button" data-act="tab" data-arg="${k}">${TABS[k].n}${b[k] ? `<span class="dot">${b[k]}</span>` : ''}</button>`).join('');
  if (html !== UI.lastTabs || force) { $('#tabs').innerHTML = html; UI.lastTabs = html }
}
function renderPanel(force) {
  if (UI.panelBusy && !force) return;
  const body = $('#tabBody'), html = TABS[UI.tab].r();
  if (html === UI.lastPanel && !force) return;
  const fa = document.activeElement, fk = fa && body.contains(fa) && fa.dataset.act ? [fa.dataset.act, fa.dataset.arg || ''] : null;
  const st = body.scrollTop;
  body.innerHTML = html; UI.lastPanel = html; body.scrollTop = st;
  paintThumbs(body);
  if (fk) { const el = [...body.querySelectorAll('[data-act]')].find(e => e.dataset.act === fk[0] && (e.dataset.arg || '') === fk[1]); if (el) el.focus({ preventScroll: true }) }
}
const costHTML = (c, extra = '') => `<div class="cost">${Object.keys(c).map(k => `<span class="${S.res[k] < c[k] ? 'lack' : ''}" title="${RES[k].n}">${ic(k)}${fmt(c[k])}</span>`).join('')}${extra}</div>`;
function effText(e, type) {
  const p = [];
  for (const k in e.prod) p.push(`+${fmt1(e.prod[k])} ${RES[k].g}/min`);
  for (const k in e.use) p.push(`−${fmt1(e.use[k])} ${RES[k].g}/min`);
  if (e.upkeep) p.push(`ülalpidamine ${fmt1(e.upkeep)} kulda/min`);
  if (e.residents) p.push(`${e.residents} elanikku`);
  if (e.storage) p.push(`+${e.storage} laomahtu`);
  if (e.fame) p.push(`+${fmt1(e.fame)} kuulsust/min`);
  if (e.gather) p.push(`korjamine +${Math.round(e.gather * 100)}%`);
  if (type === 'vahitorn') p.push('kaitseb huntide eest');
  if (type === 'metsamaja') p.push('puud kasvavad 20% kiiremini');
  if (BUILD[type] && BUILD[type].water) p.push('ehita vee kõrvale');
  return p.join(' · ');
}
function renderBuildTab() {
  const rb = REGIONS[S.view].bonus;
  let h = `<h2>Ehitamine</h2><p class="lead">Vali hoone ja seejärel vaba ruut kaardil. Ehitad praegu piirkonda <b>${REGIONS[S.view].n}</b>.${Object.keys(rb).length ? ' Siin saavad boonust: ' + Object.keys(rb).map(k => BUILD[k].n + ' ×' + fmt1(rb[k])).join(', ') + '.' : ''}</p><div class="cards">`;
  for (const k of BUILD_ORDER) {
    const D = BUILD[k], locked = S.level < D.lvl, n = countType(k), full = n >= D.max;
    const e = bEffect({ type: k, region: S.view, lvl: 1 });
    h += `<article class="card bcard ${locked ? 'locked' : ''}"><canvas class="thumb" data-thumb="${k}"></canvas><div><h3>${D.n}${n ? `<small>${n} ehitatud${D.max < 20 ? ' / max ' + D.max : ''}</small>` : ''}</h3><p>${D.d}</p><div class="eff">${effText(e, k)}</div></div>
      <div class="act">${costHTML(D.cost, `<span class="time">${ic('time')}${fmtTime(buildTime(D.time))}</span>`)}
      ${locked ? `<span class="lockmsg">${ic('lock')}Avaneb ${D.lvl}. tasemel</span>` : full ? '<span class="pill">Maksimum ehitatud</span>' : `<button class="btn sm" type="button" data-act="build" data-arg="${k}" ${canAfford(D.cost) ? '' : 'disabled'}>${UI.placing === k ? 'Valitud' : 'Ehita'}</button>`}</div></article>`;
  }
  h += '</div>';
  const mine = S.buildings.filter(b => b.region === S.view);
  if (mine.length) {
    h += `<div class="sec-h">Hooned selles piirkonnas <small>${mine.length}</small></div><div class="cards">`;
    for (const b of mine) {
      const st = RATES.status[b.id] || {};
      h += `<div class="card qcard"><div><h3>${BUILD[b.type].n} <span class="pill">tase ${b.lvl}</span> ${statusPill(b, st)}</h3></div><button class="btn sm ghost" type="button" data-act="openB" data-arg="${b.id}">Ava</button></div>`;
    }
    h += '</div>';
  }
  return h;
}
function statusPill(b, st) {
  if (b.done) return `<span class="pill warn">${b.up ? 'Täiendamisel' : 'Ehitamisel'} · ${fmtTime((b.done - Date.now()) / 1000)}</span>`;
  if (st.s === 'stall') return `<span class="pill bad">Seisab</span>`;
  if (st.s === 'warn') return `<span class="pill warn">Probleem</span>`;
  return `<span class="pill ok">Töötab</span>`;
}
function renderQuestTab() {
  const done = QUESTS.filter(q => S.quests[q.id]).length;
  const ready = QUESTS.filter(q => !S.quests[q.id] && q.get(S) >= q.goal);
  const open = QUESTS.filter(q => !S.quests[q.id] && q.get(S) < q.goal);
  const card = (q, isReady) => {
    const v = Math.min(q.goal, q.get(S));
    return `<div class="card qcard ${isReady ? 'done' : ''}"><div><h3>${q.n}</h3><div class="rew">${rewardHTML(q.reward)}</div></div>${isReady ? `<button class="btn sm" type="button" data-act="claim" data-arg="${q.id}">Võta preemia</button>` : ''}
      <div class="qprog"><div class="bar ${isReady ? '' : 'green'}"><i style="width:${(v / q.goal * 100).toFixed(1)}%"></i></div><span class="num">${fmt(v)} / ${fmt(q.goal)}</span></div></div>`;
  };
  let h = `<h2>Ülesanded</h2><p class="lead">Täida ülesandeid, et saada kulda, ressursse, kogemust ja kuulsust. Täidetud: ${done} / ${QUESTS.length}.</p>`;
  h += `<div class="bar"><i style="width:${(done / QUESTS.length * 100).toFixed(1)}%"></i></div>`;
  if (ready.length) h += `<div class="sec-h">Valmis <small>${ready.length}</small></div><div class="cards">${ready.map(q => card(q, true)).join('')}</div>`;
  h += `<div class="sec-h">Pooleli <small>${open.length}</small></div><div class="cards">${open.map(q => card(q, false)).join('')}</div>`;
  if (done) h += `<div class="sec-h">Lõpetatud <small>${done}</small></div><p class="lead">${QUESTS.filter(q => S.quests[q.id]).map(q => q.n).join(' · ')}</p>`;
  return h;
}
function sparkSVG(hist) {
  const w = 70, h = 22, mn = .45, mx = 2;
  const pts = hist.map((v, i) => `${(i / (hist.length - 1) * w).toFixed(1)},${(h - (v - mn) / (mx - mn) * h).toFixed(1)}`).join(' ');
  const last = hist[hist.length - 1], prev = hist[hist.length - 2] ?? last, col = last >= prev ? '#97d983' : '#ff8a78';
  const ly = h - (1 - mn) / (mx - mn) * h;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><line x1="0" x2="${w}" y1="${ly}" y2="${ly}" stroke="#355f50" stroke-dasharray="2 2"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.6"/><circle cx="${w}" cy="${(h - (last - mn) / (mx - mn) * h).toFixed(1)}" r="2.2" fill="${col}"/></svg>`;
}
function renderMarketTab() {
  const open = hasActive('turg');
  let h = '';
  if (S.merchant) h += `<div class="card qcard done"><div><h3>Rändkaupmees on Kodumetsas</h3><div class="rew">Lahkub ${fmtTime(S.merchant.until - S.time)} pärast · ${S.merchant.offers.filter(o => !o.done).length} pakkumist alles</div></div><button class="btn sm" type="button" data-act="merchant">Vaata pakkumisi</button></div>`;
  h += `<h2>Turg</h2><p class="lead">${open ? `Müü üleliigset ja osta puuduolevat. Hinnad muutuvad iga 30 sekundi järel ja langevad, kui palju müüd. Turu tase ${turgLvl()} annab müügihinnale +${turgLvl() * 8}%.` : 'Kauplemiseks ehita esmalt turg (avaneb 3. tasemel). Allpool näed praeguseid hindu.'}</p>`;
  h += `<div class="cards">`;
  for (const k of MARKET_KEYS) {
    const su = sellUnit(k), bu = buyUnit(k), m = S.market[k].m;
    const trend = m > 1.15 ? '<span class="pill ok">kõrge hind</span>' : m < .85 ? '<span class="pill bad">madal hind</span>' : '';
    h += `<div class="card mrow"><div><div class="mname">${ic(k, 'lg')}${RES[k].n} ${trend}</div><div class="prices">Müük ${fmt1(su)} · ost ${fmt1(bu)} kulda tükk · laos ${fmt(S.res[k])}</div></div>${sparkSVG(S.market[k].h.concat([m]))}
    ${open ? `<div class="btns"><button class="btn sm ghost" type="button" data-act="sell" data-arg="${k}:10" ${S.res[k] >= 10 ? '' : 'disabled'}>Müü 10</button><button class="btn sm ghost" type="button" data-act="sell" data-arg="${k}:50" ${S.res[k] >= 50 ? '' : 'disabled'}>Müü 50</button><button class="btn sm ghost" type="button" data-act="sell" data-arg="${k}:all" ${S.res[k] >= 1 ? '' : 'disabled'}>Müü kõik</button><button class="btn sm" type="button" data-act="buy" data-arg="${k}:10" ${S.res.gold >= Math.ceil(10 * bu) && S.res[k] <= RATES.cap - 10 ? '' : 'disabled'}>Osta 10 (${Math.ceil(10 * bu)})</button><button class="btn sm" type="button" data-act="buy" data-arg="${k}:50" ${S.res.gold >= Math.ceil(50 * bu) && S.res[k] <= RATES.cap - 50 ? '' : 'disabled'}>Osta 50 (${Math.ceil(50 * bu)})</button></div>` : ''}</div>`;
  }
  h += `</div><p class="lead">Kokku müüdud ${fmt(S.st.sold)} ühikut, ostetud ${fmt(S.st.bought)} ühikut.</p>`;
  return h;
}
function renderAnimalTab() {
  let h = `<h2>Loomad</h2><p class="lead">Klõpsa kaardil loomale, et teda marjadega toita. Kui ta usaldab sind, kolib ta Kodumetsa ja toob kuningriigile kasu. Iga liigi kohta saad kuni ${maxTame()} sõpra.</p><div class="cards">`;
  for (const k of ANIMAL_ORDER) {
    const A = ANIMALS[k], n = S.st.tamed[k] || 0, locked = S.level < A.lvl;
    const where = REGION_ORDER.filter(r => REGIONS[r].animals.includes(k)).map(r => REGIONS[r].n).join(', ');
    h += `<div class="card acard ${locked ? 'locked' : ''}"><canvas data-animal="${k}"></canvas><div><h3 style="font-size:15px">${A.n} <span class="pill ${n ? 'ok' : ''}">${n} / ${maxTame()} sõpra</span></h3>
      <div class="eff">Toitmine: ${A.feed} marja · Kasu: ${A.bt}</div><div class="lead" style="font-size:12.5px">Elab: ${where}</div>${locked ? `<div class="lockmsg">${ic('lock')}Sõbruneda saab ${A.lvl}. tasemel</div>` : ''}</div></div>`;
  }
  h += `</div><p class="lead">Kokku sõpru: ${S.st.tamedTotal}. Öiseid hunte peletatud: ${S.st.scared}.</p>`;
  return h;
}
function renderMapTab() {
  let h = `<h2>Kaart</h2><p class="lead">Mets on suurem, kui esmapilgul paistab. Ava uusi piirkondi, et leida uusi ressursse, loomi ja avastusi. Avastusi tehtud: ${S.st.discoveries} / ${TOTAL_DISC}.</p><div class="cards">`;
  for (const k of REGION_ORDER) {
    const R = REGIONS[k], open = !!S.regions[k];
    const disc = open ? S.regions[k].tiles.filter(t => ['chest', 'relic', 'crystal'].includes(t.t) || (t.t === 'mushring' && !t.found)).length : R.disc.length;
    const req = regionReq(k), ok = req.every(r => r.ok);
    h += `<div class="card rcard"><canvas class="rimg" data-region="${k}" data-lock="${open ? 0 : 1}"></canvas><div class="rin"><h3 style="font-size:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${R.n} ${open ? (S.view === k ? '<span class="pill ok">Siin oled</span>' : '<span class="pill ok">Avatud</span>') : '<span class="pill">Lukus</span>'}</h3>
      <p class="lead">${R.d}</p><div class="eff">Loomad: ${R.animals.map(a => ANIMALS[a].n.toLowerCase()).join(', ')} · Leidmata avastusi: ${disc}${Object.keys(R.bonus).length ? ' · Boonus: ' + Object.keys(R.bonus).map(b => BUILD[b].n.toLowerCase() + ' ×' + fmt1(R.bonus[b])).join(', ') : ''}</div>
      ${open ? (S.view === k ? '' : `<div><button class="btn sm" type="button" data-act="region" data-arg="${k}">Mine sinna</button></div>`) : `<div class="req">${req.map(r => `<span class="pill ${r.ok ? 'ok' : 'bad'}">${r.ok ? '✓' : '✗'} ${r.t}</span>`).join('')}</div><div><button class="btn sm" type="button" data-act="unlock" data-arg="${k}" ${ok ? '' : 'disabled'}>Ava piirkond (${R.cost} kulda)</button></div>`}</div></div>`;
  }
  return h + '</div>';
}
function renderAchTab() {
  const got = ACH.filter(a => S.ach[a.id]).length;
  return `<h2>Saavutused</h2><p class="lead">Avatud ${got} / ${ACH.length}. Iga saavutus toob kuulsust.</p><div class="achgrid">${ACH.map((a, i) => `<div class="ach ${S.ach[a.id] ? 'got' : ''}"><div class="medal">${S.ach[a.id] ? '★' : i + 1}</div><b>${a.n}</b><small>${a.d}</small>${a.fame ? `<small>+${a.fame} kuulsust</small>` : ''}</div>`).join('')}</div>`;
}
function renderKingdomTab() {
  const d = dailyState();
  let h = `<h2>${esc(S.kingdom)}</h2><p class="lead">Valitseja ${esc(S.name)} · Päev ${dayNum()} · ${RATES.residents} elanikku · ${S.buildings.length} hoonet · laomaht ${fmt(RATES.cap)}</p>`;
  h += `<div class="card"><div class="sec-h" style="margin:0">Päevapreemia <small>${S.daily.streak ? 'järjest ' + S.daily.streak + ' päeva' : 'alusta seeriat'}</small></div>
    <div class="daily">${DAILY.map((r, i) => { const claimedToday = !d.can, cur = (S.daily.streak - 1) % 7; const got = claimedToday ? i <= cur : i < d.idx; const next = d.can && i === d.idx; return `<div class="${got ? 'got' : ''} ${next ? 'next' : ''}"><b>${i + 1}.</b>${ic(Object.keys(r).includes('fame') ? 'fame' : 'gold')}<span>${r.gold}</span></div>` }).join('')}</div>
    ${typeof fdayLine === 'function' ? fdayLine() : ''}
    ${d.can ? `<button class="btn" type="button" data-act="daily">Võta päevapreemia: ${rewardText(DAILY[d.idx])}</button>` : '<p class="lead">Tänane preemia on võetud. Tule homme tagasi, et seeriat jätkata.</p>'}</div>`;
  h += `<div class="card"><div class="sec-h" style="margin:0">Lõkkeplats <small>3 marja + 1 vesi → 2 toitu</small></div><p class="lead">Elanikud vajavad toitu. Kui põlde veel pole, valmista toitu marjadest.</p>
    ${S.res.food >= RATES.cap - 1 ? '<p class="lead" style="color:var(--amber-2)">Toiduladu on täis.</p>' : ''}<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="cook" data-arg="1" ${S.res.berries >= 3 && S.res.water >= 1 && S.res.food < RATES.cap - 1 ? '' : 'disabled'}>Valmista 2 toitu</button><button class="btn sm" type="button" data-act="cook" data-arg="5" ${S.res.berries >= 15 && S.res.water >= 5 && S.res.food < RATES.cap - 1 ? '' : 'disabled'}>Valmista 10 toitu</button><button class="btn sm ghost" type="button" data-act="cook" data-arg="999" ${S.res.berries >= 3 && S.res.water >= 1 && S.res.food < RATES.cap - 1 ? '' : 'disabled'}>Kõik marjad toiduks</button></div></div>`;
  h += `<div class="card"><div class="sec-h" style="margin:0">Majandus minutis</div><div class="prodtable">${RES_KEYS.map(k => { const r = RATES.net[k]; return `${ic(k)}<span>${RES[k].n}</span><span class="${r > 0 ? 'pos' : r < 0 ? 'neg' : ''}">${r > 0 ? '+' : r < 0 ? '−' : ''}${fmt1(Math.abs(r))}</span><span style="color:var(--faint)">${k === 'gold' ? '' : fmt(S.res[k]) + '/' + fmt(RATES.cap)}</span>` }).join('')}
    ${ic('fame')}<span>Kuulsus</span><span class="pos">+${fmt1(RATES.fame)}</span><span></span></div><p class="lead">Hoonete ülalpidamine kokku ${fmt1(RATES.upkeep)} kulda minutis. Kui kuld lõpeb, jäävad ülalpidamist vajavad hooned seisma.</p></div>`;
  const st = S.st;
  h += `<div class="card"><div class="sec-h" style="margin:0">Statistika</div><dl class="stats">
    <dt>Kogutud puitu</dt><dd>${fmt(st.gathered.wood)}</dd><dt>Kogutud kivi</dt><dd>${fmt(st.gathered.stone)}</dd><dt>Korjatud marju</dt><dd>${fmt(st.gathered.berries)}</dd><dt>Toodetud toitu</dt><dd>${fmt(st.gathered.food)}</dd><dt>Teenitud kulda</dt><dd>${fmt(st.goldEarned)}</dd>
    <dt>Istutatud puid</dt><dd>${st.planted}</dd><dt>Langetatud puid</dt><dd>${st.chopped}</dd><dt>Valminud hooneid</dt><dd>${st.builtTotal}</dd><dt>Täiendusi</dt><dd>${st.upgrades}</dd><dt>Loomasõpru</dt><dd>${st.tamedTotal}</dd><dt>Avastusi</dt><dd>${st.discoveries} / ${TOTAL_DISC}</dd><dt>Üle elatud öid</dt><dd>${st.nights}</dd><dt>Huntide rünnakuid</dt><dd>${st.raids}</dd></dl></div>`;
  h += `<div class="card"><div class="sec-h" style="margin:0">Salvestamine</div><p class="lead">${storageOk ? `Mäng salvestub automaatselt selles brauseris iga 10 sekundi järel ja lehelt lahkudes.${lastSaved ? ' Viimati salvestatud ' + new Date(lastSaved).toLocaleTimeString('et-EE') + '.' : ''} Kui oled eemal, jätkab kuningriik tootmist kuni ${offlineCapH()} tundi.` : 'Brauser ei luba siin andmeid salvestada (nt privaatne aken). Mäng töötab, kuid areng ei säili pärast sulgemist.'}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm ghost" type="button" data-act="saveNow">Salvesta kohe</button><button class="btn sm ghost" type="button" data-act="help">Mängujuhend</button><button class="btn sm danger" type="button" data-act="reset">Lähtesta mäng</button></div></div>`;
  return h;
}

function renderCouncilTab() {
  let h = `<h2>Kuninglik nõukogu</h2><p class="lead">Nõunikud pakuvad uuendusi, mis teevad kogu kuningriigi tugevamaks. Uuendus maksab ressursse ja vajab piisavalt kuulsust, kuid kuulsust ei kulutata. Ostetud astmeid: ${upgTotal(S)}.</p><div class="cards">`;
  for (const k of UPG_ORDER) {
    const U = UPG[k], r = upgRank(k), maxed = r >= U.max, lockL = S.level < U.lvl, fameNeed = upgFame(k), c = upgCost(k);
    const pips = Array.from({ length: U.max }, (_, i) => `<span style="display:inline-block;width:18px;height:6px;border-radius:3px;background:${i < r ? 'var(--amber)' : 'rgba(0,0,0,.35)'}"></span>`).join(' ');
    h += `<div class="card ${lockL ? 'locked' : ''}" style="${lockL ? 'opacity:.6' : ''}"><div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline;flex-wrap:wrap"><h3 style="font-size:15px">${U.n}</h3><span style="display:flex;gap:3px;align-items:center">${pips}</span></div><p class="lead" style="font-size:13px">${U.d}</p>`;
    if (maxed) h += '<span class="pill ok">Täielikult uuendatud</span>';
    else if (lockL) h += `<span class="lockmsg">${ic('lock')}Avaneb ${U.lvl}. tasemel</span>`;
    else h += `<div class="act" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">${costHTML(c, `<span class="${S.fame < fameNeed ? 'lack' : ''}">${ic('fame')}${fameNeed} vaja</span>`)}<button class="btn sm" type="button" data-act="upg" data-arg="${k}" ${S.fame >= fameNeed && canAfford(c) ? '' : 'disabled'}>${r ? (r + 1) + '. aste' : 'Uuenda'}</button></div>`;
    h += '</div>';
  }
  return h + '</div>';
}
function openMerchant() {
  showModal(() => {
    const m = S.merchant; if (!m) return null;
    return `<div class="mhead"><canvas data-wagon="1"></canvas><div><h2>Rändkaupmees</h2><p class="lead">Lahkub ${fmtTime(m.until - S.time)} pärast</p></div></div><p>„Tervist, valitseja! Toon kaupa kaugetest maadest. Iga pakkumine kehtib üks kord."</p>
    <div class="cards">${m.offers.map((o, i) => `<div class="card qcard ${o.done ? '' : 'done'}" style="${o.done ? 'opacity:.55' : ''}"><div>${o.label ? `<h3>${o.label}</h3>` : ''}<div class="rew">Annad: ${rewardHTML(o.give)}</div><div class="rew">Saad: ${rewardHTML(o.get)}</div></div>${o.done ? '<span class="pill ok">Tehtud</span>' : `<button class="btn sm" type="button" data-act="trade" data-arg="${i}" ${canAfford(o.give) ? '' : 'disabled'}>Vaheta</button>`}</div>`).join('')}</div>
    <div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Sulge</button></div>`;
  });
}

/* ---------- modal ---------- */
function showModal(view, cls) { $('#modalCard').className = 'modal-card ' + (cls || ''); UI.modalView = view; UI.lastModal = ''; $('#modal').hidden = false; renderModal(true) }
function closeModal() { UI.modalView = null; $('#modal').hidden = true; $('#modalCard').innerHTML = ''; $('#modalCard').className = 'modal-card'; if (UI.pendingLvl && S) { const p = UI.pendingLvl; UI.pendingLvl = null; setTimeout(() => showLevelUp(p.from, p.to), 250) } }
function renderModal(force) {
  if (!UI.modalView || (UI.modalBusy && !force)) return;
  const html = UI.modalView(); if (html === null) { closeModal(); return }
  if (html === UI.lastModal && !force) return;
  const card = $('#modalCard'); card.innerHTML = html; UI.lastModal = html; paintThumbs(card);
  if (force) { const f = card.querySelector('.btn:not([disabled])'); if (f) f.focus({ preventScroll: true }) }
}
function confirmModal(title, text, okLabel, act, arg) {
  showModal(() => `<h2>${title}</h2><p>${text}</p><div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Loobu</button><button class="btn danger" type="button" data-act="${act}" data-arg="${arg ?? ''}">${okLabel}</button></div>`);
}
function openBuilding(id) {
  showModal(() => {
    const b = getB(id); if (!b) return null;
    const D = BUILD[b.type], e = bEffect(b), st = RATES.status[b.id] || {};
    let stat;
    if (b.done) { const p = clamp((Date.now() - b.start) / (b.done - b.start), 0, 1); stat = `<span class="pill warn">${b.up ? 'Täiendamisel ' + (b.lvl + 1) + '. tasemele' : 'Ehitamisel'}</span> <span class="num">${fmtTime((b.done - Date.now()) / 1000)}</span><div class="bar" style="width:100%"><i style="width:${(p * 100).toFixed(1)}%"></i></div>` }
    else if (st.s === 'stall') stat = `<span class="pill bad">Seisab</span> ${st.why}`;
    else if (st.s === 'warn') stat = `<span class="pill warn">Töötab osaliselt</span> ${st.why}`;
    else stat = '<span class="pill ok">Töötab</span>';
    const wm = weatherMult(b.type);
    let h = `<div class="mhead"><canvas data-thumb="${b.type}"></canvas><div><h2>${D.n}</h2><p class="lead">${REGIONS[b.region].n} · tase ${b.lvl} / ${MAX_LVL}</p></div></div><p>${D.d}</p>
      <dl class="kv"><dt>Olek</dt><dd>${stat}</dd><dt>Praegu</dt><dd>${effText(e, b.type) || '—'}</dd>${e.rm !== 1 ? `<dt>Piirkond</dt><dd>boonus ×${fmt1(e.rm)}</dd>` : ''}${wm !== 1 && Object.keys(e.prod).length ? `<dt>Ilm</dt><dd>${WEATHER[S.weather.t].n.toLowerCase()} ×${fmt1(wm)}</dd>` : ''}`;
    if (b.lvl < MAX_LVL && !b.done) h += `<dt>${b.lvl + 1}. tase</dt><dd>${effText(bEffect(b, b.lvl + 1), b.type)}</dd><dt>Täienduse hind</dt><dd>${costHTML(upCost(b), `<span class="time">${ic('time')}${fmtTime(upTime(b))}</span>`)}</dd>`;
    h += `</dl><div class="mbtns">`;
    if (b.done) h += `<button class="btn" type="button" data-act="speed" data-arg="${b.id}" ${S.res.gold >= speedCost(b) ? '' : 'disabled'}>Kiirenda (${speedCost(b)} kulda)</button>`;
    else if (b.lvl < MAX_LVL) h += `<button class="btn" type="button" data-act="upgrade" data-arg="${b.id}" ${canAfford(upCost(b)) ? '' : 'disabled'}>Täienda ${b.lvl + 1}. tasemele</button>`;
    else h += '<span class="pill ok">Maksimaalne tase</span>';
    h += `<button class="btn ghost" type="button" data-act="demolish" data-arg="${b.id}">Lammuta</button><button class="btn ghost" type="button" data-act="closeModal">Sulge</button></div>`;
    return h;
  });
}
function helpView() {
  return () => `<h2>Tere tulemast, ${esc(S.name)}!</h2><p>Sinu maalapp asub keset Kodumetsa. Siin on, kuidas kuningriik kasvama panna:</p>
  <ul class="tips"><li><b>Kogu:</b> klõpsa küpsel puul, kivil, marjapõõsal või veel. Loomale klõpsates toidad teda marjadega ja võid temaga sõbruneda.</li>
  <li><b>Istuta:</b> vali tööriist "Istuta puu" ja klõpsa vabal maal. Istik kasvab neli järku. Vihm kiirendab kasvu.</li>
  <li><b>Ehita:</b> vali menüüst hoone ja seejärel ruut kaardil. Klõpsa valmis hoonel, et seda täiendada.</li>
  <li><b>Hoia elanikud söönuna:</b> elumajad maksavad kulda, kuid söövad toitu. Valmista toitu lõkkel või ehita põld.</li>
  <li><b>Öösel</b> võivad hundid tulla toitu varastama. Peleta nad klõpsuga minema või ehita vahitorn.</li>
  <li>Täida <b>ülesandeid</b>, võta iga päev <b>päevapreemia</b> ja ava kaardilt <b>uusi piirkondi</b>.</li></ul>
  <p class="lead">Mäng salvestub automaatselt. Sinu kuningriik toodab edasi ka siis, kui oled eemal.</p>
  <div class="mbtns"><button class="btn" type="button" data-act="closeModal">Asun valitsema</button></div>`;
}
function onLevelUp(from, to) {
  S.fame += 2 * (to - from + 1);
  if (SILENT) { toast(`Tase ${to}!`); return }
  if (typeof sparkle === 'function') for (let i = 0; i < 4; i++) sparkle(rnd(3, W - 3), rnd(2, H - 2), '#ffd286', 18);
  if (UI.modalView) { UI.pendingLvl = { from: UI.pendingLvl ? UI.pendingLvl.from : from, to }; return }
  showLevelUp(from, to);
}
function unlockItems(a, b) {
  const u = [];
  for (const k of BUILD_ORDER) if (BUILD[k].lvl >= a && BUILD[k].lvl <= b) u.push({ kind: 'Hoone', name: BUILD[k].n, attr: `data-thumb="${k}"` });
  for (const k of REGION_ORDER) if (k !== 'kodu' && REGIONS[k].lvl >= a && REGIONS[k].lvl <= b) u.push({ kind: 'Piirkond', name: REGIONS[k].n, attr: `data-region="${k}" data-lock="0"` });
  for (const k of ANIMAL_ORDER) if (ANIMALS[k].lvl > 1 && ANIMALS[k].lvl >= a && ANIMALS[k].lvl <= b) u.push({ kind: 'Loom', name: ANIMALS[k].n, attr: `data-animal="${k}"` });
  return u;
}
function showLevelUp(from, to) {
  const u = unlockItems(from, to), fame = 2 * (to - from + 1);
  let nextL = null; for (let l = to + 1; l <= 12 && !nextL; l++) if (unlockItems(l, l).length) nextL = l;
  const motes = Array.from({ length: 10 }, (_, i) => `<i class="mote" style="left:${8 + i * 9}%;top:${30 + (i * 37) % 50}%;animation-delay:${(i * .37) % 3}s"></i>`).join('');
  showModal(() => `<div class="rays"></div>${motes}
    <div class="ribbon">Tase tõusis</div>
    <div class="emblem"><div class="emblem-in"><b>${to}</b><small>tase</small></div></div>
    <h2>${esc(S.name)}, kuningriik kasvab!</h2>
    <p class="sub">Metsarahvas räägib sinu valitsemisest juba kaugetes orgudes.</p>
    <div class="gains"><span>${ic('fame')}+${fame} kuulsust</span><span>${ic('xp')}järgmine tase ${fmt(xpNeed(S.level))} kogemust</span></div>
    ${u.length ? `<div class="ulabel">Avanes</div><div class="ucards">${u.map((x, i) => `<div class="ucard" style="animation-delay:${.15 + i * .08}s"><canvas ${x.attr}></canvas><small>${x.kind}</small><b>${x.name}</b></div>`).join('')}</div>`
      : `<p class="nextl">${nextL ? `Järgmised uued asjad avanevad ${nextL}. tasemel.` : 'Kõik hooned, piirkonnad ja loomad on avatud. Jätka ülesannete ja avastustega.'}</p>`}
    <button class="btn" type="button" data-act="closeModal">Edasi valitsema</button>`, 'lvlup');
}
function showOffline(g, sec) {
  const keys = Object.keys(g.diff);
  showModal(() => `<h2>Tere tagasi!</h2><p>Sind polnud ${fmtTime(sec)}. ${sec > offlineCapH() * 3600 ? `Kuningriik töötas sel ajal ${offlineCapH()} tundi. ` : ''}Vahepeal juhtus kuningriigis nii:</p>
    <dl class="kv">${keys.map(k => `<dt>${ic(k)} ${RES[k].n}</dt><dd class="num" style="color:${g.diff[k] > 0 ? 'var(--ok)' : 'var(--bad)'}">${g.diff[k] > 0 ? '+' : '−'}${fmt(Math.abs(g.diff[k]))}</dd>`).join('')}<dt>${ic('fame')} Kuulsus</dt><dd class="num" style="color:var(--ok)">+${fmt1(g.fame)}</dd></dl>
    ${g.log.length ? `<p class="lead">${g.log.map(esc).join(' ')}</p>` : ''}<div class="mbtns"><button class="btn" type="button" data-act="closeModal">Jätka</button></div>`);
}

/* ---------- actions ---------- */
const ACT = {
  tab: a => { UI.tab = a; renderTabs(true); renderPanel(true); if (isMobile()) $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' }) },
  tool: a => { if (a === 'ehita') { UI.tab = 'ehita'; renderTabs(true); setTool('ehita'); renderPanel(true); if (isMobile()) $('#panel').scrollIntoView({ behavior: 'smooth', block: 'start' }) } else setTool(a) },
  build: a => { UI.placing = a; setTool('ehita'); if (isMobile()) $('#mapWrap').scrollIntoView({ behavior: 'smooth', block: 'center' }) },
  cancelPlace: () => setTool('kogu'),
  region: a => { setView(a); closeModal() },
  regionInfo: a => { UI.tab = 'kaart'; renderTabs(true); renderPanel(true); info(`${REGIONS[a].n} on veel lukus. Vaata avamise tingimusi kaardi menüüst.`); if (isMobile()) $('#panel').scrollIntoView({ behavior: 'smooth' }) },
  unlock: a => { unlockRegion(a); renderRegionTabs() },
  claim: a => claimQuest(a),
  sell: a => { const [k, q] = a.split(':'); sell(k, q) },
  buy: a => { const [k, q] = a.split(':'); buy(k, q) },
  cook: a => cook(+a),
  daily: () => claimDaily(),
  saveNow: () => { save(); toast(storageOk ? 'Mäng salvestatud.' : 'Salvestamine ei õnnestunud: brauser ei luba andmeid salvestada.', storageOk ? 'good' : 'bad') },
  help: () => showModal(helpView()),
  reset: () => confirmModal('Lähtesta mäng?', 'Kogu kuningriik, hooned, loomad ja edusammud kustutatakse jäädavalt. Seda ei saa tagasi võtta.', 'Kustuta ja alusta otsast', 'confirmReset'),
  confirmReset: () => { closeModal(); running = false; wipeSave(); S = null; showStart() },
  openB: a => openBuilding(+a),
  upgrade: a => upgradeB(+a),
  speed: a => speedB(+a),
  demolish: a => { const b = getB(+a); if (b) confirmModal(`Lammuta ${BUILD[b.type].n.toLowerCase()}?`, `Saad tagasi pool ehitushinnast: ${rewardText(scaleCost(BUILD[b.type].cost, .5))}. Taseme täiendusi tagasi ei saa.`, 'Lammuta', 'confirmDemolish', b.id) },
  confirmDemolish: a => { demolishB(+a); closeModal() },
  closeModal: () => closeModal(),
  confirmNew: () => { closeModal(); doNewGame() },
  upg: a => buyUpg(a),
  merchant: () => openMerchant(),
  trade: a => merchantTrade(+a),
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.act]; if (!f || !S && !['confirmNew', 'closeModal'].includes(el.dataset.act)) return;
  f(el.dataset.arg, el, e);
  if (S) { RATES = computeRates(); hudUpdate(); renderTabs(); renderPanel(true); if (UI.modalView) renderModal(true) }
});
['tabBody', 'modalCard'].forEach(id => $('#' + id).addEventListener('pointerdown', () => { if (id === 'tabBody') UI.panelBusy = true; else UI.modalBusy = true }));
window.addEventListener('pointerup', () => setTimeout(() => { UI.panelBusy = false; UI.modalBusy = false }, 80));
window.addEventListener('pointercancel', () => { UI.panelBusy = false; UI.modalBusy = false });
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal() });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (UI.modalView) closeModal(); else if (UI.placing || UI.tool !== 'kogu') setTool('kogu') } });

/* ---------- map input ---------- */
function mapPos(e) { const r = cv.getBoundingClientRect(); return { fx: (e.clientX - r.left) / r.width * W, fy: (e.clientY - r.top) / r.height * H } }
cv.addEventListener('pointermove', e => {
  if (!S) return; const { fx, fy } = mapPos(e); const x = Math.floor(fx), y = Math.floor(fy);
  if (x < 0 || y < 0 || x >= W || y >= H) { hover = null; return }
  hover = { x, y };
  if (e.pointerType === 'mouse' && (!UI.infoT || Date.now() - UI.infoT > 2500)) { $('#mapInfo').textContent = describe(x, y, fx, fy) }
});
cv.addEventListener('pointerleave', () => hover = null);
cv.addEventListener('click', e => {
  if (!S) return; const { fx, fy } = mapPos(e); const x = Math.floor(fx), y = Math.floor(fy);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  hover = { x, y };
  if (UI.tool === 'kogu') {
    const a = !merchantAt(x, y) && animalAt(fx, fy); if (a) tryTame(a); else interactTile(x, y);
  } else if (UI.tool === 'istuta') plantAt(x, y);
  else if (UI.tool === 'kaeva') digAt(x, y);
  else if (UI.tool === 'pyua') startFishing(x, y);
  else if (UI.tool === 'ehita') {
    if (!UI.placing) { const t = S.regions[S.view].tiles[y * W + x]; if (t.t === 'b') openBuilding(t.id); else info('Vali esmalt menüüst hoone, mida ehitada.'); }
    else if (placeBuilding(UI.placing, x, y)) setTool('kogu', true);
  }
  RATES = computeRates(); hudUpdate(); renderTabs(); renderPanel();
});
function animalAt(fx, fy) {
  let best = null, bd = 1e9;
  for (const a of ents) {
    const ay = a.fly ? a.y : a.y - .25, d = Math.hypot(a.x - fx, ay - fy), r = a.fly ? .6 : a.sp === 'hirv' || a.sp === 'hunt' ? .5 : .4;
    if (d < r && d < bd && !a.flee && !a.leave && !a.dead) { best = a; bd = d }
  }
  return best;
}
function describe(x, y, fx, fy) {
  if (merchantAt(x, y)) return 'Rändkaupmehe vanker. Klõpsa, et vaadata tema pakkumisi.';
  if (UI.tool === 'pyua') return S.regions[S.view].tiles[y * W + x].t === 'water' ? 'Klõpsa, et õng siia visata.' : 'Õnge saab visata ainult vette.';
  if (UI.tool === 'kaeva') return S.hunt && S.view === S.hunt.region ? 'Klõpsa, et siia kaevata.' : 'Aare on peidetud teises piirkonnas.';
  const a = UI.tool === 'kogu' && animalAt(fx, fy);
  if (a) { const A = ANIMALS[a.sp]; if (a.raid) return 'Näljane hunt! Klõpsa, et ta minema peletada.'; if (a.tame) return `${A.n} on sinu sõber. Klõpsa, et silitada.`; return S.level < A.lvl ? `${A.n}. ${A.com} saad sõbruneda ${A.lvl}. tasemel.` : `${A.n}. Klõpsa, et toita ${A.feed} marjaga ja sõbruneda.` }
  const t = S.regions[S.view].tiles[y * W + x];
  if (UI.tool === 'ehita' && UI.placing) return (t.t === 'grass' || t.t === 'stump') ? `Klõpsa, et ehitada siia ${BUILD[UI.placing].n.toLowerCase()}.` : 'Siia ei saa ehitada.';
  if (UI.tool === 'istuta') return (t.t === 'grass' || t.t === 'stump') ? 'Klõpsa, et istutada puu (1 vesi).' : 'Siia ei saa istutada.';
  const kn = { kuusk: 'Kuusk', tume: 'Tume kuusk', kask: 'Kask', hobekask: 'Hõbekask', tamm: 'Iidne tamm' };
  switch (t.t) {
    case 'tree': return t.s < 3 ? `${kn[t.k]}, noor puu (${t.s + 1}/4 järku, ${Math.round(t.g * 100)}% järgmiseni).` : `${kn[t.k]}. Klõpsa, et langetada (+${Math.round((t.k === 'tamm' ? 11 : 5) * (1 + RATES.gather))} puitu).`;
    case 'stump': return 'Känd. Klõpsa koristamiseks või istuta siia uus puu.';
    case 'rock': return `Kivi (${t.c} kildu). Klõpsa, et raiuda.`;
    case 'rubble': return `Kivipuru. Uus kivi ${fmtTime(t.w)} pärast.`;
    case 'goldvein': return t.c > 0 ? `Kullasoon (${t.c} tükki). Klõpsa, et kaevandada.` : `Tühi kullasoon, täitub ${fmtTime(t.w)} pärast.`;
    case 'bush': return t.ripe ? 'Küpsed marjad. Klõpsa korjamiseks.' : `Marjad valmivad (${Math.round(t.g * 100)}%).`;
    case 'water': return 'Vesi. Klõpsa, et ämbriga vett tuua.';
    case 'chest': return 'Sammaldunud laegas! Klõpsa, et avada.';
    case 'relic': return 'Helendavad ruunid kivil. Klõpsa, et puudutada.';
    case 'crystal': return 'Helendav kristall. Klõpsa, et selle väge koguda.';
    case 'mushring': return t.w > 0 ? `Seentering puhkab (${fmtTime(t.w)}).` : 'Helendav seentering. Klõpsa, et haldjatelt kingitust küsida.';
    case 'oldstone': return 'Vana ruunikivi.';
    case 'cave': return 'Koopa sissepääs. Klõpsa, et minna ekspeditsioonile.';
    case 'b': { const b = getB(t.id); return b ? `${BUILD[b.type].n}, tase ${b.lvl}. Klõpsa, et avada.` : '' }
    default: return 'Vaba rohumaa. Siia saab ehitada või puu istutada.';
  }
}

/* ---------- boot ---------- */
let running = false, logicT = 0, panelT = 0, saveT = 0;
function showStart() {
  $('#game').hidden = true; $('#start').hidden = false; setTimeout(fitTitle, 0);
  const sv = loadSave();
  $('#contBox').hidden = !sv; $('#newDivider').hidden = !sv; $('#newNote').hidden = !sv;
  if (sv) { $('#btnContinue').textContent = 'Jätka: ' + sv.kingdom; $('#contInfo').textContent = `Valitseja ${sv.name} · tase ${sv.level} · päev ${Math.floor(sv.time / DAY) + 1}` }
}
function enterGame() {
  ensureAdventure(); if (typeof ensureFish === 'function') ensureFish(); setTimeout(() => { if (typeof pushScore === 'function') pushScore(true) }, 1500);
  $('#start').hidden = true; $('#game').hidden = false;
  RATES = computeRates();
  buildHUD(); renderRegionTabs(); UI.tab = 'ehita'; UI.tool = 'kogu'; UI.placing = null; UI.lastPanel = ''; renderTabs(true); renderPanel(true); $('#tabBody').scrollTop = 0;
  resizeMap(); spawnView(); setTool('kogu'); hudUpdate();
  running = true; logicT = performance.now();
}
function doNewGame() {
  const name = $('#playerName').value.trim() || 'Metsavalitseja', kingdom = $('#kingdomName').value.trim() || name + ' kuningriik';
  S = newState(name, kingdom); S.welcomed = true; save(); enterGame(); showModal(helpView());
}
$('#newForm').addEventListener('submit', e => {
  e.preventDefault();
  if (loadSave()) showModal(() => `<h2>Alusta uut mängu?</h2><p>Sinu praegune kuningriik kirjutatakse üle ja selle areng kaob jäädavalt.</p><div class="mbtns"><button class="btn ghost" type="button" data-act="closeModal">Loobu</button><button class="btn danger" type="button" data-act="confirmNew">Alusta uut</button></div>`);
  else doNewGame();
});
$('#btnContinue').addEventListener('click', () => {
  const sv = loadSave(); if (!sv) { showStart(); return }
  S = migrate(sv); enterGame();
  const away = (Date.now() - (S.last || Date.now())) / 1000;
  if (away > 30) { const g = catchUp(away); RATES = computeRates(); hudUpdate(); renderPanel(true); showOffline(g, away) }
  save();
});
setInterval(() => {
  if (!running || !S) return;
  const now = performance.now(); const dt = (now - logicT) / 1000; logicT = now;
  if (dt > 10) { const g = catchUp(dt); if (Object.keys(g.diff).length) showOffline(g, dt) } else tick(dt, false);
  hudUpdate();
  panelT += dt; saveT += dt;
  if (panelT >= 1) { panelT = 0; renderTabs(); renderPanel(); renderModal() }
  if (saveT >= 10) { saveT = 0; save() }
}, 250);
document.addEventListener('visibilitychange', () => { if (document.hidden) save() });
window.addEventListener('pagehide', save);
window.addEventListener('resize', () => { if (S && running) resizeMap() });
new ResizeObserver(() => { if (S && running) resizeMap() }).observe($('#mapWrap'));
window.claude?.hot?.snapshot?.(() => ({}));
function fitTitle() {
  const h = document.querySelector('.start h1'); if (!h || !h.clientWidth) return;
  let fs = 48; h.style.fontSize = fs + 'px';
  while (h.scrollWidth > h.clientWidth && fs > 18) { fs -= 1; h.style.fontSize = fs + 'px' }
}
window.addEventListener('resize', fitTitle);
if (document.fonts) { document.fonts.ready.then(fitTitle); document.fonts.addEventListener?.('loadingdone', fitTitle) }
showStart();
fitTitle();
requestAnimationFrame(frame);
requestAnimationFrame(startFrame);
