/* =====================================================================
   Kaluri päev – meeldetuletus püügi lehe ülaosas
   24 tunni ketas (öö, Kalatund, ilmavahetused, kesköö, praegune aeg) + mis on tegemata + mis on tulemas.
   Kõik andmed tulevad juba laetud seisust (FS, FV, KT, SEC) – uusi serveripäringuid pole.
   ===================================================================== */
const REM = { open: true, playFrom: Date.now() };
try { REM.open = localStorage.getItem('mk.remOpen') !== '0' } catch (e) { }

document.head.insertAdjacentHTML('beforeend', `<style>
.rem{--rw:#0c222b;--rl:#2f6a84;--rf:#c8f2ff;--ra:#f2b552;--rv:#b48cff;--rg:#97d983;
  position:relative;overflow:hidden;border-radius:18px;border:1px solid rgba(134,205,224,.18);
  background:radial-gradient(140% 120% at 0% 0%,rgba(47,106,132,.35),transparent 55%),linear-gradient(180deg,#112d37,#0c222b);padding:14px;display:grid;gap:12px}
.rem-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:14px;align-items:center}
.rem-dial{width:132px;height:132px;display:block}
.rem.closed .rem-dial{width:64px;height:64px}
.rem-t{display:grid;gap:4px;min-width:0}
.rem-t h2{margin:0;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:24px;color:#f1ead2;letter-spacing:.01em}
.rem-t p{margin:0;color:#a9c6cf;font-size:14px;line-height:1.4}
.rem-t .live{display:inline-flex;gap:7px;align-items:center;color:#ffd286;font-weight:700}
.rem-t .live i{width:8px;height:8px;border-radius:50%;background:var(--ra);box-shadow:0 0 0 0 rgba(242,181,82,.7);animation:remPing 1.6s ease-out infinite}
.rem-tg{border:0;background:rgba(255,255,255,.06);color:#a9c6cf;border-radius:10px;padding:7px 10px;font-weight:700;font-size:13px;cursor:pointer;align-self:start}
.rem-tg:hover{background:rgba(255,255,255,.1);color:#fff}
.rem-tg:focus-visible,.rem-go:focus-visible{outline:2px solid var(--ra);outline-offset:2px}
.rem-body{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:18px}
.rem-sec{display:grid;gap:2px;align-content:start}
.rem-sec h3{margin:0 0 4px;font-size:13px;color:#7fa3ae;font-weight:600}
.rem-row{position:relative;display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 6px 8px 4px;border-bottom:1px solid rgba(134,205,224,.08);overflow:hidden}
.rem-row:last-child{border-bottom:0}
.rem-row .dot{width:8px;height:8px;border-radius:50%;background:var(--c)}
.rem-row .tx{display:grid;gap:3px;min-width:0;font-size:14px;color:#e4eef1;line-height:1.35}
.rem-row .tx small{color:#8fb0ba;font-size:12px}
.rem-bar{height:4px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;max-width:180px}
.rem-bar i{display:block;height:100%;border-radius:3px;background:var(--c)}
.rem-go{border:0;cursor:pointer;border-radius:9px;padding:6px 11px;font-weight:700;font-size:13px;background:rgba(255,255,255,.07);color:#e4eef1;white-space:nowrap}
.rem-go:hover{background:rgba(255,255,255,.13)}
.rem-row.claim .rem-go{background:linear-gradient(180deg,#ffd286,#e9a640);color:#2a1a05}
.rem-row.claim::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,214,140,.14) 50%,transparent 65%);transform:translateX(-100%);animation:remSheen 4.5s ease-in-out infinite}
.rem-row.hot .tx{color:#ffe2a0;font-weight:700}
.rem-more{border:0;background:none;color:#8fb0ba;font-size:13px;padding:6px 4px;text-align:left;cursor:pointer}
.rem-more:hover{color:#fff}
.rem-tl{position:relative;display:grid;gap:0;padding-left:2px}
.rem-ev{display:grid;grid-template-columns:62px 12px minmax(0,1fr);gap:8px;align-items:start;padding:6px 0}
.rem-ev time{font-variant-numeric:tabular-nums;color:#c8e4ec;font-weight:700;font-size:14px;text-align:right;line-height:1.3}
.rem-ev .pin{position:relative;width:12px;height:100%;min-height:22px}
.rem-ev .pin::before{content:"";position:absolute;left:5px;top:0;bottom:-12px;width:2px;background:rgba(134,205,224,.15)}
.rem-ev:last-child .pin::before{bottom:auto;height:10px}
.rem-ev .pin::after{content:"";position:absolute;left:2px;top:4px;width:8px;height:8px;border-radius:50%;background:var(--c);box-shadow:0 0 0 3px #0e2730}
.rem-ev .tx{font-size:14px;color:#e4eef1;line-height:1.35;display:grid;gap:2px}
.rem-ev .tx small{color:#8fb0ba;font-size:12px}
.rem-done{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:rgba(151,217,131,.1);color:#c8f0b8;font-size:14px}
/* ketas */
.rem-dial .hand{transform-origin:66px 66px;transform:rotate(var(--a))}
.rem-dial .prog{stroke-dasharray:var(--len);stroke-dashoffset:var(--off)}
.rem-dial .ktarc.live{animation:remGlow 2.2s ease-in-out infinite}
.rem.play .rem-dial .prog{animation:remDraw 1.1s cubic-bezier(.3,.7,.2,1) both;animation-delay:var(--el)}
.rem.play .rem-dial .hand{animation:remSweep 1.3s cubic-bezier(.25,.8,.25,1) both;animation-delay:var(--el)}
.rem.play .rem-dial .ticks{animation:remFade .9s ease-out both;animation-delay:var(--el)}
@keyframes remDraw{from{stroke-dashoffset:var(--len)}to{stroke-dashoffset:var(--off)}}
@keyframes remSweep{from{transform:rotate(0deg)}to{transform:rotate(var(--a))}}
@keyframes remFade{from{opacity:0}to{opacity:1}}
@keyframes remGlow{0%,100%{opacity:.75;filter:none}50%{opacity:1;filter:drop-shadow(0 0 5px rgba(255,200,100,.9))}}
@keyframes remPing{0%{box-shadow:0 0 0 0 rgba(242,181,82,.7)}80%,100%{box-shadow:0 0 0 9px rgba(242,181,82,0)}}
@keyframes remSheen{0%,55%{transform:translateX(-100%)}85%,100%{transform:translateX(100%)}}
@media (max-width:640px){.rem-body{grid-template-columns:1fr;gap:12px}.rem-dial{width:104px;height:104px}.rem-t h2{font-size:21px}}
@media (prefers-reduced-motion:reduce){.rem *,.rem *::after{animation:none!important}}
</style>`);

