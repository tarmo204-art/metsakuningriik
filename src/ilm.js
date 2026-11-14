/* =====================================================================
   Ilmajaam: aastaaeg, õhu- ja veetemperatuur, õhurõhk ja selle muutus, ilmateade 12 tunniks
   ning iga kala aktiivsus praeguses kohas (server weather_state, fx_act – mõjutab päriselt püüki).
   ===================================================================== */
const WX = { d: null, loading: false, key: '', open: true, objs: [], raf: 0 };
try { const v = localStorage.getItem('mk.wxOpen'); WX.open = v === null ? innerWidth > 720 : v !== '0' } catch (e) { WX.open = innerWidth > 720 }
const WX_IC = { paike: ['☀️', 'Päike'], pilves: ['☁️', 'Pilves'], vihm: ['🌧️', 'Vihm'], udu: ['🌫️', 'Udu'], torm: ['⛈️', 'Äike ja torm'] };
const WX_SEASON = { talv: '❄️ Talv', kevad: '🌱 Kevad', suvi: '🌻 Suvi', 'sügis': '🍂 Sügis' };
const WX_PREF = { cold: ['❄️', 'külma vee kala', 'parim vesi 2–10 °C'], cool: ['🌊', 'jahedama vee kala', 'parim vesi 8–20 °C'], warm: ['☀️', 'sooja vee kala', 'parim vesi 18–26 °C'] };

document.head.insertAdjacentHTML('beforeend', `<style>
.wx{border-radius:18px;margin-bottom:12px;overflow:hidden;border:1px solid rgba(140,210,230,.22);background:linear-gradient(180deg,rgba(18,52,66,.9),rgba(8,26,34,.95))}
.wx-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 14px;cursor:pointer;user-select:none}
.wx-bar .big{font-size:26px}
.wx-bar .t{display:grid;gap:1px;flex:1 1 200px}
.wx-bar .t b{font-size:15px}.wx-bar .t small{opacity:.85}
.wx-chip{padding:4px 10px;border-radius:999px;font-weight:800;font-size:12.5px;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.12);white-space:nowrap}
.wx-chip.hot{background:rgba(255,120,60,.2);border-color:rgba(255,140,80,.55)}
.wx-chip.storm{background:rgba(255,200,60,.2);border-color:#ffc83a;animation:wxBlink 1.8s ease-in-out infinite}
@keyframes wxBlink{50%{box-shadow:0 0 14px rgba(255,200,60,.6)}}
.wx-body{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:12px;padding:0 14px 14px}
.wx-ins canvas{display:block;width:100%;height:190px;border-radius:14px;background:radial-gradient(120% 120% at 30% 0%,#1e4a5c,#0a1c24)}
.wx-fc{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}
.wx-fc div{display:grid;justify-items:center;gap:1px;padding:6px 2px;border-radius:12px;background:rgba(0,0,0,.25);font-size:12px}
.wx-fc div.st{background:rgba(255,200,60,.16);border:1px solid rgba(255,200,60,.5)}
.wx-fc i{font-style:normal;font-size:20px}.wx-fc b{font-size:13px}
.wx-act{display:grid;gap:5px;align-content:start}
.wx-act h4{margin:0 0 2px;font-size:14px}
.wx-row{display:grid;grid-template-columns:62px minmax(0,1fr) 92px;gap:8px;align-items:center;padding:5px 8px;border-radius:10px;background:rgba(0,0,0,.2)}
.wx-row canvas{width:62px;height:28px}
.wx-row b{font-size:13px}.wx-row small{display:block;font-size:11.5px;opacity:.8;line-height:1.3}
.wx-meter{height:8px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden}.wx-meter i{display:block;height:100%;border-radius:5px}
.wx-lv{font-size:12px;font-weight:800;text-align:right}
@media (max-width:720px){.wx-body{grid-template-columns:1fr}.wx-row{grid-template-columns:52px minmax(0,1fr) 78px}.wx-row canvas{width:52px}}
@media (prefers-reduced-motion:reduce){.wx-chip.storm{animation:none}}
</style>`);

