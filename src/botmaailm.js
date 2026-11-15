/* =====================================================================
   Järve kalurid igal pool: neil on oma kuningriik (edetabel, külastus, sõprusekingid),
   akvaarium (imetlemine), nädala retk; kalatund, kalaturg, geenilabori turg ja monument
   tulevad otse serverist. Server: bots_world, bot_gift_send, bot_aquarium_like (schema 6t).
   Tegelased on alati märgistatud ega võta päris mängijatelt preemiaid.
   ===================================================================== */
const BW = { d: null, at: 0, p: null, base: null };
document.head.insertAdjacentHTML('beforeend', `<style>
.jr-bots{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:12.5px}
.jr-bots > small{opacity:.8;margin-right:2px}
.jr-bots span{padding:4px 9px;border-radius:999px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.08);white-space:nowrap}
.jr-bots span.fin{border-color:rgba(255,210,122,.55);background:rgba(255,210,122,.12)}
</style>`);

async function bwLoad(force) {
  if (!CL.user || !BW.base) return BW.d;
  if (!force && BW.d && Date.now() - BW.at < 60000) return BW.d;
  if (BW.p) return BW.p;
  BW.p = (async () => { try { BW.d = await BW.base('bots_world'); BW.at = Date.now() } catch (e) { } BW.p = null; return BW.d })();
  return BW.p;
}
function bwIsBot(v) { return typeof v === 'string' && v.startsWith('bot:') }
function bwBot(id) { const k = String(id).replace(/^bot:/, ''); return (BW.d || []).find(b => b.bot === k) }

// tegelase kuningriik: sama metsamaa nagu mängijatel, hooned vastavalt tasemele (alati ühesugune, et külastus oleks tuttav)
function bwKingdom(b) {
  const seed = hashStr('bot:' + b.bot), rand = mulberry32(seed ^ 0x5bd1e995), lvl = b.k_level || 1;
  const tiles = genRegion('kodu', seed).tiles;
  const types = Object.keys(BUILD).filter(k => BUILD[k].lvl <= lvl);
  const n = Math.min(16, 3 + Math.floor(lvl * 0.7)), used = {}, buildings = [];
  const spots = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const t = tiles[y * W + x]; if (t.t === 'grass' || t.t === 'bush' || t.t === 'tree') spots.push([x, y, Math.hypot(x - 7.5, (y - 5) * 1.3) + rand() * 2.5 + (t.t === 'grass' ? 0 : 1.5)]) }
  spots.sort((a, c) => a[2] - c[2]);
  for (const [x, y] of spots) {
    if (buildings.length >= n) break;
    if (buildings.some(o => Math.abs(o.x - x) + Math.abs(o.y - y) < 2 && rand() < .55)) continue;
    const pool = types.filter(k => (used[k] || 0) < (BUILD[k].max || 99)); if (!pool.length) break;
    const type = buildings.length === 0 && pool.includes('loss') ? 'loss' : pool[Math.floor(rand() * pool.length)];
    used[type] = (used[type] || 0) + 1;
    buildings.push({ type, x, y, lvl: Math.max(1, Math.min(MAX_LVL, 1 + Math.floor(lvl / 5) - (rand() < .4 ? 1 : 0))) });
    tiles[y * W + x] = { t: 'b' };
  }
  const rk = typeof RANKS !== 'undefined' ? Math.min(RANKS.length - 1, Math.floor(lvl / 8)) : 0;
  return { user: 'bot:' + b.bot, bot: true, emoji: b.emoji, name: b.name, kingdom: b.kingdom, level: lvl, fame: b.k_fame, regions: b.k_regions, rank: rk,
    tiles, buildings, tamed: { janes: 1 + lvl % 3, lind: 2, hirv: lvl >= 8 ? 1 : 0, rebane: lvl >= 14 ? 1 : 0 }, relics: b.k_treasures, gifted: b.gifted, me: false };
}
function bwAquarium(b) {
  return { user: 'bot:' + b.bot, bot: true, emoji: b.emoji, name: b.name, kingdom: b.kingdom, title: 'Järve kalur', level: b.level, house: b.house, house_name: b.house_name,
    slots: b.slots, score: b.aq_score, likes: b.aq_likes, liked: b.liked, me: false, fish: b.aq || [] };
}
function bwMergeK(rows, bots) {
  rows.forEach((r, i) => r._pl = i + 1);
  if (!bots) return rows;
  const add = bots.map(b => ({ id: 'bot:' + b.bot, bot: true, emoji: b.emoji, name: b.name, kingdom: b.kingdom, level: b.k_level, fame: b.k_fame, regions: b.k_regions, treasures: b.k_treasures, me: false }));
  return rows.concat(add).sort((a, c) => c.level - a.level || c.fame - a.fame);
}
function bwMergeAq(rows, bots) {
  rows.forEach((r, i) => r._pl = i + 1);
  if (!bots) return rows;
  const add = bots.filter(b => (b.aq || []).length).map(b => ({ id: 'bot:' + b.bot, bot: true, emoji: b.emoji, name: b.name, kingdom: b.kingdom, title: 'Järve kalur', house: b.house, house_name: b.house_name, likes: b.aq_likes, score: b.aq_score, n: b.aq.length, me: false }));
  return rows.concat(add).sort((a, c) => c.score - a.score || c.likes - a.likes);
}
// kõik päringud, mis puudutavad tegelasi, suunatakse siit õigesse kohta (ülejäänud mäng ei pea teadma, kas tegu on tegelasega)
function bwInstall() {
  const base = rpc; BW.base = base;
  rpc = async function (fn, args) {
    args = args || {};
    const id = args.p_user;
    if (bwIsBot(id)) {
      if (fn === 'kingdom_visit') { await bwLoad(true); const b = bwBot(id); if (!b) throw new Error('Seda kuningriiki ei leitud'); return bwKingdom(b) }
      if (fn === 'fish_aquarium_view') { await bwLoad(true); const b = bwBot(id); if (!b) throw new Error('Seda akvaariumi ei leitud'); return bwAquarium(b) }
      if (fn === 'kingdom_gift_send') { const r = await base('bot_gift_send', { p_bot: id.slice(4) }); BW.at = 0; return r }
      if (fn === 'fish_aquarium_like') { const r = await base('bot_aquarium_like', { p_bot: id.slice(4) }); BW.at = 0; return r }
    }
    const r = await base(fn, args);
    if (fn === 'kingdom_leaderboard' && Array.isArray(r)) return bwMergeK(r, await bwLoad());
    if (fn === 'fish_aquariums' && Array.isArray(r)) return bwMergeAq(r, await bwLoad());
    return r;
  };
}
bwInstall();

