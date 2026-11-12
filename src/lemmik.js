/* =====================================================================
   Lemmiksööt ja parim aeg – igal kalal on oma lemmiksöödad ja parim päevaaeg.
   Server eelistab püügil kala, kui sööt on tema lemmik (×4) ja aeg on parim (×2,5).
   Siin: kalakaart (kalaraamatus vajutades), vihjeriba püügi lehel ja „Lemmiksööt!“ efekt.
   Püüdmata kala lemmiksööt ja aeg jäävad saladuseks.
   ===================================================================== */
const DP = {
  hommik: ['🌅', 'Hommik', 'kell 5–10', 5, 10], 'päev': ['☀️', 'Päev', 'kell 10–17', 10, 17],
  'õhtu': ['🌇', 'Õhtu', 'kell 17–21', 17, 21], 'öö': ['🌙', 'Öö', 'kell 21–5', 21, 29]
};
const DIFF = [[2, 'Lihtne', '#8fd17a'], [4, 'Keskmine', '#e6c45a'], [6, 'Raske', '#f09a4a'], [8, 'Väga raske', '#ff7a6a'], [10, 'Legendaarne', '#c58cff']];
const FC = { id: null, raf: 0 };

document.head.insertAdjacentHTML('beforeend', `<style>
.bcell.fcbtn{cursor:pointer;transition:transform .15s ease,border-color .15s ease}
.bcell.fcbtn:hover{transform:translateY(-2px);border-color:rgba(255,226,160,.4)!important}
.bcell.fcbtn:focus-visible{outline:2px solid var(--amber-2);outline-offset:2px}
.modal-card.fishcard{max-width:470px;padding:0;gap:0;overflow:hidden;border:1px solid var(--fcc,rgba(134,205,224,.3));background:linear-gradient(180deg,#0f2a35,#0b1f28)}
.fc-hero{position:relative}
.fc-cv{display:block;width:100%;height:210px}
.fc-rar{position:absolute;left:14px;top:12px;padding:4px 11px;border-radius:999px;font-weight:800;font-size:12px;color:#10202a;background:var(--fcc)}
.fc-x{position:absolute;right:10px;top:10px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.4);color:#fff;font-size:18px;cursor:pointer}
.fc-x:hover{background:rgba(0,0,0,.6)}
.fc-body{padding:16px 18px 18px;display:grid;gap:14px}
.fc-name{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.fc-name h2{margin:0;font-family:var(--f-display),Georgia,serif;font-weight:400;font-size:30px;color:#f6efd8}
.fc-diff{padding:3px 10px;border-radius:999px;font-weight:700;font-size:12.5px;color:var(--dc);background:color-mix(in srgb,var(--dc) 18%,transparent);border:1px solid color-mix(in srgb,var(--dc) 45%,transparent)}
.fc-descr{margin:-6px 0 0;color:#a9c6cf;font-style:italic;font-size:14px;line-height:1.45}
.fc-info{display:grid;gap:2px}
.fc-row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:start;padding:9px 0;border-top:1px solid rgba(134,205,224,.1)}
.fc-row .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:17px;background:rgba(255,255,255,.06)}
.fc-row .v{display:grid;gap:5px;min-width:0}.fc-row .v > small{color:#7fa3ae;font-size:12px}
.fc-row .v > span{color:#e8f2f4;font-size:14.5px;line-height:1.4}
.fc-chips{display:flex;flex-wrap:wrap;gap:6px}
.fc-bait{display:inline-flex;gap:7px;align-items:center;padding:4px 10px 4px 4px;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);font-size:13.5px;color:#f0f6f8}
.fc-bait.on{border-color:rgba(255,143,176,.7);background:rgba(255,143,176,.14)}
.fc-bait canvas{width:26px;height:26px;border-radius:50%}
.fc-time{display:flex;gap:12px;align-items:center}
.fc-time svg{width:64px;height:64px;flex:none}
.fc-time .tl{display:grid;gap:3px;font-size:13.5px;color:#e8f2f4}.fc-time .now{color:#ffd286;font-weight:700}
.fc-pips{display:flex;gap:4px}.fc-pips i{width:14px;height:8px;border-radius:3px;background:rgba(255,255,255,.1)}
.fc-pips i.on{background:var(--dc);box-shadow:0 0 6px color-mix(in srgb,var(--dc) 60%,transparent)}
.fc-hid{color:#7f98a2;font-style:italic}
.fc-tape{padding-top:20px}
.fc-tape .tp{position:relative;height:30px;border-radius:5px;overflow:visible;
  background:linear-gradient(180deg,#ffe066,#f2c230 60%,#d9a514);box-shadow:inset 0 -2px 0 rgba(0,0,0,.18),0 2px 6px rgba(0,0,0,.35)}
.fc-tape .tk{position:absolute;inset:0;overflow:hidden;border-radius:5px}
.fc-tape .tk i{position:absolute;top:0;width:1px;height:9px;background:rgba(40,25,0,.7)}
.fc-tape em{position:absolute;bottom:2px;transform:translateX(-50%);font:700 9.5px system-ui;color:#3a2600;font-style:normal;white-space:nowrap}
.fc-tape .nz,.fc-tape .gz{position:absolute;top:11px;height:6px;border-radius:3px}
.fc-tape .nz{background:#1f8a7a;box-shadow:0 0 0 1px rgba(255,255,255,.5)}
.fc-tape .gz{background:repeating-linear-gradient(135deg,#c2410c 0 4px,#f97316 4px 8px);box-shadow:0 0 0 1px rgba(255,255,255,.5)}
.fc-tape .pin{position:absolute;top:-6px;bottom:-6px;width:2px;margin-left:-1px;background:#e11d48;box-shadow:0 0 6px rgba(225,29,72,.7)}
.fc-tape .pin::before{content:"";position:absolute;top:-4px;left:-4px;width:10px;height:10px;border-radius:50%;background:#e11d48;border:2px solid #fff}
.fc-tape .pin b{position:absolute;top:-22px;left:50%;transform:translateX(-50%);font:700 10px system-ui;color:#ffc2d0;white-space:nowrap}
.fc-sz{display:grid;gap:4px;margin-top:6px;font-size:13.5px;color:#d8e8ec}
.fc-sz .d{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:7px;vertical-align:-1px}
.fc-sz .d.n{background:#1f8a7a}.fc-sz .d.g{background:repeating-linear-gradient(135deg,#c2410c 0 3px,#f97316 3px 6px)}.fc-sz .d.r{background:#e11d48;border-radius:50%}
.fc-go{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.fav-strip{display:grid;gap:8px;padding:10px 12px;border-radius:14px;background:linear-gradient(110deg,rgba(255,143,176,.12),rgba(255,255,255,.03));border:1px solid rgba(255,143,176,.22)}
.fav-strip > small{color:#e8c4d0;font-size:12.5px}
.fav-list{display:flex;gap:6px;flex-wrap:wrap}
.fav-f{display:inline-flex;gap:6px;align-items:center;padding:3px 9px 3px 3px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.25);color:#eef4f6;font-size:13px;cursor:pointer}
.fav-f canvas{width:40px;height:24px;border-radius:999px}
.fav-f.best{border-color:rgba(255,210,122,.7);box-shadow:0 0 12px rgba(255,200,110,.35)}
.fav-f.best::after{content:"🕐";font-size:11px}
.fav-chip{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:8px;font:800 12px system-ui;vertical-align:middle;color:#3a0b1c;background:linear-gradient(180deg,#ffc2d4,#ff8fb0);animation:favPop .5s cubic-bezier(.2,1.7,.4,1) both}
.age-chip{display:inline-block;margin:2px 0 0;padding:2px 9px;border-radius:999px;font:700 12px system-ui;color:#fff;background:color-mix(in srgb,var(--ac) 28%,rgba(0,0,0,.25));border:1px solid var(--ac);justify-self:start}
.fc-ages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
.fc-ages div{padding:6px 6px 5px;border-radius:8px;background:rgba(255,255,255,.05);border-top:3px solid var(--ac);display:grid;gap:1px;min-width:0}
.fc-ages b{font-size:12px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fc-ages small{font-size:11px;color:#9cb8c2}
.fc-ages div.on{background:color-mix(in srgb,var(--ac) 22%,transparent);box-shadow:0 0 0 1px var(--ac)}
.fc-disc{display:grid;gap:3px;font-size:13.5px;color:#e8f2f4}
.fav-chip.t{color:#2a1a05;background:linear-gradient(180deg,#ffe2a0,#f2b552)}
@keyframes favPop{from{transform:scale(.3);opacity:0}to{transform:scale(1);opacity:1}}
@media (max-width:560px){.fc-ages{grid-template-columns:repeat(2,minmax(0,1fr))}.fc-cv{height:180px}.fc-name h2{font-size:25px}}
@media (prefers-reduced-motion:reduce){.fav-chip{animation:none}}
</style>`);