/* ---------- andmed ---------- */
function wxKey() { return (FV.spot || '') + '|' + Math.floor(Date.now() / 600000) }
async function wxLoad() {
  if (WX.loading || !CL.user) return; WX.loading = true; WX.key = wxKey();
  try { WX.d = await rpc('weather_state', { p_spot: FV.spot || 'metsajarv' }) } catch (e) { }
  WX.loading = false; if (FV.open && FV.tab === 'puuk') renderFV(true);
}
function wxName(w, night) { return w === 'paike' && night ? ['🌙', 'Selge'] : WX_IC[w] || ['🌤️', w] }
function wxDeg(v) { v = +v; return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1).replace('.', ',') + ' °C' }
function wxLevel(a) { return a < .55 ? ['💤', 'loid', '#6a8aa0'] : a < .85 ? ['😐', 'vaikne', '#8ab0b8'] : a < 1.15 ? ['🙂', 'tavaline', '#9fd0a0'] : a < 1.45 ? ['😃', 'aktiivne', '#ffd27a'] : ['🔥', 'väga aktiivne', '#ff8a4a'] }
// miks kala on aktiivne või loid (sama loogika mis serveris fx_act)
function wxWhy(x, d) {
  const r = [], w = +d.water, t = x.tags || [];
  if (x.pref === 'cold') r.push(w < 10 ? 'külm vesi meeldib' : w > 15 ? 'vesi on liiga soe' : '');
  if (x.pref === 'warm') r.push(w < 12 ? 'vesi on liiga külm' : w > 18 ? 'soe vesi meeldib' : '');
  if (x.pref === 'cool') r.push(w < 4 ? 'vesi on väga külm' : w > 22 ? 'vesi on väga soe' : '');
  if (d.prestorm) r.push('enne tormi sööb ahnelt');
  if (d.weather === 'vihm' && t.includes('rain')) r.push('vihm uhub vette toitu');
  if (d.weather === 'paike' && !d.night) r.push(t.includes('sun') ? 'nautib päikest' : 'päike ajab sügavale');
  if ((d.weather === 'udu' || d.weather === 'pilves') && t.includes('dim')) r.push('hämaras julgem');
  if (d.weather === 'torm') r.push(t.includes('pred') ? 'torm ei häiri jahti' : 'torm hirmutab');
  if ((d.daypart === 'hommik' || d.daypart === 'õhtu') && t.includes('pred')) r.push(d.daypart === 'hommik' ? 'koidiku jahiaeg' : 'videviku jahiaeg');
  if (d.daypart === 'öö') r.push(t.includes('night') ? 'öine kala' : 'öösel loid');
  if (d.daypart === 'päev' && t.includes('pred')) r.push('keskpäeval vaiksem');
  return r.filter(Boolean).slice(0, 2).join(', ') || 'tavaline päev';
}