/* ---------- abifunktsioonid ---------- */
function remNow() { return Date.now() + ((typeof KT !== 'undefined' && KT.off) || 0) }
function remIn(ms) {
  if (ms <= 0) return 'kohe';
  const m = Math.round(ms / 60000); if (m < 1) return 'vähem kui minuti pärast'; if (m < 60) return `${m} min pärast`;
  const h = Math.floor(m / 60), r = m % 60; if (h < 24) return r ? `${h} h ${r} min pärast` : `${h} h pärast`;
  const d = Math.round(h / 24); return d === 1 ? 'homme' : `${d} päeva pärast`;
}
function remClock(t) {
  const d = new Date(t), n = new Date(remNow()), hm = d.toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tallinn' });
  const day = (x) => x.toLocaleDateString('et-EE', { timeZone: 'Europe/Tallinn' });
  if (day(d) === day(n)) return hm;
  const tm = new Date(n.getTime() + 864e5); if (day(d) === day(tm)) return hm === '00:00' ? 'kesköö' : 'homme';
  return d.toLocaleDateString('et-EE', { weekday: 'short', timeZone: 'Europe/Tallinn' });
}
function remTallinn(t) { const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Tallinn', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date(t)); return +p.find(x => x.type === 'hour').value + +p.find(x => x.type === 'minute').value / 60 }
function remMidnight() { const h = remTallinn(remNow()); return remNow() + (24 - h) * 36e5 }

/* ---------- mis on tegemata ---------- */
function remTodo() {
  const T = [], C = { fish: '#5ac8e8', gold: '#f2b552', sec: '#b48cff', warn: '#ff8a78' };
  let done = 0, total = 0;
  const add = (o) => T.push(o);
  const k = typeof KT !== 'undefined' ? KT.d : null;
  if (k && k.active) add({ c: C.gold, hot: true, t: 'Kalatund käib praegu', s: `Iga kala annab punkte ja teeb bossikalale kahju · lõpeb ${remIn(new Date(k.end) - remNow())}`, tab: 'kalatund', b: 'Ava' });
  if (k && k.unclaimed > 0) add({ c: C.gold, claim: true, t: 'Kalatunni auhind ootab', tab: 'kalatund', b: 'Võta' });
  if (FV.comps && ['big', 'rare', 'most'].some(x => { const c = FV.comps[x]; return c && !c.claimed && (c.last || []).some(r => r.me && r.place <= 3) })) add({ c: C.gold, claim: true, t: 'Võistluse auhind ootab', tab: 'voistlus', b: 'Võta' });
  if (FS.rod_broken) add({ c: C.warn, hot: true, t: 'Õng on katki', s: 'Paranda see allpool või vali poes teine õng', tab: 'puuk' });
  if (FV.quests) {
    const all = [...(FV.quests.daily || [])], ready = [...all, ...(FV.quests.weekly || [])].filter(q => !q.done && +q.progress >= +q.target).length, dn = all.filter(q => q.done).length;
    total += all.length; done += dn;
    if (ready) add({ c: C.gold, claim: true, t: ready === 1 ? 'Üks ülesanne on täidetud' : `${ready} ülesannet on täidetud`, tab: 'tellimus', b: 'Võta' });
    else if (dn < all.length) add({ c: C.fish, t: 'Päevaülesanded', s: `${dn} / ${all.length} tehtud`, p: dn / Math.max(1, all.length), tab: 'tellimus', b: 'Vaata' });
  }
  if (FV.orders) {
    const O = FV.orders, ready = O.filter(o => !o.done && o.have >= o.qty).length, dn = O.filter(o => o.done).length;
    total += O.length; done += dn;
    if (ready) add({ c: C.gold, claim: true, t: ready === 1 ? 'Kokk ootab tellimust' : `Kokk ootab ${ready} tellimust`, s: 'Kala on sul juba olemas', tab: 'tellimus', b: 'Vii kokale' });
    else if (dn < O.length) add({ c: C.fish, t: 'Kuningliku köögi tellimused', s: `${dn} / ${O.length} täidetud`, p: dn / Math.max(1, O.length), tab: 'tellimus', b: 'Vaata' });
  }
  if (FS.aq_pending >= 50) add({ c: C.gold, claim: true, t: `Akvaariumi külastajad jätsid ${fmt(FS.aq_pending)} kulda`, tab: 'maja', b: 'Võta' });
  const d = typeof SEC !== 'undefined' ? SEC.d : null;
  if (d) {
    if (d.visitor) { const a = (d.animals || []).find(x => x.id === d.visitor.id); add({ c: C.sec, hot: true, t: `${a ? a.name : 'Haruldane loom'} ootab sind`, s: `Lahkub ${remIn(new Date(d.visitor.until) - remNow())}`, tab: 'saladus', b: 'Ava' }) }
    if (d.ring_ready) add({ c: C.sec, claim: true, t: 'Pärija sõrmus ärkas', tab: 'saladus', b: 'Ava' });
    if (d.gift_ready) { total++; add({ c: C.sec, claim: true, t: 'Loomad tõid kingitused', tab: 'saladus', b: 'Võta' }) } else if ((d.animals || []).some(a => a.own)) { total++; done++ }
    if (d.cave_open) {
      const mx = d.lanterns_max || 3; total += mx; done += mx - d.lanterns;
      if (d.run) add({ c: C.sec, hot: true, t: 'Oled Kristallikoopas', s: `Sügavus ${d.run.depth} · saak ${fmt(d.run.gold)} kulda`, tab: 'saladus', b: 'Jätka' });
      else if (d.lanterns > 0) add({ c: C.sec, t: 'Kristallikoopa laternad', s: `${d.lanterns} / ${mx} alles`, p: (mx - d.lanterns) / mx, tab: 'saladus', b: 'Ava' });
    }
    const ca = d.castle || {}, bo = ca.boss || {};
    if (ca.open) {
      if (bo.claim > 0) add({ c: C.gold, claim: true, t: 'Kuninga Varju preemia ootab', tab: 'saladus', b: 'Võta' });
      if (!bo.killed) {
        const mx = bo.hits_max || 5; total += mx; done += mx - Math.max(0, bo.left);
        const weak = FS.weather === bo.weak;
        if (bo.left > 0) add({ c: C.sec, hot: weak, t: weak ? 'Kuninga Vari on praegu nõrk' : 'Kuninga Vari', s: `${bo.left} / ${mx} lööki alles${weak ? ' · löögid teevad topelt kahju' : ''}`, p: (mx - bo.left) / mx, tab: 'saladus', b: 'Löö' });
      }
    }
    if (d.chron) { total++; if (d.chron.done) done++; else add({ c: C.sec, t: 'Kalurite kroonika mõistatus', s: `${(d.chron.hints || []).length} / 3 vihjet avatud`, tab: 'saladus', b: 'Loe' }) }
  }
  if (typeof S !== 'undefined' && S && S.daily && typeof dailyState === 'function') { const dd = dailyState(); total++; if (dd.can) add({ c: C.gold, claim: true, hot: true, act: 'daily', t: 'Päevapreemia ootab', s: dd.streakNext > 1 ? `${dd.streakNext}. päev järjest` + (typeof FDAY !== 'undefined' && FDAY.d && FDAY.d.can ? ' · koos kalapüügi boonusega' : '') : 'Alusta uut seeriat', b: 'Võta' }); else done++ }
  // tähtsamad ette: praegu toimuv, siis preemiad, siis muu
  T.sort((a, b) => (b.hot ? 2 : 0) + (b.claim ? 1 : 0) - (a.hot ? 2 : 0) - (a.claim ? 1 : 0));
  return { T, done, total };
}

/* ---------- mis on tulemas ---------- */
function remSoon() {
  const E = [], n = remNow(), k = typeof KT !== 'undefined' ? KT.d : null, d = typeof SEC !== 'undefined' ? SEC.d : null;
  if (k && !k.active && k.next) E.push({ t: new Date(k.next).getTime(), c: '#f2b552', x: 'Kalatund algab', s: 'Tund aega ühist püüki ja bossikala' });
  if (k && k.active) E.push({ t: new Date(k.end).getTime(), c: '#f2b552', x: 'Kalatund lõpeb', s: 'Auhinnad saab võtta pärast lõppu' });
  const wx = Math.ceil(n / 108e5) * 108e5, bo = d && d.castle && d.castle.open && d.castle.boss;
  E.push({ t: wx, c: '#86cde0', x: 'Ilm vahetub', s: bo && !bo.killed ? `Kuninga Vari kardab ${(typeof SEC_WEAK !== 'undefined' && SEC_WEAK[bo.weak] ? SEC_WEAK[bo.weak][1] : bo.weak)}` : 'Mõni kala ujub ainult kindla ilmaga' });
  const nightAt = (() => { const h = remTallinn(n); return h >= 21 || h < 5 ? null : n + (21 - h) * 36e5 })();
  if (nightAt) E.push({ t: nightAt, c: '#7c8fd6', x: 'Öö algab', s: 'Öösel näkkavad öökalad' });
  E.push({ t: remMidnight(), c: '#97d983', x: 'Uus päev', s: 'Uued tellimused, ülesanded' + (d && d.cave_open ? ', laternad' : '') + (bo ? ', löögid' : '') + (typeof S !== 'undefined' && S && S.daily && typeof dailyState === 'function' && !dailyState().can ? ' ja päevapreemia' : '') });
  if (d && d.chron && !d.chron.done && d.chron.stage < 3) {
    const wk = new Date(d.chron.week + 'T00:00:00+02:00').getTime(), at = wk + (d.chron.stage === 1 ? 2 : 4) * 864e5;
    if (at > n) E.push({ t: at, c: '#b48cff', x: 'Kroonika uus vihje', s: d.chron.stage === 1 ? 'Selgub koht' : 'Selgub kala nimi' });
  }
  return E.filter(e => e.t > n).sort((a, b) => a.t - b.t).slice(0, 5);
}

/* ---------- 24 tunni ketas ---------- */
function remDial(left, done, total, small) {
  const C = 66, R = 56, rIn = 42, n = remNow(), h = remTallinn(n), k = typeof KT !== 'undefined' ? KT.d : null;
  const pt = (hr, r) => { const a = (hr / 24) * 2 * Math.PI - Math.PI / 2; return [C + r * Math.cos(a), C + r * Math.sin(a)] };
  const arc = (h0, h1, r) => { const [x0, y0] = pt(h0, r), [x1, y1] = pt(h1, r), big = ((h1 - h0 + 24) % 24) > 12 ? 1 : 0; return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}` };
  const ktH = k && k.hour != null ? +k.hour : 20, len = 2 * Math.PI * rIn, frac = total ? Math.min(1, done / total) : 0;
  let ticks = '';
  for (let i = 0; i < 24; i++) { const [x0, y0] = pt(i, R + 6), [x1, y1] = pt(i, R + (i % 6 ? 3 : 1)); ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="rgba(200,242,255,${i % 6 ? .25 : .55})" stroke-width="${i % 6 ? 1 : 1.6}"/>` }
  for (let i = 0; i < 24; i += 3) { const [x, y] = pt(i, R - 7); ticks += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="rgba(134,205,224,.55)"/>` }
  const [sx, sy] = pt(0, R + 10), [hx, hy] = pt(h, R + 2);
  return `<svg class="rem-dial" viewBox="0 0 132 132" role="img" aria-label="Täna on veel ${left} asja teha. Kell on ${new Date(n).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tallinn' })}.">
    <defs><linearGradient id="remPg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8f2ff"/><stop offset="1" stop-color="#5ac8e8"/></linearGradient>
      <radialGradient id="remFace" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#1d4656"/><stop offset="1" stop-color="#0d2630"/></radialGradient></defs>
    <circle cx="${C}" cy="${C}" r="${R}" fill="url(#remFace)" stroke="rgba(134,205,224,.18)"/>
    <path d="${arc(21, 5, R)}" fill="none" stroke="#2a3f86" stroke-width="8" opacity=".95"/>
    <path class="ktarc ${k && k.active ? 'live' : ''}" d="${arc(ktH, ktH + 1, R)}" fill="none" stroke="#f2b552" stroke-width="8" stroke-linecap="butt"/>
    <g class="ticks">${ticks}<text x="${sx.toFixed(1)}" y="${(sy + 3).toFixed(1)}" text-anchor="middle" font-size="8" fill="#97d983">✦</text></g>
    <circle cx="${C}" cy="${C}" r="${rIn}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="5"/>
    <circle class="prog" cx="${C}" cy="${C}" r="${rIn}" fill="none" stroke="url(#remPg)" stroke-width="5" stroke-linecap="round" transform="rotate(-90 ${C} ${C})" style="--len:${len.toFixed(1)};--off:${(len * (1 - frac)).toFixed(1)}"/>
    <g class="hand" style="--a:${(h / 24 * 360).toFixed(2)}deg"><line x1="${C}" y1="${C - rIn + 4}" x2="${C}" y2="${C - R - 2}" stroke="#ffe2a0" stroke-width="2" stroke-linecap="round"/><circle cx="${C}" cy="${C - R - 2}" r="3.2" fill="#ffe2a0" style="filter:drop-shadow(0 0 4px rgba(255,214,140,.9))"/></g>
    ${small ? '' : `<text x="${C}" y="${C + 7}" text-anchor="middle" font-size="30" font-family="Georgia,serif" fill="${left ? '#f1ead2' : '#97d983'}">${left || '✓'}</text>
    <text x="${C}" y="${C + 20}" text-anchor="middle" font-size="8.5" fill="#8fb0ba">${left ? 'teha' : 'valmis'}</text>`}
    ${small ? `<text x="${C}" y="${C + 9}" text-anchor="middle" font-size="26" font-family="Georgia,serif" fill="${left ? '#f1ead2' : '#97d983'}">${left || '✓'}</text>` : ''}
  </svg>`;
}

/* ---------- paneel ---------- */
function remHtml() {
  if (!FS) return '';
  const { T, done, total } = remTodo(), E = remSoon(), left = T.length, k = typeof KT !== 'undefined' ? KT.d : null;
  const el = Math.min(0, REM.playFrom - Date.now()), play = Date.now() - REM.playFrom < 1500;
  const lead = k && k.active ? `<span class="live"><i></i>Kalatund käib – lõpeb ${remIn(new Date(k.end) - remNow())}</span>`
    : left ? `Täna on veel ${left === 1 ? 'üks asi' : left + ' asja'} teha.` : 'Kõik tänased asjad on tehtud. Head püüki!';
  const next = E[0];
  let h = `<section class="rem ${REM.open ? '' : 'closed'} ${play ? 'play' : ''}" style="--el:${el}ms" aria-label="Kaluri päev">
    <div class="rem-head">${remDial(left, done, total, !REM.open)}
      <div class="rem-t"><h2>Kaluri päev</h2><p>${lead}</p>${!REM.open && next ? `<p>${esc(next.x)} ${remIn(next.t - remNow())}</p>` : ''}</div>
      <button class="rem-tg" type="button" data-rem="toggle" aria-expanded="${REM.open}">${REM.open ? 'Peida' : 'Näita'}</button></div>`;
  if (REM.open) {
    const showAll = REM.all, rows = showAll ? T : T.slice(0, 5);
    h += `<div class="rem-body"><div class="rem-sec"><h3>Tegemata</h3>${rows.length ? rows.map(r => `<div class="rem-row ${r.claim ? 'claim' : ''} ${r.hot ? 'hot' : ''}" style="--c:${r.c}"><span class="dot"></span>
        <div class="tx"><span>${esc(r.t)}</span>${r.s ? `<small>${esc(r.s)}</small>` : ''}${r.p != null ? `<div class="rem-bar"><i style="width:${Math.round(r.p * 100)}%"></i></div>` : ''}</div>
        ${r.act ? `<button class="rem-go" type="button" data-daily="open">${r.b || 'Ava'}</button>` : r.tab && r.tab !== FV.tab ? `<button class="rem-go" type="button" data-fa="tab" data-arg="${r.tab}">${r.b || 'Ava'}</button>` : '<span></span>'}</div>`).join('')
        : `<div class="rem-done">🎣 Kõik on tehtud. Nüüd on hea aeg lihtsalt püüda.</div>`}
        ${T.length > 5 ? `<button class="rem-more" type="button" data-rem="all">${showAll ? 'Näita vähem' : `Näita veel ${T.length - 5}`}</button>` : ''}</div>
      <div class="rem-sec"><h3>Tulemas</h3><div class="rem-tl">${E.map(e => `<div class="rem-ev" style="--c:${e.c}"><time>${remClock(e.t)}</time><span class="pin"></span><div class="tx"><span>${esc(e.x)} <small>${remIn(e.t - remNow())}</small></span><small>${esc(e.s)}</small></div></div>`).join('')}</div></div></div>`;
  }
  return h + '</section>';
}

{
  const basePuuk = tabPuuk;
  tabPuuk = function () { let r = ''; try { r = remHtml() } catch (e) { } return r + basePuuk() };
  const baseOpen = openFishView;
  openFishView = async function (tab) { REM.playFrom = Date.now(); return baseOpen(tab) };
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-rem]'); if (!el) return;
  if (el.dataset.rem === 'toggle') { REM.open = !REM.open; if (REM.open) REM.playFrom = Date.now(); try { localStorage.setItem('mk.remOpen', REM.open ? '1' : '0') } catch (er) { } }
  if (el.dataset.rem === 'all') REM.all = !REM.all;
  renderFV(true);
});
// kellaajad ja osuti püsivad värsked ka siis, kui midagi muud ei muutu
setInterval(() => { if (FV.open && FV.tab === 'puuk' && (FV.phase === 'idle' || FV.phase === 'result') && !FV.busy) renderFV() }, 60000);
