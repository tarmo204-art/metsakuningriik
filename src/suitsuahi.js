/* =====================================================================
   Suitsuahi: 10 arengutaset (igaühel oma välimus), 5 suitsutamisviisi, küttepuud ja maitseained,
   serveris kulgev taimeriga tootmine (töötab ka mängija eemalolekul), täiustused, eritooted,
   toodete galerii ja müük. Kõik kontrollid teeb server (smoke_* funktsioonid).
   ===================================================================== */
const SM = { d: null, at: 0, loading: false, busy: false, grp: null, method: 'kuum', wood: 'lepp', spices: [], qty: 3, special: null };
const SM_LV = ['Vana suitsunurk', 'Väike suitsuahi', 'Kaluri suitsuahi', 'Täiustatud suitsuahi', 'Kalameistri suitsuahi', 'Suur suitsukamber', 'Professionaalne suitsuahi', 'Kuninglik suitsuahi', 'Meisterlik suitsukoda', 'Legendaarne suitsukoda'];
const SM_METH = { kuum: ['Kuumsuits', 'Kiire: ~15 min. Parim lepapuuga.', '#c8842a'], maitse: ['Maitsesuits', '~40 min, väärtus ×1,4. Vajab 2 maitseainet ja maitseainete riiulit. Parim õunapuuga.', '#8a6a2a'],
  kulm: ['Külmsuits', '~2 h, väärtus ×1,6. Vajab soola. Parim tammega.', '#e0784a'], kuiv: ['Kuivatatud', '~3 h, väärtus ×1,8. Vajab tamme ja 2 soola.', '#6a4220'], premium: ['Premium', '~4 h, väärtus ×2,5. Vajab erimarinaadi ja premium-kambrit.', '#d8a020'] };
const SM_GRP = { sarg: 'Särg', raim: 'Räim', ahven: 'Ahven', latikas: 'Latikas', tuulehaug: 'Tuulehaug (nokkhaug)', haug: 'Haug', koha: 'Koha', forell: 'Forell', angerjas: 'Angerjas', lohe: 'Lõhe', muu: 'Muu kala' };
const SM_WOOD = ['kask', 'lepp', 'ounapuu', 'tamm'], SM_SPICE = ['sool', 'till', 'kuuslauk', 'pipar', 'maitsetaim', 'marinaad'];
const SM_PRICE = { kask: 3, lepp: 4, ounapuu: 8, tamm: 10, sool: 2, till: 3, kuuslauk: 4, pipar: 6, maitsetaim: 5 };
const SM_ICON = { kask: '🪵', lepp: '🪵', ounapuu: '🍎', tamm: '🌳', sool: '🧂', till: '🌿', kuuslauk: '🧄', pipar: '🌶️', maitsetaim: '🌱', marinaad: '🫙' };
const SM_WNAME = { kask: 'Kask', lepp: 'Lepp', ounapuu: 'Õunapuu', tamm: 'Tamm', sool: 'Sool', till: 'Till', kuuslauk: 'Küüslauk', pipar: 'Must pipar', maitsetaim: 'Maitsetaimed', marinaad: 'Erimarinaad' };