/* ---------- näidikud ---------- */
function wxInsDraw(c, w, h, t) {
  const d = WX.d; if (!d) return;
  // termomeetrid: õhk ja vesi (−20 … +30)
  const th = (x, v, lab, col) => { const top = 26, bot = h - 42, k = Math.max(0, Math.min(1, (+v + 20) / 50)), y = bot - (bot - top) * k;
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.roundRect ? c.roundRect(x - 7, top - 6, 14, bot - top + 10, 7) : c.rect(x - 7, top - 6, 14, bot - top + 10); c.fill();
    c.beginPath(); c.arc(x, bot + 9, 12, 0, 6.283); c.fill();
    const g = c.createLinearGradient(0, bot, 0, top); g.addColorStop(0, col); g.addColorStop(1, mixC(col, '#ffffff', .3)); c.fillStyle = g;
    c.fillRect(x - 4, y, 8, bot - y + 4); c.beginPath(); c.arc(x, bot + 9, 9, 0, 6.283); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; for (let v2 = -20; v2 <= 30; v2 += 10) { const yy = bot - (bot - top) * (v2 + 20) / 50; c.beginPath(); c.moveTo(x + 9, yy); c.lineTo(x + 14, yy); c.stroke(); c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '9px system-ui'; c.fillText(String(v2), x + 16, yy + 3) }
    c.fillStyle = '#fff'; c.font = '800 12px system-ui'; c.textAlign = 'center'; c.fillText(wxDeg(v), x + 4, h - 6); c.font = '600 11px system-ui'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText(lab, x, 12); c.textAlign = 'left' };
  th(w * .12, d.air, 'Õhk', +d.air < 0 ? '#5ab0ff' : '#ff6a4a'); th(w * .33, d.water, 'Vesi', '#3ad0e8');
  // baromeeter
  const cx = w * .73, cy = h * .46, R = Math.min(w * .24, h * .37), p = +d.pressure, a0 = Math.PI * .85, a1 = Math.PI * 2.15, ang = v => a0 + (a1 - a0) * Math.max(0, Math.min(1, (v - 975) / 60));
  const g = c.createRadialGradient(cx - R * .3, cy - R * .3, 2, cx, cy, R * 1.1); g.addColorStop(0, '#f4ecd8'); g.addColorStop(1, '#c8b890'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 6.283); c.fill();
  c.strokeStyle = '#8a6a3a'; c.lineWidth = 4; c.stroke();
  [['TORM', 980], ['VIHM', 995], ['MUUTLIK', 1010], ['SELGE', 1025]].forEach(([s, v]) => { const an = ang(v); c.save(); c.translate(cx + Math.cos(an) * R * .68, cy + Math.sin(an) * R * .68); c.fillStyle = '#4a3a20'; c.font = `700 ${Math.max(7, R * .13)}px Georgia`; c.textAlign = 'center'; c.fillText(s, 0, 3); c.restore() });
  c.strokeStyle = '#4a3a20'; c.lineWidth = 1; for (let v = 975; v <= 1035; v += 5) { const an = ang(v), r1 = R * (v % 10 === 5 ? .86 : .82); c.beginPath(); c.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); c.lineTo(cx + Math.cos(an) * R * .92, cy + Math.sin(an) * R * .92); c.stroke() }
  const wob = Math.sin(t * 2) * .01, an = ang(p) + wob;
  c.strokeStyle = '#1a1a1a'; c.lineWidth = 2.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - Math.cos(an) * R * .12, cy - Math.sin(an) * R * .12); c.lineTo(cx + Math.cos(an) * R * .78, cy + Math.sin(an) * R * .78); c.stroke();
  const tr = +d.trend; if (tr) { const an2 = ang(p + tr); c.strokeStyle = tr < 0 ? '#c83a2a' : '#2a8a4a'; c.lineWidth = 2; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an2) * R * .7, cy + Math.sin(an2) * R * .7); c.stroke(); c.setLineDash([]) }
  c.fillStyle = '#c8a24a'; c.beginPath(); c.arc(cx, cy, R * .08, 0, 6.283); c.fill();
  c.fillStyle = '#fff'; c.font = '800 13px system-ui'; c.textAlign = 'center'; c.fillText(`${p} hPa ${tr < -2 ? '↘ langeb' : tr > 2 ? '↗ tõuseb' : '→ püsib'}`, cx, h - 6); c.textAlign = 'left';
}
function wxCv(o) { WX.objs.push(o); return `<canvas data-wxcv="${WX.objs.length - 1}"></canvas>` }
function wxPaint(ts) {
  const cvs = document.querySelectorAll('#fishView canvas[data-wxcv]');
  if (!FV.open || !cvs.length) { WX.raf = 0; return }
  cvs.forEach(cv => { const o = WX.objs[+cv.dataset.wxcv]; if (!o) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; const d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) } const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h); o.draw(c, w, h, ts / 1000) });
  WX.raf = requestAnimationFrame(wxPaint);
}