function fdpNow() { return FS && FS.daypart ? FS.daypart : (() => { const h = new Date().getHours(); return h >= 5 && h < 10 ? 'hommik' : h < 17 && h >= 10 ? 'päev' : h >= 17 && h < 21 ? 'õhtu' : 'öö' })() }
function fdiff(d) { return DIFF.find(x => d <= x[0]) || DIFF[DIFF.length - 1] }
function fbaitName(id) { return FD.bait && FD.bait[id] ? FD.bait[id].name : id }

/* ---------- päevaring: 4 päevaosa, parimad helendavad ---------- */
function fcDayRing(times, now) {
  const C = 32, R = 25, pt = (h, r) => { const a = h / 24 * 2 * Math.PI - Math.PI / 2; return [C + r * Math.cos(a), C + r * Math.sin(a)] };
  const seg = (a, b, col, wd) => { const [x0, y0] = pt(a, R), [x1, y1] = pt(b, R); return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${(b - a) > 12 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${wd}" stroke-linecap="butt"/>` };
  let s = `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>`;
  Object.entries(DP).forEach(([k, d]) => { const on = times.includes(k); s += seg(d[3] + .15, d[4] - .15, on ? (k === 'öö' ? '#8a9cff' : '#ffd286') : 'rgba(255,255,255,.13)', on ? 8 : 6) });
  const h = new Date().getHours() + new Date().getMinutes() / 60, [hx, hy] = pt(h, R);
  s += `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="3.5" fill="#fff" style="filter:drop-shadow(0 0 3px #fff)"/>`;
  s += `<text x="${C}" y="${C + 5}" text-anchor="middle" font-size="14">${DP[now] ? DP[now][0] : ''}</text>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${s}</svg>`;
}

/* ---------- vanus ja avastus ---------- */
function fcDate(d) { return new Date(d).toLocaleDateString('et-EE', { day: 'numeric', month: 'long', year: 'numeric' }) }
function fcSpot(id) { return FD.spot[id] ? FD.spot[id].name : (id || '') }
function fcAges(s, b) {
  if (!s.max_age) return '';
  const lim = [s.min_w + .3 * (s.max_w - s.min_w), s.min_w + .75 * (s.max_w - s.min_w), s.max_w], my = b ? fAgeCls(s, +b.max) : -1;
  const rng = [`kuni ${fKg(lim[0])}`, `${fRange(fKg(lim[0]), fKg(lim[1]))}`, `${fRange(fKg(lim[1]), fKg(lim[2]))}`, `üle ${fKg(lim[2])}`];
  return `<div class="fc-ages">${AGE_CLS.map((c, i) => `<div class="${i === my ? 'on' : ''}" style="--ac:${c[3]}"><b>${c[1]} ${c[2]}</b><small>${rng[i]}</small><small>${fAgeTxt(fAgeYears(s, i === 0 ? lim[0] : i === 1 ? lim[1] : i === 2 ? lim[2] : s.max_w * FISH_GIANT))}</small></div>`).join('')}</div>
    ${b ? `<span style="font-size:13.5px;color:#e8f2f4">Sinu rekordkala: <b>${fAge(s, +b.max).txt}</b></span>` : ''}`;
}

/* ---------- mõõdulint: tavaline suurus, hiiglased ja sinu rekord ---------- */
function fcTape(s, b) {
  const gm = s.max_w * FISH_GIANT, L = (w) => s.max_len ? s.max_len * Math.cbrt(w / s.max_w) : null;
  const top = L(gm) || 1, pos = (w) => Math.max(0, Math.min(100, (L(w) || 0) / top * 100));
  const a = pos(s.min_w), m = pos(s.max_w), rec = b ? pos(+b.max) : null;
  // sentimeetrimärgid: samm sõltub kala suurusest
  const step = [1, 2, 5, 10, 20, 50, 100, 200][[12, 25, 60, 120, 250, 600, 1200, 1e9].findIndex(x => top <= x)];
  let ticks = ''; for (let v = step; v < top; v += step) { const x = v / top * 100; ticks += `<i style="left:${x.toFixed(2)}%"></i>`; }
  const lbl = (v) => v >= 100 ? fmt1(v / 100) + ' m' : Math.round(v) + ' cm';
  const nums = []; for (let k = 1; k <= 3; k++) { const v = Math.round(top * k / 4 / step) * step; if (v > 0 && v < top) nums.push(`<em style="left:${(v / top * 100).toFixed(2)}%">${lbl(v)}</em>`) }
  return `<div class="fc-tape" role="img" aria-label="Tavaliselt ${fRange(fKg(s.min_w), fKg(s.max_w))}, suurim võimalik ${fSize(s, gm)}${b ? ', sinu rekord ' + fSize(s, +b.max) : ''}">
      <div class="tp"><div class="tk">${ticks}</div>${nums.join('')}
        <span class="nz" style="left:${a.toFixed(1)}%;width:${(m - a).toFixed(1)}%"></span><span class="gz" style="left:${m.toFixed(1)}%;width:${(100 - m).toFixed(1)}%"></span>
        ${rec != null ? `<span class="pin" style="left:${rec.toFixed(1)}%"><b>sinu rekord</b></span>` : ''}</div>
    </div>
    <div class="fc-sz">
      <span><i class="d n"></i>Tavaliselt <b>${fRange(fKg(s.min_w), fKg(s.max_w))}</b>${s.max_len ? ` · ${fRange(fLen(s, s.min_w), fLen(s, s.max_w))}` : ''}</span>
      <span><i class="d g"></i>Suurim võimalik (hiiglane) <b>${fSize(s, gm)}</b></span>
      ${b ? `<span><i class="d r"></i>Sinu rekord <b>${fSize(s, +b.max)}</b> · püütud ${b.n}×</span>` : ''}
    </div>`;
}

/* ---------- kalakaart ---------- */
function fishCard(id) {
  const s = FD.sp[id]; if (!s) return;
  FC.id = id;
  const show = () => {
    showModal(() => {
      const s2 = FD.sp[FC.id], b = (FS.book || {})[s2.id], [rn, rc] = RAR2[s2.rarity] || RAR2[1], df = fdiff(s2.difficulty || 3), now = fdpNow();
      const where = (s2.spots || []).map(x => FD.spot[x] ? FD.spot[x].name : x).join(', ');
      const tags = [s2.night_only ? 'ainult öösel' : '', s2.winter_only ? 'ainult talvel' : '', s2.weather ? 'ainult ' + s2.weather.map(w => WNAME[w] || w).join(' või ') : ''].filter(Boolean);
      const baits = s2.baits || [], times = s2.times || [], bestNow = times.includes(now);
      const pips = Array.from({ length: 10 }, (_, i) => `<i class="${i < (s2.difficulty || 3) ? 'on' : ''}"></i>`).join('');
      const firstSpot = (s2.spots || []).find(x => FD.spot[x] && FS.level >= FD.spot[x].min_level && (!FD.spot[x].boat || (FS.boats || []).includes(FD.spot[x].boat)));
      return `<div class="fc-hero" style="--fcc:${rc}"><canvas class="fc-cv" aria-label="${b ? esc(s2.name) : 'Tundmatu kala'}"></canvas><span class="fc-rar">${rn}</span>
          <button class="fc-x" type="button" data-act="closeModal" aria-label="Sulge">×</button></div>
        <div class="fc-body">
          <div class="fc-name"><h2>${b ? esc(s2.name) : '???'}</h2><span class="fc-diff" style="--dc:${df[2]}">${df[1]}</span></div>
          ${s2.real === false ? `<p class="fc-descr" style="font-style:normal;color:#d8c4ff">✨ Muinasjutukala – seda kala päriselus ei ole, tema suurused on välja mõeldud.</p>` : ''}
          ${b && s2.descr ? `<p class="fc-descr">${esc(s2.descr)}</p>` : !b ? `<p class="fc-descr">Seda kala sa veel püüdnud ei ole. Püüa see, et saada teada tema lemmiksööt ja parim aeg.</p>` : ''}
          <div class="fc-info">
            <div class="fc-row"><span class="ic">📍</span><div class="v"><small>Elupaik</small><span>${esc(where)}${tags.length ? ` · ${tags.join(', ')}` : ''}</span></div></div>
            <div class="fc-row"><span class="ic">🪱</span><div class="v"><small>Lemmiksööt ${b ? '· selle söödaga näkkab 4 korda meelsamini' : ''}</small>
              ${b ? (baits.length ? `<div class="fc-chips">${baits.map(x => `<span class="fc-bait ${x === FS.bait ? 'on' : ''}">${gearCv('bait', x)}${esc(fbaitName(x))}${x === FS.bait ? ' · sul kasutusel' : ''}</span>`).join('')}</div>` : '<span>Pole kindlat lemmikut</span>') : '<span class="fc-hid">??? – püüa see kala, et teada saada</span>'}</div></div>
            <div class="fc-row"><span class="ic">🕐</span><div class="v"><small>Parim aeg</small>
              ${b ? (times.length ? `<div class="fc-time">${fcDayRing(times, now)}<div class="tl">${times.map(t => `<span>${DP[t] ? DP[t][0] + ' ' + DP[t][1] + ' <small style="color:#8fb0ba">' + DP[t][2] + '</small>' : t}</span>`).join('')}${bestNow ? '<span class="now">✨ Praegu on parim aeg!</span>' : ''}</div></div>` : '<span>Igal ajal</span>') : '<span class="fc-hid">???</span>'}</div></div>
            <div class="fc-row"><span class="ic">💪</span><div class="v"><small>Raskus</small><div class="fc-pips" style="--dc:${df[2]}" aria-label="Raskus ${s2.difficulty} / 10">${pips}</div></div></div>
            <div class="fc-row"><span class="ic">🎂</span><div class="v"><small>Vanus · ${s2.real === false ? 'muinasjutu järgi elab' : 'elab'} kuni ~${fmt(s2.max_age || 0)} aastat</small>${fcAges(s2, b)}</div></div>
            ${b && b.fa ? `<div class="fc-row"><span class="ic">📖</span><div class="v"><small>Sinu kalaraamatust</small><div class="fc-disc"><span>Avastasid <b>${fcDate(b.fa)}</b> · ${esc(fcSpot(b.fs))}</span>${b.ra && b.n > 1 ? `<span>🏆 Rekord püütud <b>${fcDate(b.ra)}</b> · ${esc(fcSpot(b.rs))}</span>` : ''}</div></div></div>` : ''}
            <div class="fc-row"><span class="ic">📏</span><div class="v"><small>Mängus püütav suurus${s2.real === false ? '' : ' · päris kala mõõdud'}</small>${fcTape(s2, b)}</div></div>
          </div>
          <div class="fc-go">${firstSpot ? `<button class="btn" type="button" data-fcgo="${firstSpot}">Püüa: ${esc(FD.spot[firstSpot].name)}</button>` : ''}</div>
        </div>`;
    }, 'fishcard');
    const card = document.querySelector('#modalCard'); card.style.setProperty('--fcc', (RAR2[s.rarity] || RAR2[1])[1] + '88');
    try { paintGear(card) } catch (e) { }
    cancelAnimationFrame(FC.raf); FC.raf = requestAnimationFrame(fcLoop);
  };
  show();
}
// elav kala kaardil: veealune valgus, mullid ja ujuv kala
function fcLoop(ts) {
  const cv = document.querySelector('.fc-cv'); if (!cv || !FC.id) return;
  FC.raf = requestAnimationFrame(fcLoop);
  const s = FD.sp[FC.id], b = (FS.book || {})[FC.id], w = cv.clientWidth || 400, h = cv.clientHeight || 200, d = Math.min(2, devicePixelRatio || 1), t = ts / 1000;
  if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d) }
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
  const spot = (s.spots || [])[0], sc = (typeof SCN !== 'undefined' && SCN[spot]) || ['', '#2f6a8a', '#0e2e44'], col = (RAR2[s.rarity] || RAR2[1])[1];
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sc[1]); g.addColorStop(1, sc[2]); c.fillStyle = g; c.fillRect(0, 0, w, h);
  // valgusvihud
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) { const x = w * (.1 + i * .2) + Math.sin(t * .4 + i) * 20, a = .06 + .04 * Math.sin(t * .7 + i * 2); c.fillStyle = `rgba(220,245,255,${a.toFixed(3)})`; c.beginPath(); c.moveTo(x - 14, 0); c.lineTo(x + 14, 0); c.lineTo(x + 70, h); c.lineTo(x + 10, h); c.fill() }
  c.restore();
  // haruldane kala helendab
  const rg = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * .45); rg.addColorStop(0, col + (s.rarity >= 4 ? '66' : '33')); rg.addColorStop(1, col + '00'); c.fillStyle = rg; c.fillRect(0, 0, w, h);
  // põhi
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(w / 2, h + 8, w * .7, 30, 0, 0, Math.PI * 2); c.fill();
  // mullid
  for (let i = 0; i < 12; i++) { const x = (i * 73 + Math.sin(t + i) * 8) % w, y = h - ((t * (14 + i % 5 * 6) + i * 41) % (h + 20)); c.strokeStyle = 'rgba(220,245,255,.45)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, 1.5 + i % 3, 0, Math.PI * 2); c.stroke() }
  // kala
  const L = Math.min(w * .62, h * .78 / fishFit(s.look)), x = w / 2 + Math.sin(t * .6) * w * .05, y = h / 2 + Math.sin(t * 1.1) * 6;
  if (!b) { c.filter = 'brightness(0)'; c.globalAlpha = .8 }
  drawLook(c, x, y, L, s.look, t, Math.cos(t * .3) > -.92 ? 1 : 1);
  c.filter = 'none'; c.globalAlpha = 1;
}