// --- suitsuahju pilt: iga tase näeb erinev välja ---
function smOven(l, burning) {
  const gold = l >= 8, steel = l === 7, brick = l >= 3 && l !== 7, house = l === 6 || l >= 9, glow = l === 10;
  const W = 320, G = 196, bw = [0, 90, 96, 120, 150, 170, 180, 170, 190, 210, 220][l], bh = [0, 40, 70, 84, 96, 104, 130, 112, 120, 130, 136][l], x0 = (W - bw) / 2, y0 = G - bh;
  let s = `<svg viewBox="0 0 ${W} 220" class="sm-oven" aria-hidden="true"><defs>
    <linearGradient id="smB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${steel ? '#aab4bc' : gold ? '#c8b89a' : '#b0583a'}"/><stop offset="1" stop-color="${steel ? '#5a646c' : gold ? '#8a7a5a' : '#6a2e1c'}"/></linearGradient>
    <linearGradient id="smW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a4426"/><stop offset=".5" stop-color="#8a5a34"/><stop offset="1" stop-color="#5a381e"/></linearGradient>
    <linearGradient id="smM" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3e42"/><stop offset=".5" stop-color="#7a8288"/><stop offset="1" stop-color="#2a2e32"/></linearGradient>
    <linearGradient id="smGd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6206"/><stop offset=".5" stop-color="#ffe7a0"/><stop offset="1" stop-color="#b8860b"/></linearGradient>
    <radialGradient id="smF"><stop offset="0" stop-color="#fff2a0"/><stop offset=".5" stop-color="#ff9a2a"/><stop offset="1" stop-color="#c83a10" stop-opacity="0"/></radialGradient>
    <pattern id="smBr" width="20" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill="none"/><path d="M0 9.5h20M10 0v4.5M0 4.5h20M0 5v4.5M20 5v4.5" stroke="rgba(0,0,0,.28)" stroke-width="1"/></pattern></defs>
    <ellipse cx="${W / 2}" cy="${G + 6}" rx="${bw * .7}" ry="9" fill="rgba(0,0,0,.35)"/>`;
  const chim = (cx, w, h, cap) => `<rect x="${cx - w / 2}" y="${y0 - h}" width="${w}" height="${h + 4}" fill="${steel ? 'url(#smM)' : 'url(#smB)'}" stroke="rgba(0,0,0,.4)"/>${brick && !steel ? `<rect x="${cx - w / 2}" y="${y0 - h}" width="${w}" height="${h}" fill="url(#smBr)"/>` : ''}<rect x="${cx - w / 2 - 3}" y="${y0 - h - 4}" width="${w + 6}" height="6" rx="1" fill="${cap || (steel ? '#4a5258' : '#5a2a18')}"/>`;
  const smoke = (cx, top) => burning ? `<g class="sm-smoke" style="--x:${cx}px">${[0, 1, 2, 3].map(i => `<circle cx="${cx}" cy="${top}" r="${7 + i * 2}" fill="${glow ? '#8af0e8' : '#cfd6d8'}" style="animation-delay:${i * .7}s"/>`).join('')}</g>` : '';
  if (glow) s += `<ellipse cx="${W / 2}" cy="${G - bh / 2}" rx="${bw * .75}" ry="${bh * .9}" fill="#8af0e8" opacity=".13" class="sm-rune"/><g fill="#bff8f0">${[[40, 60], [280, 50], [60, 150], [262, 140], [160, 20]].map(([x, y]) => `<path d="M${x} ${y - 6}l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" class="sm-rune"/>`).join('')}</g>`;
  let chims = [];
  if (l === 1) {
    // kivid ringis, kolmjalg ja rippuvad kalad
    s += [...Array(9)].map((_, i) => `<ellipse cx="${115 + i * 11}" cy="${G - 3}" rx="8" ry="6" fill="#7a7a72" stroke="#4a4a44"/>`).join('');
    s += `<path d="M120 ${G - 2} L160 ${G - 88} L200 ${G - 2}" stroke="#6a4426" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M135 ${G - 58} h50" stroke="#6a4426" stroke-width="3"/>`;
    s += [0, 1, 2].map(i => `<path d="M${145 + i * 15} ${G - 58} v6 c-4 2 -4 14 0 18 c4 -4 4 -16 0 -18" fill="#c8842a" stroke="#6a3a10"/>`).join('');
    if (burning) s += `<ellipse cx="160" cy="${G - 10}" rx="20" ry="12" fill="url(#smF)" class="sm-fire"/>`;
    s += smoke(160, G - 70);
  } else if (l === 2) {
    // väike tünnisuitsuahi jalgadel
    s += `<path d="M${x0 + 10} ${G} l8 -22 M${x0 + bw - 10} ${G} l-8 -22" stroke="#2a2e32" stroke-width="4"/>
      <rect x="${x0}" y="${y0 - 6}" width="${bw}" height="${bh - 16}" rx="16" fill="url(#smM)" stroke="#1a1e22" stroke-width="2"/>
      <path d="M${x0} ${y0 + 20} h${bw}" stroke="#1a1e22" stroke-width="2"/><rect x="${x0 + bw / 2 - 12}" y="${y0 + 4}" width="24" height="5" rx="2" fill="#6a4426"/>`;
    chims.push([x0 + bw - 18, 10, 30]);
  } else {
    if (house) {
      // puust/kivist suitsuhoone katusega
      const rx = x0 - 12, rw = bw + 24, ry = y0 - 30;
      s += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="${l >= 9 ? 'url(#smB)' : 'url(#smW)'}" stroke="rgba(0,0,0,.45)" stroke-width="2"/>${l >= 9 ? `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="url(#smBr)"/>` : [...Array(Math.floor(bw / 12))].map((_, i) => `<path d="M${x0 + i * 12} ${y0} v${bh}" stroke="rgba(0,0,0,.25)"/>`).join('')}
        <path d="M${rx} ${y0 + 2} L${W / 2} ${ry} L${rx + rw} ${y0 + 2} Z" fill="${l >= 9 ? '#5a2a20' : '#4a3a2a'}" stroke="rgba(0,0,0,.5)" stroke-width="2"/>
        ${l >= 9 ? [...Array(5)].map((_, i) => `<path d="M${rx + 10 + i * 6} ${y0 - 4 - i * 5} L${rx + rw - 10 - i * 6} ${y0 - 4 - i * 5}" stroke="rgba(255,255,255,.12)"/>`).join('') : ''}`;
      chims.push([x0 + bw * .75, 16, 46, gold ? 'url(#smGd)' : null]); if (l >= 9) chims.push([x0 + bw * .25, 14, 40, gold ? 'url(#smGd)' : null]);
    } else {
      s += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="${steel ? 10 : 4}" fill="url(#smB)" stroke="rgba(0,0,0,.45)" stroke-width="2"/>${!steel ? `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="url(#smBr)"/>` : ''}
        ${l >= 4 ? `<path d="M${x0 - 6} ${y0 + 2} h${bw + 12}" stroke="${gold ? 'url(#smGd)' : '#4a2418'}" stroke-width="7" stroke-linecap="round"/>` : ''}`;
      chims.push([x0 + bw * .78, 16, 40, gold ? 'url(#smGd)' : null]); if (l >= 5) chims.push([x0 + bw * .22, 13, 30, gold ? 'url(#smGd)' : null]);
      if (l === 5) s += `<rect x="${x0 + bw - 2}" y="${G - 44}" width="30" height="44" fill="url(#smB)" stroke="rgba(0,0,0,.45)"/><rect x="${x0 + bw - 2}" y="${G - 44}" width="30" height="44" fill="url(#smBr)"/>`;
    }
    // uks / kolle
    const dw = Math.min(70, bw * .42), dh = Math.min(64, bh * .6), dx = W / 2 - dw / 2, dy = G - dh - 8;
    s += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" rx="${l >= 4 ? 6 : 3}" fill="${l >= 4 ? 'url(#smM)' : '#3a2412'}" stroke="${gold ? '#e8b65a' : 'rgba(0,0,0,.6)'}" stroke-width="${gold ? 3 : 2}"/>`;
    if (burning) s += `<rect x="${dx + 8}" y="${dy + dh * .45}" width="${dw - 16}" height="${dh * .4}" rx="4" fill="url(#smF)" class="sm-fire"/>`;
    if (l >= 4) s += `<rect x="${dx + dw - 12}" y="${dy + dh / 2 - 3}" width="9" height="6" rx="2" fill="${gold ? '#ffd86a' : '#c8c8c8'}"/>`;
    if (l >= 4 && l !== 6) s += `<circle cx="${x0 + bw * .2}" cy="${y0 + 20}" r="9" fill="#f4f2ea" stroke="#3a3e42" stroke-width="2"/><path d="M${x0 + bw * .2} ${y0 + 20} l5 -4" stroke="#c83a2a" stroke-width="1.8"/>`;
    if (steel) s += `<path d="M${x0 + 10} ${y0 + 34} h24 M${x0 + 10} ${y0 + 42} h18" stroke="#2a3a40" stroke-width="3"/><circle cx="${x0 + bw - 22}" cy="${y0 + 20}" r="8" fill="#f4f2ea" stroke="#3a3e42" stroke-width="2"/><rect x="${x0 + bw - 30}" y="${y0 + 36}" width="16" height="10" rx="2" fill="${burning ? '#7fe0a0' : '#2a4a3a'}"/>`;
    if (gold) s += `<g transform="translate(${W / 2} ${y0 + 16})"><path d="M0 -12 L10 -8 L10 2 C10 9 5 12 0 14 C-5 12 -10 9 -10 2 L-10 -8 Z" fill="url(#smGd)" stroke="#6a4a10"/><text y="5" text-anchor="middle" font-size="11">🐟</text></g>`;
    if (l >= 8 && l !== 10) s += `<path d="M${x0 - 4} ${y0 + 10} v40 l8 -6 l8 6 v-40 z" fill="#8a2a2a" stroke="#e8b65a"/><path d="M${x0 + bw - 12} ${y0 + 10} v40 l8 -6 l8 6 v-40 z" fill="#8a2a2a" stroke="#e8b65a"/>`;
    if (l >= 9) s += `<circle cx="${x0 - 8}" cy="${G - 40}" r="6" fill="${burning ? '#ffd86a' : '#6a5a3a'}" class="${burning ? 'sm-lamp' : ''}"/><circle cx="${x0 + bw + 8}" cy="${G - 40}" r="6" fill="${burning ? '#ffd86a' : '#6a5a3a'}" class="${burning ? 'sm-lamp' : ''}"/>`;
    if (glow) s += `<g class="sm-rune" fill="none" stroke="#8af0e8" stroke-width="2">${[0, 1, 2, 3].map(i => `<path d="M${x0 + 18 + i * (bw - 36) / 3} ${y0 + 36} l6 -10 l6 10 l-6 10 z"/>`).join('')}</g>`;
  }
  chims.forEach(([cx, w, h, cap]) => { s += chim(cx, w, h, cap) });
  chims.forEach(([cx, , h]) => { s += smoke(cx, y0 - h - 6) });
  return s + '</svg>';
}
// suitsutoote pilt: kala kuju ja värv sõltub suitsutamisviisist
function smIc(grp, method, special, size) {
  const c = { kuum: ['#c8842a', '#7a4410'], kulm: ['#e8885a', '#a84a24'], maitse: ['#a8783a', '#5a3a14'], kuiv: ['#7a4a22', '#3a200a'], premium: ['#e0a030', '#8a5a08'] }[method] || ['#c8842a', '#7a4410'];
  const long = ['angerjas', 'tuulehaug'].includes(grp), s = size || 46;
  const body = long ? 'M4 24c10-6 30-8 52-3l8-5v16l-8-5c-22 5-42 3-52-3z' : 'M6 24c8-12 26-15 40-8l10-7v30l-10-7c-14 7-32 4-40-8z';
  return `<svg viewBox="0 0 64 48" width="${s}" height="${Math.round(s * .75)}" aria-hidden="true" class="sm-ic">${special ? '<circle cx="32" cy="24" r="23" fill="#ffd86a" opacity=".22"/>' : ''}
    <path d="${body}" fill="${c[0]}" stroke="${c[1]}" stroke-width="1.6"/><path d="M14 20c8 2 18 2 26 0M14 28c8-2 18-2 26 0" stroke="${c[1]}" stroke-opacity=".5" stroke-width="1.3" fill="none"/>
    ${method === 'maitse' ? '<g fill="#5a8a3a"><circle cx="20" cy="22" r="1.4"/><circle cx="28" cy="27" r="1.2"/><circle cx="34" cy="21" r="1.3"/></g>' : ''}
    ${method === 'premium' || special ? '<path d="M16 18c6-3 16-4 22-2" stroke="#fff4c8" stroke-width="1.6" fill="none" opacity=".8"/>' : ''}
    <circle cx="${long ? 9 : 12}" cy="23" r="1.6" fill="#1a0e04"/>${special ? '<path d="M52 6l1.6 3.4 3.4 1.6-3.4 1.6L52 16l-1.6-3.4L47 11l3.4-1.6z" fill="#ffe27a"/>' : ''}</svg>`;
}
function smQ(q) { return `<span class="sm-q" title="Kvaliteet ${q}/5">${'★'.repeat(q)}<i>${'★'.repeat(5 - q)}</i></span>` }
function smProd(id) { return (SM.d && SM.d.products || []).find(p => p.id === id) || { id, name: id, grp: 'muu', method: 'kuum' } }
function smHas(u) { return SM.d && SM.d.upg.includes(u) }
function smStock(k) { return (SM.d && SM.d.stock && SM.d.stock[k]) || 0 }
function smLeft(iso) { const ms = Date.parse(iso) - (Date.now() + (SM.off || 0)); if (ms <= 0) return 'valmis!'; const m = Math.floor(ms / 60000), h = Math.floor(m / 60), ss = Math.floor(ms / 1000) % 60; return h ? `${h} h ${String(m % 60).padStart(2, '0')} min` : `${m} min ${String(ss).padStart(2, '0')} s` }