// nädala retk: kus teised retkelised on
function bwJourneyLine() {
  if (!BW.d) { bwLoad().then(d => { if (d && FV.open && FV.tab === 'sundmused') renderFV(true) }); return '' }
  const bots = BW.d.filter(b => b.journey);
  if (!bots.length) return '';
  return `<div class="jr-bots"><small>Teised retkel ${duBotTag()}</small>${bots.map(b => { const j = b.journey, fin = j.done >= j.of;
    return `<span class="${fin ? 'fin' : ''}" title="${esc(b.name)}: ${j.done} peatust ${j.of}-st">${b.emoji} ${esc(b.name)} <b>${fin ? '🏁' : j.done + '/' + j.of}</b></span>` }).join('')}</div>`;
}
{
  const _jr = jrMapDraw;
  jrMapDraw = function (c, w, h, t) {
    _jr(c, w, h, t);
    const j = EV.d && EV.d.journey; if (!j || !BW.d) return;
    const n = j.legs.length, P = j.legs.map((l, i) => [w * (.08 + .84 * i / Math.max(1, n - 1)), h * (.55 + .22 * Math.sin(i * 1.7))]);
    const at = {};
    BW.d.forEach(b => { if (!b.journey) return; const k = Math.min(n - 1, Math.round(b.journey.done / b.journey.of * (n - 1))); (at[k] = at[k] || []).push(b) });
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const k in at) {
      const [x, y] = P[k], list = at[k];
      const cols = 4, sx = Math.min(x + w * .045, w - 12 - (Math.min(cols, list.length) - 1) * 17);
      list.forEach((b, i) => {
        const bx = sx + (i % cols) * 17, by = y + 6 + Math.floor(i / cols) * 18 + Math.sin(t * 1.6 + i) * 1.2;
        c.fillStyle = 'rgba(255,248,230,.95)'; c.beginPath(); c.arc(bx, by, 8.5, 0, 6.283); c.fill();
        c.strokeStyle = 'rgba(90,60,30,.55)'; c.lineWidth = 1; c.stroke();
        c.font = '11px system-ui'; c.fillText(b.emoji, bx, by + .5);
      });
    }
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  };
}
// kui tegelane saatis kingi, korja see kohe ära ja anna teada
{
  const _op = onPing;
  onPing = async function () {
    await _op();
    const g = ON.d && ON.d.gift;
    if (g && ON.giftShown !== g + (ON.d.now || '')) { ON.giftShown = g + (ON.d.now || ''); toast(`${g} saatis sulle sõprusekingi! 🎁`, 'gold', 'gold'); if (typeof claimInbox === 'function') setTimeout(() => claimInbox(), 600) }
  };
}