/* ---------- vihjeriba püügi lehel ---------- */
function favStrip() {
  if (!FD.loaded || !FV.spot || !FS.bait) return '';
  const now = fdpNow(), book = FS.book || {};
  const list = FD.species.filter(s => (s.spots || []).includes(FV.spot) && s.min_level <= FS.level && (s.baits || []).includes(FS.bait))
    .sort((a, b) => ((b.times || []).includes(now) - (a.times || []).includes(now)) || a.rarity - b.rarity).slice(0, 8);
  const bn = FD.bait[FS.bait] ? FD.bait[FS.bait].name : 'See sööt';
  if (!list.length) return `<div class="fav-strip"><small>❤ ${esc(bn)}: siin ei ole kala, kelle lemmik see oleks. Vaata kalaraamatust, mis sööta su sihtkala armastab.</small></div>`;
  return `<div class="fav-strip"><small>❤ ${esc(bn)} on siin nende kalade lemmik${list.some(s => (s.times || []).includes(now) && book[s.id]) ? ' · 🕐 = praegu ka parim aeg' : ''}:</small>
    <div class="fav-list">${list.map(s => { const k = !!book[s.id], best = k && (s.times || []).includes(now); return `<button type="button" class="fav-f ${best ? 'best' : ''}" data-fcard="${s.id}"><canvas data-fl="${s.id}" data-r="${s.rarity}" data-unk="${k ? 0 : 1}"></canvas>${k ? esc(s.name) : '???'}</button>` }).join('')}</div></div>`;
}