async function smLoad(silent) {
  if (SM.loading) return; SM.loading = true; SM.at = Date.now();
  try { smSet(await rpc('smoke_state')) } catch (e) { if (!silent) toast('Suitsuahju ei õnnestunud laadida: ' + e.message, 'bad') }
  SM.loading = false; if (FV.open && FV.tab === 'kalurimaja') renderFV(true);
}
function smSet(d) {
  SM.d = d; SM.at = Date.now(); SM.off = Date.parse(d.now) - Date.now();
  if (d.auto_got) smTaken(d.auto_got, true);
  if (d.gift) toast('🎁 Kingitus suitsuahju avamiseks: 15 lepapuud, 10 kasepuud, 10 soola ja 5 tilli!', 'gold', 'gold');
}
function smSel() {
  const D = SM.d; let pid = SM.special || (SM.grp ? SM.grp + ':' + SM.method : null); const pr = pid ? smProd(pid) : null;
  return { pid, pr };
}
function smView() {
  if (!SM.d || Date.now() - SM.at > 45000) smLoad(true);
  if (!SM.d) return '<div class="fv-card"><p class="lead">Laen suitsuahju…</p></div>';
  const D = SM.d, l = D.lvl, B = D.batch, nx = D.next;
  const nextUnl = D.products.filter(p => p.min_lvl === l + 1 && (p.special || p.grp === 'ahven')).map(p => p.special ? p.name : SM_METH[p.method][0]);
  let h = `<div class="fv-card sm-hero"><div class="sm-ov ${l >= 8 ? 'gold' : ''}">${smOven(l, !!B)}</div><div class="sm-info">
    <small class="lead">Suitsuahi · tase ${l}/10</small><h2 style="margin:2px 0 6px">${SM_LV[l - 1]}</h2>
    <div class="sm-lv">${[...Array(10)].map((_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>
    <div class="kt-chips" style="margin-top:8px"><span class="kt-chip">🐟 Korraga ${D.cap} kala</span><span class="kt-chip">⏱ Aeg −${(l - 1) * 5 + (smHas('kytte') ? 20 : 0)}%</span><span class="kt-chip">✨ Kvaliteet +${l * 3 + (smHas('temp') ? 10 : 0)}</span></div>
    <div class="sm-wood">${SM_WOOD.map(w => `<span title="${SM_WNAME[w]}">${matIc(w, 22)}<b class="${smStock(w) ? '' : 'no'}">${smStock(w)}</b><small>${SM_WNAME[w]}</small></span>`).join('')}<button class="btn sm ghost" type="button" data-sm="goshop">🛒 Osta puid</button></div>
    ${l < 10 ? `<p class="lead" style="margin:8px 0 4px">Järgmine: <b>${SM_LV[l]}</b>${nextUnl.length ? ` – avaneb ${nextUnl.join(', ')}` : ''}</p>${ktCost(nx)}<button class="btn sm" type="button" data-sm="lvl" ${SM.busy ? 'disabled' : ''}>🔨 Täienda ahju</button>` : '<p class="lead">🏆 Legendaarne suitsukoda – kõrgeim tase!</p>'}</div></div>`;
  if (B) {
    const pr = smProd(B.product), tot = Date.parse(B.ready_at) - Date.parse(B.started_at), done = Date.parse(B.ready_at) <= Date.now() + (SM.off || 0);
    h += `<div class="fv-card sm-batch"><h2>🔥 Ahjus praegu</h2><div class="sm-brow">${smIc(pr.grp, pr.method, pr.special, 72)}<div><h3 style="margin:0">${B.out_qty || B.qty} × ${esc(pr.name)}</h3>${B.out_qty && B.out_qty > B.qty ? `<small class="lead">${B.qty} kalast – suured kalad annavad rohkem tooteid</small>` : ''}
      <div class="kt-chips" style="margin-top:4px"><span class="kt-chip">${SM_ICON[B.wood]} ${SM_WNAME[B.wood]}</span>${(B.spices || []).map(x => `<span class="kt-chip">${SM_ICON[x]} ${SM_WNAME[x]}</span>`).join('')}</div></div></div>
      <div class="kt-prog" style="margin-top:10px"><i data-smp="${B.started_at}|${B.ready_at}" style="width:${Math.min(100, (Date.now() + (SM.off || 0) - Date.parse(B.started_at)) / tot * 100).toFixed(1)}%"></i></div>
      <div class="kt-act" style="justify-content:space-between;margin-top:6px"><span class="bz-time">⏳ <b data-smt="${B.ready_at}">${smLeft(B.ready_at)}</b></span>
      ${done ? `<button class="btn" type="button" data-sm="take" ${SM.busy ? 'disabled' : ''}>🍽 Võta ahjust välja</button>` : smHas('auto') ? '<small class="lead">🤖 Automaatne taimer viib valmis toodangu ise lattu</small>' : '<small class="lead">Võid mängust lahkuda – suitsutamine jätkub.</small>'}</div></div>`;
  } else h += smBuilder();
  h += smShop() + smUpgs() + smGallery();
  h += `<div class="fv-card"><h2>🍳 Fileetooted</h2><p class="lead">Fileest valmistatavad tooted (klikkimisega).</p>${ktRecipes('ahi')}</div>`;
  return h;
}
function smBuilder() {
  const D = SM.d, l = D.lvl, { pid, pr } = smSel();
  const grps = Object.keys(SM_GRP), F = D.fish || {};
  let h = `<div class="fv-card sm-build"><h2>🐟 Uus suitsutamine</h2>
    <h3 class="sm-step"><b>1</b> Vali kala</h3><div class="sm-grps">${grps.map(g => { const n = (F[g] || {}).n || 0; return `<button type="button" class="sm-g ${SM.grp === g && !SM.special ? 'on' : ''} ${n ? '' : 'dim'}" data-sm="grp" data-arg="${g}">${smIc(g, SM.method, false, 40)}<b>${SM_GRP[g]}</b><small>${n} tk</small></button>` }).join('')}</div>
    <h3 class="sm-step" style="margin-top:10px">✨ Eriretseptid</h3><div class="sm-grps">${D.products.filter(p => p.special).map(p => { const lock = l < p.min_lvl || (p.need_upg && !smHas(p.need_upg)); const n = p.grp === 'legend' ? D.legend_n : ((F[p.grp] || {}).n || 0);
      return `<button type="button" class="sm-g sp ${SM.special === p.id ? 'on' : ''} ${lock ? 'lock' : ''}" data-sm="special" data-arg="${p.id}" ${lock ? 'disabled' : ''}>${lock ? '<span class="sm-lk">🔒</span>' : smIc(p.grp, p.method, true, 40)}<b>${esc(p.name)}</b><small>${lock ? `Tase ${p.min_lvl}${p.need_upg ? ' + täiustus' : ''}` : `${n} kala`}</small></button>` }).join('')}</div>`;
  if (!pid) return h + '<p class="lead" style="margin-top:10px">Vali kõigepealt kala või eriretsept.</p></div>';
  // 2. viis
  if (!SM.special) h += `<h3 class="sm-step" style="margin-top:12px"><b>2</b> Suitsutamise viis</h3><div class="sm-meths">${Object.keys(SM_METH).map(m => { const p = smProd(SM.grp + ':' + m), lock = l < p.min_lvl || (p.need_upg && !smHas(p.need_upg));
    return `<button type="button" class="sm-m ${SM.method === m ? 'on' : ''} ${lock ? 'lock' : ''}" data-sm="method" data-arg="${m}" ${lock ? 'disabled' : ''} style="--mc:${SM_METH[m][2]}"><b>${lock ? '🔒 ' : ''}${SM_METH[m][0]}</b><small>${lock ? `Avaneb tasemel ${p.min_lvl}${p.need_upg ? ' + ' + ((D.upgs.find(u => u.id === p.need_upg) || {}).name || '') : ''}` : SM_METH[m][1]}</small></button>` }).join('')}</div>`;
  else h += `<p class="lead" style="margin:10px 0 0">📜 ${esc(pr.descr)}</p>`;
  // 3. puu ja maitseained
  const req = pr.spices || {}, needW = pr.wood;
  h += `<h3 class="sm-step" style="margin-top:12px"><b>${SM.special ? 2 : 3}</b> Küttepuu ja maitseained</h3>
    <div class="sm-chips">${SM_WOOD.map(w => `<button type="button" class="sm-c ${SM.wood === w ? 'on' : ''} ${needW && needW !== w ? 'lock' : ''}" data-sm="wood" data-arg="${w}" ${needW && needW !== w ? 'disabled' : ''}>${SM_ICON[w]} ${SM_WNAME[w]} <i class="${smStock(w) ? '' : 'no'}">${smStock(w)}</i></button>`).join('')}</div>
    <div class="sm-chips" style="margin-top:6px">${SM_SPICE.map(x => `<button type="button" class="sm-c ${SM.spices.includes(x) ? 'on' : ''} ${req[x] ? 'req' : ''}" data-sm="spice" data-arg="${x}">${SM_ICON[x]} ${SM_WNAME[x]} <i class="${smStock(x) ? '' : 'no'}">${smStock(x)}</i></button>`).join('')}</div>
    ${smMissBox(pr)}
    <small class="lead">${needW ? `Retsept vajab puud: <b>${SM_WNAME[needW]}</b>. ` : ''}${Object.keys(req).length ? 'Vaja: ' + Object.entries(req).map(([k, v]) => k === 'maitse' ? '2 maitseainet' : k === 'berries' ? `${v} marja kala kohta (kuningriigist)` : `${SM_WNAME[k]}${v > 1 ? ' ×' + v : ''}`).join(', ') + '. ' : ''}Kulub 1 puu iga 3 kala ja 1 maitseaine iga 5 kala kohta.</small>`;
  // 4. kogus ja käivitus
  const have = SM.special && pr.grp === 'legend' ? D.legend_n : ((D.fish[pr.grp] || {}).n || 0), mx = Math.min(D.cap, have);
  SM.qty = Math.max(1, Math.min(SM.qty || 1, Math.max(1, mx)));
  const mins = ({ kuum: 15, maitse: 40, kulm: 120, kuiv: 180, premium: 240 }[pr.method]) * (1 + .04 * (SM.qty - 1)) * (1 - .05 * (D.lvl - 1)) * (smHas('kytte') ? .8 : 1);
  h += `<h3 class="sm-step" style="margin-top:12px"><b>${SM.special ? 3 : 4}</b> Kogus ja käivitamine</h3>
    <div class="sm-sum">${smIc(pr.grp, pr.method, pr.special, 64)}<div><b>${esc(pr.name)}</b><small>Hind ${fmt(pr.price)}–${fmt(Math.round(pr.price * 1.8))} kulda tk (sõltub kvaliteedist) · aega umbes ${mins >= 60 ? (mins / 60).toFixed(1).replace('.', ',') + ' h' : Math.round(mins) + ' min'}</small>
      <div class="kt-act" style="margin-top:6px"><span class="kt-step"><button type="button" data-sm="q-" aria-label="Vähem">−</button><b>${SM.qty}</b><button type="button" data-sm="q+" aria-label="Rohkem">+</button></span><small class="lead">sul on ${have} sobivat kala${(F0 => F0 && F0.amin != null ? ` (vanus ${fAgeTxt(+F0.amin).replace(' a', '')}–${fAgeTxt(+F0.amax)})` : '')(SM.special && pr.grp === 'legend' ? null : D.fish[pr.grp])} · ahju mahub ${D.cap} · suur kala annab kuni 2 toodet</small></div></div></div>
    <button class="btn sm-go" type="button" data-sm="start" ${!have || SM.busy ? 'disabled' : ''}>🔥 Käivita suitsutamine</button></div>`;
  return h;
}
// mis puudu on valitud koguse jaoks (puud ja maitseained)
function smMiss(pr) {
  const n = SM.qty || 1, req = pr.spices || {}, need = {}, miss = [];
  need[SM.wood] = Math.ceil(n / 3);
  SM.spices.forEach(x => { need[x] = (need[x] || 0) + Math.ceil(n / 5) * (req[x] || 1) });
  Object.keys(req).filter(k => SM_SPICE.includes(k) && !SM.spices.includes(k)).forEach(k => { need[k] = Math.ceil(n / 5) * req[k] });
  for (const [k, q] of Object.entries(need)) if (smStock(k) < q) miss.push([k, q - smStock(k)]);
  return miss;
}
function smMissBox(pr) {
  const miss = smMiss(pr); if (!miss.length) return '<div class="sm-okbox">✓ Küttepuud ja maitseained on olemas</div>';
  const buyable = miss.filter(([k]) => SM_PRICE[k]), cost = buyable.reduce((t, [k, q]) => t + SM_PRICE[k] * q, 0);
  return `<div class="sm-miss"><span>⚠️ Puudu: ${miss.map(([k, q]) => `<b>${q} × ${SM_WNAME[k]}</b>`).join(', ')}</span>
    ${buyable.length ? `<button class="btn sm" type="button" data-sm="buymiss" ${SM.busy || (SM.d.gold || 0) < cost ? 'disabled' : ''}>🛒 Osta puuduvad (${fmt(cost)} kulda)</button>` : ''}
    ${miss.some(([k]) => k === 'marinaad') ? '<small>Erimarinaadi valmistad allpool „Puuriit ja maitseainete riiul“ juures.</small>' : ''}</div>`;
}
function smShop() {
  const R = SM.d.res || {};
  return `<div class="fv-card"><h2>🪵 Puuriit ja 🧂 maitseainete riiul</h2><p class="lead">Küttepuud ja maitseained on eraldi kaup sinu laos. Puid saab ka ise lõhkuda kuningriigi puidust.</p>
    <div class="sm-shop">${[...SM_WOOD, ...SM_SPICE.filter(x => x !== 'marinaad')].map(k => `<div class="sm-it"><span class="sm-ii">${SM_ICON[k]}</span><div><b>${SM_WNAME[k]}</b><small>Laos ${smStock(k)} · ${SM_PRICE[k]} kulda tk</small></div>
      <div class="sm-bb"><button class="btn sm ghost" type="button" data-sm="buy" data-arg="${k}" data-n="1">+1</button><button class="btn sm ghost" type="button" data-sm="buy" data-arg="${k}" data-n="10">+10</button></div></div>`).join('')}
      <div class="sm-it"><span class="sm-ii">🪓</span><div><b>Lõhu puid</b><small>2 kuningriigi puitu → 1 lepp + 1 kask (sul on ${R.wood || 0} puitu)</small></div><div class="sm-bb"><button class="btn sm ghost" type="button" data-sm="buy" data-arg="lohu" data-n="5" ${(R.wood || 0) < 10 ? 'disabled' : ''}>×5</button><button class="btn sm ghost" type="button" data-sm="buy" data-arg="lohu" data-n="20" ${(R.wood || 0) < 40 ? 'disabled' : ''}>×20</button></div></div>
      <div class="sm-it ${smHas('riiul') ? '' : 'lock'}"><span class="sm-ii">🫙</span><div><b>Erimarinaad (laos ${smStock('marinaad')})</b><small>${smHas('riiul') ? '2 maitsetaime + 1 küüslauk + 3 marja' : '🔒 Vajab maitseainete riiulit'}</small></div><div class="sm-bb"><button class="btn sm ghost" type="button" data-sm="buy" data-arg="marinaad" data-n="1" ${smHas('riiul') ? '' : 'disabled'}>Valmista</button></div></div></div></div>`;
}
function smUpgs() {
  const D = SM.d;
  return `<div class="fv-card"><h2>🔧 Ahju täiustused</h2><div class="kt-grid">${D.upgs.map(u => { const own = smHas(u.id), lock = D.lvl < u.lvl;
    return `<div class="kt-card ${lock ? 'lock' : ''} ${own ? 'r3' : ''}"><h3 style="margin:0">${own ? '✓ ' : lock ? '🔒 ' : ''}${esc(u.name)}</h3><small class="lead">${esc(u.descr)}</small>
      ${own ? '<span class="pill ok">Paigaldatud</span>' : lock ? `<small class="lead">Vajab ahju ${u.lvl}. taset</small>` : `${ktCost(u)}<button class="btn sm" type="button" data-sm="upg" data-arg="${u.id}" ${SM.busy ? 'disabled' : ''}>🔧 Paigalda</button>`}</div>` }).join('')}</div></div>`;
}
function smGallery() {
  const D = SM.d, own = {}; (D.smoked || []).forEach(z => { own[z.product] = (own[z.product] || 0) + z.qty });
  const groups = Object.keys(SM_GRP);
  return `<div class="fv-card"><h2>🖼 Suitsutoodete galerii</h2><p class="lead">Kõik suitsutooted, mida saad valmistada. Värviline – avatud, hall – veel lukus. Number näitab, palju sul laos on.</p>
    <div class="sm-gal">${groups.map(g => `<div class="sm-gi"><b>${SM_GRP[g]}</b><div>${Object.keys(SM_METH).map(m => { const p = smProd(g + ':' + m), lock = D.lvl < p.min_lvl; return `<span class="${lock ? 'lock' : ''}" title="${esc(p.name)} – ${fmt(p.price)} kulda${lock ? ' (avaneb tasemel ' + p.min_lvl + ')' : ''}">${smIc(g, m, false, 38)}${own[p.id] ? `<i>${own[p.id]}</i>` : ''}</span>` }).join('')}</div></div>`).join('')}
      ${D.products.filter(p => p.special).map(p => { const lock = D.lvl < p.min_lvl; return `<div class="sm-gi sp ${lock ? 'lock' : ''}"><b>${esc(p.name)}</b><div><span>${smIc(p.grp, p.method, true, 54)}${own[p.id] ? `<i>${own[p.id]}</i>` : ''}</span><small class="lead">${lock ? `🔒 Tase ${p.min_lvl}` : `${'✦'.repeat(p.rarity - 2)} ${fmt(p.price)} kulda`}</small></div></div>` }).join('')}</div>
    ${(D.smoked || []).length ? `<h3 style="margin:14px 0 6px">📦 Laos</h3><div class="ka-log">${D.smoked.map(z => { const p = smProd(z.product); return `<div><span>${smIc(p.grp, p.method, p.special, 28)}</span><span><b>${z.qty} × ${esc(p.name)}</b><br>${smQ(z.quality)}</span><b>${fmt(z.value)} 🪙 tk</b></div>` }).join('')}</div>` : ''}</div>`;
}
function smTaken(t, auto) {
  if (!t) return; const p = smProd(t.product);
  showModal(() => `<div class="kt-res">${smIc(p.grp, p.method, t.special, 110)}<h2 style="margin:0">${auto ? '🤖 Automaatne taimer: ' : ''}Suitsukala on valmis!</h2>
    <p style="margin:0;font-size:18px"><b>${t.qty} × ${esc(t.name)}</b></p>${smQ(t.quality)}
    ${t.fails ? `<p style="margin:0;color:#ffb4a0">🔥 ${t.fails} kala kõrbes ära – suitsufilter aitaks.</p>` : ''}
    <p class="lead" style="margin:0">✨ +${t.xp} oskuse kogemust · ⭐ +${t.rep} mainet</p>
    <div class="mbtns" style="justify-content:center"><button class="btn" type="button" data-act="closeModal">Lõhnab imeliselt!</button></div></div>`, 'smmodal');
  if (typeof sfx === 'function') sfx(t.special ? 'levelup' : 'chime');
}
async function smAct(a, arg, n) {
  if (a === 'grp') { SM.grp = arg; SM.special = null; const p = smProd(arg + ':' + SM.method); if (SM.d.lvl < p.min_lvl || (p.need_upg && !smHas(p.need_upg))) SM.method = 'kuum'; smAuto(); renderFV(true); return }
  if (a === 'special') { SM.special = arg; SM.grp = null; smAuto(); renderFV(true); return }
  if (a === 'method') { SM.method = arg; smAuto(); renderFV(true); return }
  if (a === 'goshop') { const el = document.querySelector('.sm-shop'), fv = document.getElementById('fishView'); if (el && fv) fv.scrollTo({ top: el.getBoundingClientRect().top + fv.scrollTop - 120, behavior: 'smooth' }); return }
  if (a === 'wood') { SM.wood = arg; renderFV(true); return }
  if (a === 'spice') { SM.spices = SM.spices.includes(arg) ? SM.spices.filter(x => x !== arg) : [...SM.spices, arg]; renderFV(true); return }
  if (a === 'q+' || a === 'q-') { SM.qty = Math.max(1, (SM.qty || 1) + (a === 'q+' ? 1 : -1)); renderFV(true); return }
  if (SM.busy) return; SM.busy = true; renderFV(true);
  try {
    if (a === 'start') {
      const { pid } = smSel(); if (SM.special && SM.special.includes('marjaforell') || (smProd(pid).spices || {}).berries) { if (typeof cloudSave === 'function') await cloudSave(true) }
      const d = await rpc('smoke_start', { p_product: pid, p_qty: SM.qty, p_wood: SM.wood, p_spices: SM.spices }); smSet(d); await refreshFS();
      toast(`🔥 Ahi köeb! ${d.started.out || d.started.qty} × ${d.started.name} valmib umbes ${d.started.minutes >= 60 ? Math.round(d.started.minutes / 6) / 10 + ' tunniga' : d.started.minutes + ' minutiga'}.`, 'good'); if (typeof sfx === 'function') sfx('build');
    } else if (a === 'buymiss') {
      const { pr } = smSel(); let d;
      for (const [k, q] of smMiss(pr).filter(([k]) => SM_PRICE[k])) d = await rpc('smoke_buy', { p_item: k, p_qty: q });
      if (d) { smSet(d); await refreshFS(); toast('🛒 Puuduvad küttepuud ja maitseained ostetud!', 'good') }
    } else if (a === 'take') { const d = await rpc('smoke_take'); smSet(d); smTaken(d.taken) }
    else if (a === 'lvl' || a === 'upg') {
      if (typeof cloudSave === 'function') await cloudSave(true);
      const d = await rpc('smoke_upgrade', { p_what: a === 'lvl' ? 'lvl' : arg }); smSet(d); await refreshFS();
      if (d.spent && S && S.res) { if (d.spent.wood) S.res.wood = Math.max(0, S.res.wood - d.spent.wood); if (d.spent.stone) S.res.stone = Math.max(0, S.res.stone - d.spent.stone); save() }
      if (a === 'lvl') showModal(() => `<div class="kt-res"><div class="sm-ov big ${d.lvl >= 8 ? 'gold' : ''}">${smOven(d.lvl, true)}</div><h2 style="margin:0">🔥 ${SM_LV[d.lvl - 1]}!</h2><p class="lead" style="margin:0">Suitsuahi on nüüd tase ${d.lvl}: mahub ${d.cap} kala korraga ja töötab kiiremini.</p>
        ${(d.unlocked || []).length ? `<div class="sm-unl">${d.unlocked.map((x, i) => `<span style="animation-delay:${.3 + i * .25}s">🔓 ${esc(x)}</span>`).join('')}</div>` : ''}<div class="mbtns" style="justify-content:center"><button class="btn" type="button" data-act="closeModal">Suurepärane!</button></div></div>`, 'smmodal');
      else toast(`🔧 ${(d.upgs.find(u => u.id === arg) || {}).name} paigaldatud!`, 'good', 'gold');
      if (typeof sfx === 'function') sfx('levelup');
    } else if (a === 'buy') {
      if ((arg === 'lohu' || arg === 'marinaad') && typeof cloudSave === 'function') await cloudSave(true);
      const d = await rpc('smoke_buy', { p_item: arg, p_qty: +n || 1 }); smSet(d); await refreshFS();
      if (arg === 'lohu' && S && S.res) { S.res.wood = Math.max(0, S.res.wood - 2 * (+n || 1)); save() }
      if (arg === 'marinaad' && S && S.res) { S.res.berries = Math.max(0, S.res.berries - 3 * (+n || 1)); save() }
      toast(arg === 'lohu' ? `🪓 Lõhkusid puid: +${n} lepp ja +${n} kask` : arg === 'marinaad' ? '🫙 Erimarinaad valmis!' : `🛒 +${n} ${SM_WNAME[arg]}`, 'good');
    } else if (a === 'sell') { const [pid, q] = arg.split('|'); const d = await rpc('smoke_sell', { p_product: pid, p_quality: +q, p_qty: +n }); smSet(d); await refreshFS(); toast(`🪙 Müüdud ${d.sold.qty} × ${d.sold.name} – ${fmt(d.sold.gold)} kulda`, 'gold', 'gold') }
  } catch (e) { toast(e.message, 'bad') }
  SM.busy = false; KTK.at = 0; renderFV(true);
}
// vali automaatselt nõutud puu ja maitseained, mis laos olemas
function smAuto() {
  const { pr } = smSel(); if (!pr) return;
  if (pr.wood) SM.wood = pr.wood; else SM.wood = ({ kuum: 'lepp', kulm: 'tamm', kuiv: 'tamm', maitse: 'ounapuu', premium: 'ounapuu' }[pr.method] || 'lepp');
  if (!smStock(SM.wood) && !pr.wood) SM.wood = SM_WOOD.find(w => smStock(w)) || SM.wood;
  const req = pr.spices || {}; let sp = Object.keys(req).filter(k => SM_SPICE.includes(k));
  if (req.maitse) sp = sp.concat(['till', 'kuuslauk', 'pipar', 'maitsetaim'].filter(x => smStock(x)).slice(0, 2));
  SM.spices = [...new Set(sp)];
}
document.addEventListener('click', e => { const b = e.target.closest('[data-sm]'); if (!b || b.disabled) return; smAct(b.dataset.sm, b.dataset.arg, b.dataset.n) });
// Kalurimaja → Suitsuahi: uus suitsuahju vaade (töökoja 3. tasemest)
{
  const _kv = ktView;
  ktView = function () {
    if (KTK.sub === 'ahi' && KTK.d && !KTK.job) { if (KTK.d.proc.ws < 3) return ktHead() + ktLocked(3); return ktHead() + smView() }
    return _kv.apply(this, arguments);
  };
  // kalaletis ka suitsutooted
  const _kl = ktLett;
  ktLett = function () {
    let h = _kl.apply(this, arguments); if (!SM.d) { smLoad(true); return h }
    if (KTK.d.proc.ws < 5 || !(SM.d.smoked || []).length) return h;
    const bonus = 1 + 0.05 * KTK.d.proc.tier;
    return h + `<div class="fv-card"><h2>🐟 Suitsutooted müüki</h2><div class="kt-grid">${SM.d.smoked.map(z => { const p = smProd(z.product);
      return `<div class="kt-card"><div class="kt-row">${smIc(p.grp, p.method, p.special, 48)}<div><h3>${esc(p.name)} × ${z.qty}</h3>${smQ(z.quality)}<small>${fmt(Math.round(z.value * bonus))} kulda tk</small></div></div>
        <div class="kt-act"><button class="btn sm ghost" type="button" data-sm="sell" data-arg="${z.product}|${z.quality}" data-n="1">Müü 1</button><button class="btn sm" type="button" data-sm="sell" data-arg="${z.product}|${z.quality}" data-n="${z.qty}">Müü kõik (${fmt(Math.round(z.value * bonus * z.qty))} 🪙)</button></div></div>` }).join('')}</div></div>`;
  };
}
// taimer ja edenemine uuenevad iga sekund
setInterval(() => {
  let ready = false;
  document.querySelectorAll('[data-smt]').forEach(el => { const t = smLeft(el.dataset.smt); el.textContent = t; if (t === 'valmis!') ready = true });
  document.querySelectorAll('[data-smp]').forEach(el => { const [a, b] = el.dataset.smp.split('|').map(Date.parse); el.style.width = Math.min(100, (Date.now() + (SM.off || 0) - a) / (b - a) * 100).toFixed(1) + '%' });
  if (ready && !SM.readyShown && FV.open && FV.tab === 'kalurimaja') { SM.readyShown = true; SM.at = 0; smLoad(true) }
}, 1000);
// teade ja märk, kui suitsukala valmib
{
  const _b = fvBadges;
  fvBadges = function () { const b = _b(); if (FS && FS.smoke && FS.smoke.ready) b.kalurimaja = (b.kalurimaja || 0) + 1; return b };
  const _r = renderFV;
  renderFV = function () {
    const r = _r.apply(this, arguments);
    if (FS && FS.smoke && FS.smoke.ready && SM.toastAt !== FS.smoke.at) { SM.toastAt = FS.smoke.at; toast('🔥 Suitsukala on valmis! Võta see Kalurimaja suitsuahjust välja.', 'gold', 'gold') }
    if (!(FS && FS.smoke)) SM.readyShown = false;
    return r;
  };
}
// äripartnerite tellimused: suitsutoodete nimi ja pilt
{
  const _w = bzWant;
  bzWant = function (o) {
    const w = o.want; if (w.type !== 'smoked') return _w(o);
    const nm = (BZ.d && BZ.d.smoked_names && BZ.d.smoked_names[w.product]) || 'Suitsukala', chips = [];
    if (w.qmin) chips.push(`★ kvaliteet vähemalt ${w.qmin}`);
    return { pic: smIc(w.grp, w.method, false, 64), name: nm, chips, kind: 'Suitsutatud kala' };
  };
}
document.head.insertAdjacentHTML('beforeend', `<style>
.sm-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px;align-items:center}
.sm-ov{border-radius:16px;background:radial-gradient(120% 90% at 50% 100%,rgba(255,170,80,.18),transparent 60%),linear-gradient(180deg,#1a3a44,#0e2228);box-shadow:inset 0 0 0 1px rgba(134,205,224,.16);padding:8px}
.sm-ov.gold{box-shadow:inset 0 0 0 2px rgba(232,182,90,.5),0 0 22px rgba(232,182,90,.18)}
.sm-ov.big{width:min(80vw,360px)}
.sm-oven{width:100%;height:auto;display:block}
.sm-smoke circle{opacity:0;animation:smSmoke 2.8s ease-out infinite}
.sm-fire{animation:smFire .5s ease-in-out infinite alternate;transform-origin:center bottom;transform-box:fill-box}
.sm-lamp{animation:smFire 1.2s ease-in-out infinite alternate}
.sm-rune{animation:smRune 2.4s ease-in-out infinite}
.sm-lv{display:grid;grid-template-columns:repeat(10,1fr);gap:3px}.sm-lv i{height:8px;border-radius:3px;background:rgba(255,255,255,.1)}.sm-lv i.on{background:linear-gradient(90deg,#c8842a,#ffd27a)}
.sm-batch .sm-brow{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center}
.sm-batch .kt-prog i{background:linear-gradient(90deg,#c8582a,#ffb04a);transition:width 1s linear}
.sm-step{display:flex;align-items:center;gap:8px;font-size:15px;margin:6px 0}.sm-step b{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#e8b65a;color:#2a1a06;font-size:13px}
.sm-grps{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}
.sm-g{display:grid;justify-items:center;gap:2px;padding:8px 4px;border-radius:12px;border:1px solid rgba(134,205,224,.16);background:rgba(255,255,255,.04);color:#e6efec;font:inherit;cursor:pointer;text-align:center}
.sm-g b{font-size:12.5px;line-height:1.2}.sm-g small{font-size:11px;color:#a9c4c8}.sm-g.dim{opacity:.5}.sm-g.lock{opacity:.45;cursor:not-allowed}.sm-lk{font-size:24px;line-height:30px}
.sm-g.sp{border-color:rgba(232,182,90,.35)}
.sm-g.on{background:linear-gradient(180deg,#2f9a96,#1d6a6c);border-color:rgba(130,245,230,.75);box-shadow:0 0 14px rgba(70,208,198,.3)}
.sm-meths{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px}
.sm-m{display:grid;gap:2px;text-align:left;padding:9px 11px;border-radius:12px;border:1px solid rgba(134,205,224,.16);border-left:4px solid var(--mc);background:rgba(255,255,255,.04);color:#e6efec;font:inherit;cursor:pointer}
.sm-m small{font-size:11.5px;color:#a9c4c8;line-height:1.35}.sm-m.on{background:rgba(70,208,198,.16);border-color:rgba(130,245,230,.75);border-left-color:var(--mc)}.sm-m.lock{opacity:.5;cursor:not-allowed}
.sm-chips{display:flex;flex-wrap:wrap;gap:6px}
.sm-c{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;border:1px solid rgba(134,205,224,.18);background:rgba(0,0,0,.25);color:#e6efec;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.sm-c i{font-style:normal;font-size:11px;padding:1px 6px;border-radius:999px;background:rgba(255,255,255,.1)}
.sm-c i.no,.sm-wood b.no{background:rgba(220,80,60,.35);color:#ffd0c4}
.sm-wood{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}.sm-wood span{display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 4px;border-radius:999px;background:rgba(0,0,0,.25);font-size:12px}
.sm-wood b{padding:0 6px;border-radius:999px;background:rgba(255,255,255,.1)}.sm-wood small{color:#a9c4c8}
.sm-miss{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(220,110,60,.14);border:1px solid rgba(240,140,90,.4)}.sm-miss small{flex-basis:100%;color:#ffd8c0}
.sm-okbox{margin-top:8px;padding:6px 10px;border-radius:10px;background:rgba(80,200,140,.12);color:#b8f0d0;font-size:13px}
.sm-c.on{background:#2f9a96;border-color:rgba(130,245,230,.8)}.sm-c.req{box-shadow:inset 0 0 0 1px #e8b65a}.sm-c.lock{opacity:.4;cursor:not-allowed}
.sm-sum{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;padding:10px;border-radius:12px;background:rgba(0,0,0,.22)}
.sm-sum small{display:block;color:#a9c4c8;font-size:12.5px}
.sm-go{margin-top:10px;width:100%;font-size:16px}
.sm-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.sm-it{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.2)}
.sm-it.lock{opacity:.6}.sm-ii{font-size:22px;text-align:center}.sm-it small{display:block;color:#a9c4c8;font-size:11.5px}.sm-bb{display:flex;gap:4px}
.sm-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}
.sm-gi{padding:8px 10px;border-radius:12px;background:rgba(0,0,0,.2);display:grid;gap:4px}.sm-gi > b{font-size:13.5px}
.sm-gi > div{display:flex;align-items:center;gap:2px;flex-wrap:wrap}.sm-gi span{position:relative}.sm-gi span.lock{filter:grayscale(1) brightness(.5)}
.sm-gi span i{position:absolute;right:-2px;bottom:-2px;font-style:normal;font-size:10px;font-weight:800;padding:0 4px;border-radius:999px;background:#2f9a96}
.sm-gi.sp{border:1px solid rgba(232,182,90,.45);background:radial-gradient(120% 100% at 0% 0%,rgba(232,182,90,.16),rgba(0,0,0,.2))}.sm-gi.sp.lock{opacity:.55}
.sm-q{color:#ffd27a;letter-spacing:1px;font-size:13px}.sm-q i{font-style:normal;color:rgba(255,255,255,.18)}
.sm-unl{display:grid;gap:6px}.sm-unl span{padding:6px 12px;border-radius:999px;background:rgba(232,182,90,.16);color:#ffe0a0;font-weight:800;animation:ktIn .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes smSmoke{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:.55}100%{opacity:0;transform:translate(14px,-70px) scale(1.8)}}
@keyframes smFire{from{opacity:.75;transform:scaleY(.92)}to{opacity:1;transform:scaleY(1.06)}}
@keyframes smRune{0%,100%{opacity:.5}50%{opacity:1}}
@media (max-width:600px){.sm-hero{grid-template-columns:1fr}.sm-grps{grid-template-columns:repeat(3,minmax(0,1fr))}.sm-meths{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.sm-smoke circle,.sm-fire,.sm-lamp,.sm-rune{animation:none}.sm-smoke circle{opacity:.3}}
</style>`);
// laos: küttepuude ja maitseainete pildid
(() => {
  const log = (bark, ring, mark) => `<ellipse cx="24" cy="38" rx="17" ry="4" fill="rgba(0,0,0,.25)"/><rect x="6" y="18" width="34" height="16" rx="3" fill="${bark}"/>${mark || ''}<ellipse cx="40" cy="26" rx="5" ry="8" fill="${ring}" stroke="rgba(0,0,0,.35)"/><ellipse cx="40" cy="26" rx="2.2" ry="4" fill="none" stroke="rgba(0,0,0,.25)"/>
    <rect x="9" y="8" width="30" height="13" rx="3" fill="${bark}" opacity=".9"/><ellipse cx="39" cy="14.5" rx="4" ry="6.5" fill="${ring}" stroke="rgba(0,0,0,.35)"/>`;
  Object.assign(MAT_SVG, {
    kask: log('#e8e4da', '#e8c890', '<path d="M12 22h6M22 28h8M14 31h4M26 21h5" stroke="#2a2a2a" stroke-width="1.8"/>'),
    lepp: log('#7a5a3a', '#e89a5a'),
    ounapuu: log('#6a4a32', '#d8a870', '<circle cx="18" cy="13" r="4" fill="#d83a2a"/><path d="M18 9l1-3" stroke="#4a6a2a" stroke-width="1.5"/>'),
    tamm: log('#4a3420', '#c89a5a', '<path d="M10 22c4 3 8-2 12 1s8-2 12 1M10 29c4 3 8-2 12 1" stroke="rgba(0,0,0,.35)" fill="none"/>'),
    sool: '<path d="M14 18h20l-2 24H16z" fill="#e8eef2" stroke="#7a8a94" stroke-width="1.6"/><rect x="13" y="10" width="22" height="9" rx="3" fill="#9aa8b2"/><g fill="#5a6a74"><circle cx="19" cy="14" r="1"/><circle cx="24" cy="14" r="1"/><circle cx="29" cy="14" r="1"/></g><path d="M18 30h12" stroke="#c8d2d8" stroke-width="5"/>',
    till: '<path d="M24 44V14" stroke="#4a7a2a" stroke-width="2"/>' + [0, 1, 2, 3].map(i => `<path d="M24 ${16 + i * 7}c-6-3-10-2-14 0M24 ${16 + i * 7}c6-3 10-2 14 0" stroke="#7ab83a" stroke-width="1.6" fill="none"/>`).join('') + '<circle cx="24" cy="10" r="4" fill="#d8d84a" opacity=".85"/>',
    kuuslauk: '<path d="M24 8c-3 4-4 6-4 8c-8 2-12 10-10 18c3 8 25 8 28 0c2-8-2-16-10-18c0-2-1-4-4-8z" fill="#f2ece0" stroke="#a89a80" stroke-width="1.6"/><path d="M24 18v22M17 22c-2 6-1 12 2 17M31 22c2 6 1 12-2 17" stroke="#c8bca6" fill="none"/>',
    pipar: '<path d="M14 14h20v26a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#3a2a22" stroke="#1a100a" stroke-width="1.6"/><rect x="12" y="8" width="24" height="8" rx="2" fill="#8a8a8a"/><rect x="17" y="22" width="14" height="12" rx="2" fill="#e8dcc0"/><g fill="#1a1a1a"><circle cx="21" cy="27" r="1.6"/><circle cx="26" cy="29" r="1.6"/><circle cx="24" cy="25" r="1.3"/></g>',
    maitsetaim: '<path d="M10 34c4-12 10-16 14-18c4 2 10 6 14 18" fill="#4a8a3a" stroke="#2a5a1a" stroke-width="1.4"/><path d="M24 16v22" stroke="#2a5a1a"/><path d="M8 34h32l-3 9H11z" fill="#b8683a" stroke="#6a3a1a" stroke-width="1.4"/><circle cx="17" cy="24" r="3" fill="#6ab84a"/><circle cx="31" cy="24" r="3" fill="#6ab84a"/>',
    marinaad: '<rect x="12" y="14" width="24" height="28" rx="5" fill="rgba(200,120,60,.75)" stroke="#6a3a1a" stroke-width="1.6"/><rect x="14" y="8" width="20" height="7" rx="2" fill="#c89a3a"/><circle cx="20" cy="30" r="3" fill="#8a2a5a"/><circle cx="27" cy="34" r="2.6" fill="#8a2a5a"/><path d="M18 22c4 2 8 0 12 2" stroke="#4a8a3a" stroke-width="2" fill="none"/><path d="M16 18v20" stroke="rgba(255,255,255,.4)" stroke-width="2"/>'
  });
})();
// laos alati näha puuriit ja maitseained (ka siis, kui neid on 0)
{
  const _ld = ktLadu;
  ktLadu = function () {
    const h = _ld.apply(this, arguments); if (!KTK.d || KTK.d.proc.ws < 3) return h;
    const all = [...SM_WOOD, ...SM_SPICE], smN = k => SM.d ? smStock(k) : ktHave(k);
    return `<div class="sm-ladu"><h3 style="margin:0 0 6px">🪵 Küttepuud ja 🧂 maitseained</h3><div class="sm-chips">${all.map(k => `<span class="sm-c" style="cursor:default">${matIc(k, 22)} ${SM_WNAME[k]} <i class="${smN(k) ? '' : 'no'}">${smN(k)}</i></span>`).join('')}</div>
      <button class="btn sm" type="button" data-kt="sub" data-arg="ahi" style="margin-top:8px">🔥 Mine suitsuahju juurde ostma / lõhkuma</button></div>` + h;
  };
}
document.head.insertAdjacentHTML('beforeend', '<style>.sm-ladu{margin-bottom:12px;padding:10px;border-radius:12px;background:rgba(0,0,0,.2)}</style>');