/* ---------- vaade ---------- */
function wxPanel() {
  WX.objs = [];
  if (!CL.user) return '';
  if (!WX.d || WX.key !== wxKey()) { if (!WX.loading) setTimeout(wxLoad, 0); if (!WX.d) return '' }
  const d = WX.d, [ic, nm] = wxName(d.weather, d.night), sp = (d.species || []).filter(x => FD.sp[x.id]), top = sp.slice(0, 3);
  let h = `<div class="wx"><div class="wx-bar" data-wx="tog" role="button" tabindex="0" aria-expanded="${WX.open}"><span class="big">${ic}</span>
    <div class="t"><b>Ilmajaam · ${esc(FD.spot[d.spot] ? FD.spot[d.spot].name : d.spot)}</b><small>${WX_SEASON[d.season] || d.season} · ${nm} · õhk ${wxDeg(d.air)} · vesi ${wxDeg(d.water)} · ${d.pressure} hPa ${+d.trend < -2 ? '↘' : +d.trend > 2 ? '↗' : '→'}</small></div>
    ${d.prestorm ? '<span class="wx-chip storm">⚡ Torm tulekul – kalad söövad ahnelt!</span>' : ''}${top.filter(x => x.act >= 1.15).map(x => `<span class="wx-chip hot">${wxLevel(x.act)[0]} ${esc(FD.sp[x.id].name)}</span>`).join('')}
    <span class="wx-chip">${WX.open ? 'Peida ▲' : 'Ava ▼'}</span></div>`;
  if (WX.open) {
    h += `<div class="wx-body"><div class="wx-ins">${wxCv({ draw: wxInsDraw })}<div class="wx-fc">${(d.forecast || []).map(f => { const hr = new Date(f.at).toLocaleTimeString('et-EE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tallinn' }), hh = +hr.slice(0, 2), n = hh >= 21 || hh < 5, [fi, fn] = wxName(f.weather, n);
        return `<div class="${f.weather === 'torm' ? 'st' : ''}"><span>${hr}</span><i>${fi}</i><b>${wxDeg(f.air).replace(',0', '').replace(' °C', '°')}</b><small>${fn}</small></div>` }).join('')}</div></div>
      <div class="wx-act"><h4>Kalade aktiivsus siin praegu</h4>${sp.length ? (WX.all || sp.length <= 7 ? sp : [...sp.slice(0, 4), ...sp.slice(-3)]).map(x => { const [e, l, col] = wxLevel(+x.act), pct = Math.min(100, +x.act / 1.9 * 100);
        return `<div class="wx-row"><canvas data-fl="${x.id}" data-r="${FD.sp[x.id].rarity}"></canvas><div><b>${esc(FD.sp[x.id].name)}</b><small>${wxWhy(x, d)}</small><div class="wx-meter"><i style="width:${pct.toFixed(0)}%;background:${col}"></i></div></div><span class="wx-lv" style="color:${col}">${e} ${l}</span></div>` }).join('')
        : '<p class="lead">Siin pole praegu kalu, keda saaksid püüda.</p>'}${sp.length > 7 ? `<button class="btn sm ghost" type="button" data-wx="all" style="justify-self:start">${WX.all ? 'Näita vähem' : `Näita kõiki ${sp.length} kala`}</button>` : ''}
        <small class="lead" style="margin-top:4px">Aktiivsed kalad tulevad sagedamini ja võtavad kiiremini, loiud jätavad sageli näkkamata.</small></div></div>`;
  }
  return h + '</div>';
}
// kalakaardile rida „Millal aktiivne“
function ilmRow(s) {
  if (!s || s.real === false) return '';
  const P = WX_PREF[s.temp_pref || 'cool'], t = s.wx_tags || [], parts = [`${P[0]} ${P[1]} (${P[2]})`];
  if (t.includes('rain')) parts.push('🌧️ vihmaga aktiivne'); if (t.includes('dim')) parts.push('🌫️ udu ja pilvega julgem'); if (t.includes('sun')) parts.push('☀️ ei karda päikest');
  if (t.includes('pred')) parts.push('🌅 röövkala: koidik ja videvik'); if (t.includes('night')) parts.push('🌙 öösel aktiivne');
  parts.push('⚡ enne tormi sööb ahnelt');
  const cur = WX.d && (WX.d.species || []).find(x => x.id === s.id), L = cur ? wxLevel(+cur.act) : null;
  return `<div class="fc-row"><span class="ic">🌡️</span><div class="v"><small>Millal aktiivne</small><div style="display:grid;gap:3px;font-size:13.5px">${parts.map(p => `<span>${p}</span>`).join('')}${L ? `<span style="color:${L[2]};font-weight:800">Praegu siin: ${L[0]} ${L[1]}</span>` : ''}</div></div></div>`;
}

/* ---------- ühendus ---------- */
{
  const baseTabPuukW = tabPuuk;
  tabPuuk = function () { return wxPanel() + baseTabPuukW() };
  const baseRenderW = renderFV;
  renderFV = function (force) { baseRenderW(force); if (FV.open && FV.tab === 'puuk') { if (!WX.raf) WX.raf = requestAnimationFrame(wxPaint); if (WX.d && WX.key !== wxKey() && !WX.loading) wxLoad() } };
}
document.addEventListener('click', e => { if (e.target.closest('[data-wx="all"]')) { WX.all = !WX.all; return renderFV(true) } const t = e.target.closest('[data-wx="tog"]'); if (!t) return; WX.open = !WX.open; try { localStorage.setItem('mk.wxOpen', WX.open ? '1' : '0') } catch (e2) { } renderFV(true) });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.wx === 'tog') { e.preventDefault(); e.target.click() } });