/* ---------- laiendused ---------- */
{
  const basePuukF = tabPuuk;
  tabPuuk = function () {
    const h = basePuukF(); let f = ''; try { f = favStrip() } catch (e) { }
    const at = 'data-fa="tab" data-arg="pood">Osta sööta</button></div>';
    return f && h.includes(at) ? h.replace(at, at + f) : h;
  };
  const baseRaamat = tabRaamat;
  tabRaamat = function () {
    return baseRaamat().replace('Kõigi kalade leidmine annab', 'Vajuta kalale, et näha selle kalakaarti: lemmiksööt, parim aeg ja raskus. Kõigi kalade leidmine annab')
      .replace(/<div class="bcell"([^>]*)><canvas data-fl="([^"]+)"/g, '<div class="bcell fcbtn" role="button" tabindex="0" data-fcard="$2"$1><canvas data-fl="$2"');
  };
  const baseResult = resultCard;
  resultCard = function () {
    let h = baseResult(); const r = FV.result;
    if (r && r.kind === 'fish' && FD.sp[r.species] && typeof fAge === 'function') { const ag = fAge(FD.sp[r.species], +r.weight); h = h.replace(/(<h3>[^<]*<\/h3>)/, `$1<span class="age-chip" style="--ac:${ag.col}">${ag.txt}</span>`) }
    if (r && r.kind === 'fish' && (r.fav || r.best)) {
      const chips = `${r.fav ? '<span class="fav-chip">❤ Lemmiksööt</span>' : ''}${r.best ? '<span class="fav-chip t">🕐 Parim aeg</span>' : ''}`;
      h = h.replace(/(kogemust[^<]*(?:<span class="kx2"[^>]*>×2<\/span>)?)/, '$1' + chips);
    }
    return h;
  };
  const baseLand = fxLand;
  fxLand = function (r) { baseLand(r); if (r && r.kind === 'fish' && r.fav) setTimeout(() => { try { fxText(FX.bx, FX.by - 40, '❤ Lemmiksööt!', '#ff9ec0', 20); fxRing(FX.bx, FX.by, 60, '255,160,200') } catch (e) { } }, 1100) };
}
document.addEventListener('click', e => {
  const go = e.target.closest('[data-fcgo]');
  if (go) { const sp = go.dataset.fcgo; FC.id = null; closeModal(); FV.spot = sp; FV.result = null; FV.phase = 'idle'; FV.msg = ''; FV.tab = 'puuk'; renderFV(true); if (typeof loadOdds === 'function') loadOdds().then(() => renderFV(true)); return }
  const el = e.target.closest('[data-fcard]'); if (!el) return;
  e.preventDefault(); fishCard(el.dataset.fcard);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.fcard) { e.preventDefault(); fishCard(e.target.dataset.fcard) } });
